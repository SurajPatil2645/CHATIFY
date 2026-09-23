import express from 'express';
import { ENV } from './lib/env.js';
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import path from 'path';
import { connectDB } from './lib/db.js';
import cookieParser from "cookie-parser";
import cors from 'cors'
import { app, server } from './lib/socket.js';
const __dirname = path.resolve();

const PORT = ENV.PORT || 3000;

app.use(express.json({limit:"5mb"})); //req.body
// app.use(cors({origin:ENV.CLIENT_URL, credentials:true}))
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

//make ready for deployment
if (ENV.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.get('*path', (_, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

