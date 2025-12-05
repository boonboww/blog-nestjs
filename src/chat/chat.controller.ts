import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { GetChatHistoryDto } from './dto/get-chat-history.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Get chat history with a specific user
  @Get('history/:userId')
  async getChatHistory(
    @Request() req,
    @Param('userId') otherUserId: string,
    @Query() query: GetChatHistoryDto,
  ) {
    const currentUserId = Number(req.user_data.id);
    return await this.chatService.getChatHistory(
      currentUserId,
      Number(otherUserId),
      query,
    );
  }

  // Get list of conversations
  @Get('conversations')
  async getConversations(@Request() req) {
    const userId = Number(req.user_data.id);
    return await this.chatService.getConversations(userId);
  }

  // Mark messages as read
  @Patch('read/:userId')
  async markAsRead(@Request() req, @Param('userId') otherUserId: string) {
    const currentUserId = Number(req.user_data.id);
    return await this.chatService.markAsRead(
      currentUserId,
      Number(otherUserId),
    );
  }
}
