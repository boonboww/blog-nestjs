import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { ChatGateway } from 'src/chat/chat-gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private chatGateway: ChatGateway,
  ) {}

  async createNotification(data: {
    recipientId: number;
    senderId: number;
    type: NotificationType;
    postId: number;
  }) {
    // Không tạo notification nếu tự like/comment bài của mình
    if (data.recipientId === data.senderId) {
      return null;
    }

    const notification = this.notificationRepository.create({
      recipient_id: data.recipientId,
      sender_id: data.senderId,
      type: data.type,
      post_id: data.postId,
    });

    const saved = await this.notificationRepository.save(notification);

    // Lấy notification với đầy đủ thông tin để emit
    const fullNotification = await this.notificationRepository.findOne({
      where: { id: saved.id },
      relations: ['sender', 'post'],
      select: {
        id: true,
        type: true,
        is_read: true,
        created_at: true,
        sender: {
          id: true,
          first_Name: true,
          last_Name: true,
          avatar: true,
        },
        post: {
          id: true,
          title: true,
        },
      },
    });

    // Emit socket event real-time tới user cụ thể
    this.chatGateway.sendNotificationToUser(data.recipientId, {
      type: 'new_notification',
      data: fullNotification,
    });

    return fullNotification;
  }

  async getNotifications(userId: number, query: GetNotificationsDto) {
    const page = query.page || 1;
    const items_per_page = query.items_per_page || 10;
    const skip = (page - 1) * items_per_page;

    const [notifications, total] =
      await this.notificationRepository.findAndCount({
        where: { recipient_id: userId },
        relations: ['sender', 'post'],
        order: { created_at: 'DESC' },
        take: items_per_page,
        skip,
        select: {
          id: true,
          type: true,
          is_read: true,
          created_at: true,
          sender: {
            id: true,
            first_Name: true,
            last_Name: true,
            avatar: true,
          },
          post: {
            id: true,
            title: true,
          },
        },
      });

    const lastPage = Math.ceil(total / items_per_page);

    return {
      data: notifications,
      total,
      currentPage: page,
      lastPage,
      nextPage: page + 1 > lastPage ? null : page + 1,
      prevPage: page - 1 < 1 ? null : page - 1,
    };
  }

  async getUnreadCount(userId: number) {
    const count = await this.notificationRepository.count({
      where: { recipient_id: userId, is_read: false },
    });
    return { unreadCount: count };
  }

  async markAsRead(notificationId: number, userId: number) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, recipient_id: userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.is_read = true;
    await this.notificationRepository.save(notification);

    return { message: 'Notification marked as read' };
  }

  async markAllAsRead(userId: number) {
    await this.notificationRepository.update(
      { recipient_id: userId, is_read: false },
      { is_read: true },
    );

    return { message: 'All notifications marked as read' };
  }
}
