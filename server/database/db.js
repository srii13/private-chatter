import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/private-chatter';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Schemas
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  public_key: { type: String, required: true },
  avatar: { type: String },
  created_at: { type: Date, default: Date.now }
});

// For faster searches
userSchema.index({ username: 'text' });
userSchema.index({ username: 1 });

const conversationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  participants: [{ type: String }], // Array of user IDs (strings, not ObjectIds, to keep UUID compatibility)
  created_at: { type: Date, default: Date.now }
});

conversationSchema.index({ participants: 1 });

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  conversation_id: { type: String, required: true },
  sender_id: { type: String, required: true },
  encrypted_message: { type: String, required: true },
  nonce: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

messageSchema.index({ conversation_id: 1, timestamp: 1 });

// Compile Models
export const User = mongoose.model('User', userSchema, 'chat_users');
export const Conversation = mongoose.model('Conversation', conversationSchema, 'chat_conversations');
export const Message = mongoose.model('Message', messageSchema, 'chat_messages');

export default mongoose.connection;
