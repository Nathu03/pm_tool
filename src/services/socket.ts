import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

let io: Server;

export function initSocket(server: HttpServer) {
  io = new Server(server, { cors: { origin: '*' } });
  io.on('connection', (socket) => {
    socket.on('join-project', (projectId: string) => socket.join(`project:${projectId}`));
    socket.on('leave-project', (projectId: string) => socket.leave(`project:${projectId}`));
  });
}

export function getIO() {
  return io;
}
