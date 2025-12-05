import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';
import { Friendship } from './entities/friendship.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Friendship, User]),
    JwtModule,
    ConfigModule,
  ],
  controllers: [FriendController],
  providers: [FriendService],
  exports: [FriendService], // Export để dùng trong ChatGateway
})
export class FriendModule {}
