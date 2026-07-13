import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventStatus } from '../../constants/enums/event.enums';
import { EventEntity } from './event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { OrmService } from '../../orm/orm.service';
import { IPaginationData, IPaginationDTO } from '../../constants/interfaces/pagination.interfaces';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

@Injectable()
export class EventsService extends OrmService<EventEntity> {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
  ) {
    super(eventRepo, 'event');
  }

  async paginate(options: IPaginationDTO<EventEntity>): Promise<IPaginationData<EventEntity>> {
    const qb = this.getQueryBuilder();

    if (options.filter?.status) {
      qb.where('event.status = :status', { status: options.filter.status });
    }

    qb.orderBy("(event.dates->>'start')::timestamp", options.order as 'ASC' | 'DESC')
      .skip(options.offset)
      .take(options.limit);

    const [items, count] = await qb.getManyAndCount();
    return { items, count };
  }

  findUpcoming(limit = 3): Promise<EventEntity[]> {
    return this.getQueryBuilder()
      .where('event.status = :status', { status: EventStatus.ACTIVE })
      // .andWhere("(event.dates->>'start')::timestamp > NOW()")
      .orderBy("(event.dates->>'start')::timestamp", 'ASC')
      .limit(limit)
      .getMany();
  }

  findAll(status?: EventStatus): Promise<EventEntity[]> {
    const where = status ? { status } : {};
    return this.eventRepo.find({ where, order: { id: 'ASC' } });
  }

  async findBySlug(slug: string): Promise<EventEntity> {
    const ev = await this.eventRepo.findOne({ where: { slug } });
    if (!ev) throw new NotFoundException(`Event "${slug}" not found`);
    return ev;
  }

  async findById(id: number): Promise<EventEntity> {
    const ev = await this.eventRepo.findOne({ where: { id } });
    if (!ev) throw new NotFoundException(`Event #${id} not found`);
    return ev;
  }

  async create(dto: CreateEventDto): Promise<EventEntity> {
    let base = slugify(dto.slug?.trim() || dto.title?.en || '');
    if (!base) base = 'event';
    let slug = base;
    let n = 1;
    while (await this.eventRepo.findOne({ where: { slug } })) {
      slug = `${base}-${n++}`;
    }
    return this.eventRepo.save(this.eventRepo.create({ ...dto, slug }));
  }

  async update(id: number, dto: UpdateEventDto): Promise<EventEntity> {
    const ev = await this.findById(id);
    const updated = this.eventRepo.merge(ev, dto as Partial<EventEntity>);
    return this.eventRepo.save(updated);
  }

  async remove(id: number): Promise<void> {
    await this.findById(id);
    await this.eventRepo.delete(id);
  }
}