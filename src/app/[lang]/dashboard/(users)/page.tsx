
import { UsersForm} from "./users-form";

export default function Page() {

  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Manage your users, their credits, and permissions.</p>
      </div>
      <UsersForm />
    </div>
  )
}

