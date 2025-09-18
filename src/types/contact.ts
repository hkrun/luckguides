
export type ContactFormState = {
  errors?: {
    name?: string[];
    email?: string[];
    message?: string[];
  };
  message?: string;
  success?: boolean;
};

export interface Contact {
    fullName: string;
    email: string;
    message: string;
    createdAt: string;
  }