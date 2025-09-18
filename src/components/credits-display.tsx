"use client"

import { Coins, Gem } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { type Locale } from "@/i18n-config"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect } from "react"
import { type CreditsDisplayLocale } from "@/types/locales/navbar"
import { findUserCreditsByUserId } from "@/actions/user"
import { useSession } from 'next-auth/react'

interface CreditsDisplayProps {
  lang: Locale
  creditsDisplay: CreditsDisplayLocale
}

export function CreditsDisplay({ lang, creditsDisplay }: CreditsDisplayProps) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [credits, setCredits] = useState(0)

  // 强制刷新积分
  const refreshCredits = async () => {
    if (session?.user?.id) {
      const updatedCredits = await findUserCreditsByUserId(session.user.id, true);
      setCredits(updatedCredits);
    }
  };

  // 监听全局积分更新事件
  useEffect(() => {
    const handleCreditsUpdate = (event: CustomEvent) => {
      console.log('收到积分更新事件:', event.detail);
      
      // 如果事件包含积分数据，直接使用
      if (event.detail.credits !== undefined) {
        setCredits(event.detail.credits);
      } else {
        // 否则重新获取积分
        refreshCredits();
      }
    };

    window.addEventListener('creditsUpdated', handleCreditsUpdate as EventListener);
    return () => {
      window.removeEventListener('creditsUpdated', handleCreditsUpdate as EventListener);
    };
  }, []);

  // 组件挂载时刷新积分
  useEffect(() => {
    if (session?.user?.id) {
    refreshCredits();
    }
  }, [session?.user?.id]);

  // 打开 tooltip 时刷新积分
  useEffect(() => {
    if (open && session?.user?.id) {
      refreshCredits();
    }
  }, [open, session?.user?.id]);

  if (!session?.user) return null

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild onClick={() => !open && setOpen(true)}>
          <div className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-2 rounded-lg bg-background border border-primary/20 text-primary hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 cursor-pointer shadow-sm">
            <Gem className="h-3 w-3 md:h-4 md:w-4" />
            <span className="text-xs md:text-sm font-medium">
              {credits}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="w-64 p-4 bg-background border border-border shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h4 className="font-medium text-sm text-foreground">{creditsDisplay.label}</h4>
              <div className="flex items-center gap-1 text-primary">
                <Gem className="h-4 w-4" />
                <span className="font-bold">{credits}</span>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              <p className="mb-1 font-semibold text-primary">{creditsDisplay.tooltip.costInfo}</p>
              <p>{creditsDisplay.tooltip.usageInfo}</p>
            </div>
            
            <Link href={`/${lang}/pricing`} className="block">
              <Button variant="default" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                {creditsDisplay.tooltip.getMoreButton}
              </Button>
            </Link>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}