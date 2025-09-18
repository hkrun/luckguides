'use client'

import { useState, useEffect, useRef, use } from "react"
import zhHome from '@/locales/zh/home.json'
import enHome from '@/locales/en/home.json'
import jaHome from '@/locales/ja/home.json'
import koHome from '@/locales/ko/home.json'
import frHome from '@/locales/fr/home.json'
import deHome from '@/locales/de/home.json'
import esHome from '@/locales/es/home.json'
import type { Home as HomeI18n } from '@/types/locales'
import { i18nConfig } from '@/i18n-config'

export default function Home({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  // 使用 React.use() 解包 params，符合 Next.js 15 要求
  const resolvedParams = use(params)
  const lang = resolvedParams.lang || i18nConfig.defaultLocale
  const i18n: HomeI18n = (() => {
    switch (lang) {
      case 'zh': return zhHome as any
      case 'en': return enHome as any
      case 'ja': return jaHome as any
      case 'ko': return koHome as any
      case 'fr': return frHome as any
      case 'de': return deHome as any
      case 'es': return esHome as any
      default: return zhHome as any
    }
  })()
  // === 掌纹分析状态 ===
  const [currentStep, setCurrentStep] = useState(1)
  const [previewSrc, setPreviewSrc] = useState<string>('')
  const [progress, setProgress] = useState<number>(0)
  const [logs, setLogs] = useState<string[]>([i18n.palm.progress.reading])
  const progressTimer = useRef<NodeJS.Timeout | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('')
  const [palmResult, setPalmResult] = useState<any>(null)
  const [showRecommendationModal, setShowRecommendationModal] = useState(false)
  // WhatsApp 深链：根据设备类型设置跳转地址
  const [whatsAppHref, setWhatsAppHref] = useState<string>('https://web.whatsapp.com/send?phone=8617855001595')
  // 摄像头拍照
  const [showCamera, setShowCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  // 无需 i18n 异步加载

  // === 滚动出现动画：与 index.html 一致（选择 .grid > div） ===
  useEffect(() => {
    if (typeof window === 'undefined') return
    const targets = Array.from(new Set([
      ...Array.from(document.querySelectorAll('.grid > div')),
      ...Array.from(document.querySelectorAll('.animate-on-scroll')),
    ])) as HTMLElement[]

    targets.forEach((el) => {
      el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-10')
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement
          if (entry.isIntersecting) {
            el.classList.add('opacity-100', 'translate-y-0')
            el.classList.remove('opacity-0', 'translate-y-10')
            observer.unobserve(el)
          }
        })
      },
      { root: null, rootMargin: '0px 0px -150px 0px', threshold: 0 }
    )

    targets.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
    }
  }, [])

  // 简单的用户代理检测，判断是否为移动设备，并设置 WhatsApp 链接
  useEffect(() => {
    const isMobileDevice = () => {
      if (typeof navigator === 'undefined') return false
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    }
    if (isMobileDevice()) {
      setWhatsAppHref('https://api.whatsapp.com/send?phone=8617855001595')
    } else {
      setWhatsAppHref('https://web.whatsapp.com/send?phone=8617855001595')
    }
  }, [])

  // === 掌纹分析控制 ===
  const startPalmAnalysis = () => {
    setCurrentStep(1)
    setProgress(0)
    setLogs([i18n.palm.progress.reading])
    // 滚动到掌纹分析区域
    const element = document.getElementById('palm-analysis')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
  }
  }

  const toStep = (n: number) => setCurrentStep(n)

  // 重置分析状态
  const resetAnalysis = () => {
    setCurrentStep(1)
    setPreviewSrc('')
    setUploadedImageUrl('')
    setPalmResult(null)
    setProgress(0)
    setLogs([i18n.palm.progress.reading])
    if (progressTimer.current) {
      clearInterval(progressTimer.current)
      progressTimer.current = null
    }
  }

  const onPickFile = async (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = String(e.target?.result || '')
      setPreviewSrc(dataUrl)
      // 不上传到 OSS，直接使用本地 dataURL 传给后端模型
      setUploadedImageUrl(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  // 打开摄像头
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      mediaStreamRef.current = stream
      setShowCamera(true)
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(()=>{})
        }
      })
    } catch (err) {
      console.error(err)
      alert(i18n.palm.upload.cameraError)
    }
  }

  const closeCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t=>t.stop())
      mediaStreamRef.current = null
    }
    setShowCamera(false)
  }

  // 拍照并写入预览
  const capturePhoto = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const w = video.videoWidth || 720
    const h = video.videoHeight || 1280
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, w, h)
    canvas.toBlob((blob)=>{
      if (!blob) return
      const file = new File([blob], 'camera.jpg', { type: 'image/jpeg' })
      onPickFile(file)
      closeCamera()
    }, 'image/jpeg', 0.92)
  }

  const startAnalysis = async () => {
    setProgress(5)
    setLogs([i18n.palm.progress.reading])
    if (progressTimer.current) clearInterval(progressTimer.current)

    try {
      if (!uploadedImageUrl) throw new Error(i18n.palm.upload.noImageError)
      setLogs(prev=>[...prev, i18n.palm.progress.reading])
      const resp = await fetch('/api/bailian/palm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: uploadedImageUrl, locale: lang })
      })
      setProgress(40)
      setLogs(prev=>[...prev, i18n.palm.progress.parsing])
      // 兼容上游返回非 JSON（如 413/网关错误的纯文本或HTML），先取文本再尝试解析
      const rawText = await resp.text()
      let data: any
      try {
        data = rawText ? JSON.parse(rawText) : {}
      } catch {
        // 如果不是 JSON，将其视作错误详情
        data = { success: false, error: rawText?.slice(0, 200) }
      }
      if (!resp.ok || !data?.success) throw new Error(data?.error || i18n.palm.upload.modelError)
      setProgress(85)
      setLogs(prev=>[...prev, i18n.palm.progress.generating])
      setPalmResult(data.data)
      setProgress(100)
      setLogs(prev=>[...prev, i18n.palm.progress.done])
      
      // 分析完成后自动跳转到结果页面
      setTimeout(() => {
        setCurrentStep(2)
      }, 1000)
    } catch (e:any) {
      console.error(e)
      setLogs(prev=>[...prev, `${i18n.palm.upload.analysisError}：${e?.message||e}`])
    }
  }

  // 直接渲染内容

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily: '"仿宋","宋体",serif' }}>
      <style jsx global>{`
        .bg-compass { background-size: cover; background-position: center; background-repeat: no-repeat; position: relative; }
        .fullscreen-video{ position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:0; }
        .text-shadow-lg{ text-shadow: 3px 3px 6px rgba(0,0,0,0.7); }
        .animate-glow{ animation:glow 2s ease-in-out infinite alternate }
        @keyframes glow{from{box-shadow:0 0 5px #fff,0 0 10px #fff,0 0 15px #c8a96e,0 0 20px #c8a96e}to{box-shadow:0 0 10px #fff,0 0 20px #fff,0 0 30px #9e2a2b,0 0 40px #9e2a2b}}
        .compass-rotate { animation: rotate 30s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        /* 纸纹斑点背景（与 index.html 一致） */
        .texture-paper { background-color: #f5f1e6; background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%238b6e4f' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E"); background-size: auto; background-repeat: repeat; }
        /* 全页浅噪点背景 */
        .bg-pattern { background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEWFhYWDg4N3d3dtbW17e3t1dXWBgYGHh4d5eXlzc3OLi4ubm5uVlZWPj4+NjY19fX2JiYl/f39ra2uRkZGZmZlpaWmXl5dvb29xcXGTk5NnZ2c8TV1mAAAAG3RSTlNAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAvEOwtAAAFVklEQVR4XpWWB67c2BUFb3g557T/hRo9/WUMZHlgr4Bg8Z4qQgQJlHI4A8SzFVrapvmTF9O7dmYRFZ60YiBhJRCgh1FYhiLAmdvX0CzTOpNE77ME0Zty/nWWzchDtiqrmQDeuv3powQ5ta2eN0FY0InkqDD73lT9c9lEzwUNqgFHs9VQce3TVClFCQrSTfOiYkVJQBmpbq2L6iZavPnAPcoU0dSw0SUTqz/GtrGuXfbyyBniKykOWQWGqwwMA7QiYAxi+IlPdqo+hYHnUt5ZPfnsHJyNiDtnpJyayNBkF6cWoYGAMY92U2hXHF/C1M8uP/ZtYdiuj26UdAdQQSXQErwSOMzt/XWRWAz5GuSBIkwG1H3FabJ2OsUOUhGC6tK4EMtJO0ttC6IBD3kM0ve0tJwMdSfjZo+EEISaeTr9P3wYrGjXqyC1krcKdhMpxEnt5JetoulscpyzhXN5FRpuPHvbeQaKxFAEB6EN+cYN6xD7RYGpXpNndMmZgM5Dcs3YSNFDHUo2LGfZuukSWyUYirJAdYbF3MfqEKmjM+I2EfhA94iG3L7uKrR+GdWD73ydlIB+6hgref1QTlmgmbM3/LeX5GI1Ux1RWpgxpLuZ2+I+IjzZ8wqE4nilvQdkUdfhzI5QDWy+kw5Wgg2pGpeEVeCCA7b85BO3F9DzxB3cdqvBzWcmzbyMiqhzuYqtHRVG2y4x+KOlnyqla8AoWWpuBoYRxzXrfKuILl6SfiWCbjxoZJUaCBj1CjH7GIaDbc9kqBY3W/Rgjda1iqQcOJu2WW+76pZC9QG7M00dffe9hNnseupFL53r8F7YHSwJWUKP2q+k7RdsxyOB11n0xtOvnW4irMMFNV4H0uqwS5ExsmP9AxbDTc9JwgneAT5vTiUSm1E7BSflSt3bfa1tv8Di3R8n3Af7MNWzs49hmauE2wP+ttrq+AsWpFG2awvsuOqbipWHgtuvuaAE+A1Z/7gC9hesnr+7wqCwG8c5yAg3AL1fm8T9AZtp/bbJGwl1pNrE7RuOX7PeMRUERVaPpEs+yqeoSmuOlokqw49pgomjLeh7icHNlG19yjs6XXOMedYm5xH2YxpV2tc0Ro2jJfxC50ApuxGob7lMsxfTbeUv07TyYxpeLucEH1gNd4IKH2LAg5TdVhlCafZvpskfncCfx8pOhJzd76bJWeYFnFciwcYfubRc12Ip/ppIhA1/mSZ/RxjFDrJC5xifFjJpY2Xl5zXdguFqYyTR1zSp1Y9p+tktDYYSNflcxI0iyO4TPBdlRcpeqjK/piF5bklq77VSEaA+z8qmJTFzIWiitbnzR794USKBUaT0NTEsVjZqLaFVqJoPN9ODG70IPbfBHKK+/q/AWR0tJzYHRULOa4MP+W/HfGadZUbfw177G7j/OGbIs8TahLyynl4X4RinF793Oz+BU0saXtUHrVBFT/DnA3ctNPoGbs4hRIjTok8i+algT1lTHi4SxFvONKNrgQFAq2/gFnWMXgwffgYMJpiKYkmW3tTg3ZQ9Jq+f8XN+A5eeUKHWvJWJ2sgJ1Sop+wwhqFVijqWaJhwtD8MNlSBeWNNWTa5Z5kPZw5+LbVT99wqTdx29lMUH4OIG/D86ruKEauBjvH5xy6um/Sfj7ei6UUVk4AIl3MyD4MSSTOFgSwsH/QJWaQ5as7ZcmgBZkzjjU1UrQ74ci1gWBCSGHtuV1H2mhSnO3Wp/3fEV5a+4wz//6qy8JxjZsmxxy5+4w9CDNJY09T072iKG0EnOS0arEYgXqYnXcYHwjTtUNAcMelOd4xpkoqiTYICWFq0JSiPfPDQdnt+4/wuqcXY47QILbgAAAABJRU5ErkJggg=='); }
      `}</style>
      <main className="bg-[#f8f5f0] bg-pattern text-[#333333]">
        <section id="home" className="bg-compass  flex items-center justify-center relative overflow-hidden" style={{height:'95vh'}}>
          <video className="fullscreen-video" autoPlay muted loop playsInline>
            <source src="https://pub-515c7914ec9c40a594c7ed7637de0f6b.r2.dev/blg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src={"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 500'><circle cx='250' cy='250' r='240' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='2'/><circle cx='250' cy='250' r='220' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='2'/><circle cx='250' cy='250' r='200' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='2'/><circle cx='250' cy='250' r='180' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='2'/><circle cx='250' cy='250' r='160' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='2'/><circle cx='250' cy='250' r='140' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='2'/><circle cx='250' cy='250' r='120' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='2'/><circle cx='250' cy='250' r='100' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='2'/><circle cx='250' cy='250' r='80' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='2'/><circle cx='250' cy='250' r='60' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='2'/><circle cx='250' cy='250' r='40' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='2'/><circle cx='250' cy='250' r='20' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='2'/><circle cx='250' cy='250' r='10' fill='rgba(255,255,255,0.2)'/><path d='M250 10 L250 30 M250 470 L250 490 M10 250 L30 250 M470 250 L490 250' stroke='rgba(255,255,255,0.3)' stroke-width='2'/><path d='M146 146 L166 166 M334 334 L354 354 M334 146 L354 166 M146 334 L166 354' stroke='rgba(255,255,255,0.3)' stroke-width='2'/></svg>"}
              alt="五行八卦装饰"
              className="w-full max-w-4xl h-auto compass-rotate opacity-70"
            />
          </div>
          <div className="absolute inset-0 bg-black/0" />
          <div className="container mx-auto px-4 z-10 text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-[clamp(2rem,5vw,3.5rem)] font-bold text-white mb-6 text-shadow-lg animate-glow">
                {i18n.hero.title}
            </h1>
              <p className="text-[clamp(1rem,2vw,1.5rem)] text-gray-100 mb-8">
                {i18n.hero.subtitle}
              </p>
              <div className="flex justify-center">
                <button onClick={startPalmAnalysis} className="bg-[#9e2a2b] hover:bg-[#9e2a2b]/90 text-white font-bold py-5 px-12 rounded-none text-lg transition-all duration-300 animate-glow">
                  <span className="flex items-center">
                    {i18n.hero.cta}
                    <i className="fa fa-arrow-right ml-3" />
                  </span>
                </button>
              </div>
            </div>
            <div className="relative left-0 right-0 z-10 flex flex-wrap justify-center  items-center px-4 top-5">
            {i18n.hero.badges.map((b, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-white/80">
                <i className={[
                  'fa',
                  idx === 0 ? 'fa-certificate' : idx === 1 ? 'fa-shield' : 'fa-users',
                  'text-[#c8a96e]'
                ].join(' ')} />
                <span>{b}</span>
              </div>
            ))}
          </div>
          </div>
          
    
        </section>
        {/* 掌纹分析区域 */}
        <section id="palm-analysis" className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="mx-auto w-full">
              <div className="text-center mb-12">
                <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] text-[#8B4513] mb-4 flex items-center justify-center">
                  <i className="fa fa-hand-paper-o mr-3 text-[#c8a96e]" />
                  {i18n.palm.sectionTitle}
                </h2>
                <p className="text-gray-700 text-lg">{i18n.palm.sectionDesc}</p>
              </div>

              {/* 步骤指示已移除 */}

              {/* 步骤内容 */}
                {currentStep===1 && (
                <div className="bg-white border border-gray-200 rounded-lg p-8">
                    <h4 className="text-xl font-bold text-[#8B4513] mb-4">{i18n.palm.upload.title}</h4>
                  <p className="mb-6 text-gray-700">{i18n.palm.upload.tips}</p>
                  
                  {/* 图片上传区域 */}
                  {!previewSrc && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-6">
                      <div className="w-full h-[200px] md:h-[420px] bg-gray-50 rounded flex items-center justify-center mb-4" style={{backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f0e6d6'/%3E%3Cpath d='M200 100 Q 250 150, 200 200 T 200 300' stroke='%238B4513' stroke-width='1' fill='none'/%3E%3Ccircle cx='200' cy='200' r='100' stroke='%238B4513' stroke-width='1' fill='none'/%3E%3Ctext x='200' y='150' font-family='serif' font-size='14' text-anchor='middle' fill='%238B4513' opacity='0.5'%3E${encodeURIComponent(i18n.palm.upload.placeholder)}%3C/text%3E%3C/svg%3E")`,backgroundSize:'contain',backgroundRepeat:'no-repeat',backgroundPosition:'center'}}>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={openCamera} className="bg-[#8B4513] hover:bg-[#8B4513]/80 text-white font-bold py-3 px-6"><i className="fa fa-camera mr-2"/>{i18n.palm.upload.shot}</button>
                        <label className="bg-[#c8a96e] hover:bg-[#c8a96e]/80 text-white font-bold py-3 px-6 cursor-pointer flex items-center justify-center">
                          <i className="fa fa-upload mr-2"/>{i18n.palm.upload.upload}
                          <input type="file" accept="image/*" className="hidden" onChange={(e)=> onPickFile(e.target.files?.[0])} />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* 图片预览区域 */}
                  {previewSrc && (
                    <div className="border-2 border-gray-300 rounded-lg p-4 mb-6">
                      <div className="w-full h-[220px] md:h-[420px] bg-gray-50 rounded flex items-center justify-center mb-4 relative">
                        {/* 图片预览 - 只在非分析状态显示 */}
                        {progress === 0 && (
                          <img src={previewSrc} alt="手掌预览图" className="max-w-full max-h-full object-contain" />
                        )}
                        
                        {/* AI分析进度 - 只在分析状态显示 */}
                        {progress > 0 && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-95 rounded">
                            <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center mb-6" style={{ animation: 'pulse 1.5s infinite' }}>
                              <i className="fa fa-cog text-5xl text-[#c8a96e] animate-spin" />
                            </div>
                            <div className="w-full max-w-md bg-gray-50 p-6 rounded-lg">
                              <div className="flex items-center mb-4">
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                  <div className="bg-[#c8a96e] h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                                <span className="ml-4 text-lg font-medium text-gray-700">{Math.round(progress)}%</span>
                              </div>
                              <div className="text-base text-gray-600 space-y-2">
                                {logs.map((log, i) => (
                                  <p key={i} className="flex items-center">
                                    <i className="fa fa-check-circle mr-3 text-[#c8a96e] text-base" />
                                    {log}
                                  </p>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* 按钮区域 - 只在非分析状态显示 */}
                      {progress === 0 && (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <button onClick={openCamera} className="bg-[#8B4513] hover:bg-[#8B4513]/80 text-white font-bold py-3 px-6"><i className="fa fa-camera mr-2"/>{i18n.palm.upload.reshot}</button>
                          <label className="bg-[#c8a96e] hover:bg-[#c8a96e]/80 text-white font-bold py-3 px-6 cursor-pointer flex items-center justify-center">
                            <i className="fa fa-upload mr-2"/>{i18n.palm.upload.reupload}
                            <input type="file" accept="image/*" className="hidden" onChange={(e)=> onPickFile(e.target.files?.[0])} />
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  
                  
                  <div className="flex justify-end">
                    {!previewSrc ? (
                      <button disabled className="bg-gray-300 text-gray-500 font-bold py-3 px-6 cursor-not-allowed">{i18n.palm.upload.disabled}</button>
                    ) : progress === 0 ? (
                      <button onClick={startAnalysis} className="bg-[#9e2a2b] hover:bg-[#9e2a2b]/80 text-white font-bold py-3 px-6">{i18n.palm.upload.start} <i className="fa fa-arrow-right ml-2"/></button>
                    ) : progress < 100 ? (
                      <button disabled className="bg-gray-300 text-gray-500 font-bold py-3 px-6 cursor-not-allowed">{i18n.palm.upload.analyzing}</button>
                    ) : (
                      <button onClick={()=>toStep(2)} className="bg-[#9e2a2b] hover:bg-[#9e2a2b]/80 text-white font-bold py-3 px-6">{i18n.palm.upload.viewResult} <i className="fa fa-arrow-right ml-2"/></button>
                    )}
                  </div>
                  </div>
                )}


              {currentStep===2 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-8">
                    <h4 className="text-xl font-bold text-[#8B4513] mb-4">{i18n.palm.result.title}</h4>
                    <p className="mb-6 text-gray-700">{i18n.palm.result.desc}</p>
                  <div className="grid md:grid-cols-2 gap-6 mb-8 items-stretch">
                    <div className="flex flex-col">
                        <h5 className="font-bold text-[#8B4513] mb-3 flex items-center"><i className="fa fa-pie-chart mr-2 text-[#c8a96e]"/> {i18n.palm.result.distTitle}</h5>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex-1 min-h-[220px] md:min-h-[260px]">
                          {(function(){
                            const fe = palmResult?.fiveElements
                            let dist
                            if (fe) {
                              // 归一化处理：确保五个分数总和为100%
                              const scores = [fe.scoreFire||0, fe.scoreWater||0, fe.scoreWood||0, fe.scoreMetal||0, fe.scoreEarth||0]
                              const total = scores.reduce((sum, score) => sum + score, 0)
                              const normalizedScores = total > 0 ? scores.map(score => (score / total) * 100) : [20, 20, 20, 20, 20]
                              
                              dist = [
                                {label:i18n.palm.elements.fire, color:'bg-red-500', percent: Math.round(normalizedScores[0]), icon:'fa fa-fire'},
                                {label:i18n.palm.elements.water, color:'bg-blue-500', percent: Math.round(normalizedScores[1]), icon:'fa fa-tint'},
                                {label:i18n.palm.elements.wood, color:'bg-green-500', percent: Math.round(normalizedScores[2]), icon:'fa fa-leaf'},
                                {label:i18n.palm.elements.metal, color:'bg-gray-400', percent: Math.round(normalizedScores[3]), icon:'fa fa-diamond'},
                              {label:i18n.palm.elements.earth, color:'bg-yellow-600', percent: Math.round(normalizedScores[4]), icon:'fa fa-cube'},
                              ]
                            } else {
                              // 默认示例数据
                              dist = [
                                {label:i18n.palm.elements.fire, color:'bg-red-500', percent:60, icon:'fa fa-fire'},
                                {label:i18n.palm.elements.water, color:'bg-blue-500', percent:30, icon:'fa fa-tint'},
                                {label:i18n.palm.elements.wood, color:'bg-green-500', percent:70, icon:'fa fa-leaf'},
                                {label:i18n.palm.elements.metal, color:'bg-gray-400', percent:20, icon:'fa fa-diamond'},
                              {label:i18n.palm.elements.earth, color:'bg-yellow-600', percent:50, icon:'fa fa-cube'},
                            ]
                          }
                          return dist
                        })().length > 0 && (
                          <div className="h-full flex flex-col justify-between">
                            {(() => {
                              const items = (function(){
                                const fe = palmResult?.fiveElements
                                let dist
                                if (fe) {
                                  const scores = [fe.scoreFire||0, fe.scoreWater||0, fe.scoreWood||0, fe.scoreMetal||0, fe.scoreEarth||0]
                                  const total = scores.reduce((sum, score) => sum + score, 0)
                                  const normalizedScores = total > 0 ? scores.map(score => (score / total) * 100) : [20, 20, 20, 20, 20]
                                  dist = [
                                    {label:i18n.palm.elements.fire, color:'bg-red-500', percent: Math.round(normalizedScores[0]), icon:'fa fa-fire'},
                                    {label:i18n.palm.elements.water, color:'bg-blue-500', percent: Math.round(normalizedScores[1]), icon:'fa fa-tint'},
                                    {label:i18n.palm.elements.wood, color:'bg-green-500', percent: Math.round(normalizedScores[2]), icon:'fa fa-leaf'},
                                    {label:i18n.palm.elements.metal, color:'bg-gray-400', percent: Math.round(normalizedScores[3]), icon:'fa fa-diamond'},
                                    {label:i18n.palm.elements.earth, color:'bg-yellow-600', percent: Math.round(normalizedScores[4]), icon:'fa fa-cube'},
                                  ]
                                } else {
                                  dist = [
                                    {label:i18n.palm.elements.fire, color:'bg-red-500', percent:60, icon:'fa fa-fire'},
                                    {label:i18n.palm.elements.water, color:'bg-blue-500', percent:30, icon:'fa fa-tint'},
                                    {label:i18n.palm.elements.wood, color:'bg-green-500', percent:70, icon:'fa fa-leaf'},
                                    {label:i18n.palm.elements.metal, color:'bg-gray-400', percent:20, icon:'fa fa-diamond'},
                                    {label:i18n.palm.elements.earth, color:'bg-yellow-600', percent:50, icon:'fa fa-cube'},
                              ]
                            }
                            return dist
                              })()
                              return items.map((it, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                              <span className="flex items-center"><i className={`${it.icon} mr-2`} /> {it.label}</span>
                              <div className="w-2/3 bg-gray-200 rounded-full h-2"><div className={`${it.color} h-2 rounded-full`} style={{ width: `${it.percent}%` }} /></div>
                              <span>{it.percent}%</span>
                            </div>
                              ))
                            })()}
                          </div>
                        )}
                        </div>
                        <div className="bg-[#9e2a2b]/10 border-l-4 border-[#9e2a2b] p-4 rounded-r">
                          <h6 className="font-bold text-[#9e2a2b] mb-1">{i18n.palm.result.lackTitle}</h6>
                          <p className="text-gray-700 text-sm">{palmResult?.advice || i18n.palm.result.defaultAdvice}</p>
                        </div>
                      </div>
                    <div className="flex flex-col">
                        <h5 className="font-bold text-[#8B4513] mb-3 flex items-center"><i className="fa fa-book mr-2 text-[#c8a96e]"/> {i18n.palm.result.insightTitle}</h5>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex-1 max-h-[420px] md:max-h-[520px] overflow-y-auto">
                          <div className="mb-3"><h6 className="font-bold text-gray-800 mb-1">{i18n.palm.result.career}</h6><p className="text-gray-700 text-sm">{palmResult?.aspects?.career || i18n.palm.result.defaultCareer}</p></div>
                          <div className="mb-3"><h6 className="font-bold text-gray-800 mb-1">{i18n.palm.result.wealth}</h6><p className="text-gray-700 text-sm">{palmResult?.aspects?.wealth || i18n.palm.result.defaultWealth}</p></div>
                          <div><h6 className="font-bold text-gray-800 mb-1">{i18n.palm.result.health}</h6><p className="text-gray-700 text-sm">{palmResult?.aspects?.health || i18n.palm.result.defaultHealth}</p></div>
                        </div>
                        <div className="bg-[#c8a96e]/10 border-l-4 border-[#c8a96e] p-4 rounded-r">
                          <h6 className="font-bold text-[#c8a96e] mb-1">{i18n.palm.result.adviceTitle}</h6>
                        <p className="text-gray-700 text-sm">{palmResult?.advice || i18n.palm.result.defaultAdvice}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    {/* 重置按钮已隐藏 */}
                    <div className="flex gap-3">
                      <button onClick={()=>setShowRecommendationModal(true)} className="bg-[#9e2a2b] hover:bg-[#9e2a2b]/80 text-white font-bold py-3 px-6">{i18n.palm.result.shop} <i className="fa fa-arrow-right ml-2"/></button>
                      {/* 仙师指引：跳转 WhatsApp（根据设备类型设置链接） */}
                      <a id="whatsapp-link" href={whatsAppHref} target="_blank" rel="nofollow noopener" aria-label="Whatsapp" className="chaty-tooltip Whatsapp-channel chaty-link chaty-whatsapp-channel pos-right bg-[#9e2a2b] hover:bg-[#9e2a2b]/80 text-white font-bold py-3 px-6 flex items-center justify-center" data-form="chaty-form-0-Whatsapp" data-hover="WhatsApp">
                        {i18n.palm.result.guide}
                        <i className="fa fa-arrow-right ml-2"></i>
                      </a>
                    </div>
                    </div>
                  </div>
                )}

            </div>
          </div>
        </section>
        {/* 痛点直击区 */}
        <section id="pain-points" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] text-[#8B4513] text-center mb-12 relative inline-block mx-auto">
              <span className="relative z-10">{i18n.painPoints.title}</span>
              <span className="absolute bottom-2 left-0 w-full h-3 bg-[#c8a96e]/20 -z-10" />
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {i18n.painPoints.items.map((item, idx)=> {
                const card = {
                  bar: idx === 0 ? '#9e2a2b' : idx === 1 ? '#c8a96e' : '#4a5d23',
                  icon: idx === 0 ? 'fa fa-warning' : idx === 1 ? 'fa fa-money' : 'fa fa-heartbeat',
                  title: item.title,
                  desc: item.desc,
                  solColor: idx === 0 ? '#9e2a2b' : idx === 1 ? '#c8a96e' : '#4a5d23',
                  sol: item.solution,
                  svgColor: idx === 0 ? '%239e2a2b' : idx === 1 ? '%23c8a96e' : '%234a5d23',
                  svgText: idx === 0 ? '太岁符' : idx === 1 ? '财神符' : '平安符'
                }
                return (
                <div key={idx} className="bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl animate-on-scroll">
                  <div className="h-2" style={{ backgroundColor: card.bar }} />
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: `${card.bar}1A` }}>
                        <i className={`${card.icon}`} style={{ color: card.bar }} />
                      </div>
                      <h3 className="text-xl font-bold text-[#8B4513]">{card.title}</h3>
                    </div>
                    <p className="mb-4 text-gray-700">{card.desc}</p>
                    <div className="p-4 border-l-4" style={{ backgroundColor: `${card.bar}0D`, borderColor: card.solColor }}>
                      <p className="font-bold" style={{ color: card.solColor }}>{i18n.painPoints.solutionLabel}</p>
                      <p className="text-gray-700">{card.sol}</p>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <img src={`data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 100 100'><rect x='20' y='20' width='60' height='60' fill='none' stroke='${card.svgColor}' stroke-width='2'/><text x='50' y='55' font-size='10' text-anchor='middle' fill='${card.svgColor}'>${card.svgText}</text></svg>`} alt="符" className="opacity-70" />
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 核心服务展示 */}
        <section id="services" className="py-16 md:py-24 bg-gray-100 texture-paper">
          <div className="container mx-auto px-4">
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] text-[#8B4513] text-center mb-12 relative inline-block mx-auto">
              <span className="relative z-10">{i18n.services.title}</span>
              <span className="absolute bottom-2 left-0 w-full h-3 bg-[#c8a96e]/20 -z-10" />
            </h2>
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h3 className="text-2xl font-bold text-[#8B4513] mb-6 flex items-center">
                  <span className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor:'rgba(139,69,19,0.1)'}}><i className="fa fa-calculator" style={{ color:'#8B4513'}}/></span>
                  {i18n.services.calc.title}
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start"><i className="fa fa-check-circle mt-1 mr-3" style={{ color:'#4a5d23'}}/><div><span className="font-bold">{i18n.services.calc.point}</span></div></li>
                </ul>
                <button onClick={startPalmAnalysis} className="mt-8 bg-[#8B4513] hover:bg-[#8B4513]/80 text-white font-bold py-3 px-6">{i18n.services.calc.cta} <i className="fa fa-arrow-right ml-2"/></button>
              </div>
              <div className="relative overflow-hidden">
                <div className="bg-white p-4 shadow-xl rounded-lg transform transition-all duration-500 hover:rotate-1">
                  <img src="https://scmh-shanghai.oss-cn-shanghai.aliyuncs.com/luckguides/images/d7a84ede88cebfdc21e192109bfadc32.jpeg" alt="五行测算示例" className="w-full h-full object-cover rounded" />
                </div>
                <div className="absolute -bottom-6 -left-6 w-24 h-24 md:w-32 md:h-32 opacity-70 animate-[rotate_30s_linear_infinite]">
                  <img src={"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='none' stroke='%238B4513' stroke-width='2'/><circle cx='50' cy='50' r='5' fill='%238B4513'/><path d='M50 10 L50 20 M50 80 L50 90 M10 50 L20 50 M80 50 L90 50 M29 29 L39 39 M71 71 L61 61 M71 29 L61 39 M29 71 L39 61' stroke='%238B4513' stroke-width='2'/></svg>"} alt="罗盘" />
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div className="relative overflow-hidden">
                <div className="bg-white p-4 shadow-xl rounded-lg transform transition-all duration-500 hover:-rotate-1"><img src="https://scmh-shanghai.oss-cn-shanghai.aliyuncs.com/luckguides/images/c92453a4d6c519435e02cd0c70f7902a.jpeg" alt="本命五行手串展示" className="w-full h-full object-cover rounded" /></div>
                
              </div>
              <div>
                 <h3 className="text-2xl font-bold text-[#8B4513] mb-6 flex items-center"><span className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor:'rgba(139,69,19,0.1)'}}><i className="fa fa-diamond" style={{ color:'#8B4513'}}/></span>{i18n.services.bracelet.title}</h3>
                <div className="mb-6"><p className="font-bold mb-2">{i18n.services.bracelet.talismanTitle}</p><p className="mb-4">{i18n.services.bracelet.talismanDesc}</p></div>
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed bg-white border border-gray-200">
                    <thead><tr className="bg-gray-100"><th className="py-2 px-4 border-b text-left break-words">{i18n.services.bracelet.table.lack}</th><th className="py-2 px-4 border-b text-left break-words">{i18n.services.bracelet.table.material}</th><th className="py-2 px-4 border-b text-left break-words">{i18n.services.bracelet.table.meaning}</th></tr></thead>
                    <tbody>
                      {i18n.services.bracelet.tableRows.map((row, idx) => (
                        <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                          <td className="py-2 px-4 border-b break-words whitespace-pre-wrap align-top">{row.lack}</td>
                          <td className="py-2 px-4 border-b break-words whitespace-pre-wrap align-top">{row.material}</td>
                          <td className="py-2 px-4 border-b break-words whitespace-pre-wrap align-top">{row.meaning}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold text-[#8B4513] mb-6 flex items-center"><span className="w-10 h-10 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor:'rgba(158,42,43,0.1)'}}><i className="fa fa-gift" style={{ color:'#8B4513'}}/></span>{i18n.services.valueAdded.title}</h3>
                <ul className="space-y-6">
                  <li className="flex"><div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-4" style={{ backgroundColor:'rgba(158,42,43,0.1)'}}><i className="fa fa-book text-2xl" style={{ color:'#9e2a2b'}}/></div><div><h4 className="font-bold text-lg mb-1">{i18n.services.valueAdded.items[0]}</h4><p>{i18n.services.valueAdded.descriptions[0]}</p></div></li>
                  <li className="flex"><div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-4" style={{ backgroundColor:'rgba(200,169,110,0.1)'}}><i className="fa fa-bell text-2xl" style={{ color:'#c8a96e'}}/></div><div><h4 className="font-bold text-lg mb-1">{i18n.services.valueAdded.items[1]}</h4><p>{i18n.services.valueAdded.descriptions[1]}</p></div></li>
                  <li className="flex"><div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-4" style={{ backgroundColor:'rgba(74,93,35,0.1)'}}><i className="fa fa-wrench text-2xl" style={{ color:'#4a5d23'}}/></div><div><h4 className="font-bold text-lg mb-1">{i18n.services.valueAdded.items[2]}</h4><p>{i18n.services.valueAdded.descriptions[2]}</p></div></li>
                </ul>
              </div>
              <div><img src="https://scmh-shanghai.oss-cn-shanghai.aliyuncs.com/luckguides/images/bde69b52618f985c43ed4137ff8c9713.jpeg" alt="增值服务展示" className="w-full h-auto rounded-lg shadow-xl transform transition-all duration-500 hover:scale-105" /></div>
            </div>
          </div>
        </section>

        {/* 产品优势 */}
        <section id="advantages" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] text-[#8B4513] text-center mb-12 relative inline-block mx-auto"><span className="relative z-10">{i18n.advantages.title}</span><span className="absolute bottom-2 left-0 w-full h-3 bg-[#c8a96e]/20 -z-10" /></h2>
            <div className="grid md:grid-cols-3 gap-8">
              {i18n.advantages.items.map((item, idx) => {
                const it = {
                  icon: idx === 0 ? 'fa fa-certificate' : idx === 1 ? 'fa fa-diamond' : 'fa fa-id-card',
                  title: item.title,
                  img: idx === 0 ? 'https://scmh-shanghai.oss-cn-shanghai.aliyuncs.com/luckguides/images/01661da68bc1de372f00527676764840.jpeg' : idx === 1 ? 'https://scmh-shanghai.oss-cn-shanghai.aliyuncs.com/luckguides/images/dc76f9c660feefafef586ac8697f582c.jpeg' : 'https://scmh-shanghai.oss-cn-shanghai.aliyuncs.com/luckguides/images/05c140d70e45c131954dd8ec2c7c9980.jpeg',
                  text: item.description,
                  circle: idx === 0 ? '#9e2a2b' : idx === 1 ? '#c8a96e' : '#4a5d23'
                }
                return (
                <div key={idx} className="bg-white p-6 rounded-lg shadow-lg transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${it.circle}1A` }}>
                    <i className={`${it.icon} text-2xl`} style={{ color: it.circle }} />
                  </div>
                  <h3 className="text-xl font-bold text-center text-[#8B4513] mb-4">{it.title}</h3>
                  <p className="text-gray-700 text-center mb-4">{it.text}</p>
                  <div className="mt-6 text-center"><img src={it.img} alt={it.title} className="w-full h-[160px] md:h-[200px] object-cover rounded shadow-md" /></div>
                </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 行动引导区 */}
        <section id="action" className="py-16 md:py-24 texture-paper" style={{ backgroundColor:'rgba(139,69,19,0.1)'}}>
          <div className="container mx-auto px-4">
            <h2 className="text-[clamp(1.8rem,3vw,2.5rem)] text-[#8B4513] text-center mb-12 relative inline-block mx-auto"><span className="relative z-10">{i18n.action.title}</span><span className="absolute bottom-2 left-0 w-full h-3 bg-[#c8a96e]/20 -z-10" /></h2>
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/2 p-8 md:p-12">
                  <h3 className="text-2xl font-bold text-[#8B4513] mb-6">{i18n.action.benefitTitle}</h3>
                  <div className="p-4 mb-6 rounded border-l-4" style={{ backgroundColor:'rgba(158,42,43,0.1)', borderColor:'#9e2a2b'}}>
                    <p className="font-bold" style={{ color:'#9e2a2b'}}>{i18n.action.benefitDesc}</p>
                  </div>
                  <h3 className="text-2xl font-bold text-[#8B4513] mb-6">{i18n.action.reviewsTitle}</h3>
                  <div className="space-y-6 mb-8">
                    {i18n.action.reviews.map((review, i) => {
                      const u = {
                        id: i === 0 ? 64 : 65,
                        quote: review.quote,
                        name: review.name
                      }
                      return (
                      <div key={i} className="flex">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden mr-4"><img src={`https://picsum.photos/id/${u.id}/100/100`} alt="用户头像" className="w-full h-full object-cover" /></div>
                        <div><p className="italic text-gray-700">{u.quote}</p><p className="text-sm text-gray-500 mt-1">{u.name}</p></div>
                      </div>
                      )
                    })}
                  </div>
                  <div className="flex flex-col space-y-4">
                    <button onClick={startPalmAnalysis} className="bg-[#9e2a2b] hover:bg-[#9e2a2b]/80 text-white font-bold py-4 px-6 rounded-none">{i18n.action.ctaMeasure}</button>
                    <button className="bg-[#8B4513] hover:bg-[#8B4513]/80 text-white font-bold py-4 px-6 rounded-none">{i18n.action.ctaPlan}</button>
                    <button className="bg-[#c8a96e] hover:bg-[#c8a96e]/80 text-white font-bold py-4 px-6 rounded-none">{i18n.action.ctaPay} <i className="fa fa-arrow-right ml-1"/></button>
                  </div>
                </div>
                <div className="md:w-1/2 bg-compass relative overflow-hidden min-h-[320px] md:min-h-0 flex items-center justify-center">
                  <div className="flex items-center justify-center p-8 md:absolute md:inset-0">
                    <div className="text-center text-[#8B4513] z-10">
                      <h3 className="text-2xl font-bold mb-4">{i18n.action.rightTitle}</h3>
                      <p className="mb-6">{i18n.action.rightDesc}</p>
                      <img src="https://scmh-shanghai.oss-cn-shanghai.aliyuncs.com/luckguides/images/bde69b52618f985c43ed4137ff8c9713.jpeg" alt="转运手串" className="w-full max-w-xs mx-auto rounded-lg shadow-2xl border-4 border-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 摄像头拍照弹窗 */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg overflow-hidden w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h5 className="font-bold text-[#8B4513]">{i18n.palm.upload.shot}</h5>
              <button onClick={closeCamera} className="text-gray-500 hover:text-gray-700 text-xl"><i className="fa fa-times"/></button>
            </div>
            <div className="p-4">
              <div className="relative w-full rounded overflow-hidden bg-black">
                <video ref={videoRef} playsInline autoPlay className="w-full h-auto"/>
                <canvas ref={canvasRef} className="hidden"/>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button onClick={closeCamera} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4"><i className="fa fa-times mr-2"/>{i18n.palm.upload.cancel}</button>
                <button onClick={capturePhoto} className="bg-[#9e2a2b] hover:bg-[#9e2a2b]/80 text-white font-bold py-2 px-4"><i className="fa fa-camera mr-2"/>{i18n.palm.upload.captureAndUse}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 推荐方案对话框 */}
      {showRecommendationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-2xl font-bold text-[#8B4513]">{i18n.modal.title}</h4>
                <button 
                  onClick={() => setShowRecommendationModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  <i className="fa fa-times"></i>
                </button>
              </div>
              
              <p className="mb-6 text-gray-700">{i18n.modal.recommendationDesc}</p>
              
              <div className="mb-6">
                <h5 className="font-bold text-[#8B4513] mb-3 flex items-center"><i className="fa fa-calendar-check-o mr-2 text-[#c8a96e]"/> {i18n.modal.month}</h5>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  <div className="md:flex">
                    <div className="md:w-1/3"><img src="https://scmh-shanghai.oss-cn-shanghai.aliyuncs.com/luckguides/images/bde69b52618f985c43ed4137ff8c9713.jpeg" alt={i18n.modal.productTitle || 'product'} className="w-full h-full object-cover"/></div>
                    <div className="md:w-2/3 p-4">
                      <div className="flex justify-between items-start mb-2"><h6 className="font-bold text-lg text-[#8B4513]">{i18n.modal.productTitle}</h6><span className="bg-[#9e2a2b] text-white text-xs py-1 px-2 rounded">{i18n.modal.badgeBestForMetal}</span></div>
                      <p className="text-gray-700 text-sm mb-3">{i18n.modal.productDesc}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {[i18n.modal.tagCrystal, i18n.modal.tagSilver925, i18n.modal.tagTalismanTube, i18n.modal.tagBlessed].map((t)=>(<span key={t} className="bg-gray-100 text-gray-800 text-xs py-1 px-2 rounded">{t}</span>))}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="hidden"><span className="text-[#9e2a2b] font-bold text-xl">¥398</span><span className="text-gray-400 line-through text-sm ml-2">¥498</span></div>
                        <a href={whatsAppHref} target="_blank" rel="nofollow noopener" className="bg-[#c8a96e] hover:bg-[#c8a96e]/80 text-white font-bold py-2 px-4">{i18n.modal.buyNow}</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="font-bold text-[#8B4513] mb-3 flex items-center"><i className="fa fa-th mr-2 text-[#c8a96e]"/> {i18n.modal.others}</h5>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { id: 177, img: 'https://scmh-shanghai.oss-cn-shanghai.aliyuncs.com/luckguides/images/d7a84ede88cebfdc21e192109bfadc32.jpeg' },
                    { id: 167, img: 'https://scmh-shanghai.oss-cn-shanghai.aliyuncs.com/luckguides/images/05c140d70e45c131954dd8ec2c7c9980.jpeg' }
                  ].map((meta, i) => {
                    const item = i18n.modal.othersList?.[i];
                    if (!item) return null;
                    return (
                      <div key={meta.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                        <img src={meta.img} alt={item.title} className="w-full h-48 object-cover" />
                        <div className="p-4">
                          <h6 className="font-bold text-[#8B4513] mb-1">{item.title}</h6>
                          <p className="text-gray-700 text-sm mb-2">{item.desc}</p>
                          <div className="flex justify-between items-center"><span className="hidden text-[#9e2a2b] font-bold" />
                            <a href={whatsAppHref} target="_blank" rel="nofollow noopener" className="bg-[#8B4513] hover:bg-[#8B4513]/80 text-white font-bold py-1 px-3 text-sm">{i18n.modal.viewDetails}</a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-bold text-[#8B4513] mb-2">{i18n.modal.advice}</h5>
                <p className="text-gray-700 text-sm">{i18n.modal.wearingAdvice}</p>
              </div>
              
              <div className="flex justify-between mt-6">
                <button onClick={() => setShowRecommendationModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6"><i className="fa fa-times mr-2"/>{i18n.modal.close}</button>
                <button className="bg-[#9e2a2b] hover:bg-[#9e2a2b]/90 text-white font-bold py-3 px-8" style={{ boxShadow: '0 0 10px #fff,0 0 20px #fff,0 0 30px #9e2a2b,0 0 40px #9e2a2b' }}>{i18n.modal.buy} <i className="fa fa-shopping-cart ml-2"/></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}