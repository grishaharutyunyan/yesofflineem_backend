import * as crypto from 'crypto';

import { BadRequestException, Logger } from '@nestjs/common';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

export function toBoolean(value: string | number): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    value = value?.toLowerCase();

    return value === 'true' || value === '1';
  }

  if (typeof value === 'number') {
    return !!value;
  }

  return value;
}

export function booleanToNumber(value: string): number {
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (typeof value === 'string') {
    value = value?.toLowerCase();

    return value === 'true' ? 1 : 0;
  }

  return value;
}

export function delayByMS(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function filterByKeys<T extends Record<string, any>>(
  obj: T,
  keys: (keyof T)[],
  isKeysExcluded?: boolean,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) =>
      isKeysExcluded
        ? !keys.includes(key as keyof T)
        : keys.includes(key as keyof T),
    ),
  ) as Partial<T>;
}

export function filterObject(obj, deep = false) {
  return Object.keys(obj).reduce((acc, elem) => {
    const val = obj[elem];
    if (deep) {
      if (val === '' || val === 0 || typeof val === 'boolean' || !!val) {
        acc[elem] = obj[elem];
      }
    } else {
      if (val) {
        acc[elem] = obj[elem];
      }
    }

    return acc;
  }, {});
}

export function parseJson(obj: any) {
  try {
    return JSON.parse(obj);
  } catch (error) {
    Logger.warn(error.message);
    return null;
  }
}

export const formatDate = (
  date: string | Date,
  format: string = 'YYYY-MM-DD HH:mm:ss',
  daysOffset: number = 0,
  hoursOffset: number | string = 0,
): string => {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    throw new BadRequestException('Invalid date');
  }

  d.setDate(d.getDate() + daysOffset);

  let offsetHours = 0;
  if (typeof hoursOffset === 'number') {
    offsetHours = hoursOffset;
  } else if (typeof hoursOffset === 'string') {
    const match = hoursOffset.match(/([+-])(\d{2}):?(\d{2})?/);
    if (match) {
      const sign = match[1] === '+' ? 1 : -1;
      const hours = parseInt(match[2], 10);
      const minutes = match[3] ? parseInt(match[3], 10) : 0;
      offsetHours = sign * (hours + minutes / 60);
    } else {
      throw new BadRequestException('Invalid hours offset format');
    }
  }

  d.setHours(d.getHours() + offsetHours);

  const pad = (num: number) => num.toString().padStart(2, '0');

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return format
    .replace('YYYY', year.toString())
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

export function createRangeFilter<T>(
  from?: T,
  to?: T,
  formatter?: (value: T) => any,
) {
  if (from && to) {
    return Between(
      formatter ? formatter(from) : from,
      formatter ? formatter(to) : to,
    );
  } else if (from) {
    return MoreThanOrEqual(formatter ? formatter(from) : from);
  } else if (to) {
    return LessThanOrEqual(formatter ? formatter(to) : to);
  }
  return undefined;
}

export function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((o) => toCamelCase(o));
  } else if (typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, char) =>
        char.toUpperCase(),
      );
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  } else if (typeof obj === 'string') {
    return obj.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
  }
  return obj;
}

export function toSnakeCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

export function encryptKey(hashString: string) {
  return crypto
    .createHash('sha256')
    .update(hashString)
    .digest()
    .toString('base64');
}

export function areAllBooleans(
  obj: Record<string, any>,
  booleanValue: boolean,
): boolean {
  const booleans = Object.values(obj)
    .flatMap((value) =>
      typeof value === 'object' && value !== null
        ? Object.values(value)
        : value,
    )
    .filter((value) => typeof value === 'boolean');

  return (
    booleans.length > 0 && booleans.every((value) => value === booleanValue)
  );
}

export function allItemsExistForStrings(arr1: string[], arr2: string[]) {
  return arr1.every((item) => arr2.includes(item));
}

export function trimEmail(email: string): string {
  if (!email) {
    return '';
  }
  const mainEmail = email.trim().toLowerCase();
  const atIndex = mainEmail.indexOf('@');
  if (atIndex !== -1) {
    return mainEmail.substring(0, atIndex);
  }
  return mainEmail;
}
