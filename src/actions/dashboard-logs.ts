'use server';

import { getCurrentUser } from "@/lib/auth";
import { db } from '@/lib/postgres-client';

export interface NamingTask {
    fullName: string;
    emailAddress: string;
    action: string;
    params: any;
    result: any;
    ip: string;
    createdAt: string;
}

function buildWhereClause(filters: { email?: string; date?: string }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.email) {
        conditions.push(`u.email_address ILIKE $${paramIndex}`);
        params.push(`%${filters.email}%`);
        paramIndex++;
    }

    if (filters.date) {
        conditions.push(`DATE(q.created_at) = $${paramIndex}`);
        params.push(filters.date);
        paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, params };
}

export async function queryNamingTaskList(
    page: number = 1,
    limit: number = 8,
    email?: string,
    date?: string
): Promise<{ tasks: NamingTask[], total: number, pages: number }> {
    const user = await getCurrentUser();
    if (!user || user.userId !== process.env.APP_ROLE_ADMIN) {
        return { tasks: [], total: 0, pages: 0 };
    }

    try {
        const filters = { email, date };
        const { whereClause, params: baseParams } = buildWhereClause(filters);

        // Get total count
        const countQuery = `
            SELECT count(0) FROM 
            nf_naming_tasks q left join nf_users u on(u.user_id = q.user_id) 
            ${whereClause}
        `;
        const totalResult = await db.query(countQuery, baseParams);
        const total = parseInt(totalResult.rows[0].count);

        // Get paginated results
        const query = `
            SELECT 
                CONCAT(
                    COALESCE(u.first_name, ''),
                    CASE 
                        WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL THEN ' '
                        ELSE ''
                    END,
                    COALESCE(u.last_name, '')
                ) as full_name,
                u.email_address, 
                q.action,
                q.params,
                q.result,
                q.ip,
                q.created_at  
                FROM nf_naming_tasks q
                left join nf_users u on(u.user_id = q.user_id)
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${baseParams.length + 1} 
            OFFSET $${baseParams.length + 2}
        `;

        const queryParams = [...baseParams, limit, (page - 1) * limit];
        const { rows } = await db.query(query, queryParams);

        const tasks = rows.map(row => ({
            fullName: row.full_name || 'Unknown User',
            emailAddress: row.email_address || 'unknown@email.com',
            action: row.action,
            params: row.params,
            result: row.result,
            ip: row.ip,
            createdAt: row.created_at
        }));

        const pages = Math.ceil(total / limit);
        return { tasks, total, pages };
    } catch (error) {
        console.error('Failed to fetch naming tasks:', error);
        return { tasks: [], total: 0, pages: 0 };
    }
}


