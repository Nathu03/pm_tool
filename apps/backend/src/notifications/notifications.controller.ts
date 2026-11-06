import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}
  @Get() findAll(@Request() req) { return this.notifications.findByUser(req.user.id); }
  @Patch(':id/read') markRead(@Param('id') id: string) { return this.notifications.markRead(id); }
  @Patch('read-all') markAllRead(@Request() req) { return this.notifications.markAllRead(req.user.id); }
}
