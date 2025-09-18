/**
 * API密钥管理模块
 * 为商业版用户提供API密钥生成、管理和验证功能
 */

import { sql } from '@/lib/postgres-client'
import bcrypt from 'bcryptjs'
import { getCurrentUser } from '@/lib/auth'
import { SubscriptionPlan } from '@/lib/subscription-plans'

// API密钥接口定义
export interface ApiKey {
  id: number
  userId: string
  apiKey: string
  name: string
  description?: string
  status: '1' | '0'
  lastUsedAt?: Date
  usageCount: number
  monthlyUsage: number
  monthlyLimit: number
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

// API密钥创建参数
export interface CreateApiKeyParams {
  name: string
  description?: string
  monthlyLimit?: number
  expiresAt?: Date
}

// API使用统计接口
export interface ApiUsageStats {
  totalCalls: number
  monthlyUsage: number
  monthlyLimit: number
  lastUsedAt?: Date
  dailyUsage: { date: string; count: number }[]
  endpointUsage: { endpoint: string; count: number }[]
}

/**
 * 生成API密钥
 * 格式: tv_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (总长度40字符)
 */
function generateApiKey(): string {
  const prefix = 'tv_live_'
  const randomPart = Array.from({ length: 32 }, () => 
    Math.random().toString(36).charAt(2) || '0'
  ).join('')
  return prefix + randomPart
}

/**
 * 创建API密钥哈希
 */
async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, 12)
}

/**
 * 验证API密钥
 */
export async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  return bcrypt.compare(apiKey, hash)
}

/**
 * 检查用户是否有权限创建API密钥
 */
async function checkApiKeyPermission(userId: string): Promise<boolean> {
  try {
    const { rows } = await sql`
      SELECT plan_type, order_desc, subscription_status, subscription_type, order_date
      FROM nf_subscription
      WHERE user_id = ${userId}
        AND (
          (order_type = '1' AND subscription_status IN ('active', 'trialing'))
          OR
          (order_type = '0' AND subscription_status = 'canceled')
        )
      ORDER BY order_date DESC
      LIMIT 1
    `

    if (rows.length === 0) return false

    const subscription = rows[0]

    // 如果是已取消的订阅，检查是否仍在有效期内
    if (subscription.subscription_status === 'canceled') {
      const orderDate = new Date(subscription.order_date)
      const now = new Date()
      let periodDays = 30 // 默认月度

      if (subscription.subscription_type === 'quarterly') {
        periodDays = 90
      } else if (subscription.subscription_type === 'annual') {
        periodDays = 365
      } else if (subscription.subscription_type === 'trial') {
        // 试用期不支持API访问
        return false
      }

      // 计算当前周期的结束时间
      const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
      const periodsElapsed = Math.floor(daysSinceOrder / periodDays)
      const currentPeriodEndDate = new Date(orderDate)
      currentPeriodEndDate.setDate(orderDate.getDate() + ((periodsElapsed + 1) * periodDays))

      // 如果当前时间超过了有效期，返回无权限
      if (now >= currentPeriodEndDate) {
        return false
      }
    }

    // 检查是否为商业版
    if (subscription.plan_type === 'business') return true

    // 如果plan_type为空，检查order_desc
    const desc = (subscription.order_desc || '').toLowerCase()
    return desc.includes('elite') || desc.includes('business') || desc.includes('商业版')

  } catch (error) {
    console.error('检查API密钥权限失败:', error)
    return false
  }
}

/**
 * 创建API密钥
 */
