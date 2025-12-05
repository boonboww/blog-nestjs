import { IsNotEmpty, IsNumber } from 'class-validator';

export class SendFriendRequestDto {
  @IsNotEmpty()
  @IsNumber()
  addresseeId: number;
}
