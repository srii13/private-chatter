import { User, Conversation, Message } from '../database/db.js';
import { v4 as uuidv4 } from 'uuid';

export default function setupChatSockets(io) {
  const connectedUsers = new Map();
  const userSockets = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // When client authenticates its socket
    socket.on('join', (userId) => {
      connectedUsers.set(socket.id, userId);
      userSockets.set(userId, socket.id);
      
      // Update online status
      io.emit('user_status', { userId, online: true });
    });

    // Start a conversation
    socket.on('start_conversation', async ({ participantIds }, callback) => {
      try {
        const [p1, p2] = participantIds;
        
        let existingConv = await Conversation.findOne({
          participants: { $all: [p1, p2], $size: 2 }
        });

        if (!existingConv) {
          existingConv = new Conversation({
            id: uuidv4(),
            participants: [p1, p2]
          });
          await existingConv.save();
        }

        callback({ success: true, conversationId: existingConv.id });
      } catch (err) {
        console.error(err);
        callback({ success: false, error: err.message });
      }
    });

    // Send a message
    socket.on('send_message', async (data, callback) => {
      const { conversationId, senderId, receiverId, encryptedMessage, nonce } = data;
      const messageId = uuidv4();
      
      try {
        const savedMsg = new Message({
          id: messageId,
          conversation_id: conversationId,
          sender_id: senderId,
          encrypted_message: encryptedMessage,
          nonce: nonce
        });

        await savedMsg.save();

        const msgObj = savedMsg.toObject();

        const receiverSocketId = userSockets.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', msgObj);
        }

        if (callback) callback({ success: true, message: msgObj });
      } catch (err) {
        console.error(err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Get previous messages
    socket.on('get_messages', async ({ conversationId }, callback) => {
      try {
        const msgs = await Message.find({ conversation_id: conversationId }).sort({ timestamp: 1 });
        callback({ success: true, messages: msgs.map(m => m.toObject()) });
      } catch (err) {
        callback({ success: false, error: err.message });
      }
    });

    
    socket.on('get_conversations', async ({ userId }, callback) => {
      try {
        const convs = await Conversation.find({ participants: userId }).sort({ created_at: -1 });

        const enrichedConvs = await Promise.all(convs.map(async (c) => {
          const contactId = c.participants.find(p => p !== userId);
          const contact = await User.findOne({ id: contactId });
          const lastMsg = await Message.findOne({ conversation_id: c.id }).sort({ timestamp: -1 });
          
          return {
            id: c.id,
            created_at: c.created_at,
            contact_id: contact ? contact.id : 'unknown',
            contact_username: contact ? contact.username : 'Deleted User',
            contact_public_key: contact ? contact.public_key : '',
            contact_avatar: contact ? contact.avatar : null,
            last_message: lastMsg ? lastMsg.toObject() : null
          };
        }));

        callback({ success: true, conversations: enrichedConvs });
      } catch (err) {
        console.error(err);
        callback({ success: false, error: err.message });
      }
    });

    socket.on('typing', ({ conversationId, receiverId, isTyping }) => {
      const receiverSocketId = userSockets.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing', { conversationId, senderId: connectedUsers.get(socket.id), isTyping });
      }
    });

    socket.on('disconnect', () => {
      const userId = connectedUsers.get(socket.id);
      if (userId) {
        connectedUsers.delete(socket.id);
        userSockets.delete(userId);
        io.emit('user_status', { userId, online: false });
      }
      console.log('User disconnected:', socket.id);
    });
  });
}
