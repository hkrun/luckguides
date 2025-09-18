'use client'
import { useState } from 'react'
// 不再使用自定义auth hooks，纯使用NextAuth
import { type Locale } from '@/i18n-config'
import { Button } from "@/components/ui/button"
import { UserButton } from './user-button'
import { LoginDialog } from './LoginDialog'
import { UserButtonLocale } from "@/types/locales/navbar"
import { SubscriptionLocal, ToastLocal } from "@/types/locales/billing";
import { useSession } from 'next-auth/react'

interface AuthButtonProps {
    lang: Locale
    userButton: UserButtonLocale;
    loginLabel: string;
    className?: string;
    subscription: SubscriptionLocal;
    toastLocal: ToastLocal;
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

export function AuthButton({
    lang,
    userButton,
    subscription,
    toastLocal,
    loginLabel,
    i18n,
    className = "inline-flex bg-deep-green hover:bg-deep-green/90 text-cream border border-gold/30 dark:bg-deep-green/80 dark:hover:bg-deep-green"
}: AuthButtonProps) {
    const { data: session, status } = useSession();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const isLoading = status === 'loading';

    const handleLogin = () => {
        setIsLoginModalOpen(true);
    }

    if (isLoading) {
        return (
            <div className='flex items-center justify-center w-full'>
                <div className="flex space-x-1.5 items-center animate-pulse bg-background border border-primary/20 rounded-md px-3 py-2.5">
                    <div className="h-2.5 w-2.5 bg-primary/60 dark:bg-primary/40 rounded-full"></div>
                    <div className="h-2.5 w-2.5 bg-primary/40 dark:bg-primary/30 rounded-full"></div>
                    <div className="h-2.5 w-2.5 bg-primary/20 dark:bg-primary/20 rounded-full"></div>
                </div>
            </div>
        )
    }
    
    const isLoggedIn = session?.user;

    return (
        <>
            {isLoggedIn ? (
                <UserButton
                    lang={lang}
                    userLocal={userButton}
                    subscriptionLocal={subscription}
                    toastLocal={toastLocal}
                />
            ) : (
                <Button
                    className={className}
                    onClick={handleLogin}
                >
                    {loginLabel}
                </Button>
            )}
            
            <LoginDialog 
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                lang={lang}
                i18n={i18n}
            />
        </>
    )
}