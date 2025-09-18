'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const handleLogin = () => {
    // 简单关闭模态框，让用户通过主要的认证流程登录
    onClose();
    // 可以重定向到登录页面或触发其他登录流程
    window.location.href = '/login';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>用户登录</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            点击下方按钮进行登录或注册
          </p>
          <Button onClick={handleLogin} className="w-full">
            登录 / 注册
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 