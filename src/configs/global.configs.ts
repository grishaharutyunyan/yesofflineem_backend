import * as process from 'node:process';

import {
  IGlobalConfigs,
} from '../constants/interfaces/global.interfaces';

export default () =>
  ({
    projectName: process.env.PROJECT_NAME,
    port: parseInt(process.env.PORT, 10) || 7772,
    nodeEnv: process.env.NODE_ENV,
    database: {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [],
      synchronize: !!Number(process.env.DB_MAIN_SYNCHRONIZE),
      autoLoadEntities: true,
      logging: Number(process.env.DEBUG_DB_MODE) === 1,
      retryAttempts: 3,
      retryDelay: 1000,
    },
    frontendUrl: process.env.FRONTEND_URL,
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    admin: {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      apiKey: process.env.ADMIN_API_KEY,
    },
    openRouter: {
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct',
    },
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      contactToEmail: process.env.CONTACT_TO_EMAIL || process.env.ADMIN_EMAIL,
    },
  }) as IGlobalConfigs;
