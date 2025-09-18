import 'server-only'
import { Pool } from 'pg';
import type { QueryResult, QueryResultRow } from '@neondatabase/serverless';
import { neon, NeonQueryFunction, FullQueryResults } from '@neondatabase/serverless';

export type Primitive = string | number | boolean | undefined | null;

const connectionString = process.env.POSTGRES_URL as string;
const dbType = process.env.POSTGRES_CLIENT_TYPE || 'pg'; // 默认使用 pg



class ClientProxy {

  private client: NeonQueryFunction<false, true> | Pool;

  constructor() {
    if (dbType === 'neon') {
      this.client = neon(connectionString, { fullResults: true });
    } else {
      this.client = new Pool({
        connectionString,
        // ssl: {
        //   rejectUnauthorized: false
        // }
      });
    }
  }

  async sql<T extends QueryResultRow>(
    strings: TemplateStringsArray,
    ...values: Primitive[]
  ): Promise<QueryResult<T>> {
    if (dbType === 'neon') {
      const result = await (this.client as NeonQueryFunction<false, true>)(strings, ...values);
      return this.adaptNeonResult(result);
    } else {
      const [query, params] = this.sqlTemplate(strings, ...values);
      return await (this.client as Pool).query(query, params);
    }
  }

  async query<T extends QueryResultRow>(
    query: string,
    params: Primitive[]
  ): Promise<QueryResult<T>> {
    if (dbType === 'neon') {
      const result = await (this.client as NeonQueryFunction<false, true>)(query, params);
      return this.adaptNeonResult(result);
    } else {
      return await (this.client as Pool).query(query, params);
    }
  }


  private sqlTemplate(
    strings: TemplateStringsArray,
    ...values: Primitive[]
  ): [string, Primitive[]] {
    if (!this.isTemplateStringsArray(strings) || !Array.isArray(values)) {
      throw new Error("Invalid template strings array. Use it as a tagged template: sql`SELECT * FROM users`.");
    }

    let query = strings[0] ?? '';

    for (let i = 1; i < strings.length; i++) {
      query += `$${i}${strings[i] ?? ''} `;
    }

    return [query.trim(), values];
  }

  private isTemplateStringsArray(strings: unknown): strings is TemplateStringsArray {
    return Array.isArray(strings) && 'raw' in strings && Array.isArray(strings.raw);
  }

  private adaptNeonResult(result: FullQueryResults<false>): QueryResult {
    return {
      command: result.command,
      rowCount: result.rowCount,
      rows: result.rows,
      fields: result.fields,
      oid: 0
    };
  }

}

export const db = new ClientProxy();

export async function sql<T extends QueryResultRow>(
  strings: TemplateStringsArray,
  ...values: Primitive[]
): Promise<QueryResult<T>> {
  const result = await db.sql(strings, ...values);
  return result as unknown as Promise<QueryResult<T>>;
}