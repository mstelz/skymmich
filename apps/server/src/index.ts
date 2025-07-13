import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { configService } from "./services/config";
import { registerRoutes } from "./routes";
import { cronManager, setSocketIO as setCronSocketIO } from './services/cron-manager';
// Vite imports are loaded dynamically to avoid bundling them in production
import { setSocketIO } from "./services/astrometry";
import { workerManager } from "./services/worker-manager";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Setup routes
registerRoutes(app, io);

// Main startup function
async function startServer() {
  // Serve static files (in production, frontend is pre-built to dist/public)
  const publicPath = path.resolve(process.cwd(), 'dist/public');
  app.use(express.static(publicPath));
  
  // Serve index.html for all non-API routes (SPA)
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(publicPath, 'index.html'));
  });

  // Initialize cron manager
  cronManager.initialize();

  // Socket.io connection handling
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Set Socket.io instance in astrometry service for real-time updates
  setSocketIO(io);

  // Set Socket.io instance in cron manager for real-time updates
  setCronSocketIO(io);

  // Start worker manager in production (in development, worker runs separately)
  if (process.env.NODE_ENV === "production") {
    console.log("Starting worker manager...");
    workerManager.start().catch(error => {
      console.error("Failed to start worker manager:", error);
    });
  }
}

// Start the server
startServer().catch(console.error);

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(() => {
    console.log("HTTP server closed");
  });
  
  // Stop worker manager
  if (process.env.NODE_ENV === "production") {
    try {
      await workerManager.gracefulShutdown();
    } catch (error) {
      console.error("Error during worker shutdown:", error);
    }
  }
  
  // Stop cron manager
  try {
    cronManager.shutdown();
  } catch (error) {
    console.error("Error during cron manager shutdown:", error);
  }
  
  console.log("Graceful shutdown complete");
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Export io for use in other modules
export { io };

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Skymmich server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'}`);
  console.log(`Worker enabled: ${process.env.ENABLE_PLATE_SOLVING || 'true'}`);
});
