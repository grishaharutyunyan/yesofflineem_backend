import { IsJSON, IsOptional, IsString } from 'class-validator';

export class PaginationOptionsDto {
  @IsString()
  @IsOptional()
  @IsJSON()
  readonly sort?: string;

  @IsString()
  @IsOptional()
  readonly range?: string;

  @IsOptional()
  @IsJSON()
  readonly filter?: string;
}
