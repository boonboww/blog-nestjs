import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { GetChatHistoryDto } from './dto/get-chat-history.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { SupabaseService } from 'src/supabase/supabase.service';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly supabaseService: SupabaseService,
  ) {}

  // Upload chat image
  @Post('upload-image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        const allowedExtArr = ['.jpg', '.png', '.jpeg', '.gif', '.webp'];
        if (!allowedExtArr.includes(ext)) {
          req.fileValidationError = `Wrong extension type. Accepted file ext are: ${allowedExtArr.toString()}`;
          cb(null, false);
        } else {
          const fileSize = parseInt(req.headers['content-length']);
          if (fileSize > 1024 * 1024 * 10) {
            // 10MB limit
            req.fileValidationError =
              'File size is too large. Accepted file size is less than 10 MB';
            cb(null, false);
          } else {
            cb(null, true);
          }
        }
      },
    }),
  )
  async uploadImage(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (req.fileValidationError) {
      throw new BadRequestException(req.fileValidationError);
    }
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    // Upload to Supabase Storage
    const ext = extname(file.originalname).toLowerCase();
    const filename = `chat-${req.user_data.id}-${Date.now()}${ext}`;
    const path = `chat-images/${filename}`;

    const publicUrl = await this.supabaseService.uploadFile(
      'images',
      path,
      file.buffer,
      file.mimetype,
    );

    return { imageUrl: publicUrl };
  }

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
