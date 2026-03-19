# End-to-End Encrypted Chat Application

A production-quality private encrypted messaging web application with a premium dark-mode, glassmorphism UI similar to Instagram Direct Messages.

## Tech Stack
**Frontend:** React (Vite), TailwindCSS, Framer Motion, Zustand, Socket.IO Client, TweetNaCl (Curve25519-XSalsa20-Poly1305 E2E Encryption)
**Backend:** Node.js, Express, Socket.IO, better-sqlite3

## Features
- **End-to-End Encryption:** Messages are encrypted in the browser using TweetNaCl before being sent to the server. The server never sees the plaintext.
- **Real-Time Messaging:** Instant message delivery, online user status, and typing indicators powered by Socket.IO.
- **Premium UI:** Instagram DM-style interface featuring dark mode, transparent glass cards, animated message bubbles, and responsive design.
- **Security:** Secure JWT authentication and bcrypt password hashing. Local key-pair generation.

---

## Local Setup Instructions

### 1. Backend Setup
1. Open a terminal and navigate to the `server` directory.
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` root (optional defaults are provided):
   ```env
   PORT=5000
   JWT_SECRET=your_super_secret_jwt_key
   CLIENT_URL=http://localhost:5173
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:5000` and automatically create a `chat.db` file.

### 2. Frontend Setup
1. Open a new terminal and navigate to the `client` directory.
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Create a `.env` file in the `client` root:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`. Open this URL in your browser.

---

## Deployment Guide (Unified on Render)

The application has been configured for a single-service "Unified Deployment". This means the Node.js backend will build the React frontend and serve it directly, requiring only one Render Web Service for both.

### Deploying to Render

1. **Push your code to GitHub.** Ensure the root `package.json` and the frontend/backend folder structures are intact.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New > Web Service**.
3. **Connect your GitHub repository** containing this project.
4. **Configure the Web Service:**
   - **Name:** Your choice (e.g., `private-chatter-app`)
   - **Environment:** Node
   - **Build Command:** `npm install` 
     *(This runs the `postinstall` script in the root `package.json`, which automatically installs all dependencies and builds the React frontend)*
   - **Start Command:** `npm start`
5. **Environment Variables:**
   Add the following under "Environment":
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: Generate a secure random string (e.g., `my_super_secret_key_123`)
   - `MONGODB_URI`: Your MongoDB connection string (e.g., your MongoDB Atlas connection URL)
   - `CLIENT_URL`: Add the Render URL that will be generated for your app (e.g., `https://private-chatter-app.onrender.com`)
6. Click **Create Web Service**.

> **Note on Database:** The application uses MongoDB for reliable cloud database storage. Ensure your MongoDB cluster allows connections from Render (in MongoDB Atlas, you can whitelist `0.0.0.0/0` to allow all IP addresses, or find Render's static IPs if using a paid tier).

---

## E2E Encryption Note
This project demonstrates End-to-End Encryption. When a user registers, a public-private key pair is generated locally. 
- The Public Key is sent to the server to share with other users for message encryption.
- The Private Key is stored securely in the browser's `localStorage` and NEVER sent to the server. If the user clears their browser cache or logs in from a new device, they will lose access to decrypting historical messages unless a key backup flow is implemented.
