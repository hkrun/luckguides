const VideoenhanClient = require('@alicloud/videoenhan20200320')
const OpenapiClient = require('@alicloud/openapi-client')

// 创建阿里云视频增强客户端
export function createAliyunClient() {
  const config = new OpenapiClient.Config({
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET
  })

  // 访问的域名
  config.endpoint = 'videoenhan.cn-shanghai.aliyuncs.com'

  if (!config.accessKeyId || !config.accessKeySecret) {
    throw new Error('阿里云AccessKey配置缺失')
  }

  return new VideoenhanClient.default(config)
}

// 导出类型
export type AliyunClient = any
export type MergeVideoFaceAdvanceRequest = any
export type MergeVideoFaceResponse = any
export type GetAsyncJobResultRequest = any
export type GetAsyncJobResultResponse = any
