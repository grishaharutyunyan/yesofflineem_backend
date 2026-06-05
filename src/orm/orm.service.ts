import {
  DeepPartial,
  EntityManager,
  Repository,
  SaveOptions,
  UpdateResult,
} from 'typeorm';
import { FindManyOptions } from 'typeorm/find-options/FindManyOptions';
import { FindOneOptions } from 'typeorm/find-options/FindOneOptions';
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { SelectQueryBuilder } from 'typeorm/query-builder/SelectQueryBuilder';
import {IORMService} from "../constants/interfaces/orm.interfaces";
import {IPaginationData, IPaginationDTO} from "../constants/interfaces/pagination.interfaces";


export abstract class OrmService<T> implements IORMService<T> {
  protected constructor(
    protected readonly repository: Repository<T>,
    protected alias: string,
  ) {
    this.alias = alias;
  }

  runQuery(raqQuery: string, params: any): any {
    return this.repository.query(raqQuery, params);
  }

  getQueryBuilder(): SelectQueryBuilder<T> {
    return this.repository.createQueryBuilder(this.alias);
  }

  async getTransaction(): Promise<
    (callback: (manager: EntityManager) => Promise<void>) => Promise<void>
  > {
    return (callback) => this.repository.manager.transaction(callback);
  }

  async findOne(options: FindOneOptions<T>): Promise<T> {
    return this.repository.findOne(options);
  }

  async find(options: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async count(options: FindManyOptions<T>): Promise<number> {
    return this.repository.count(options);
  }

  async findAndCount(options: FindManyOptions<T>): Promise<[T[], number]> {
    return await this.repository.findAndCount(options);
  }

  async insert(entity: T): Promise<T> {
    const insertedResult = await this.repository.insert(
      entity as QueryDeepPartialEntity<T>,
    );
    return this.findOne({
      where: { id: insertedResult.raw.insertId },
    } as FindOneOptions<T> & { where: any });
  }

  save(entity: DeepPartial<T>, options?: SaveOptions): Promise<T> {
    return this.repository.save(entity, {
      ...options,
      reload: true,
    });
  }

  async bulkInsert(entities: DeepPartial<T>[]): Promise<void> {
    await this.repository.insert(entities as QueryDeepPartialEntity<T>[]);
  }

  async saveWithRelations(
    entity: DeepPartial<T>,
    options?: SaveOptions,
    relationOptions?: FindOneOptions<T>,
  ): Promise<T> {
    const savedEntity = await this.repository.save(entity, {
      ...options,
      reload: true,
    });

    const entityId = (savedEntity as Record<string, unknown>).id;

    if (!entityId) {
      throw new Error('Entity does not have an ID after saving.');
    }
    return this.repository.findOne({
      where: { id: entityId } as FindOptionsWhere<T>,
      ...relationOptions,
    });
  }

  async update(id: number, entity: QueryDeepPartialEntity<T>): Promise<T> {
    await this.repository.update(id, entity);
    return this.findOne({ where: { id } } as FindOneOptions<T> & {
      where: any;
    });
  }

  async updateWithOptions(
    options: FindOptionsWhere<T>,
    entity: QueryDeepPartialEntity<T>,
  ): Promise<UpdateResult> {
    return this.repository.update(options, entity);
  }

  async softDelete(id: number): Promise<void> {
    await this.getQueryBuilder()
      .where('id = :id', { id })
      .softDelete()
      .execute();
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async deleteWithOptions(options: FindOptionsWhere<T>): Promise<void> {
    await this.repository.delete(options);
  }

  async paginate(
    options: IPaginationDTO<T>,
  ): Promise<IPaginationData<T>> {
    const queryOptions: Record<string, any> = {
      order: {
        [options.orderField]: options.order,
      },
    };

    if (options.filter) {
      const { relations, select, ...rest } = options.filter;
      if (relations) {
        queryOptions.relations = relations;
      }
      if (select) {
        queryOptions.select = select;
      }
      queryOptions.where = {
        ...(queryOptions.where || {}),
        ...rest,
      };
    }

    const [items, count] = await this.findAndCount({
      ...queryOptions,
      skip: options.offset,
      take: options.limit,
    });

    return { items, count };
  }
}
