import {
  DeepPartial,
  SaveOptions,
  UpdateResult,
} from 'typeorm';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { FindOneOptions } from 'typeorm/find-options/FindOneOptions';
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { SelectQueryBuilder } from 'typeorm/query-builder/SelectQueryBuilder';

import { IPaginationDTO, IPaginationData } from './pagination.interfaces';

export interface IORMService<T> {
  runQuery(raqQuery: string, params: any): any;
  getQueryBuilder(): SelectQueryBuilder<T>;
  findOne(options: FindOneOptions<T>): Promise<T>;
  find(options: FindManyOptions<T>): Promise<T[]>;
  findAll(): Promise<T[]>;
  findAndCount(options: FindManyOptions<T>): Promise<[T[], number]>;
  count(options: FindManyOptions<T>): Promise<number>;
  insert(entity: T): Promise<T>;
  bulkInsert(entities: T[]): Promise<void>;
  save(entity: DeepPartial<T>, options?: SaveOptions): Promise<T>;
  update(id: number, entity: QueryDeepPartialEntity<T>): Promise<T>;
  softDelete(id: number): Promise<void>;
  delete(id: number): Promise<void>;
  pagination?(
    options: IPaginationDTO<T>,
    projectSingle?: boolean,
    disableProject?: boolean,
  ): Promise<IPaginationData<T>>;
  deleteWithOptions?(options: FindOptionsWhere<T>): Promise<void>;
  saveWithRelations(
    entity: DeepPartial<T>,
    options?: SaveOptions,
    relationOptions?: FindOneOptions<T>,
  ): Promise<T>;
  updateWithOptions(
    options: FindOptionsWhere<T>,
    entity: QueryDeepPartialEntity<T>,
  ): Promise<UpdateResult>;
}
