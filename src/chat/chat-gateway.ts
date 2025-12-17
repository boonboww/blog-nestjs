import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { FriendService } from 'src/friend/friend.service';
import { ChatService } from './chat.service';

@WebSocketGateway(3002, { cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly friendService: FriendService,
    private readonly chatService: ChatService,
  ) {}

  // Lưu userId ↔ socketId
  private users: Record<string, string> = {};

  // Khi user connect
  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (userId) {
      this.users[userId] = client.id;
      console.log(`User connected: ${userId} - socket: ${client.id}`);

      client.broadcast.emit('user-joined', {
        userId,
        message: `User ${userId} joined`,
      });
    }
  }

  // Khi user disconnect
  handleDisconnect(client: Socket) {
    const userId = Object.keys(this.users).find(
      (key) => this.users[key] === client.id,
    );

    if (userId) {
      delete this.users[userId];
      console.log(`User disconnected: ${userId}`);

      client.broadcast.emit('user-left', {
        userId,
        message: `User ${userId} left`,
      });
    }
  }

  // =========================
  //       CHAT 1 – 1
  // =========================

  @SubscribeMessage('privateMessage')
  async handlePrivateMessage(
    client: Socket,
    payload: {
      fromUserId: string;
      toUserId: string;
      message: string;
      imageUrl?: string;
    },
  ) {
    const { fromUserId, toUserId, message, imageUrl } = payload;

    // Kiểm tra 2 user có phải bạn bè không
    const areFriends = await this.friendService.areFriends(
      +fromUserId,
      +toUserId,
    );

    if (!areFriends) {
      client.emit('error', {
        message: 'You must be friends to send private messages',
      });
      return { error: 'You must be friends to send private messages' };
    }

    // Save message to database (with optional image)
    const savedMessage = await this.chatService.saveMessage(
      +fromUserId,
      +toUserId,
      message,
      imageUrl,
    );

    const targetSocket = this.users[toUserId];

    // Prepare message data with DB info
    const messageData = {
      id: savedMessage.id,
      from: fromUserId,
      to: toUserId,
      message: message,
      imageUrl: savedMessage.image_url,
      timestamp: savedMessage.created_at,
      isRead: false,
    };

    // Send to target user if online
    if (targetSocket) {
      this.server.to(targetSocket).emit('privateMessage', messageData);
    }

    // Send confirmation back to sender
    client.emit('messageSent', {
      ...messageData,
      isRead: targetSocket ? false : undefined, // undefined if user offline
    });

    return { success: true, messageId: savedMessage.id };
  }

  // =========================
  //        GROUP CHAT
  // =========================

  // Join room
  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
    console.log(`Socket ${client.id} joined room ${room}`);

    this.server.to(room).emit('roomInfo', {
      message: `User ${client.id} joined room ${room}`,
    });
  }

  // Rời room
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, room: string) {
    client.leave(room);
    this.server.to(room).emit('roomInfo', {
      message: `User ${client.id} left room ${room}`,
    });
  }

  // Send message trong group
  @SubscribeMessage('groupMessage')
  handleGroupMessage(
    client: Socket,
    payload: { room: string; message: string },
  ) {
    this.server.to(payload.room).emit('groupMessage', {
      from: client.id,
      message: payload.message,
    });
  }

  // =========================
  //  BROADCAST TOÀN SERVER
  // =========================

  @SubscribeMessage('newMessage')
  handleNewMessage(client: Socket, message: any) {
    console.log('BROADCAST:', message);
    this.server.emit('newMessage', message);
  }

  // =========================
  //  SEND NOTIFICATION TO USER
  // =========================

  sendNotificationToUser(userId: number, notification: any) {
    console.log('=== SEND NOTIFICATION ===');
    console.log('Target userId:', userId);
    console.log('Connected users:', this.users);

    const targetSocket = this.users[userId.toString()];
    console.log('Target socket:', targetSocket);

    if (targetSocket) {
      this.server.to(targetSocket).emit('newNotification', notification);
      console.log('Notification sent!');
      return true;
    }
    console.log('User offline, notification not sent');
    return false; // User offline
  }
}
