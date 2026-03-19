import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';

export default function ChatDashboard() {
  const user = useAuthStore(state => state.user);
  const initSocket = useChatStore(state => state.initSocket);
  const disconnectSocket = useChatStore(state => state.disconnectSocket);

  useEffect(() => {
    if (user) {
      initSocket();
      // Request notification permissions
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
    return () => disconnectSocket();
  }, [user, initSocket, disconnectSocket]);

  return (
    <div className="absolute inset-0 w-full bg-black text-white flex overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-instagram-blue/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="flex w-full h-full max-w-7xl mx-auto border-x border-white/10 z-10 glass-card">
        <ChatList />
        <ChatWindow />
      </div>
    </div>
  );
}
