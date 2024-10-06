import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Home</h1>
        <Card>
          <CardHeader>
            <CardTitle>Welcome to the Dashboard</CardTitle>
            <CardDescription>This is your dashboard home page.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Here you can find an overview of your account and quick access to important features.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
