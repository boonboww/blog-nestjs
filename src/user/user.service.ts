import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, In, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateResult } from 'typeorm/browser';
import { FilterUserDto } from './dto/filter-user.dto';
import { Like } from 'typeorm';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}
  async findAll(query: FilterUserDto): Promise<any> {
    const itemsPerPage = Number(query.items_per_page) || 10;
    const page = Number(query.page) || 1;
    const skip = (page - 1) * itemsPerPage;
    const keyword = query.search || '';
    const [res, total] = await this.userRepository.findAndCount({
      where: [
        {
          first_Name: Like(`%${keyword}%`),
        },
        {
          last_Name: Like(`%${keyword}%`),
        },
        {
          email: Like(`%${keyword}%`),
        },
      ],
      order: { created_at: 'DESC' },
      take: itemsPerPage,
      skip: skip,
      select: [
        'id',
        'first_Name',
        'last_Name',
        'email',
        'status',
        'created_at',
        'updated_at',
      ],
    });
    const lastPage = Math.ceil(total / itemsPerPage);
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

  async findOne(id: number): Promise<User | null> {
    return await this.userRepository.findOneBy({ id });
  }
  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashPassword = await bcrypt.hash(createUserDto.password, 10);
    return await this.userRepository.save({
      ...createUserDto,
      password: hashPassword,
    });
  }
  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UpdateResult> {
    return this.userRepository.update(id, updateUserDto);
  }
  async delete(id: number): Promise<DeleteResult> {
    return this.userRepository.delete(id);
  }
  async updateAvatar(id: number, avatar: string): Promise<UpdateResult> {
    return await this.userRepository.update(id, { avatar });
  }
  async multipleDelete(ids: string[]): Promise<DeleteResult> {
    return await this.userRepository.delete({ id: In(ids) });
  }
}
