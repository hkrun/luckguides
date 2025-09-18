import { NextRequest, NextResponse } from 'next/server'
import { PALM_PROMPT_ZH, PALM_PROMPT_EN, PALM_PROMPT_JA, PALM_PROMPT_KO, PALM_PROMPT_FR, PALM_PROMPT_DE, PALM_PROMPT_ES } from '@/actions/constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PalmAnalyzeRequest = {
  imageUrl: string
  promptExtras?: string
  locale?: string
}

const MODEL_ID = process.env.BAILIAN_MODEL_ID || 'qwen-vl-max'

const BAILIAN_API_KEY =
  process.env.DASHSCOPE_API_KEY ||
  process.env.BAILIAN_API_KEY ||
  process.env.ALIBABA_BAILIAN_API_KEY ||
  ''

function buildSystemPrompt(locale: string = 'zh') {
  if (locale.startsWith('en')) return PALM_PROMPT_EN
  if (locale.startsWith('ja')) return PALM_PROMPT_JA
  if (locale.startsWith('ko')) return PALM_PROMPT_KO
  if (locale.startsWith('fr')) return PALM_PROMPT_FR
  if (locale.startsWith('de')) return PALM_PROMPT_DE
  if (locale.startsWith('es')) return PALM_PROMPT_ES
  return PALM_PROMPT_ZH
}

export async function POST(request: NextRequest) {
  try {
    if (!BAILIAN_API_KEY) {
      return NextResponse.json({ error: 'missing_api_key', details: 'DASHSCOPE_API_KEY 未配置' }, { status: 500 })
    }

    const body = (await request.json().catch(() => ({}))) as PalmAnalyzeRequest
    const { imageUrl, promptExtras, locale } = body
    console.log('[BailianPalm] incoming body:', { hasImage: !!imageUrl, imageUrlSample: imageUrl?.slice(0, 32), locale, hasPromptExtras: !!promptExtras })

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
    }

    const systemPrompt = buildSystemPrompt(locale || 'zh')

    // 根据语言参数选择用户消息
    let userMessage = ''
    if (locale?.startsWith('en')) {
      userMessage = (promptExtras || '') + ' Please analyze the palm photo for Five-Element fortune reading and return the result in JSON format as specified.'
    } else if (locale?.startsWith('ja')) {
      userMessage = (promptExtras || '') + ' 手のひらの写真を基に五行と運勢の分析を行い、指定されたJSON形式で結果を返してください。'
    } else if (locale?.startsWith('ko')) {
      userMessage = (promptExtras || '') + ' 손바닥 사진을 기반으로 오행과 운세 분석을 수행하고, 지정된 JSON 형식으로 결과를 반환해 주세요.'
    } else if (locale?.startsWith('fr')) {
      userMessage = (promptExtras || '') + ' Veuillez analyser la photo de paume pour la lecture de fortune des Cinq Éléments et retourner le résultat au format JSON comme spécifié.'
    } else if (locale?.startsWith('de')) {
      userMessage = (promptExtras || '') + ' Bitte analysieren Sie das Handflächenfoto für die Fünf-Elemente-Glückslesung und geben Sie das Ergebnis im angegebenen JSON-Format zurück.'
    } else if (locale?.startsWith('es')) {
      userMessage = (promptExtras || '') + ' Por favor analiza la foto de palma para la lectura de fortuna de los Cinco Elementos y devuelve el resultado en formato JSON como se especifica.'
    } else {
      userMessage = (promptExtras || '') + ' 请基于图片进行掌纹五行与运势分析，并按约定 JSON 返回。'
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: userMessage },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ]

    // 使用百炼 DashScope OpenAI 兼容模式 Chat Completions 调用
    const resp = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BAILIAN_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages,
        temperature: 0.4,
        // 提高可返回长度，减少被截断概率
        max_tokens: 1024,
      }),
    })

    if (!resp.ok) {
      const text = await resp.text().catch(()=> '')
      let details: any = text
      try { details = JSON.parse(text) } catch {}
      return NextResponse.json({ error: 'upstream_error', details }, { status: 502 })
    }

    const data = await resp.json()
    console.log('[BailianPalm] upstream raw data:', JSON.stringify(data).slice(0, 2000))
    const content: string = data?.choices?.[0]?.message?.content ?? ''
    console.log('[BailianPalm] model content (first 400 chars):', content?.slice(0, 400))

    // 尝试解析为 JSON（增强容错：代码块提取 + 平衡大括号提取）
    let parsed: any = null
    const tryParse = (s?: string) => {
      if (!s) return null
      try { return JSON.parse(s) } catch { return null }
    }

    // 1) 直接解析
    parsed = tryParse(content)

    // 2) ```json 代码块
    if (!parsed) {
      const fence = content.match(/```json\s*([\s\S]*?)\s*```/i) || content.match(/```\s*([\s\S]*?)\s*```/)
      if (fence?.[1]) parsed = tryParse(fence[1])
    }

    // 3) 提取最大平衡花括号片段
    if (!parsed) {
      const text = content
      let start = -1
      let depth = 0
      let best: string | null = null
      let inStr = false
      let esc = false
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        if (inStr) {
          if (!esc && ch === '"') inStr = false
          esc = ch === '\\' && !esc
          continue
        }
        if (ch === '"') { inStr = true; esc = false; continue }
        if (ch === '{') {
          if (depth === 0) start = i
          depth++
        } else if (ch === '}') {
          if (depth > 0) depth--
          if (depth === 0 && start >= 0) {
            const candidate = text.slice(start, i + 1)
            best = candidate // 保留最后一个完整的
          }
        }
      }
      if (best) parsed = tryParse(best)
    }

    if (!parsed) {
      return NextResponse.json({ error: 'invalid_model_output', details: '模型未返回可解析的JSON', raw: content }, { status: 500 })
    }

    console.log('[BailianPalm] parsed JSON:', parsed)
    return NextResponse.json({ success: true, data: parsed })
  } catch (error: any) {
    return NextResponse.json({ error: 'internal_error', details: error?.message || String(error) }, { status: 500 })
  }
}


