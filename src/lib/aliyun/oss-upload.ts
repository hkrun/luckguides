import crypto from 'crypto'

// OSS配置接口
interface OSSConfig {
  accessKeyId: string
  accessKeySecret: string
  bucket: string
  region: string
  endpoint: string
}

// 上传响应接口
interface UploadResponse {
  success: boolean
  url?: string
  error?: string
}

export class AliyunOSSService {
  private config: OSSConfig

  constructor() {
    this.config = {
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET || '',
      bucket: process.env.ALIYUN_OSS_BUCKET || 'your-bucket-name',
      region: process.env.ALIYUN_OSS_REGION || 'oss-cn-shanghai',
      endpoint: process.env.ALIYUN_OSS_ENDPOINT || 'oss-cn-shanghai.aliyuncs.com'
    }

    if (!this.config.accessKeyId || !this.config.accessKeySecret) {
      throw new Error('阿里云OSS配置缺失')
    }
  }

  /**
   * 生成OSS签名
   */
  private generateSignature(
    method: string,
    contentMD5: string,
    contentType: string,
    date: string,
    canonicalizedOSSHeaders: string,
    canonicalizedResource: string
  ): string {
    const stringToSign = [
      method,
      contentMD5,
      contentType,
      date,
      canonicalizedOSSHeaders + canonicalizedResource
    ].join('\n')

    return crypto
      .createHmac('sha1', this.config.accessKeySecret)
      .update(stringToSign)
      .digest('base64')
  }

  /**
   * 上传文件到OSS
   */
  async uploadFile(
    file: File,
    fileName?: string
  ): Promise<UploadResponse> {
    try {
      // 生成文件名
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split('.').pop()
      const baseKey = fileName
        ? (fileName.startsWith('probface/') ? fileName : `probface/${fileName}`)
        : `probface/face-images/${timestamp}-${randomStr}.${fileExtension}`
      const objectKey = baseKey

      // 准备上传参数
      const date = new Date().toUTCString()
      const contentType = file.type || 'application/octet-stream'
      const contentMD5 = await this.calculateMD5(file)

      // 构建签名
      const canonicalizedResource = `/${this.config.bucket}/${objectKey}`
      const signature = this.generateSignature(
        'PUT',
        contentMD5,
        contentType,
        date,
        '',
        canonicalizedResource
      )

      // 构建上传URL
      const uploadUrl = `https://${this.config.bucket}.${this.config.endpoint}/${objectKey}`

      // 执行上传
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `OSS ${this.config.accessKeyId}:${signature}`,
          'Date': date,
          'Content-Type': contentType,
          'Content-MD5': contentMD5
        },
        body: file
      })

      if (!response.ok) {
        throw new Error(`OSS上传失败: ${response.status} ${response.statusText}`)
      }

      // 返回公开访问URL
      const publicUrl = `https://${this.config.bucket}.${this.config.endpoint}/${objectKey}`

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
   * 计算文件MD5（服务端实现）
   */
  private async calculateMD5(file: File): Promise<string> {
    // 在服务端环境中计算MD5
    if (typeof window === 'undefined') {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer
            const uint8Array = new Uint8Array(arrayBuffer)
            const hash = crypto.createHash('md5')
            hash.update(uint8Array)
            const md5 = hash.digest('base64')
            resolve(md5)
          } catch (error) {
            reject(error)
          }
        }
        reader.onerror = reject
        reader.readAsArrayBuffer(file)
      })
    } else {
      // 在客户端环境中返回空字符串，让服务端处理
      return ''
    }
  }

  /**
   * 生成预签名上传URL（客户端直传）
   */
  generatePresignedUrl(
    objectKey: string,
    expiration: number = 3600 // 1小时
  ): {
    url: string
    fields: Record<string, string>
  } {
    const policy = {
      expiration: new Date(Date.now() + expiration * 1000).toISOString(),
      conditions: [
        { bucket: this.config.bucket },
        { key: objectKey },
        ['content-length-range', 0, 20 * 1024 * 1024] // 最大20MB
      ]
    }

    const policyBase64 = Buffer.from(JSON.stringify(policy)).toString('base64')
    const signature = crypto
      .createHmac('sha1', this.config.accessKeySecret)
      .update(policyBase64)
      .digest('base64')

    return {
      url: `https://${this.config.bucket}.${this.config.endpoint}`,
      fields: {
        key: objectKey,
        policy: policyBase64,
        OSSAccessKeyId: this.config.accessKeyId,
        signature: signature
      }
    }
  }
}

export default AliyunOSSService
