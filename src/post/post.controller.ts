import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { storageConfig } from 'helpers/config';
import { extname } from 'path';
import { PostService } from './post.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { FilterPostDto } from './dto/filter-post.dto';
import { Post as PostEntity } from './entities/post.entity';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('posts')
export class PostController {
  constructor(private postService: PostService) {}

  @UseGuards(AuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      storage: storageConfig('post'),
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname);
        const allowedExtArr = ['.jpg', '.png', '.jpeg'];
        if (!allowedExtArr.includes(ext)) {
          req.fileValidationError = `Wrong extension type. Accepted file ext are: ${allowedExtArr.toString()}`;
          cb(null, false);
        } else {
          const fileSize = parseInt(req.headers['content-length']);
          if (fileSize > 1024 * 1024 * 5) {
            req.fileValidationError =
              'File size is too large. Accepted file size is less than 5 MB';
            cb(null, false);
          } else {
            cb(null, true);
          }
        }
      },
    }),
  )
  create(
    @Req() req: any,
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log(req['user_data']);
    console.log(createPostDto);
    console.log(file);
    if (req.fileValidationError) {
      throw new BadRequestException(req.fileValidationError);
    }
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.postService.create(req['user_data'].id, {
      ...createPostDto,
      thumbnail: file.destination + '/' + file.filename,
    });
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Query() query: FilterPostDto): Promise<any> {
    return this.postService.findAll(query);
  }

  @UseGuards(AuthGuard)
  @Get('user/:userId')
  findByUserId(
    @Param('userId') userId: string,
    @Query() query: FilterPostDto,
  ): Promise<any> {
    return this.postService.findByUserId(Number(userId), query);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<PostEntity> {
    return this.postService.findDetail(Number(id));
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      storage: storageConfig('post'),
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname);
        const allowedExtArr = ['.jpg', '.png', '.jpeg'];
        if (!allowedExtArr.includes(ext)) {
          req.fileValidationError = `Wrong extension type. Accepted file ext are: ${allowedExtArr.toString()}`;
          cb(null, false);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const fileSize = parseInt(req.headers['content-length']);
          if (fileSize > 1024 * 1024 * 5) {
            req.fileValidationError =
              'File size is too large. Accepted file size is less than 5 MB';
            cb(null, false);
          } else {
            cb(null, true);
          }
        }
      },
    }),
  )
  update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (req.fileValidationError) {
      throw new BadRequestException(req.fileValidationError);
    }

    if (file) {
      updatePostDto.thumbnail = file.destination + '/' + file.filename;
    }

    return this.postService.update(Number(id), updatePostDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.postService.delete(Number(id));
  }

  // ============ LIKE ENDPOINTS ============

  @UseGuards(AuthGuard)
  @Post(':id/like')
  likePost(@Param('id') id: string, @Req() req: any) {
    return this.postService.likePost(Number(id), Number(req.user_data.id));
  }

  @UseGuards(AuthGuard)
  @Delete(':id/like')
  unlikePost(@Param('id') id: string, @Req() req: any) {
    return this.postService.unlikePost(Number(id), Number(req.user_data.id));
  }

  @UseGuards(AuthGuard)
  @Get(':id/likes')
  getLikes(@Param('id') id: string) {
    return this.postService.getLikes(Number(id));
  }

  @UseGuards(AuthGuard)
  @Get(':id/liked')
  checkUserLiked(@Param('id') id: string, @Req() req: any) {
    return this.postService.checkUserLiked(
      Number(id),
      Number(req.user_data.id),
    );
  }

  // ============ COMMENT ENDPOINTS ============

  @UseGuards(AuthGuard)
  @Post(':id/comments')
  createComment(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: CreateCommentDto,
  ) {
    return this.postService.createComment(
      Number(id),
      Number(req.user_data.id),
      dto,
    );
  }

  @UseGuards(AuthGuard)
  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.postService.getComments(Number(id));
  }

  @UseGuards(AuthGuard)
  @Delete('comments/:commentId')
  deleteComment(@Param('commentId') commentId: string, @Req() req: any) {
    return this.postService.deleteComment(
      Number(commentId),
      Number(req.user_data.id),
    );
  }
}
