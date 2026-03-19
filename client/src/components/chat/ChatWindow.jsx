import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Send, Lock, Smile, Phone, Video, Info, ChevronLeft, Trash } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';

export default function ChatWindow() {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  
  const user = useAuthStore(state => state.user);
  const { activeConversation, messages, sendMessage, sendTypingStatus, typingUsers, onlineUsers, setActiveConversation, deleteMessage, deleteConversation } = useChatStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
      sendTypingStatus(false);
    }
  };

  const handleTyping = (e) => {
    setInputText(e.target.value);
    sendTypingStatus(e.target.value.length > 0);
  };

  if (!activeConversation) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-black/30 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 rounded-full border-2 border-white/20 flex items-center justify-center mx-auto mb-4">
            <Send className="w-10 h-10 text-white/50 -ml-1 mt-1" />
          </div>
          <h2 className="text-xl font-medium mb-1">Your Messages</h2>
          <p className="text-sm text-white/50">Send private end-to-end encrypted photos and messages.</p>
        </motion.div>
      </div>
    );
  }

  const isContactTyping = typingUsers[activeConversation.id]?.[activeConversation.contact_id];
  const isOnline = onlineUsers[activeConversation.contact_id];

  return (
    <div className={`flex-1 flex flex-col h-full bg-black/40 backdrop-blur-xl relative top-0 z-0 ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
      {/* Header */}
      <div className="h-[80px] px-4 md:px-6 flex justify-between items-center border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center space-x-3 cursor-pointer">
          <button 
            onClick={() => setActiveConversation(null)}
            className="md:hidden p-1 mr-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-tr from-instagram-blue to-purple-600 flex items-center justify-center overflow-hidden font-bold">
            {activeConversation.contact_avatar ? (
              <img src={activeConversation.contact_avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              activeConversation.contact_username.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{activeConversation.contact_username}</h3>
            <p className="text-xs text-white/60">
              {isOnline ? 'Active now' : 'Offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-white/80">
          <Phone className="w-6 h-6 hover:text-white cursor-pointer transition-colors hidden sm:block" />
          <Video className="w-7 h-7 hover:text-white cursor-pointer transition-colors hidden sm:block" />
          <Trash 
            className="w-5 h-5 hover:text-red-500 cursor-pointer transition-colors" 
            title="Delete Conversation"
            onClick={() => {
              if(window.confirm('Delete this entire conversation?')) {
                deleteConversation(activeConversation.id);
              }
            }}
          />
          <Info className="w-6 h-6 hover:text-white cursor-pointer transition-colors hidden sm:block" />
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
        <div className="flex items-center justify-center py-4">
          <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 flex items-center space-x-2 text-xs text-white/60">
            <Lock className="w-3.5 h-3.5 text-yellow-500" />
            <span>Messages are end-to-end encrypted</span>
          </div>
        </div>

        <AnimatePresence>
          {messages.map((msg, i) => {
            const isMe = msg.sender_id === user.id;
            return (
              <motion.div
                key={msg.id || i}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} group items-center`}
              >
                {!isMe && (
                   <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-instagram-blue to-purple-600 flex items-center justify-center mb-1 mr-2 self-end text-[10px] font-bold shrink-0">
                     {activeConversation.contact_username.charAt(0).toUpperCase()}
                   </div>
                )}
                
                {isMe && (
                  <button 
                    onClick={() => { if(window.confirm('Delete message?')) deleteMessage(msg.id) }}
                    className="opacity-0 group-hover:opacity-100 mr-2 p-1.5 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-red-400"
                    title="Delete Message"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                )}
                
                <div 
                  className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-[15px] leading-[1.4] shadow-sm ${
                    isMe 
                      ? 'bg-gradient-to-tr from-instagram-blue to-[#0077c9] text-white rounded-br-sm' 
                      : 'bg-instagram-lightGray border border-white/5 text-white rounded-bl-sm'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isContactTyping && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center space-x-2 text-white/50 text-sm ml-10"
          >
            <div className="flex space-x-1">
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 bg-black/60 backdrop-blur-xl border-t border-white/10 mt-auto">
        <form 
          onSubmit={handleSend}
          className="flex items-center space-x-3 bg-white/10 border border-white/10 rounded-full px-4 py-2 hover:bg-white/15 focus-within:bg-white/15 focus-within:border-white/20 transition-all"
        >
          <Smile className="w-6 h-6 text-white/70 hover:text-white cursor-pointer shrink-0" />
          <input
            type="text"
            value={inputText}
            onChange={handleTyping}
            placeholder="Message..."
            className="flex-1 bg-transparent border-none focus:outline-none text-[15px] placeholder:text-white/50 px-2 py-1"
          />
          {inputText ? (
            <button type="submit" className="text-instagram-blue hover:text-blue-400 font-semibold transition-colors shrink-0">
              Send
            </button>
          ) : (
            <div className="flex items-center space-x-4 text-white/70">
              <Image className="w-6 h-6 hover:text-white cursor-pointer shrink-0" />
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
