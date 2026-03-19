import { create } from 'zustand';
import { io } from 'socket.io-client';
import { useAuthStore } from './useAuthStore';
import { encryptMessage, decryptMessage } from '../utils/crypto';

let socket = null;

export const useChatStore = create((set, get) => ({
  socket: null,
  conversations: [],
  activeConversation: null,
  messages: [],
  onlineUsers: {}, // {userId: true/false}
  typingUsers: {}, // {conversationId: {userId: true/false}}

  initSocket: () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    if (!socket) {
      const API_URL = import.meta.env.PROD ? '' : import.meta.env.VITE_API_URL || 'http://localhost:5000';
      socket = io(API_URL, {
        withCredentials: true
      });

      socket.on('connect', () => {
        socket.emit('join', user.id);
        get().fetchConversations();
      });

      socket.on('user_status', ({ userId, online }) => {
        set(state => ({
          onlineUsers: { ...state.onlineUsers, [userId]: online }
        }));
      });

      socket.on('receive_message', (message) => {
        const { activeConversation, processReceivedMessage, conversations } = get();
        
        // Find which conversation this belongs to
        const convId = message.conversation_id;
        
        // Decrypt if it's for active conversation
        if (activeConversation && activeConversation.id === convId) {
          const decryptedMsg = processReceivedMessage(message, activeConversation.contact_public_key);
          set(state => ({
            messages: [...state.messages, decryptedMsg]
          }));
        }

        // Update last message in conversations list
        set(state => ({
          conversations: state.conversations.map(c => 
            c.id === convId ? { ...c, last_message: message } : c
          )
        }));

        // Notification logic
        const authUser = useAuthStore.getState().user;
        if (authUser && message.sender_id !== authUser.id) {
          if ('Notification' in window && Notification.permission === 'granted') {
            const isWindowFocused = document.hasFocus();
            const isCurrentChat = activeConversation && activeConversation.id === convId;
            
            if (!isWindowFocused || !isCurrentChat) {
              const conv = get().conversations.find(c => c.id === convId);
              const senderName = conv?.contact_username || 'Someone';
              
              const notification = new Notification('New Message', {
                body: `${senderName} sent you a message`
              });
              
              // Optional: close it after a few seconds
              setTimeout(() => notification.close(), 5000);
            }
          }
        }
      });

      socket.on('typing', ({ conversationId, senderId, isTyping }) => {
        set(state => ({
          typingUsers: {
            ...state.typingUsers,
            [conversationId]: {
              ...(state.typingUsers[conversationId] || {}),
              [senderId]: isTyping
            }
          }
        }));
      });

      set({ socket });
    }
  },

  disconnectSocket: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      set({ socket: null, messages: [], activeConversation: null, conversations: [] });
    }
  },

  fetchConversations: () => {
    const user = useAuthStore.getState().user;
    if (!socket || !user) return;

    socket.emit('get_conversations', { userId: user.id }, (res) => {
      if (res.success) {
        set({ conversations: res.conversations });
      }
    });
  },

  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation, messages: [] });
    if (conversation && socket) {
      socket.emit('get_messages', { conversationId: conversation.id }, (res) => {
        if (res.success) {
          const decryptedMsgs = res.messages.map(m => get().processReceivedMessage(m, conversation.contact_public_key));
          set({ messages: decryptedMsgs });
        }
      });
    }
  },

  processReceivedMessage: (message, contactPublicKey) => {
    const authUser = useAuthStore.getState();
    if (!authUser.privateKey) return { ...message, text: '[Private Key Missing]' };

    // Determine whose public key to use for decryption based on sender
    const isMe = message.sender_id === authUser.user.id;
    // For simplicity with TweetNaCl box, sender encrypts using receiver's pub AND sender's priv.
    // If we sent it, we can decrypt using our priv and receiver's pub.
    // If they sent it, we can decrypt using our priv and their pub.
    // So the "other" party's public key is always `contactPublicKey`.
    
    // Actually, box.open requires (nonce, senderPublicKey, receiverPrivateKey).
    // If we are evaluating a message, we need the sender's public key to decrypt.
    // Due to how this simple chat is structured, we decrypt EVERYTHING using our Private Key and the Contact's Public Key.
    // Wait, if it was sent by us, the sender was us, so decrypt needs (contactPubKey, ourPrivKey). 
    // Wait, TweetNaCl box is symmetric in keys if you use the same pair.
    
    const text = decryptMessage(
      message.encrypted_message,
      message.nonce,
      contactPublicKey,
      authUser.privateKey
    );

    return { ...message, text };
  },

  sendMessage: (text) => {
    const { socket, activeConversation } = get();
    const authUser = useAuthStore.getState();
    
    if (!socket || !activeConversation || !text.trim() || !authUser.privateKey) return;

    // Encrypt
    const { encryptedMessage, nonce } = encryptMessage(
      text,
      activeConversation.contact_public_key,
      authUser.privateKey
    );

    const data = {
      conversationId: activeConversation.id,
      senderId: authUser.user.id,
      receiverId: activeConversation.contact_id,
      encryptedMessage,
      nonce
    };

    socket.emit('send_message', data, (res) => {
      if (res.success) {
        const decryptedMsg = { ...res.message, text };
        set(state => ({
          messages: [...state.messages, decryptedMsg],
          conversations: state.conversations.map(c => 
            c.id === activeConversation.id ? { ...c, last_message: res.message } : c
          )
        }));
      }
    });
  },

  startConversation: (contact) => {
    const { socket, conversations } = get();
    const authUser = useAuthStore.getState();
    
    // Check if we already have it
    const existing = conversations.find(c => c.contact_id === contact.id);
    if (existing) {
      get().setActiveConversation(existing);
      return;
    }

    if (!socket) return;
    
    socket.emit('start_conversation', { participantIds: [authUser.user.id, contact.id] }, (res) => {
      if (res.success) {
        const newConv = {
          id: res.conversationId,
          contact_id: contact.id,
          contact_username: contact.username,
          contact_public_key: contact.public_key,
          contact_avatar: contact.avatar,
          last_message: null
        };
        set(state => ({ conversations: [newConv, ...state.conversations] }));
        get().setActiveConversation(newConv);
      }
    });
  },

  sendTypingStatus: (isTyping) => {
    const { socket, activeConversation } = get();
    if (socket && activeConversation) {
      socket.emit('typing', {
        conversationId: activeConversation.id,
        receiverId: activeConversation.contact_id,
        isTyping
      });
    }
  }
}));
