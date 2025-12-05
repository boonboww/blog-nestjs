import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { Friendship } from './entities/friendship.entity';
import { FriendshipStatus } from './enums/friendship-status.enum';
import { User } from 'src/user/entities/user.entity';
import { GetFriendsDto } from './dto/get-friends.dto';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(Friendship)
    private friendshipRepository: Repository<Friendship>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async sendFriendRequest(requesterId: number, addresseeId: number) {
    // Kiểm tra không tự gửi cho chính mình
    if (requesterId === addresseeId) {
      throw new BadRequestException(
        'You cannot send friend request to yourself',
      );
    }

    // Kiểm tra addressee có tồn tại không
    const addressee = await this.userRepository.findOne({
      where: { id: addresseeId },
    });
    if (!addressee) {
      throw new NotFoundException('User not found');
    }

    // Kiểm tra đã có friendship chưa (cả 2 chiều)
    const existingFriendship = await this.friendshipRepository.findOne({
      where: [
        { requester_id: requesterId, addressee_id: addresseeId },
        { requester_id: addresseeId, addressee_id: requesterId },
      ],
    });

    if (existingFriendship) {
      if (existingFriendship.status === FriendshipStatus.PENDING) {
        throw new ConflictException('Friend request already sent');
      }
      if (existingFriendship.status === FriendshipStatus.ACCEPTED) {
        throw new ConflictException('You are already friends');
      }
      if (existingFriendship.status === FriendshipStatus.BLOCKED) {
        throw new ConflictException(
          'Cannot send friend request to blocked user',
        );
      }
      // Nếu REJECTED, cho phép gửi lại
      if (existingFriendship.status === FriendshipStatus.REJECTED) {
        existingFriendship.status = FriendshipStatus.PENDING;
        existingFriendship.requester_id = requesterId;
        existingFriendship.addressee_id = addresseeId;
        return await this.friendshipRepository.save(existingFriendship);
      }
    }

    // Tạo friendship mới
    const friendship = this.friendshipRepository.create({
      requester_id: requesterId,
      addressee_id: addresseeId,
      status: FriendshipStatus.PENDING,
    });

    return await this.friendshipRepository.save(friendship);
  }

  async acceptFriendRequest(userId: number, friendshipId: number) {
    console.log('acceptFriendRequest called with:', {
      userId,
      friendshipId,
      userIdType: typeof userId,
      friendshipIdType: typeof friendshipId,
    });

    const friendship = await this.friendshipRepository.findOne({
      where: { id: friendshipId },
    });

    console.log('Found friendship:', friendship);

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    // Kiểm tra user phải là người nhận request
    if (friendship.addressee_id !== userId) {
      throw new BadRequestException(
        'You are not authorized to accept this request',
      );
    }

    // Kiểm tra status phải là PENDING
    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('This request cannot be accepted');
    }

    friendship.status = FriendshipStatus.ACCEPTED;
    return await this.friendshipRepository.save(friendship);
  }

  async rejectFriendRequest(userId: number, friendshipId: number) {
    const friendship = await this.friendshipRepository.findOne({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    // Kiểm tra user phải là người nhận request
    if (friendship.addressee_id !== userId) {
      throw new BadRequestException(
        'You are not authorized to reject this request',
      );
    }

    // Kiểm tra status phải là PENDING
    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('This request cannot be rejected');
    }

    friendship.status = FriendshipStatus.REJECTED;
    return await this.friendshipRepository.save(friendship);
  }

  async unfriend(userId: number, friendId: number) {
    // Tìm friendship ACCEPTED giữa 2 user (cả 2 chiều)
    const friendship = await this.friendshipRepository.findOne({
      where: [
        {
          requester_id: userId,
          addressee_id: friendId,
          status: FriendshipStatus.ACCEPTED,
        },
        {
          requester_id: friendId,
          addressee_id: userId,
          status: FriendshipStatus.ACCEPTED,
        },
      ],
    });

    if (!friendship) {
      throw new NotFoundException('You are not friends with this user');
    }

    await this.friendshipRepository.remove(friendship);
    return { message: 'Unfriended successfully' };
  }

  async blockUser(userId: number, targetUserId: number) {
    if (userId === targetUserId) {
      throw new BadRequestException('You cannot block yourself');
    }

    // Kiểm tra target user có tồn tại không
    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Tìm friendship hiện tại (cả 2 chiều)
    let friendship = await this.friendshipRepository.findOne({
      where: [
        { requester_id: userId, addressee_id: targetUserId },
        { requester_id: targetUserId, addressee_id: userId },
      ],
    });

    if (friendship) {
      // Update status thành BLOCKED
      friendship.status = FriendshipStatus.BLOCKED;
      friendship.requester_id = userId; // User block là requester
      friendship.addressee_id = targetUserId;
    } else {
      // Tạo mới với status BLOCKED
      friendship = this.friendshipRepository.create({
        requester_id: userId,
        addressee_id: targetUserId,
        status: FriendshipStatus.BLOCKED,
      });
    }

    return await this.friendshipRepository.save(friendship);
  }

  async getFriends(userId: number, query: GetFriendsDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    // Query builder để lấy friends
    const queryBuilder = this.friendshipRepository
      .createQueryBuilder('friendship')
      .where('friendship.status = :status', {
        status: FriendshipStatus.ACCEPTED,
      })
      .andWhere(
        '(friendship.requester_id = :userId OR friendship.addressee_id = :userId)',
        { userId },
      );

    // Join với User để lấy thông tin bạn bè
    queryBuilder
      .leftJoinAndSelect('friendship.requester', 'requester')
      .leftJoinAndSelect('friendship.addressee', 'addressee');

    // Nếu có search, tìm theo tên
    if (search) {
      queryBuilder.andWhere(
        '(CONCAT(requester.first_Name, " ", requester.last_Name) LIKE :search OR CONCAT(addressee.first_Name, " ", addressee.last_Name) LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Pagination
    queryBuilder.skip(skip).take(limit);

    const [friendships, total] = await queryBuilder.getManyAndCount();

    // Map để lấy thông tin user (không phải current user)
    const friends = friendships.map((friendship) => {
      const friend =
        friendship.requester_id === userId
          ? friendship.addressee
          : friendship.requester;

      return {
        id: friend.id,
        first_Name: friend.first_Name,
        last_Name: friend.last_Name,
        email: friend.email,
        avatar: friend.avatar,
        friendshipId: friendship.id,
        friendsSince: friendship.created_at,
      };
    });

    return {
      data: friends,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPendingRequests(userId: number) {
    // Lấy các request mà user là người nhận (addressee)
    const requests = await this.friendshipRepository.find({
      where: {
        addressee_id: userId,
        status: FriendshipStatus.PENDING,
      },
      relations: ['requester'],
      order: {
        created_at: 'DESC',
      },
    });

    return requests.map((request) => ({
      friendshipId: request.id,
      requester: {
        id: request.requester.id,
        first_Name: request.requester.first_Name,
        last_Name: request.requester.last_Name,
        email: request.requester.email,
        avatar: request.requester.avatar,
      },
      createdAt: request.created_at,
    }));
  }

  async checkFriendshipStatus(userId1: number, userId2: number) {
    const friendship = await this.friendshipRepository.findOne({
      where: [
        { requester_id: userId1, addressee_id: userId2 },
        { requester_id: userId2, addressee_id: userId1 },
      ],
    });

    if (!friendship) {
      return { status: null, message: 'No friendship exists' };
    }

    return {
      status: friendship.status,
      friendshipId: friendship.id,
      requester_id: friendship.requester_id,
      addressee_id: friendship.addressee_id,
    };
  }

  // Helper method để check xem 2 user có phải bạn không (dùng cho ChatGateway)
  async areFriends(userId1: number, userId2: number): Promise<boolean> {
    const friendship = await this.friendshipRepository.findOne({
      where: [
        {
          requester_id: userId1,
          addressee_id: userId2,
          status: FriendshipStatus.ACCEPTED,
        },
        {
          requester_id: userId2,
          addressee_id: userId1,
          status: FriendshipStatus.ACCEPTED,
        },
      ],
    });

    return !!friendship;
  }
}
