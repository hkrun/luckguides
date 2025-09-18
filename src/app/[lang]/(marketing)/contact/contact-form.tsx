'use client'

import { useState } from "react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useToast } from "@/hooks/use-toast"
import { ContactFormLocale, FormFields } from "@/types/locales/contact"
import { createLocalizedContactSchema } from "@/lib/validations/contact"
import { addContactInfo } from "@/actions/contact"
import { useSession } from "next-auth/react"
import { LoginDialog } from "@/components/auth/LoginDialog"

interface ContactFormProps {
  formLabels: ContactFormLocale;
  lang: string;
  authTexts?: any;
  authErrorTitle?: string;
  authErrorDesc?: string;
}

export function ContactForm({ formLabels, lang, authTexts, authErrorTitle, authErrorDesc }: ContactFormProps) {
  const [isPending, setIsPending] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const { toast } = useToast()
  const { data: session } = useSession()

  // 使用本地化的验证模式
  const localizedSchema = createLocalizedContactSchema(formLabels.fields)

  const form = useForm<z.infer<typeof localizedSchema>>({
    resolver: zodResolver(localizedSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  })

  async function onSubmit(values: z.infer<typeof localizedSchema>) {
    // 检查用户是否已登录
    if (!session?.user) {
      // 显示登录提示
      toast({
        title: authErrorTitle || "请先登录",
        description: authErrorDesc || "请登录后再发送咨询",
        variant: "destructive",
      });
      
      // 打开登录对话框
      setIsLoginModalOpen(true);
      return;
    }

    try {
      setIsPending(true)
      const result = await addContactInfo(values)

      if (result?.success) {
        console.log(result)
        toast({
          title: "Success",
          description: 'Your message has been submitted,We value your feedback as it empowers us to enhance our tools.',
          variant: "default",
          duration: 3000
        })
        form.reset()
      } else {
        toast({
          title: "Error",
          description: 'Failed to submit message. Please try again.',
          variant: "destructive",
          duration: 3000
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit form. Please try again later.",
        variant: "destructive",
        duration: 3000
      })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{formLabels.fields.name.label}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={formLabels.fields.name.placeholder}
                    {...field}
                    className="border-gray-200 dark:border-gray-600 focus:border-blue-600 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{formLabels.fields.email.label}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={formLabels.fields.email.placeholder}
                    {...field}
                    className="border-gray-200 dark:border-gray-600 focus:border-blue-600 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{formLabels.fields.message.label}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={formLabels.fields.message.placeholder}
                  className="min-h-[160px] border-gray-200 dark:border-gray-600 focus:border-blue-600 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 text-center rounded-xl font-semibold transition-colors bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 shadow-lg"
        >
          {isPending ? formLabels.submitting : formLabels.submitButton}
        </button>
      </form>
      
      <LoginDialog
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        lang={lang}
        i18n={authTexts || {
          auth: {
            login: {
              title: "登录",
              googleButton: "使用Google登录",
              orDivider: "或",
              emailLabel: "邮箱",
              emailPlaceholder: "请输入邮箱",
              passwordLabel: "密码",
              passwordPlaceholder: "请输入密码",
              loginButton: "登录",
              registerLink: "注册",
              registerButton: "立即注册",
              forgotPassword: "忘记密码？"
            },
            register: {
              title: "注册",
              googleButton: "使用Google注册",
              orDivider: "或",
              emailLabel: "邮箱",
              emailPlaceholder: "请输入邮箱",
              passwordLabel: "密码",
              passwordPlaceholder: "请输入密码",
              firstNameLabel: "名字",
              firstNamePlaceholder: "请输入名字",
              lastNameLabel: "姓氏",
              lastNamePlaceholder: "请输入姓氏",
              registerButton: "注册",
              loginLink: "登录",
              loginButton: "立即登录"
            },
            errors: {
              emailRequired: "邮箱必填",
              emailInvalid: "邮箱格式不正确",
              passwordRequired: "密码必填",
              passwordLength: "密码至少6位",
              firstNameRequired: "名字必填",
              lastNameRequired: "姓氏必填",
              loginFailed: "登录失败",
              registerFailed: "注册失败",
              googleLoginFailed: "Google登录失败",
              networkError: "网络错误",
              userNotFound: "用户不存在",
              invalidCredentials: "用户名或密码错误",
              accountDisabled: "账户已禁用"
            },
            success: {
              welcomeBack: "欢迎回来！"
            }
          }
        }}
      />
    </Form>
  )
}