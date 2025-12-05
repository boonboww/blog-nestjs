import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { RespondFriendRequestDto } from './dto/respond-friend-request.dto';
import { GetFriendsDto } from './dto/get-friends.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('friend')
@UseGuards(AuthGuard)
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  // Gửi lời mời kết bạn
  @Post('request')
  async sendFriendRequest(@Request() req, @Body() dto: SendFriendRequestDto) {
    const requesterId = Number(req.user_data.id);
    return await this.friendService.sendFriendRequest(
      requesterId,
      dto.addresseeId,
    );
  }

  // Chấp nhận hoặc từ chối lời mời
  @Post('respond')
  async respondToFriendRequest(
    @Request() req,
    @Body() dto: RespondFriendRequestDto,
  ) {
    const userId = Number(req.user_data.id);

    if (dto.action === 'accept') {
      return await this.friendService.acceptFriendRequest(
        userId,
        dto.friendshipId,
      );
    } else {
      return await this.friendService.rejectFriendRequest(
        userId,
        dto.friendshipId,
      );
    }
  }

  // Unfriend
  @Delete(':friendId')
  async unfriend(@Request() req, @Param('friendId') friendId: string) {
    const userId = Number(req.user_data.id);
    return await this.friendService.unfriend(userId, Number(friendId));
  }

  // Block user
  @Post('block/:userId')
  async blockUser(@Request() req, @Param('userId') targetUserId: string) {
    const userId = Number(req.user_data.id);
    return await this.friendService.blockUser(userId, Number(targetUserId));
  }

  // Lấy danh sách bạn bè
  @Get('list')
  async getFriends(@Request() req, @Query() query: GetFriendsDto) {
    const userId = Number(req.user_data.id);
    return await this.friendService.getFriends(userId, query);
  }

  // Lấy danh sách lời mời đang chờ
  @Get('pending')
  async getPendingRequests(@Request() req) {
    const userId = Number(req.user_data.id);
    return await this.friendService.getPendingRequests(userId);
  }

  // Kiểm tra trạng thái kết bạn với user khác
  @Get('status/:userId')
  async checkFriendshipStatus(
    @Request() req,
    @Param('userId') targetUserId: string,
  ) {
    const userId = Number(req.user_data.id);
    return await this.friendService.checkFriendshipStatus(
      userId,
      Number(targetUserId),
    );
  }
}
