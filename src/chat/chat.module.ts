import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ChatGateway } from './chat-gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { FriendModule } from 'src/friend/friend.module';
import { Message } from './entities/message.entity';
import { User } from 'src/user/entities/user.entity';
import { SupabaseModule } from 'src/supabase/supabase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, User]),
    FriendModule,
    JwtModule,
    ConfigModule,
    SupabaseModule, // Import để upload ảnh chat
  ],
  providers: [ChatGateway, ChatService],
  controllers: [ChatController],
  exports: [ChatGateway],
})
export class ChatModule {}
