import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { GitIntegrationsModule } from '../git-integrations/git-integrations.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({ imports: [GitIntegrationsModule, TasksModule], providers: [WebhooksService], controllers: [WebhooksController] })
export class WebhooksModule {}
