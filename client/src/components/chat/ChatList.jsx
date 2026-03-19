import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Edit, User, LogOut } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';

export default function ChatList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const { conversations, activeConversation, setActiveConversation, startConversation, onlineUsers } = useChatStore();

  useEffect(() => {
    if (!searchQuery.trim() || !user) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const searchTimer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const API_URL = import.meta.env.PROD ? '' : import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/auth/users/search?q=${searchQuery}`);
        const data = await res.json();
        setSearchResults(data.filter(u => u.id !== user.id)); // filter out self
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(searchTimer);
  }, [searchQuery, user?.id]);

  if (!user) {
    return (
      <div className="w-full md:w-[350px] lg:w-[400px] flex-shrink-0 border-r border-white/10 flex flex-col h-full bg-black/50 backdrop-blur-md items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-instagram-blue"></div>
      </div>
    );
  }

  return (
    <div 
      className={`w-full md:w-[350px] lg:w-[400px] flex-shrink-0 border-r border-white/10 flex-col h-full bg-black/50 backdrop-blur-md ${activeConversation ? 'hidden md:flex' : 'flex'}`}
    >
      {/* Header */}
      <div className="p-5 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-instagram-blue to-purple-600 flex items-center justify-center font-bold text-lg shadow-lg">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold">{user.username}</h2>
        </div>
        <div className="flex space-x-3 text-white/70">
          <button className="hover:text-white transition-colors" title="New Message">
            <Edit className="w-6 h-6" />
          </button>
          <button onClick={logout} className="hover:text-red-500 transition-colors" title="Log Out">
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-instagram-blue focus:bg-white/10 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <AnimatePresence>
          {searchQuery ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="px-5 py-2 text-xs font-semibold text-white/50 uppercase tracking-wider">Search Results</h3>
              {searchResults.map(result => (
                <div 
                  key={result.id}
                  onClick={() => {
                    startConversation(result);
                    setSearchQuery('');
                  }}
                  className="flex items-center px-5 py-3 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-white/60" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{result.username}</h4>
                    <p className="text-sm text-white/50">Start conversation</p>
                  </div>
                </div>
              ))}
              {searchResults.length === 0 && !isSearching && (
                <p className="px-5 py-3 text-sm text-white/50">No users found.</p>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="px-5 py-2 text-xs font-semibold text-white/50 uppercase tracking-wider">Messages</h3>
              {conversations.length === 0 ? (
                <div className="p-5 text-center text-white/50 mt-10">
                  <MessageCircleIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No conversations yet.</p>
                  <p className="text-sm mt-1">Search for a user to start chatting.</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <div 
                    key={conv.id}
                    onClick={() => setActiveConversation(conv)}
                    className={`flex items-center px-5 py-3 cursor-pointer transition-colors relative ${activeConversation?.id === conv.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  >
                    <div className="relative grid place-items-center w-14 h-14 rounded-full bg-gradient-to-tr from-instagram-blue to-purple-600 p-[2px] mr-4">
                      <div className="bg-black w-full h-full rounded-full flex items-center justify-center overflow-hidden">
                        {conv.contact_avatar ? (
                          <img src={conv.contact_avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-lg">{conv.contact_username.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      {onlineUsers[conv.contact_id] && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-[15px] truncate">{conv.contact_username}</h4>
                      <p className="text-[13px] text-white/60 truncate mt-0.5">
                        {conv.last_message ? (
                          // For simplicity, we didn't decrypt `last_message` in the store when fetching convos, so it might say Encrypted Message.
                          // Real apps might decrypt it here, but let's just show an indicator
                          `🔐 Encrypted Message`
                        ) : 'Say hi!'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Temporary icon
function MessageCircleIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
