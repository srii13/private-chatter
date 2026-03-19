import express from 'express';
import bcrypt from 'bcrypt';
import jwtToken from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, Conversation, Message } from '../database/db.js';

const router = express.Router();
const generateId = () => uuidv4();

router.post('/register', async (req, res) => {
  try {
    const { username, password, public_key, avatar } = req.body;
    
    if (!username || !password || !public_key) {
      return res.status(400).json({ error: 'Username, password, and public key are required' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const id = generateId();

    const newUser = new User({
      id,
      username,
      password_hash,
      public_key,
      avatar: avatar || null
    });

    await newUser.save();

    const token = jwtToken.sign({ id, username }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });

    res.status(201).json({ 
      user: { id, username, public_key, avatar: newUser.avatar },
      token 
    });

  } catch (err) {
    if (err.code === 11000) { // MongoDB duplicate key
      return res.status(400).json({ error: 'Username already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwtToken.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });

    res.json({
      user: { id: user.id, username: user.username, public_key: user.public_key, avatar: user.avatar },
      token
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Search users
router.get('/users/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    // Case-insensitive regex search on username
    const users = await User.find({ username: { $regex: q, $options: 'i' } })
                            .select('id username public_key avatar -_id')
                            .limit(20);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
