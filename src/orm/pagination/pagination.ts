
import { PaginationOptionsDto } from './dto/pagination-options.dto';
import {IPaginationData, IPaginationDTO, IPaginationResponse} from "../../constants/interfaces/pagination.interfaces";
import {Order} from "../../constants/enums/pagination.enums";
import {filterByKeys} from "./cast.helper";

export function parseGetPaginationParams(
  options: PaginationOptionsDto,
  filterEmptyArray = false,
): IPaginationDTO<any> {
  const optionsDefault = {
    filter: {},
    range: [1, 10],
    sort: ['id', Order.DESC],
  };

  const { sort, range, filter } = Object.keys(optionsDefault).reduce(
    (acc, elem) => {
      if (options[elem]) {
        acc[elem] = JSON.parse(options[elem]);
      } else {
        acc[elem] = optionsDefault[elem];
      }
      return acc;
    },
    {
      sort: [],
      range: [],
      filter: {},
    },
  );

  const limit = Math.max(1, Number(range[1]) || 10); // Ensure limit is at least 1
  const page = Math.max(1, Number(range[0]) || 1); // Ensure page is at least 1

  const offset = Math.max(0, (page - 1) * limit); // Ensure offset is never negative

  return {
    limit,
    offset,
    until: page * limit,
    order: sort[1] || Order.DESC,
    orderField: sort[0] || 'id',
    filter: filterEmptyArray
      ? Object.fromEntries(
          Object.entries(filter).filter(([key, value]) => {
            if (Array.isArray(value) && value.length === 0) return false;
            return !!key;
          }),
        )
      : filter,
    page,
  };
}

export function getResponseForPagination(
  paginationResponse: IPaginationData<any>,
  options: IPaginationDTO<any>,
  keys?: string[],
  isKeysExcluded?: boolean,
): IPaginationResponse<any> {
  const { limit, offset, page } = options;
  const { count, items } = paginationResponse;

  const filteredItems = keys?.length
    ? items.map((item) => filterByKeys(item, keys, isKeysExcluded))
    : items;
  return {
    items: filteredItems,
    count,
    page,
    limit,
    offset,
  };
}
