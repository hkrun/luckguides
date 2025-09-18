'use client'
import { useState } from 'react'
import { UserButton } from './user-button'
import { type Locale } from '@/i18n-config'
import { Button } from "@/components/ui/button"
import { UserButtonLocale } from "@/types/locales/navbar"
import { AuthModal } from "@/components/auth/auth-modal"
import { useSession } from 'next-auth/react'

interface AuthButtonProps {
    lang: Locale
    userButton: UserButtonLocale;
    loginLabel: string;
    className?: string;
}

export function AuthButton({
    lang,
    userButton,
    loginLabel,
    className = "inline-flex bg-primary-gold hover:bg-primary-gold/90 text-white dark:bg-primary-gold/80 dark:hover:bg-primary-gold"
}: AuthButtonProps) {
    const { data: session, status } = useSession();
    const [showAuthModal, setShowAuthModal] = useState(false);

    const handleLogin = () => {
        setShowAuthModal(true);
    }

    const isLoading = status === 'loading';

    if (isLoading) {
        return <div className='flex items-center justify-center w-full'>
                <div className="flex space-x-1.5 items-center animate-pulse bg-background border border-primary-gold/20 rounded-md px-3 py-2.5">
                    <div className="h-2.5 w-2.5 bg-primary-gold/60 dark:bg-primary-gold/40 rounded-full"></div>
                    <div className="h-2.5 w-2.5 bg-primary-gold/40 dark:bg-primary-gold/30 rounded-full"></div>
                    <div className="h-2.5 w-2.5 bg-primary-gold/20 dark:bg-primary-gold/20 rounded-full"></div>
                </div>
        </div>
    }

    return (
        <>
            {session?.user ? (
        <UserButton lang={lang} userLocal={userButton} />
    ) : (
        <Button
            className={className}
            onClick={handleLogin}
        >
            {loginLabel}
        </Button>
            )}
            
            <AuthModal 
                isOpen={showAuthModal} 
                onClose={() => setShowAuthModal(false)}
            />
        </>
    )
}