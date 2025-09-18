export interface Contact {
  hero: {
    subtitle: string;
    title: string;
    description: string;
  };
  info: {
    title: string;
    description: string;
    contacts: Array<{
      text: string;
    }>;
  };
  form: ContactFormLocale;
  meta: {
    keywords: string;
    title: string;
    description: string;
    alt: string;
  }
}

export interface ContactFormLocale {
  title: string;
  description: string;
  fields: FormFields;
  submitButton: string;
  successMessage: string;
  submitting: string;
  toasts: {
    success: {
      title: string;
      description: string;
    };
    error: {
      title: string;
      description: string;
      fallback: string;
    }
  }
}

export interface FormFields{
    name: {
      label: string;
      placeholder: string;
      error: string;
    };
    email: {
      label: string;
      placeholder: string;
      error: string;
    };
    message: {
      label: string;
      placeholder: string;
      error: string;
    };
  }