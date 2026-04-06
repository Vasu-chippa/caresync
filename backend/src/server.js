import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/db.js';
import { redisClient } from './config/redis.js';
import { logger } from './config/logger.js';
import { setSocketServer, joinUserRooms } from './config/socket.js';
import { prescriptionSchedulerService } from './services/prescriptionScheduler.service.js';

const startServer = async () => {
  try {
    await connectDatabase();
    await redisClient.ping();

    const server = http.createServer(app);
    const io = new SocketIOServer(server, {
      cors: {
        origin: env.CLIENT_URL || true,
        credentials: true,
      },
    });

    io.on('connection', (socket) => {
      const { userId, role } = socket.handshake.query || {};
      joinUserRooms(socket, { userId, role });
    });

    setSocketServer(io);
  // Start prescription reminder scheduler
  prescriptionSchedulerService.start();


    server.listen(env.PORT, () => {
      logger.info('CareSyncr backend server started', {
        port: env.PORT,
        nodeEnv: env.NODE_ENV,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

startServer();
