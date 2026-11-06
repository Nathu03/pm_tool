import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';

@UseGuards(AuthGuard('jwt'))
@Controller('ai')
export class AiController {
  constructor(private ai: AiService) {}
  @Post('chat') chat(@Body() body: any) { return this.ai.chat(body.message, body.taskId, body.conversationId); }
  @Post('review/:taskId') queueReview(@Param('taskId') taskId: string) { return this.ai.queueReview(taskId); }
  @Post('test-cases/:taskId') generateTestCases(@Param('taskId') taskId: string) { return this.ai.generateTestCases(taskId); }
}
