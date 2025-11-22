import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { Post } from './entities/post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Like, Repository, UpdateResult } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { FilterPostDto } from './dto/filter-post.dto';
import { UpdatePostDto } from './dto/update-post.sto';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Post) private postRepository: Repository<Post>,
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
          'Post created but not found',
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
    const [res, total] = await this.postRepository.findAndCount({
      where: [
        { title: Like(`%${search}%`) },
        { description: Like(`%${search}%`) },
      ],
      order: {
        created_at: 'DESC',
      },
      take: items_per_page,
      skip: (page - 1) * items_per_page,
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
      lastPage,
      nextPage,
      prevPage,
    };
  }
  async findDetail(id: number): Promise<any> {
    return await this.postRepository.findOne({
      where: {
        id,
      },
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
}