export async function createApiKey(params: CreateApiKeyParams): Promise<{
  success: boolean
  apiKey?: string
  data?: ApiKey
  error?: string
}> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: '用户未登录' }
    }

    // 检查权限
    const hasPermission = await checkApiKeyPermission(user.userId)
    if (!hasPermission) {
      return { success: false, error: '只有商业版用户才能创建API密钥' }
    }

    // 检查用户现有API密钥数量（限制每个用户最多5个）
    const { rows: existingKeys } = await sql`
      SELECT COUNT(*) as count
      FROM nf_api_keys 
      WHERE user_id = ${user.userId} AND status = '1'
    `
    
    if (existingKeys[0]?.count >= 5) {
      return { success: false, error: '每个用户最多只能创建5个API密钥' }
    }

    // 生成API密钥
    const apiKey = generateApiKey()
    const apiKeyHash = await hashApiKey(apiKey)
    
    // 存储到数据库
    const { rows } = await sql`
      INSERT INTO nf_api_keys (
        user_id, api_key, api_key_hash, name, description, 
        monthly_limit, expires_at
      ) VALUES (
        ${user.userId},
        ${apiKey.substring(0, 12) + '...'}, -- 只存储前缀用于显示
        ${apiKeyHash},
        ${params.name},
        ${params.description || null},
        ${params.monthlyLimit || 10000},
        ${params.expiresAt || null}
      )
      RETURNING 
        id, user_id as "userId", api_key as "apiKey", name, description,
        status, usage_count as "usageCount", monthly_usage as "monthlyUsage",
        monthly_limit as "monthlyLimit", expires_at as "expiresAt",
        created_at as "createdAt", updated_at as "updatedAt"
    `

    if (rows.length === 0) {
      return { success: false, error: '创建API密钥失败' }
    }

    return {
      success: true,
      apiKey, // 完整的API密钥只在创建时返回一次
      data: rows[0] as ApiKey
    }

  } catch (error) {
    console.error('创建API密钥失败:', error)
    return { success: false, error: '服务器内部错误' }
  }
}

/**
 * 获取用户的API密钥列表
 */
export async function getUserApiKeys(): Promise<{
  success: boolean
  data?: ApiKey[]
  error?: string
}> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: '用户未登录' }
    }

    const { rows } = await sql`
      SELECT 
        id, user_id as "userId", api_key as "apiKey", name, description,
        status, last_used_at as "lastUsedAt", usage_count as "usageCount", 
        monthly_usage as "monthlyUsage", monthly_limit as "monthlyLimit",
        expires_at as "expiresAt", created_at as "createdAt", updated_at as "updatedAt"
      FROM nf_api_keys 
      WHERE user_id = ${user.userId}
      ORDER BY created_at DESC
    `

    return {
      success: true,
      data: rows as ApiKey[]
    }

  } catch (error) {
    console.error('获取API密钥列表失败:', error)
    return { success: false, error: '服务器内部错误' }
  }
}

/**
 * 删除API密钥
 */
export async function deleteApiKey(apiKeyId: number): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: '用户未登录' }
    }

    const { rowCount } = await sql`
      DELETE FROM nf_api_keys 
      WHERE id = ${apiKeyId} AND user_id = ${user.userId}
    `

    if (rowCount === 0) {
      return { success: false, error: 'API密钥不存在或无权限删除' }
    }

    return { success: true }

  } catch (error) {
    console.error('删除API密钥失败:', error)
    return { success: false, error: '服务器内部错误' }
  }
}

/**
 * 更新API密钥状态
 */
export async function updateApiKeyStatus(apiKeyId: number, status: '1' | '0'): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: '用户未登录' }
    }

    const { rowCount } = await sql`
      UPDATE nf_api_keys 
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${apiKeyId} AND user_id = ${user.userId}
    `

    if (rowCount === 0) {
      return { success: false, error: 'API密钥不存在或无权限修改' }
    }

    return { success: true }

  } catch (error) {
    console.error('更新API密钥状态失败:', error)
    return { success: false, error: '服务器内部错误' }
  }
}

/**
 * 验证API密钥并获取用户信息
 */
