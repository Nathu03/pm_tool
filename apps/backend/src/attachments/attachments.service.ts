import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttachmentsService {
  constructor(private prisma: PrismaService) {}
  create(taskId: string, uploaderId: string, file: Express.Multer.File) {
    return this.prisma.taskAttachment.create({ data: { taskId, uploaderId, fileName: file.originalname, fileSize: file.size, mimeType: file.mimetype, storageKey: file.filename || file.path } });
  }
  findByTask(taskId: string) { return this.prisma.taskAttachment.findMany({ where: { taskId } }); }
}
