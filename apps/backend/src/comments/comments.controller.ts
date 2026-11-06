import { Controller, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommentsService } from './comments.service';

@UseGuards(AuthGuard('jwt'))
@Controller()
export class CommentsController {
  constructor(private comments: CommentsService) {}

  @Post('tasks/:taskId/comments')
  create(@Param('taskId') taskId: string, @Body() body: any, @Request() req: any) {
    return this.comments.create(taskId, req.user.id, body.body, body.parentId);
  }

  @Patch('tasks/comments/:id')
  update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.comments.update(id, req.user.id, body.body);
  }

  @Delete('tasks/comments/:id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.comments.remove(id, req.user.id);
  }
}
