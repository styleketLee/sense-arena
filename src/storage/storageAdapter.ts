import { Storage } from '@apps-in-toss/web-framework';
import type { TestType, TestRecord } from '../domain/types';
import { STORAGE_KEY } from '../domain/constants';
import type { StorageSchema } from './schema';
import { createDefaultSchema } from './schema';
import { migrate } from './migration';

async function load(): Promise<Record<TestType, TestRecord> | null> {
  try {
    const raw = await Storage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    const schema = migrate(parsed);
    return schema.records;
  } catch {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed: unknown = JSON.parse(raw);
      const schema = migrate(parsed);
      return schema.records;
    } catch (error) {
      console.error('Storage load failed:', error);
      return null;
    }
  }
}

async function save(records: Record<TestType, TestRecord>): Promise<boolean> {
  const schema: StorageSchema = {
    ...createDefaultSchema(),
    records,
  };
  const raw = JSON.stringify(schema);

  try {
    await Storage.setItem(STORAGE_KEY, raw);
    return true;
  } catch {
    try {
      localStorage.setItem(STORAGE_KEY, raw);
      return true;
    } catch (error) {
      console.error('Storage save failed:', error);
      return false;
    }
  }
}

export const storageAdapter = { load, save };
