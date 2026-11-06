import { Processor, WorkerHost } from 'bullmq';
import { Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

@Processor('ai-review')
export class AiReviewProcessor extends WorkerHost {
  private openai: OpenAI | null = null;
  private readonly logger = new Logger(AiReviewProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
    if (process.env.OPENAI_API_KEY) this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async process(job: any) {
    const { taskId, reviewId } = job.data;
    await this.prisma.aiReview.update({ where: { id: reviewId }, data: { status: 'RUNNING' } });
    try {
      const task = await this.prisma.task.findUnique({ where: { id: taskId }, include: { commits: { take: 5 } } });
      if (!task || !this.openai) { await this.prisma.aiReview.update({ where: { id: reviewId }, data: { status: 'SKIPPED' } }); return; }

      const commitSummary = task.commits.map((c: any) => c.message).join('; ');
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: `Review task "${task.title}". Commits: ${commitSummary || 'none'}. Return JSON: {passed: bool, score: 0-100, findings: [{severity, message}], summary: string}` }],
        response_format: { type: 'json_object' },
      });
      const result = JSON.parse(response.choices[0].message.content || '{}');
      await this.prisma.aiReview.update({ where: { id: reviewId }, data: { status: result.passed ? 'PASSED' : 'FAILED', score: result.score, findings: result.findings, summary: result.summary } });
      await this.prisma.task.update({ where: { id: taskId }, data: { status: result.passed ? 'QA_BA_REVIEW' : 'IN_PROGRESS' } });
    } catch (err) {
      this.logger.error('AI review failed', err);
      await this.prisma.aiReview.update({ where: { id: reviewId }, data: { status: 'FAILED' } });
    }
  }
}
