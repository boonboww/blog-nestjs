import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(@Request() req, @Query() query: GetNotificationsDto) {
    const userId = Number(req.user_data.id);
    return this.notificationService.getNotifications(userId, query);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const userId = Number(req.user_data.id);
    return this.notificationService.getUnreadCount(userId);
  }

  @Patch(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    const userId = Number(req.user_data.id);
    return this.notificationService.markAsRead(Number(id), userId);
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    const userId = Number(req.user_data.id);
    return this.notificationService.markAllAsRead(userId);
  }
}
