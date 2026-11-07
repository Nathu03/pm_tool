import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { initSocket } from './services/socket';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import projectsRouter from './routes/projects';
import tasksRouter from './routes/tasks';
import repositoriesRouter from './routes/repositories';
import webhooksRouter from './routes/webhooks';
import leaveRouter from './routes/leave';
import departmentsRouter from './routes/departments';
import aiRouter from './routes/aiassistant';
import dashboardRouter from './routes/dashboard';

const app = express();
const httpServer = createServer(app);

initSocket(httpServer);

app.use(cors());
app.use(express.json());

const api = express.Router();
api.use('/auth', authRouter);
api.use('/users', usersRouter);
api.use('/projects', projectsRouter);
api.use('/tasks', tasksRouter);
api.use('/repositories', repositoriesRouter);
api.use('/webhooks', webhooksRouter);
api.use('/leave', leaveRouter);
api.use('/departments', departmentsRouter);
api.use('/ai', aiRouter);
api.use('/dashboard', dashboardRouter);

app.use('/api', api);

if (process.env.NODE_ENV === 'production') {
  const publicDir = path.join(__dirname, '../../public');
  app.use(express.static(publicDir));
  app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
}

const PORT = Number(process.env.PORT) || 3000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
