import * as z from "zod"
import { FormFields } from "@/types/locales/contact"

// 基础验证逻辑，不包含错误消息
const baseContactSchema = {
  name: z.string()
    .min(2)
    .max(50)
    .trim(),
  email: z.string()
    .email()
    .max(100)
    .trim(),
  message: z.string()
    .min(10)
    .max(1000)
    .trim(),
}

// 默认错误消息（用于服务端）
export const contactFormSchema = z.object({
  name: baseContactSchema.name
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters"),
  email: baseContactSchema.email
    .email("Please enter a valid email address")
    .max(100, "Email cannot exceed 100 characters"),
  message: baseContactSchema.message
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message cannot exceed 1000 characters"),
})

// 创建带有本地化错误消息的模式（用于客户端）
export const createLocalizedContactSchema = (fields: FormFields) => {
  return z.object({
    name: baseContactSchema.name
      .min(2, fields.name.error)
      .max(50, "Name cannot exceed 50 characters"),
    email: baseContactSchema.email
      .email(fields.email.error)
      .max(100, "Email cannot exceed 100 characters"),
    message: baseContactSchema.message
      .min(10, fields.message.error)
      .max(1000, "Message cannot exceed 1000 characters"),
  })
}


export type ContactFormValues = z.infer<typeof contactFormSchema>