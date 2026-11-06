import { Controller, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommentsService } from './comments.service';

@UseGuards(AuthGuard('jwt'))
@Controller('tasks/:taskId/comments')
export class CommentsController {
  constructor(private comments: CommentsService) {}
  @Post() create(@Param('taskId') taskId: string, @Body() body: any, @Request() req) { return this.comments.create(taskId, req.user.id, body.body, body.parentId); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any, @Request() req) { return this.comments.update(id, req.user.id, body.body); }
  @Delete(':id') remove(@Param('id') id: string, @Request() req) { return this.comments.remove(id, req.user.id); }
}
