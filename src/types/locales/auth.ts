export interface Auth {
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
        authRequired: string;
        authRequiredDesc: string;
        [key: string]: string;
    };
    success: {
        welcomeBack: string;
        welcomeNew: string;
        [key: string]: string;
    };
} 