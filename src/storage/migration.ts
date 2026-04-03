import { STORAGE_VERSION } from '../domain/constants';
import type { StorageSchema } from './schema';
import { createDefaultSchema } from './schema';

function isValidSchema(data: unknown): data is StorageSchema {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;
  if (typeof obj.version !== 'number') return false;
  if (!obj.records || typeof obj.records !== 'object') return false;

  const records = obj.records as Record<string, unknown>;
  const requiredKeys = ['color', 'reaction', 'memory', 'audio'];
  return requiredKeys.every((key) =>
    records[key] != null && typeof records[key] === 'object',
  );
}

export function migrate(data: unknown): StorageSchema {
  if (!isValidSchema(data)) {
    return createDefaultSchema();
  }

  if (data.version < STORAGE_VERSION) {
    // 현재 v1만 존재. 추후 버전 업 시 마이그레이션 로직 추가
    return createDefaultSchema();
  }

  return data;
}
