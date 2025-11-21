import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateResult } from 'typeorm/browser';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}
  async findAll(): Promise<User[]> {
    return this.userRepository.find({
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
  }

  async findOne(id: number): Promise<User | null> {
    return await this.userRepository.findOneBy({ id });
  }
  async create(createUserDto: CreateUserDto): Promise<User> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const hashPassword = await bcrypt.hash(createUserDto.password, 10);
    return await this.userRepository.save(createUserDto);
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
}
