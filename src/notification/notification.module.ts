import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    JwtModule,
    ConfigModule,
    ChatModule, // Import để sử dụng ChatGateway
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService], // Export để PostService có thể inject
})
export class NotificationModule {}
