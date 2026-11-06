import { Controller, Post, Get, Param, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AttachmentsService } from './attachments.service';

@UseGuards(AuthGuard('jwt'))
@Controller('tasks/:taskId/attachments')
export class AttachmentsController {
  constructor(private attachments: AttachmentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: diskStorage({ destination: './uploads' }), limits: { fileSize: 20 * 1024 * 1024 } }))
  upload(@Param('taskId') taskId: string, @UploadedFile() file: Express.Multer.File, @Request() req) {
    return this.attachments.create(taskId, req.user.id, file);
  }

  @Get() findAll(@Param('taskId') taskId: string) { return this.attachments.findByTask(taskId); }
}
