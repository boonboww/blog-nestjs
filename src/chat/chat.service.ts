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
    // Get all messages where the user is sender or receiver
    const allMessages = await this.messageRepository.find({
      where: [{ sender_id: userId }, { receiver_id: userId }],
      order: { created_at: 'DESC' },
    });

    // Group by other user
    const conversationMap = new Map<
      number,
      { lastMessage: Message; unreadCount: number }
    >();

    for (const msg of allMessages) {
      const otherUserId =
        msg.sender_id === userId ? msg.receiver_id : msg.sender_id;

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          lastMessage: msg,
          unreadCount: 0,
        });
      }

      // Count unread messages (messages TO the current user that are not read)
      if (msg.receiver_id === userId && !msg.is_read) {
        const conv = conversationMap.get(otherUserId)!;
        conv.unreadCount++;
      }
    }

    // Get user info for each conversation
    const result = await Promise.all(
      Array.from(conversationMap.entries()).map(
        async ([otherUserId, convData]) => {
          const otherUser = await this.userRepository.findOne({
            where: { id: otherUserId },
          });

          if (!otherUser) {
            return null;
          }

          return {
            user: {
              id: otherUser.id,
              firstName: otherUser.first_Name,
              lastName: otherUser.last_Name,
              avatar: otherUser.avatar,
            },
            lastMessage: {
              content: convData.lastMessage.content,
              timestamp: convData.lastMessage.created_at,
              isFromMe: convData.lastMessage.sender_id === userId,
            },
            unreadCount: convData.unreadCount,
          };
        },
      ),
    );

    // Filter out null values and sort by last message time
    const filtered = result.filter(
      (item): item is NonNullable<typeof item> => item !== null,
    );
    filtered.sort(
      (a, b) =>
        new Date(b.lastMessage.timestamp).getTime() -
        new Date(a.lastMessage.timestamp).getTime(),
    );

    return { data: filtered };
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
