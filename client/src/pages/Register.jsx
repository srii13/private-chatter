import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Loader2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const register = useAuthStore(state => state.register);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setIsLoading(true);
      setError('');
      await register(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-instagram-blue/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-card w-full max-w-sm p-8 rounded-3xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <motion.div 
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-full flex items-center justify-center mb-4 shadow-lg shrink-0"
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
          <p className="text-instagram-textHover text-xs mt-2 max-w-[250px]">
            Your keys will be generated locally. Messages are end-to-end encrypted.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input 
              type="text" 
              placeholder="Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-instagram-lightGray/50 border border-instagram-border text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:bg-instagram-lightGray transition-colors placeholder:text-gray-500"
              required
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-instagram-lightGray/50 border border-instagram-border text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:bg-instagram-lightGray transition-colors placeholder:text-gray-500"
              required
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Confirm Password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-instagram-lightGray/50 border border-instagram-border text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:bg-instagram-lightGray transition-colors placeholder:text-gray-500"
              required
            />
          </div>
          
          {error && (
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="text-red-500 text-xs text-center"
            >
              {error}
            </motion.p>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 active:scale-[0.98] transition-all text-white font-semibold rounded-xl py-3 flex items-center justify-center mt-2 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-instagram-textHover">
          Already have an account?{' '}
          <Link to="/login" className="text-purple-400 font-semibold hover:underline">
            Log In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
