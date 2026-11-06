import { Module } from '@nestjs/common';
import { BullModule } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiReviewProcessor } from './ai-review.processor';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    TasksModule,
    BullModule.forRootAsync({ inject: [ConfigService], useFactory: (cfg: ConfigService) => ({ connection: { host: cfg.get('REDIS_HOST', 'localhost'), port: cfg.get<number>('REDIS_PORT', 6379) } }) }),
    BullModule.registerQueue({ name: 'ai-review' }),
  ],
  providers: [AiService, AiReviewProcessor],
  controllers: [AiController],
})
export class AiModule {}
