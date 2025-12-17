import {
  HttpException,
  HttpStatus,
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { Post } from './entities/post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Like, Repository, UpdateResult } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { FilterPostDto } from './dto/filter-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Like as LikeEntity } from './entities/like.entity';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from 'src/notification/entities/notification.entity';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Post) private postRepository: Repository<Post>,
    @InjectRepository(LikeEntity)
    private likeRepository: Repository<LikeEntity>,
    @InjectRepository(Comment) private commentRepository: Repository<Comment>,
    private notificationService: NotificationService,
  ) {}
  async create(userId: number, createPostDto: CreatePostDto): Promise<Post> {
    const user = await this.userRepository.findOneBy({ id: userId });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    try {
      const res = await this.postRepository.save({
        ...createPostDto,
        user,
      });

      const post = await this.postRepository.findOneBy({ id: res.id });

      if (!post) {
        throw new HttpException(
          'Post created but could not be retrieved',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return post;
    } catch (error) {
      throw new HttpException('Can not create post', HttpStatus.BAD_REQUEST);
    }
  }

  async findAll(query: FilterPostDto): Promise<any> {
    const items_per_page = Number(query.items_per_page) || 10;
    const page = Number(query.page) || 1;
    const search = query.search || '';
    const userId = Number(query.user_id) || null;

    const skip = (page - 1) * items_per_page;

    // Build where clause
    const whereConditions: any[] = [];

    if (userId) {
      whereConditions.push(
        {
          title: Like('%' + search + '%'),
          user: {
            id: userId,
          },
        },
        {
          description: Like('%' + search + '%'),
          user: {
            id: userId,
          },
        },
      );
    } else {
      whereConditions.push(
        {
          title: Like('%' + search + '%'),
        },
        {
          description: Like('%' + search + '%'),
        },
      );
    }

    const [res, total] = await this.postRepository.findAndCount({
      where: whereConditions,
      order: { created_at: 'DESC' },
      take: items_per_page,
      skip: skip,
      relations: {
        user: true,
      },
      select: {
        user: {
          id: true,
          first_Name: true,
          last_Name: true,
          email: true,
          avatar: true,
        },
      },
    });

    const lastPage = Math.ceil(total / items_per_page);
    const nextPage = page + 1 > lastPage ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;

    return {
      data: res,
      total,
      currentPage: page,
      nextPage,
      prevPage,
      lastPage,
    };
  }

  async findDetail(id: number): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['user'],
      select: {
        user: {
          id: true,
          first_Name: true,
          last_Name: true,
          email: true,
          avatar: true,
        },
      },
    });

    if (!post) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }

    return post;
  }

  async update(
    id: number,
    updatePostDto: UpdatePostDto,
  ): Promise<UpdateResult> {
    return await this.postRepository.update(id, updatePostDto);
  }

  async delete(id: number): Promise<DeleteResult> {
    return await this.postRepository.delete(id);
  }

  async findByUserId(userId: number, query: FilterPostDto): Promise<any> {
    const items_per_page = Number(query.items_per_page) || 10;
    const page = Number(query.page) || 1;
    const search = query.search || '';

    const skip = (page - 1) * items_per_page;

    const [res, total] = await this.postRepository.findAndCount({
      where: [
        {
          user: { id: userId },
          title: Like('%' + search + '%'),
        },
        {
          user: { id: userId },
          description: Like('%' + search + '%'),
        },
      ],
      order: { created_at: 'DESC' },
      take: items_per_page,
      skip: skip,
      relations: {
        user: true,
      },
      select: {
        user: {
          id: true,
          first_Name: true,
          last_Name: true,
          email: true,
          avatar: true,
        },
      },
    });

    const lastPage = Math.ceil(total / items_per_page);
    const nextPage = page + 1 > lastPage ? null : page + 1;
    const prevPage = page - 1 < 1 ? null : page - 1;

    return {
      data: res,
      total,
      currentPage: page,
      nextPage,
      prevPage,
      lastPage,
    };
  }

  // ============ LIKE METHODS ============

  async likePost(postId: number, userId: number) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['user'],
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.likeRepository.findOne({
      where: { post: { id: postId }, user: { id: userId } },
    });

    if (existingLike) {
      throw new ConflictException('You already liked this post');
    }

    const like = this.likeRepository.create({
      post: { id: postId } as Post,
      user: { id: userId } as User,
    });

    await this.likeRepository.save(like);

    // Tạo notification cho chủ bài viết
    await this.notificationService.createNotification({
      recipientId: post.user.id,
      senderId: userId,
      type: NotificationType.LIKE,
      postId: postId,
    });

    return { message: 'Post liked successfully' };
  }

  async unlikePost(postId: number, userId: number) {
    const like = await this.likeRepository.findOne({
      where: { post: { id: postId }, user: { id: userId } },
    });

    if (!like) {
      throw new NotFoundException('You have not liked this post');
    }

    await this.likeRepository.remove(like);
    return { message: 'Post unliked successfully' };
  }

  async getLikes(postId: number) {
    const post = await this.postRepository.findOneBy({ id: postId });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const [likes, total] = await this.likeRepository.findAndCount({
      where: { post: { id: postId } },
      relations: ['user'],
      select: {
        id: true,
        created_at: true,
        user: {
          id: true,
          first_Name: true,
          last_Name: true,
          avatar: true,
        },
      },
    });

    return { data: likes, total };
  }

  async checkUserLiked(postId: number, userId: number) {
    const like = await this.likeRepository.findOne({
      where: { post: { id: postId }, user: { id: userId } },
    });
    return { liked: !!like };
  }

  // ============ COMMENT METHODS ============

  async createComment(postId: number, userId: number, dto: CreateCommentDto) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['user'],
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = this.commentRepository.create({
      content: dto.content,
      post: { id: postId } as Post,
      user: { id: userId } as User,
    });

    const savedComment = await this.commentRepository.save(comment);

    // Tạo notification cho chủ bài viết
    await this.notificationService.createNotification({
      recipientId: post.user.id,
      senderId: userId,
      type: NotificationType.COMMENT,
      postId: postId,
    });

    // Return with user info
    return await this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user'],
      select: {
        id: true,
        content: true,
        created_at: true,
        user: {
          id: true,
          first_Name: true,
          last_Name: true,
          avatar: true,
        },
      },
    });
  }

  async getComments(postId: number) {
    const post = await this.postRepository.findOneBy({ id: postId });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const [comments, total] = await this.commentRepository.findAndCount({
      where: { post: { id: postId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
      select: {
        id: true,
        content: true,
        created_at: true,
        user: {
          id: true,
          first_Name: true,
          last_Name: true,
          avatar: true,
        },
      },
    });

    return { data: comments, total };
  }

  async deleteComment(commentId: number, userId: number) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user.id !== userId) {
      throw new HttpException(
        'You can only delete your own comments',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.commentRepository.remove(comment);
    return { message: 'Comment deleted successfully' };
  }
}
