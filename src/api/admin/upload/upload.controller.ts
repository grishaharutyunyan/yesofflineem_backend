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
import sharp from 'sharp';

function makeVideoStorage() {
  return diskStorage({
    destination: path.join(process.cwd(), 'uploads', 'videos'),
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
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const filename = `${randomUUID()}.webp`;
    const uploadsDir = path.join(process.cwd(), 'uploads', 'images');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const targetPath = path.join(uploadsDir, filename);

    await sharp(file.buffer)
      .resize({
        width: 800,
        height: 1000,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toFormat('webp', { quality: 85 })
      .toFile(targetPath);

    return { url: `/uploads/images/${filename}` };
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 20))
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'images');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const urls: string[] = [];

    for (const file of files) {
      const filename = `${randomUUID()}.webp`;
      const targetPath = path.join(uploadsDir, filename);

      await sharp(file.buffer)
        .resize({
          width: 800,
          height: 1000,
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .toFormat('webp', { quality: 85 })
        .toFile(targetPath);

      urls.push(`/uploads/images/${filename}`);
    }

    return { urls };
  }

  @Post('video')
  @UseInterceptors(FileInterceptor('file', { storage: makeVideoStorage() }))
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