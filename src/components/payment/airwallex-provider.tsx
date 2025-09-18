'use client';

import React, { createContext, useContext, useEffect } from 'react';
import type { Env, Payment } from '@airwallex/components-sdk';

//type ContactField = "name" | "email" | "country_code" | "address" | "phone"

interface AirwallexOptions {
    fetchClientSecret: () => Promise<{ clientSecret: string; paymentIntentId: string }>;
    intent?: { 
        env?: Env;
        mode?: Payment.Mode;
        requiredBillingContactFields?: Payment.ContactField[];
    };
    customer?: { 
        customerId?: string;
        email?: string;
        name?: string;
    };
    order?: { 
        currency?: string;
    };
    onComplete?: () => void;
    onError?: (error: any) => void;
    onCancel?: () => void;
}

// 默认选项
const defaultOptions: Partial<AirwallexOptions> = {
    intent: {
        env: 'prod',
        mode: 'recurring',
        requiredBillingContactFields: ['name', 'email', 'address']
    },
    order: {
        currency: 'USD'
    }
};


interface AirwallexContextType {
    options: AirwallexOptions;
}

const AirwallexContext = createContext<AirwallexContextType | null>(null);

export const useAirwallex = () => {
    const context = useContext(AirwallexContext);
    if (!context) {
        throw new Error('useAirwallex must be used within an AirwallexCheckoutProvider');
    }
    return context;
};

interface AirwallexCheckoutProviderProps {
    options: Partial<AirwallexOptions>;
    children: React.ReactNode;
}

export function AirwallexCheckoutProvider({ options: userOptions, children }: AirwallexCheckoutProviderProps) {

    const options: AirwallexOptions = {
        ...defaultOptions,
        ...userOptions,
        intent: {
            ...defaultOptions.intent,
            ...userOptions.intent
        },
        customer: {
            ...defaultOptions.customer,
            ...userOptions.customer
        },
        order: {
            ...defaultOptions.order,
            ...userOptions.order
        }
    } as AirwallexOptions;

    useEffect(() => {
        const initAirwallex = async () => {
            try {
                const { init } = await import('@airwallex/components-sdk');
                await init({
                    env: options.intent?.env || 'demo',
                    enabledElements: ['dropIn'],
                });
            } catch (error) {
                console.error('Failed to initialize Airwallex:', error);
                if (options.onError) {
                    options.onError(error);
                }
            }
        };

        initAirwallex();
    }, [options]);

    return (
        <AirwallexContext.Provider value={{ options }}>
          {children}
        </AirwallexContext.Provider>
      );
}

export { type AirwallexOptions }