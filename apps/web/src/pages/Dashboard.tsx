import { useUser } from "@/hooks/useUser"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

/**
 * Dashboard page
 * Note: Requires BFF running locally at http://localhost:8787 to test end-to-end.
 * Not tested end-to-end in this environment.
 */
export default function Dashboard() {
  const { user } = useUser()

  if (!user) return null

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.substring(0, 2).toUpperCase() || 'U'

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <a href="/auth/logout">
          <Button variant="outline">Logout</Button>
        </a>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.picture} alt={user.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{user.name || 'User'}</CardTitle>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </CardHeader>
        <CardContent>
          <p>Welcome to your dashboard!</p>
        </CardContent>
      </Card>
    </div>
  )
}
