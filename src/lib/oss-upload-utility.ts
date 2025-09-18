import crypto from 'crypto'

export interface OSSConfig {
  accessKeyId: string
  accessKeySecret: string
  bucket: string
  endpoint: string
}

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * 生成日期格式的目录结构：yyyy/mm/dd
 */
export function generateDatePath(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

/**
 * 生成唯一的文件名
 */
export function generateFileName(originalName: string, prefix?: string): string {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 15)
  const fileExtension = originalName.split('.').pop() || 'mp4'
  const prefixStr = prefix ? `${prefix}-` : ''
  return `${prefixStr}${timestamp}-${randomStr}.${fileExtension}`
}

/**
 * 生成完整的OSS对象键（包含日期目录结构）
 */
export function generateObjectKey(originalName: string, folder: string, prefix?: string): string {
  const normalizedFolder = folder.startsWith('probface/') ? folder : `probface/${folder}`
  const datePath = generateDatePath()
  const fileName = generateFileName(originalName, prefix)
  return `${normalizedFolder}/${datePath}/${fileName}`
}

/**
 * 上传文件到阿里云OSS
 */
export async function uploadToOSS(
  fileBuffer: Buffer,
  objectKey: string,
  contentType: string,
  ossConfig: OSSConfig
): Promise<UploadResult> {
  try {
    // 准备上传参数
    const date = new Date().toUTCString()

    // 生成签名
    const stringToSign = [
      'PUT',
      '', // Content-MD5 (可选)
      contentType,
      date,
      `/${ossConfig.bucket}/${objectKey}`
    ].join('\n')

    const signature = crypto
      .createHmac('sha1', ossConfig.accessKeySecret)
      .update(stringToSign)
      .digest('base64')

    // 构建上传URL
    const uploadUrl = `https://${ossConfig.bucket}.${ossConfig.endpoint}/${objectKey}`

    // 执行上传
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `OSS ${ossConfig.accessKeyId}:${signature}`,
        'Date': date,
        'Content-Type': contentType
      },
      body: fileBuffer
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OSS上传失败:', response.status, response.statusText, errorText)
      return {
        success: false,
        error: `OSS上传失败: ${response.status} ${response.statusText}`
      }
    }

    // 返回公开访问URL
    const publicUrl = `https://${ossConfig.bucket}.${ossConfig.endpoint}/${objectKey}`

    return {
      success: true,
      url: publicUrl
    }

  } catch (error) {
    console.error('OSS上传错误:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'OSS上传失败'
    }
  }
}

/**
 * 从URL下载文件并上传到OSS
 */
export async function downloadAndUploadToOSS(
  fileUrl: string,
  originalName: string,
  folder: string,
  prefix?: string
): Promise<UploadResult> {
  try {
    // 获取OSS配置
    const ossConfig: OSSConfig = {
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
      bucket: process.env.ALIYUN_OSS_BUCKET || 'your-bucket-name',
      endpoint: process.env.ALIYUN_OSS_ENDPOINT || 'oss-cn-shanghai.aliyuncs.com'
    }

    if (!ossConfig.accessKeyId || !ossConfig.accessKeySecret) {
      return {
        success: false,
        error: '阿里云OSS配置缺失'
      }
    }

    console.log('开始下载文件:', fileUrl)

    // 下载文件
    const response = await fetch(fileUrl)
    if (!response.ok) {
      return {
        success: false,
        error: `下载文件失败: ${response.status} ${response.statusText}`
      }
    }

    const fileBuffer = Buffer.from(await response.arrayBuffer())
    console.log('文件下载完成，大小:', fileBuffer.length, 'bytes')

    // 生成对象键
    const objectKey = generateObjectKey(originalName, folder, prefix)
    console.log('生成OSS对象键:', objectKey)

    // 确定内容类型
    const contentType = response.headers.get('content-type') || 'video/mp4'

    // 上传到OSS
    const uploadResult = await uploadToOSS(fileBuffer, objectKey, contentType, ossConfig)

    if (uploadResult.success) {
      console.log('文件上传到OSS成功:', uploadResult.url)
    } else {
      console.error('文件上传到OSS失败:', uploadResult.error)
    }

    return uploadResult

  } catch (error) {
    console.error('下载并上传到OSS错误:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '下载并上传到OSS失败'
    }
  }
}

/**
 * 获取OSS配置
 */
export function getOSSConfig(): OSSConfig {
  return {
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
    bucket: process.env.ALIYUN_OSS_BUCKET || 'your-bucket-name',
    endpoint: process.env.ALIYUN_OSS_ENDPOINT || 'oss-cn-shanghai.aliyuncs.com'
  }
}
