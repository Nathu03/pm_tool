import { Module } from '@nestjs/common';
import { GitIntegrationsService } from './git-integrations.service';
import { GitIntegrationsController } from './git-integrations.controller';

@Module({ providers: [GitIntegrationsService], controllers: [GitIntegrationsController], exports: [GitIntegrationsService] })
export class GitIntegrationsModule {}
