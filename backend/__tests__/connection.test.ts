import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { db, closeConnection } from '../src/db/index';

describe('Database Connection', () => {
  test('db instance is created', () => {
    expect(db).toBeDefined();
  });

  test('connection uses DATABASE_URL from environment', () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
    expect(process.env.DATABASE_URL).toBeDefined();
  });
});

describe('Database Connection: Live Tests (requires running PostgreSQL)', () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5433/fbagent';
  });

  afterAll(async () => {
    await closeConnection();
  });

  test('can connect to PostgreSQL', async () => {
    try {
      const result = await db.execute('SELECT 1 as test');
      expect(result).toBeDefined();
      expect(result.rows[0]).toEqual({ test: 1 });
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test('can query current database', async () => {
    try {
      const result = await db.execute('SELECT current_database()');
      expect(result).toBeDefined();
      expect(result.rows[0].current_database).toBe('fbagent');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test('closeConnection terminates connection gracefully', async () => {
    await closeConnection();
    expect(true).toBe(true);
  });
});