export async function validateApiKey(apiKey: string): Promise<{
  valid: boolean
  userId?: string
  apiKeyId?: number
  error?: string
}> {
  try {
    if (!apiKey || !apiKey.startsWith('tv_live_')) {
      return { valid: false, error: 'Invalid API key format' }
    }

    // 查找匹配的API密钥
    const { rows } = await sql`
      SELECT id, user_id, api_key_hash, status, expires_at, monthly_usage, monthly_limit
      FROM nf_api_keys 
      WHERE api_key LIKE ${apiKey.substring(0, 12) + '%'}
        AND status = '1'
    `

    for (const row of rows) {
      const isValid = await verifyApiKey(apiKey, row.api_key_hash)
      if (isValid) {
        // 检查是否过期
        if (row.expires_at && new Date(row.expires_at) < new Date()) {
          return { valid: false, error: 'API key expired' }
        }

        // 检查月度使用限制
        if (row.monthly_usage >= row.monthly_limit) {
          return { valid: false, error: 'Monthly usage limit exceeded' }
        }

        // 更新使用统计
        await sql`
          UPDATE nf_api_keys 
          SET 
            last_used_at = CURRENT_TIMESTAMP,
            usage_count = usage_count + 1,
            monthly_usage = monthly_usage + 1
          WHERE id = ${row.id}
        `

        return {
          valid: true,
          userId: row.user_id,
          apiKeyId: row.id
        }
      }
    }

    return { valid: false, error: 'Invalid API key' }

  } catch (error) {
    console.error('验证API密钥失败:', error)
    return { valid: false, error: 'Server error' }
  }
}

/**
 * 记录API使用统计
 */
export async function recordApiUsage(
  apiKeyId: number,
  userId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  requestSize: number,
  responseSize: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await sql`
      INSERT INTO nf_api_usage (
        api_key_id, user_id, endpoint, method, status_code,
        response_time, request_size, response_size, ip_address, user_agent
      ) VALUES (
        ${apiKeyId}, ${userId}, ${endpoint}, ${method}, ${statusCode},
        ${responseTime}, ${requestSize}, ${responseSize}, ${ipAddress}, ${userAgent}
      )
    `
  } catch (error) {
    console.error('记录API使用统计失败:', error)
  }
}

/**
 * 获取API使用统计
 */
export async function getApiUsageStats(apiKeyId?: number): Promise<{
  success: boolean
  data?: ApiUsageStats
  error?: string
}> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: '用户未登录' }
    }

    let whereClause = `WHERE ak.user_id = ${user.userId}`
    if (apiKeyId) {
      whereClause += ` AND ak.id = ${apiKeyId}`
    }

    // 获取基本统计
    const { rows: basicStats } = await sql`
      SELECT 
        COALESCE(SUM(ak.usage_count), 0) as total_calls,
        COALESCE(SUM(ak.monthly_usage), 0) as monthly_usage,
        COALESCE(MAX(ak.monthly_limit), 0) as monthly_limit,
        MAX(ak.last_used_at) as last_used_at
      FROM nf_api_keys ak
      ${sql.unsafe(whereClause)}
    `

    // 获取每日使用统计（最近30天）
    const { rows: dailyStats } = await sql`
      SELECT 
        DATE(au.created_at) as date,
        COUNT(*) as count
      FROM nf_api_usage au
      JOIN nf_api_keys ak ON au.api_key_id = ak.id
      ${sql.unsafe(whereClause)}
        AND au.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(au.created_at)
      ORDER BY date DESC
    `

    // 获取端点使用统计
    const { rows: endpointStats } = await sql`
      SELECT 
        au.endpoint,
        COUNT(*) as count
      FROM nf_api_usage au
      JOIN nf_api_keys ak ON au.api_key_id = ak.id
      ${sql.unsafe(whereClause)}
        AND au.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY au.endpoint
      ORDER BY count DESC
      LIMIT 10
    `

    const stats = basicStats[0]
    
    return {
      success: true,
      data: {
        totalCalls: parseInt(stats.total_calls) || 0,
        monthlyUsage: parseInt(stats.monthly_usage) || 0,
        monthlyLimit: parseInt(stats.monthly_limit) || 0,
        lastUsedAt: stats.last_used_at ? new Date(stats.last_used_at) : undefined,
        dailyUsage: dailyStats.map(row => ({
          date: row.date,
          count: parseInt(row.count)
        })),
        endpointUsage: endpointStats.map(row => ({
          endpoint: row.endpoint,
          count: parseInt(row.count)
        }))
      }
    }

  } catch (error) {
    console.error('获取API使用统计失败:', error)
    return { success: false, error: '服务器内部错误' }
  }
}
