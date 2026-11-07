import { Router, Response } from 'express';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.post('/chat', async (req, res: Response) => {
  const { message } = req.body;
  res.json({
    reply: `I received: "${message}". AI integration is a placeholder — connect your preferred LLM in src/routes/aiassistant.ts.`,
    timestamp: new Date().toISOString(),
  });
});

export default router;
