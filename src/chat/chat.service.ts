import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Message } from './entities/message.entity';
import { User } from 'src/user/entities/user.entity';
import { GetChatHistoryDto } from './dto/get-chat-history.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async saveMessage(
    senderId: number,
    receiverId: number,
    content: string,
    imageUrl?: string,
  ): Promise<Message> {
    const message = this.messageRepository.create({
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      image_url: imageUrl,
      is_read: false,
    });

    return await this.messageRepository.save(message);
  }

  async getChatHistory(
    currentUserId: number,
    otherUserId: number,
    query: GetChatHistoryDto,
  ) {
    const { page = 1, limit = 50, before } = query;
    const skip = (page - 1) * limit;

    // Verify other user exists
    const otherUser = await this.userRepository.findOne({
      where: { id: otherUserId },
    });
    if (!otherUser) {
      throw new NotFoundException('User not found');
    }

    // Build query
    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where(
        '((message.sender_id = :userId1 AND message.receiver_id = :userId2) OR (message.sender_id = :userId2 AND message.receiver_id = :userId1))',
        { userId1: currentUserId, userId2: otherUserId },
      )
      .orderBy('message.created_at', 'DESC');

    // Filter by before date if provided
    if (before) {
      queryBuilder.andWhere('message.created_at < :before', { before });
    }

    // Pagination
    queryBuilder.skip(skip).take(limit);

    const [messages, total] = await queryBuilder.getManyAndCount();

    // Map to response format
    const data = messages.map((msg) => ({
      id: msg.id,
      senderId: msg.sender_id,
      senderName: `${msg.sender.first_Name} ${msg.sender.last_Name}`,
      senderAvatar: msg.sender.avatar,
      content: msg.content,
      imageUrl: msg.image_url,
      isRead: msg.is_read,
      isFromMe: msg.sender_id === currentUserId,
      createdAt: msg.created_at,
    }));

    return {
      data: data.reverse(), // Reverse to show oldest first
      total,
      page,
      limit,
      hasMore: skip + messages.length < total,
    };
  }

  async getConversations(userId: number) {
    // Get all distinct users that userId has chatted with
    const conversations = await this.messageRepository
      .createQueryBuilder('message')
      .select('DISTINCT sub.other_user_id', 'userId')
      .addSelect('MAX(sub.created_at)', 'lastMessageTime')
      .addSelect(
        'SUM(CASE WHEN sub.receiver_id = :userId AND sub.is_read = false THEN 1 ELSE 0 END)',
        'unreadCount',
      )
      .from((subQuery) => {
        return subQuery
          .select(
            'CASE WHEN sender_id = :userId THEN receiver_id ELSE sender_id END',
            'other_user_id',
          )
          .addSelect('id')
          .addSelect('sender_id')
          .addSelect('receiver_id')
          .addSelect('content')
          .addSelect('is_read')
          .addSelect('created_at')
          .from(Message, 'msg')
          .where('sender_id = :userId OR receiver_id = :userId', { userId });
      }, 'sub')
      .groupBy('sub.other_user_id')
      .orderBy('lastMessageTime', 'DESC')
      .setParameter('userId', userId)
      .getRawMany();

    // Get user info and last message for each conversation
    const result = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = await this.userRepository.findOne({
          where: { id: Number(conv.userId) },
        });

        if (!otherUser) {
          return null; // Skip if user doesn't exist anymore
        }

        const lastMessage = await this.messageRepository.findOne({
          where: [
            { sender_id: userId, receiver_id: Number(conv.userId) },
            { sender_id: Number(conv.userId), receiver_id: userId },
          ],
          order: { created_at: 'DESC' },
        });

        if (!lastMessage) {
          return null; // Skip if no messages found
        }

        return {
          user: {
            id: otherUser.id,
            firstName: otherUser.first_Name,
            lastName: otherUser.last_Name,
            avatar: otherUser.avatar,
          },
          lastMessage: {
            content: lastMessage.content,
            timestamp: lastMessage.created_at,
            isFromMe: lastMessage.sender_id === userId,
          },
          unreadCount: Number(conv.unreadCount),
        };
      }),
    );

    // Filter out null values
    return { data: result.filter((item) => item !== null) };
  }

  async markAsRead(userId: number, conversationWithUserId: number) {
    // Mark all messages from conversationWithUserId to userId as read
    await this.messageRepository.update(
      {
        sender_id: conversationWithUserId,
        receiver_id: userId,
        is_read: false,
      },
      { is_read: true },
    );

    return { message: 'Messages marked as read' };
  }
}
