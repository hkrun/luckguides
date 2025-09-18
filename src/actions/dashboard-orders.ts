'use server'
import { sql, db } from '@/lib/postgres-client';
import { getCurrentUser } from "@/lib/auth";

export interface Order {
    orderId: string;
    fullName: string;
    email: string;
    product: string;
    amount: number;
    type: string;
    status: string;
    date: string;
}

function buildWhereClause(filters: { email?: string; date?: string }) {
    const whereConditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.email && filters.email.trim() !== '') {
        whereConditions.push(`u.email_address ILIKE $${paramIndex}`);
        params.push(`%${filters.email}%`);
        paramIndex++;
    }

    if (filters.date && filters.date.trim() !== '') {
        const [startDate, endDate] = filters.date.split('&');
        if (startDate && endDate) {
            whereConditions.push(`s.order_date >= $${paramIndex}`);
            params.push(startDate);
            paramIndex++;
            whereConditions.push(`s.order_date <= $${paramIndex}`);
            params.push(endDate + ' 23:59:59');
            paramIndex++;
        }
    }

    const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    return { whereClause, params };
}

export async function queryOrderList(
    page: number = 1,
    limit: number = 8,
    email?: string,
    date?: string
): Promise<{ orders: Order[], total: number, pages: number }> {
    const user = await getCurrentUser();
    if (!user || user.userId !== process.env.APP_ROLE_ADMIN) {
        return { orders: [], total: 0, pages: 0 };
    }

    try {
        const filters = { email, date };
        const { whereClause, params: baseParams } = buildWhereClause(filters);

        // Get total count
        const countQuery = `
            SELECT count(0) 
            FROM nf_subscription s 
            INNER JOIN nf_users u ON(s.user_id = u.user_id)
            ${whereClause}
        `;
        const totalResult = await db.query(countQuery, baseParams);
        const total = parseInt(totalResult.rows[0].count);

        // Get paginated results
        const query = `
            SELECT 
                s.order_number,
                s.subscription_id,
                s.order_price,
                s.credit_amount,
                s.order_type,
                s.order_desc,
                s.order_date,
                s.created_at,
                CONCAT(
                    COALESCE(u.first_name, ''),
                    CASE 
                        WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL THEN ' '
                        ELSE ''
                    END,
                    COALESCE(u.last_name, '')
                ) as full_name,
                u.email_address 
            FROM nf_subscription s 
            INNER JOIN nf_users u ON(s.user_id = u.user_id)
            ${whereClause}
            ORDER BY s.created_at DESC
            LIMIT $${baseParams.length + 1} 
            OFFSET $${baseParams.length + 2}
        `;

        const queryParams = [...baseParams, limit, (page - 1) * limit];
        const { rows } = await db.query(query, queryParams);

        const orders = rows.map(row => ({
            orderId: row.order_number || row.subscription_id,
            fullName: row.full_name || '',
            email: row.email_address || '',
            product: row.credit_amount || 0,
            amount: parseFloat(row.order_price || '0'),
            type: 'subscription',
            status: row.order_type === '1' ? 'Active' : 'Cancelled',
            date: row.order_date || row.created_at
        }));

        const pages = Math.ceil(total / limit);
        return { orders, total, pages };
    } catch (error) {
        console.error('Failed to fetch orders:', error);
        return { orders: [], total: 0, pages: 0 };
    }
}
