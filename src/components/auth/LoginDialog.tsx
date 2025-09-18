"use client"

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons/icons';
import { type Locale } from '@/i18n-config';

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
  lang: string;
  i18n: {
    auth: {
      login: {
        title: string;
        googleButton: string;
        orDivider: string;
        emailLabel: string;
        emailPlaceholder: string;
        passwordLabel: string;
        passwordPlaceholder: string;
        loginButton: string;
        registerLink: string;
        registerButton: string;
        forgotPassword: string;
      };
      register: {
        title: string;
        googleButton: string;
        orDivider: string;
        emailLabel: string;
        emailPlaceholder: string;
        passwordLabel: string;
        passwordPlaceholder: string;
        firstNameLabel: string;
        firstNamePlaceholder: string;
        lastNameLabel: string;
        lastNamePlaceholder: string;
        registerButton: string;
        loginLink: string;
        loginButton: string;
      };
      errors: {
        emailRequired: string;
        emailInvalid: string;
        passwordRequired: string;
        passwordLength: string;
        firstNameRequired: string;
        lastNameRequired: string;
        loginFailed: string;
        registerFailed: string;
        googleLoginFailed: string;
        networkError: string;
        userNotFound: string;
        invalidCredentials: string;
        accountDisabled: string;
        [key: string]: string;
      };
      success: {
        welcomeBack: string;
        welcomeNew: string;
        [key: string]: string;
      };
    };
  };
}

interface FormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
  message?: string;
}

export function LoginDialog({ isOpen, onClose, defaultMode = 'login', lang, i18n }: LoginDialogProps) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    username: '',
  });

  // 不再使用自定义的auth hooks，纯使用NextAuth
  const { toast } = useToast();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      // 获取当前页面路径，保持用户在登录后停留在同一页面
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : `/${lang}`;
      const callbackUrl = `${currentPath}?googleAuth=true`;
      await signIn('google', {
        callbackUrl: callbackUrl
      });
    } catch (error) {
      toast({
        title: i18n.auth.errors.googleLoginFailed,
        description: i18n.auth.errors.googleLoginFailed,
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'login') {
        // 使用NextAuth的credentials provider登录
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });
        
        if (result?.ok) {
          toast({
            title: i18n.auth.login.title,
            description: i18n.auth.success.welcomeBack,
          });
          onClose();
          // 通知其他组件：用户已登录（用于价格页自动恢复支付）
          try { console.log('[LoginDialog] dispatch userLoggedIn'); window.dispatchEvent(new CustomEvent('userLoggedIn')); } catch {}
          // 若存在待支付意图，跳到价格页交由价格按钮自动弹出；否则保持原刷新逻辑
          try {
            const pending = sessionStorage.getItem('pendingPricingIntent') || localStorage.getItem('pendingPricingIntent');
            console.log('[LoginDialog] pending intent:', pending);
            if (pending) {
              // 同时把 intent 放进 URL，防止某些环境清空 storage
              const intent = JSON.parse(pending);
              const target = `/${lang}/pricing?intent=${encodeURIComponent(intent.planType)}`;
              window.location.href = target;
            } else {
              window.location.reload();
            }
          } catch (e) {
            window.location.reload();
          }
        } else {
          toast({
            title: i18n.auth.errors.loginFailed,
            description: i18n.auth.errors.invalidCredentials,
            variant: "destructive",
          });
        }
      } else {
        // 注册流程：先创建用户账户
        const response = await fetch('/api/auth/register-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          }),
        });

        const registerResult = await response.json();
        
        if (registerResult.success) {
          // 注册成功后，使用NextAuth自动登录
          const loginResult = await signIn('credentials', {
            email: formData.email,
            password: formData.password,
            redirect: false,
          });
          
          if (loginResult?.ok) {
            toast({
              title: i18n.auth.register.title,
              description: i18n.auth.success.welcomeNew,
            });
            onClose();
            // 通知其他组件：用户已登录（用于价格页自动恢复支付）
            try { console.log('[LoginDialog] dispatch userLoggedIn (register)'); window.dispatchEvent(new CustomEvent('userLoggedIn')); } catch {}
            // 如果存在 pending intent，将其随 URL 带到价格页
            try {
              const pending = sessionStorage.getItem('pendingPricingIntent') || localStorage.getItem('pendingPricingIntent');
              if (pending) {
                const intent = JSON.parse(pending);
                window.location.href = `/${lang}/pricing?intent=${encodeURIComponent(intent.planType)}`;
              } else {
                window.location.href = `/${lang}/pricing`;
              }
            } catch {
              window.location.href = `/${lang}/pricing`;
            }
          } else {
            // 注册成功但登录失败，提示用户手动登录
            toast({
              title: i18n.auth.register.title,
              description: i18n.auth.success.welcomeNew + " " + i18n.auth.login.title,
            });
            setMode('login'); // 切换到登录模式
          }
        } else {
          const errorMessage = registerResult.error && registerResult.error in i18n.auth.errors 
            ? i18n.auth.errors[registerResult.error as keyof typeof i18n.auth.errors]
            : registerResult.error || i18n.auth.errors.registerFailed;
          toast({
            title: i18n.auth.errors.registerFailed,
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: i18n.auth.errors.loginFailed,
        description: i18n.auth.errors.networkError,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      username: '',
    });
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'login' ? i18n.auth.login.title : i18n.auth.register.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
            className="w-full py-3 px-4 text-center rounded-sm font-medium transition-colors duration-300 bg-transparent text-deep-green border border-deep-green hover:bg-deep-green/5 disabled:opacity-50 flex items-center justify-center"
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.google className="mr-2 h-4 w-4" />
            )}
            {mode === 'login' ? i18n.auth.login.googleButton : i18n.auth.register.googleButton}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {mode === 'login' ? i18n.auth.login.orDivider : i18n.auth.register.orDivider}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{i18n.auth.register.firstNameLabel}</Label>
                  <Input
                    id="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder={i18n.auth.register.firstNamePlaceholder}
                    
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{i18n.auth.register.lastNameLabel}</Label>
                  <Input
                    id="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder={i18n.auth.register.lastNamePlaceholder}
                    
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{mode === 'login' ? i18n.auth.login.emailLabel : i18n.auth.register.emailLabel}</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder={mode === 'login' ? i18n.auth.login.emailPlaceholder : i18n.auth.register.emailPlaceholder}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{mode === 'login' ? i18n.auth.login.passwordLabel : i18n.auth.register.passwordLabel}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder={mode === 'login' ? i18n.auth.login.passwordPlaceholder : i18n.auth.register.passwordPlaceholder}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <button type="submit" className="w-full py-3 text-center rounded-sm font-medium transition-colors duration-300 bg-deep-green text-cream hover:bg-deep-green/90 border border-gold/30 disabled:opacity-50 flex items-center justify-center" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'login' ? i18n.auth.login.loginButton : i18n.auth.register.registerButton}
          </button>
        </form>

        <DialogFooter className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={switchMode}
            className="text-sm text-deep-green hover:text-gold transition-colors duration-300 underline"
          >
            {mode === 'login' ? (
              <>
                {i18n.auth.login.registerLink}{' '}
                <span className="font-semibold">{i18n.auth.login.registerButton}</span>
              </>
            ) : (
              <>
                {i18n.auth.register.loginLink}{' '}
                <span className="font-semibold">{i18n.auth.register.loginButton}</span>
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 