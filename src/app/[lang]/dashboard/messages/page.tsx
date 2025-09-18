import { MessagesForm } from "./messages-form"

export default function Page() {
  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">Manage system notifications and user communications.</p>
      </div>
      <MessagesForm />
    </div>
  )
}