import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { User } from 'src/user/entities/user.entity';
import { Like } from './entities/like.entity';
import { Comment } from './entities/comment.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Post, User, Like, Comment]),
    JwtModule,
  ],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
