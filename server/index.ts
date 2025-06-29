import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { configService } from "./config";
import { registerRoutes } from "./routes";
import { cronManager, setSocketIO as setCronSocketIO } from './cron-manager';
import { setupVite } from "./vite";
import { setSocketIO } from "./astrometry";

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

// Setup Vite in development
if (process.env.NODE_ENV === "development") {
  setupVite(app, server);
}

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

// Export io for use in other modules
export { io };

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`serving on port ${PORT}`);
});
