import {
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { JwtGuard } from '../guards/jwt.guard';

function makeStorage(subfolder: 'images' | 'videos') {
  return diskStorage({
    destination: path.join(process.cwd(), 'uploads', subfolder),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${randomUUID()}${ext}`);
    },
  });
}

@UseGuards(JwtGuard)
@Controller('upload')
export class UploadController {
  @Post('image')
  @UseInterceptors(FileInterceptor('file', { storage: makeStorage('images') }))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return { url: `/uploads/images/${file.filename}` };
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 20, { storage: makeStorage('images') }))
  uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    return { urls: files.map((f) => `/uploads/images/${f.filename}`) };
  }

  @Post('video')
  @UseInterceptors(FileInterceptor('file', { storage: makeStorage('videos') }))
  uploadVideo(@UploadedFile() file: Express.Multer.File) {
    return { url: `/uploads/videos/${file.filename}` };
  }

  @Delete(':type/:filename')
  deleteFile(
    @Param('type') type: 'images' | 'videos',
    @Param('filename') filename: string,
  ) {
    if (type !== 'images' && type !== 'videos') {
      return { deleted: false, reason: 'invalid type' };
    }
    const filePath = path.join(process.cwd(), 'uploads', type, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { deleted: true };
    }
    return { deleted: false, reason: 'not found' };
  }
}