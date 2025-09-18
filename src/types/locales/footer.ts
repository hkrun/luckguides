import { type SocialIconName } from '@/types/icons'

export interface FooterLink {
    label: string;
    href: string;
}

export interface FooterSection {
    title: string;
    links: FooterLink[];
}

export interface Footer {
    logo: string;
    logoTitle: string;
    description: string;
    sections: FooterSection[];
    copyright: string;
    legal: {
        privacyPolicy: string;
        termsOfService: string;
    };
    socials: SocialLink[];
}

export interface SocialLink {
    name: SocialIconName;
    href: string;
}