import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from 'bullmq';
import { Queue } from 'bullmq';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  private openai: OpenAI | null = null;
  private readonly logger = new Logger(AiService.name);

  constructor(private prisma: PrismaService, @InjectQueue('ai-review') private reviewQueue: Queue) {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    } else {
      this.logger.warn('OPENAI_API_KEY not set - AI features disabled');
    }
  }

  async queueReview(taskId: string) {
    const review = await this.prisma.aiReview.create({ data: { taskId, status: 'PENDING' } });
    await this.reviewQueue.add('review', { taskId, reviewId: review.id });
    return review;
  }

  async chat(message: string, taskId?: string, conversationId?: string) {
    if (!this.openai) return { reply: 'AI is not configured. Set OPENAI_API_KEY.' };
    let context = '';
    if (taskId) {
      const task = await this.prisma.task.findUnique({ where: { id: taskId }, include: { assignees: { include: { user: true } } } });
      if (task) context = `Task context: ${task.taskNumber} - ${task.title} (${task.status})`;
    }
    const messages: any[] = [
      { role: 'system', content: `You are TaskFlow AI, a project management assistant.${context ? ' ' + context : ''}` },
      { role: 'user', content: message },
    ];
    const response = await this.openai.chat.completions.create({ model: 'gpt-4o', messages, max_tokens: 1000 });
    return { reply: response.choices[0].message.content };
  }

  async generateTestCases(taskId: string) {
    if (!this.openai) return { testCases: [] };
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return { testCases: [] };
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: `Generate test cases for: ${task.title}. AC: ${task.acceptanceCriteria || 'N/A'}. Return JSON array with {id, description, steps, expected}.` }],
      response_format: { type: 'json_object' },
    });
    return JSON.parse(response.choices[0].message.content || '{}');
  }
}
