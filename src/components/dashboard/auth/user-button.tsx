"use client"

import { type Locale, getPathname } from "@/i18n-config"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Mail, CreditCard, User, LogOut } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useSession, signOut } from 'next-auth/react'

interface UserMenuItem {
  label: string;
  href?: string;
  type: 'contact' | 'billing' | 'account' | 'logout';
}

interface UserButtonLocale {
  menuItems: UserMenuItem[];
  aria: {
    userMenu: string;
    userImage: string;
    userName: string;
    userEmail: string;
  };
}

interface UserButtonProps {
  lang: Locale;
  userLocal: UserButtonLocale;
}

const MENU_ICONS = {
  contact: Mail,
  billing: CreditCard,
  account: User,
  logout: LogOut,
} as const;

export function UserButton({ lang, userLocal }: UserButtonProps) {
  const { data: session } = useSession();

  const handleMenuItemClick = (item: UserMenuItem) => {
    switch (item.type) {
      case 'account':
        // 显示英文开发中提示，而不是跳转到不存在的页面
        alert('Account management feature is under development...');
        break;
      case 'logout':
        {
          const currentUrl = typeof window !== 'undefined'
            ? window.location.pathname + window.location.search + window.location.hash
            : `/${lang}`;
          signOut({ callbackUrl: currentUrl });
        }
        break;
    }
  };

  if (!session?.user) return null;

  // 生成用户头像URL（使用Dicebear API）
  const firstName = (session.user as any).firstName || session.user.name?.split(' ')[0] || 'U';
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${firstName[0]}&backgroundColor=00695c&textColor=fff`;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative p-0 size-8 rounded-full border border-primary-gold/20 hover:border-primary-gold/40 dark:border-primary-gold/30 dark:hover:border-primary-gold/50"
            aria-label={userLocal.aria.userMenu}
          >
            <Avatar className="size-7">
              <AvatarImage src={session.user.image || avatarUrl} alt={userLocal.aria.userImage} />
              <AvatarFallback className="bg-[#00796b] text-white">
                {firstName[0] || 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 mt-2 border-primary-gold/20 dark:border-primary-gold/30 dark:bg-background/95"
          align="end"
        >
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none dark:text-white" aria-label={userLocal.aria.userName}>
                {session.user.name || 'User Avatar'}
              </p>
              <p className="text-xs leading-none text-muted-foreground dark:text-muted-foreground/90" aria-label={userLocal.aria.userEmail}>
                {session.user.email || "no email"}
              </p>
            </div>
          </div>
          <DropdownMenuSeparator className="border-primary-gold/20 dark:border-primary-gold/30" />
          {userLocal.menuItems.map((item, index) => {
            const Icon = MENU_ICONS[item.type];
            return (
              <DropdownMenuItem
                key={index}
                onClick={() => !item.href && handleMenuItemClick(item)}
                className="cursor-pointer hover:bg-primary-gold/10 dark:hover:bg-primary-gold/20 focus:bg-primary-gold/10 dark:focus:bg-primary-gold/20"
              >
                <Icon className="h-4 w-4 mr-2 text-primary-gold" />
                {item.href ? (
                  <a href={getPathname(lang, item.href)} className="flex items-center">
                    {item.label}
                  </a>
                ) : (
                  item.label
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}