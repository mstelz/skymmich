
import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import imageRoutes from './images';
import plateSolvingRoutes from './plate-solving';
import equipmentRoutes from './equipment';
import equipmentGroupRoutes from './equipment-groups';
import immichRoutes from './immich';
import assetsRoutes from './assets';
import systemRoutes from './system';
import skyMapRoutes from './sky-map';
import locationRoutes from './locations';
import targetRoutes from './targets';
import catalogRoutes from './catalog';
import userTargetRoutes from './user-targets';

export async function registerRoutes(app: Express, io?: SocketIOServer): Promise<Server> {
  app.use('/api/images', imageRoutes);
  app.use('/api/plate-solving', plateSolvingRoutes(io));
  app.use('/api/equipment', equipmentRoutes);
  app.use('/api/equipment-groups', equipmentGroupRoutes);
  app.use('/api/immich', immichRoutes);
  app.use('/api/assets', assetsRoutes);
  app.use('/api/sky-map', skyMapRoutes);
  app.use('/api/locations', locationRoutes);
  app.use('/api/targets', targetRoutes);
  app.use('/api/catalog', catalogRoutes);
  app.use('/api/user-targets', userTargetRoutes);
  app.use('/api', systemRoutes(io));

  const httpServer = createServer(app);
  return httpServer;
}
