'use server';
import { sql } from '@/lib/postgres-client';
import { DashboardUser } from '@/types/dashboard-user';
import { getCurrentUser } from "@/lib/auth";

export async function getUsers(searchTerm: string = '', page: number = 1, limit: number = 8) {
  const user = await getCurrentUser();
  if (!user || user.userId !== process.env.APP_ROLE_ADMIN) {
    return {
      users: [],
      total: 0
    };
  }
  
  const offset = (page - 1) * limit;
  const searchPattern = `%${searchTerm}%`;
  
  const { rows: users } = await sql`
    SELECT 
      id,
      CONCAT(first_name, ' ', last_name) as name,
      email_address as email,
      credits,
      CASE 
        WHEN status = '1' THEN 'Active'
        WHEN status = '0' THEN 'Inactive'
        ELSE 'Unknown'
      END as status,
      user_id,
      created_at
    FROM nf_users
    WHERE 
      CONCAT(first_name, ' ', last_name) ILIKE ${searchPattern}
      OR email_address ILIKE ${searchPattern}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const { rows: totalRows } = await sql`
    SELECT COUNT(*) as total
    FROM nf_users
    WHERE 
      CONCAT(first_name, ' ', last_name) ILIKE ${searchPattern}
      OR email_address ILIKE ${searchPattern}
  `;

  return {
    users: users as DashboardUser[],
    total: parseInt(totalRows[0].total)
  };
}

export async function updateUser(userId: string, data: Partial<DashboardUser>) {
  const user = await getCurrentUser();
  if (!user || user.userId !== process.env.APP_ROLE_ADMIN || !userId) {
    throw new Error('Unauthorized');
  }
  
  const { rows } = await sql`UPDATE nf_users SET credits = ${data.credits}, status = ${data.status} WHERE user_id = ${userId}`;
  return rows;
}