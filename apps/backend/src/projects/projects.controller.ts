import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectsService } from './projects.service';

@UseGuards(AuthGuard('jwt'))
@Controller('projects')
export class ProjectsController {
  constructor(private projects: ProjectsService) {}
  @Get() findAll(@Request() req) { return this.projects.findAll(req.user.id); }
  @Post() create(@Body() body: any, @Request() req) { return this.projects.create(body, req.user.id); }
  @Get(':id') findOne(@Param('id') id: string) { return this.projects.findOne(id); }
  @Post(':id/members') addMember(@Param('id') id: string, @Body() body: any) { return this.projects.addMember(id, body.userId, body.role); }
}
