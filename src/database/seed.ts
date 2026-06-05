import 'dotenv/config';
import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { EventEntity } from '../api/events/event.entity';
import { VideoEntity } from '../api/videos/video.entity';
import { SEED_EVENTS } from '../api/events/events.seed';
import { SEED_VIDEOS } from '../api/videos/videos.seed';
import {UserEntity} from "../api/admin/auth/user.entity";

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [EventEntity, VideoEntity, UserEntity],
  synchronize: false,
  logging: false,
});

async function seedEvents(ds: DataSource) {
  const repo = ds.getRepository(EventEntity);
  let created = 0;
  let updated = 0;

  for (const dto of SEED_EVENTS) {
    const existing = await repo.findOne({ where: { slug: dto.slug } });
    if (existing) {
      await repo.update(existing.id, dto as Partial<EventEntity>);
      updated++;
    } else {
      await repo.save(repo.create(dto as Partial<EventEntity>));
      created++;
    }
  }

  console.log(`Events: ${created} created, ${updated} updated`);
}

async function seedVideos(ds: DataSource) {
  const repo = ds.getRepository(VideoEntity);
  const existing = await repo.count();

  if (existing > 0) {
    console.log(`Videos: skipped (${existing} already in DB — use --force to overwrite)`);
    return;
  }

  for (const dto of SEED_VIDEOS) {
    await repo.save(repo.create(dto as Partial<VideoEntity>));
  }

  console.log(`Videos: ${SEED_VIDEOS.length} created`);
}

async function seedAdminUser(ds: DataSource) {
  const repo = ds.getRepository(UserEntity);
  const email = process.env.ADMIN_EMAIL;

  const existing = await repo.findOne({ where: { email } });
  if (existing) {
    console.log(`Admin user: already exists (${email})`);
    return;
  }

  const plainPassword = process.env.ADMIN_PASSWORD;
  const password = await bcrypt.hash(plainPassword, 10);
  await repo.save(repo.create({ email, password, role: 'admin' }));
  console.log(`Admin user: created ${email}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`  ⚠  Default password used (admin123) — change it in .env!`);
  }
}

async function main() {
  const force = process.argv.includes('--force');

  await dataSource.initialize();
  console.log('Connected to database');

  await seedAdminUser(dataSource);
  await seedEvents(dataSource);

  if (force) {
    await dataSource.getRepository(VideoEntity).clear();
    console.log('Videos: cleared (--force)');
  }
  await seedVideos(dataSource);

  await dataSource.destroy();
  console.log('Done.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
