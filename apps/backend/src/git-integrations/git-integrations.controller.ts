import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GitIntegrationsService } from './git-integrations.service';

@UseGuards(AuthGuard('jwt'))
@Controller('projects/:projectId/repositories')
export class GitIntegrationsController {
  constructor(private git: GitIntegrationsService) {}
  @Post() add(@Param('projectId') projectId: string, @Body() body: any) { return this.git.addRepository(projectId, body); }
  @Get() list(@Param('projectId') projectId: string) { return this.git.findRepositoriesByProject(projectId); }
}
