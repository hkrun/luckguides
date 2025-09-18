import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export class DeepSeekGenerativeAI {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.DEEP_SEEK_API_KEY || '',
      baseURL: process.env.DEEP_SEEK_API || 'https://api.deepseek.com/v1',
    });
  }

  async createChatCompletion(
    messages: ChatCompletionMessageParam[],
    options?: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
    }
  ) {
    try {
      const response = await this.client.chat.completions.create({
        model: options?.model || 'deepseek-chat',
        messages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.max_tokens || 2000,
      });

      return response;
    } catch (error) {
      console.error('DeepSeek API Error:', error);
      throw new Error('Failed to communicate with DeepSeek API');
    }
  }

  /**
   * 使用Doubao多模态API分析图片
   * @param text 分析图片的提示文本
   * @param imageUrl 图片URL
   * @param options 选项
   * @returns 分析结果
   */
  async analyzeImage(
    text: string,
    imageUrl: string,
    options?: {
      model?: string;
    }
  ): Promise<any> {
    try {
      console.log('开始多模态图像分析...');
      console.log('使用的图片URL:', imageUrl.substring(0, 50) + '...');
      
      const apiKey = process.env.DEEP_SEEK_API_KEY || '';
      const model = options?.model || 'doubao-1-5-vision-pro-32k-250115';
      
      console.log('使用的模型:', model);
      console.log('构建请求数据...');
      
      // 构建请求数据
      const requestData = {
        input: [
          {
            text: text,
            type: "text"
          },
          {
            image_url: {
              url: imageUrl
            },
            type: "image_url"
          }
        ],
        model: model
      };
      
      console.log('请求数据结构:', JSON.stringify(requestData, null, 2).substring(0, 200) + '...');
      
      // 使用fetch API发送请求到Doubao多模态API
      const response = await fetch(
        'https://ark.cn-beijing.volces.com/api/v3/embeddings/multimodal', 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestData)
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API请求失败:', response.status, response.statusText, errorText);
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('收到API响应，状态码:', response.status);
      console.log('响应数据:', JSON.stringify(data).substring(0, 200) + '...');
      
      return data;
    } catch (error) {
      console.error('Doubao多模态API错误:', error);
      throw new Error(`多模态API通信失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 使用DeepSeek分析图片内容
   * 直接构建多模态消息，而不使用embedding API
   */
  async analyzeImageContent(
    text: string,
    imageUrl: string,
    options?: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
    }
  ) {
    try {
      console.log('开始分析图片内容...');
      console.log('图片URL:', imageUrl.substring(0, 50) + '...');

      // 构建多模态消息
      const messages = [
        { 
          role: 'user', 
          content: [
            { type: 'text', text },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ];

      // 使用模型参数
      const modelName = options?.model || 'deepseek-v3-241226';
      console.log('使用的模型:', modelName);

      // 调用API
      const response = await this.client.chat.completions.create({
        model: modelName,
        messages,
        temperature: options?.temperature || 0.3,
        max_tokens: options?.max_tokens || 4000,
      });

      console.log('图片分析API响应成功');
      return response;
    } catch (error) {
      console.error('图片分析API错误:', error);
      throw new Error(`图片分析服务失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}