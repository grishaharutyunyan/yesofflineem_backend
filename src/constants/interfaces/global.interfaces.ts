import { DataSourceOptions } from 'typeorm';

export interface IGlobalConfigs {
  projectName: string;
  port: number;
  nodeEnv: string;
  database: DataSourceOptions;
  frontendUrl: string;
  jwtSecret: string;
  admin: {
    email: string;
    password: string;
    apiKey: string;
  };
  openRouter: {
    apiKey: string;
    model: string;
  };
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    contactToEmail: string;
  };
}

type Primitive = number | string | boolean;

export type AllowedValue = Primitive | AllowedValueArray | AllowedValueRecord;

type AllowedValueArray = Array<AllowedValue>;

export interface AllowedValueRecord {
  [key: string]: AllowedValue;
}
