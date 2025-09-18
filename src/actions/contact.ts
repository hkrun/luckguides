'use server';
import { sql } from '@/lib/postgres-client';
import { contactFormSchema } from '@/lib/validations/contact'

export async function addContactInfo( data: unknown ) {
    try {
        const result = contactFormSchema.safeParse(data);
  
        if (!result.success) {
            return {
              success: false,
              message: 'Invalid form data. Please check your input.',
            }
          }
  
      const { name, email, message } = result.data;
  
      const { rows } = await sql`
        INSERT INTO nf_contact (name, email, message)
        VALUES (${name}, ${email}, ${message})
        RETURNING id
      `;
  
      if (!rows[0]) {
        return {
            success: false,
            message: 'Failed to submit message. Please try again.',
        };
      }
  
      return {
        success: true,
        message: 'Your message has been submitted,We value your feedback as it empowers us to enhance our tools.'
      };
    } catch (error) {
      return {
        success: false,
        message: 'An error occurred. Please try again later.',
      };
    }
  }

export async function getContactInfo() {
    const { rows } = await sql`select * from nf_contact;`;
    return rows;
}

export async function deleteContactInfo(id:number) {
    // const { rows } = await sql`delete from nf_contact where id = ${id};`; (name,email,message) values (${name},${email},${message});`;
    // return rows;
}