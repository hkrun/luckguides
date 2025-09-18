import { LogsForm } from "./logs-form"

export default function Page() {
  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Usage Logs</h1>
        <p className="text-muted-foreground">View all naming task records and their details.</p>
      </div>
      <LogsForm />
    </div>
  )
}