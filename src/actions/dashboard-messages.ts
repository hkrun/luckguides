'use server';

import { getCurrentUser } from "@/lib/auth";
import { db } from '@/lib/postgres-client';

export interface Contact {
    fullName: string;
    email: string;
    message: string;
    createdAt: string;
}

function buildWhereClause(filters: { email?: string; date?: string }) {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.email) {
        conditions.push(`email ILIKE $${paramIndex}`);
        params.push(`%${filters.email}%`);
        paramIndex++;
    }

    if (filters.date) {
        conditions.push(`DATE(created_at) = $${paramIndex}`);
        params.push(filters.date);
        paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, params };
}

export async function queryContactList(
    page: number = 1,
    limit: number = 8,
    email?: string,
    date?: string
): Promise<{ contacts: Contact[], total: number, pages: number }> {
    const user = await getCurrentUser();
    if (!user || user.userId !== process.env.APP_ROLE_ADMIN) {
        return { contacts: [], total: 0, pages: 0 };
    }

    try {
        const filters = { email, date };
        const { whereClause, params: baseParams } = buildWhereClause(filters);

        // Get total count
        const countQuery = `
            SELECT count(0) 
            FROM nf_contact
            ${whereClause}
        `;
        const totalResult = await db.query(countQuery, baseParams);
        const total = parseInt(totalResult.rows[0].count);

        // Get paginated results
        const query = `
            SELECT 
                name,
                email,
                message,
                created_at
            FROM nf_contact
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${baseParams.length + 1} 
            OFFSET $${baseParams.length + 2}
        `;

        const queryParams = [...baseParams, limit, (page - 1) * limit];
        const { rows } = await db.query(query, queryParams);

        const contacts = rows.map(row => ({
            fullName: row.name,
            email: row.email,
            message: row.message,
            createdAt: row.created_at
        }));

        const pages = Math.ceil(total / limit);
        return { contacts, total, pages };
    } catch (error) {
        console.error('Failed to fetch contacts:', error);
        return { contacts: [], total: 0, pages: 0 };
    }
}