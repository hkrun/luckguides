
export interface Navbar {
  logo: string;
  logoTitle: string;
  navigation: Navigation[];
  actions: {
    signIn: string;
  };
  mobileMenu: MobileMenuLocale;
  userButton: UserButtonLocale;
  languageToggle: {
    label: string;
  };
  themeToggle: {
    label: string;
  };
  creditsDisplay: CreditsDisplayLocale;
}


export interface UserMenuItem {
  label: string;
  href?: string;
  type: 'contact' | 'billing' | 'account' | 'logout';
}

export interface UserButtonLocale {
  menuItems: UserMenuItem[];
  aria: {
    userMenu: string;
    userImage: string;
    userName: string;
    userEmail: string;
  };
}

export interface Navigation {
  href: string;
  label: string;
}

export interface MobileMenuLocale {
  toggleMenu: string;
  actions: {
    signIn: string;
    signOut?: string;
    upgradePlan: string;
    contactUs: string;
  };
  settings: {
    theme: string;
    language: string;
  };
  navigation: Navigation[];
}

export interface CreditsDisplayLocale {
  label: string;
  tooltip: {
    title: string;
    costInfo: string;
    usageInfo: string;
    getMoreButton: string;
  };
}
