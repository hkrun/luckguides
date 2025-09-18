import { OrdersForm } from "./orders-form"

export default function Page() {
  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
        <p className="text-muted-foreground">View and manage all user orders and transactions.</p>
      </div>
      <OrdersForm />
    </div>
  )
}