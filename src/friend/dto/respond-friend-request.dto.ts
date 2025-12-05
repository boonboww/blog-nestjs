import { IsNotEmpty, IsNumber, IsIn } from 'class-validator';

export class RespondFriendRequestDto {
  @IsNotEmpty()
  @IsNumber()
  friendshipId: number;

  @IsNotEmpty()
  @IsIn(['accept', 'reject'])
  action: 'accept' | 'reject';
}
