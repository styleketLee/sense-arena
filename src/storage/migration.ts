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
    // 추후 버전 업 시 여기에 마이그레이션 로직 추가
    // 예: if (data.version === 1) { data = migrateV1toV2(data); }
    // 기존 기록은 보존하고 스키마만 업그레이드
    const defaultSchema = createDefaultSchema();
    return {
      ...defaultSchema,
      records: {
        ...defaultSchema.records,
        ...data.records,
      },
    };
  }

  return data;
}
