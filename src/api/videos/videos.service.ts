import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoEntity } from './video.entity';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { OrmService } from '../../orm/orm.service';

@Injectable()
export class VideosService extends OrmService<VideoEntity> {
  constructor(
    @InjectRepository(VideoEntity)
    private readonly videoRepo: Repository<VideoEntity>,
  ) {
    super(videoRepo, 'video');
  }

  findAll(): Promise<VideoEntity[]> {
    return this.videoRepo.find({ order: { priority: 'ASC', id: 'ASC' } });
  }

  async findById(id: number): Promise<VideoEntity> {
    const v = await this.videoRepo.findOne({ where: { id } });
    if (!v) throw new NotFoundException(`Video #${id} not found`);
    return v;
  }

  create(dto: CreateVideoDto): Promise<VideoEntity> {
    return this.videoRepo.save(this.videoRepo.create(dto));
  }

  async update(id: number, dto: UpdateVideoDto): Promise<VideoEntity> {
    await this.findById(id);
    await this.videoRepo.update(id, dto);
    return this.findById(id);
  }

  async remove(id: number): Promise<void> {
    await this.findById(id);
    await this.videoRepo.delete(id);
  }
}