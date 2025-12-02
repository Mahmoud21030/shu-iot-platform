import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { Activity, AlertTriangle, Database, Moon, Sun, Thermometer } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme();
  const { data: devices, isLoading: devicesLoading } = trpc.devices.list.useQuery(undefined, {
    refetchInterval: 5000, // Refresh every 5 seconds
  });
  const { data: alerts, isLoading: alertsLoading } = trpc.alerts.list.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const onlineDevices = devices?.filter((d) => d.status === "online").length || 0;
  const offlineDevices = devices?.filter((d) => d.status === "offline").length || 0;
  const errorDevices = devices?.filter((d) => d.status === "error").length || 0;
  const totalDevices = devices?.length || 0;

  const criticalAlerts = alerts?.filter((a) => a.severity === "critical").length || 0;
  const highAlerts = alerts?.filter((a) => a.severity === "high").length || 0;
  const totalAlerts = alerts?.length || 0;

  const devicesByType = {
    temperature: devices?.filter((d) => d.type === "temperature").length || 0,
    humidity: devices?.filter((d) => d.type === "humidity").length || 0,
    occupancy: devices?.filter((d) => d.type === "occupancy").length || 0,
    lighting: devices?.filter((d) => d.type === "lighting").length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />
              <h1 className="text-xl font-bold text-foreground">{APP_TITLE}</h1>
            </div>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/dashboard">
              <a className="text-sm font-medium text-foreground hover:text-primary transition-colors">Dashboard</a>
            </Link>
            <Link href="/devices">
              <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Devices
              </a>
            </Link>
            <Link href="/alerts">
              <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Alerts
              </a>
            </Link>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your IoT infrastructure</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-card text-card-foreground">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devicesLoading ? "..." : totalDevices}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {onlineDevices} online, {offlineDevices} offline
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Online Devices</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{devicesLoading ? "..." : onlineDevices}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0}% uptime
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{alertsLoading ? "..." : totalAlerts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {criticalAlerts} critical, {highAlerts} high
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Error Devices</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{devicesLoading ? "..." : errorDevices}</div>
              <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Device Types */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle>Devices by Type</CardTitle>
              <CardDescription>Distribution of device types across campus</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Temperature</span>
                  </div>
                  <span className="text-sm font-bold">{devicesByType.temperature}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Humidity</span>
                  </div>
                  <span className="text-sm font-bold">{devicesByType.humidity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Occupancy</span>
                  </div>
                  <span className="text-sm font-bold">{devicesByType.occupancy}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Lighting</span>
                  </div>
                  <span className="text-sm font-bold">{devicesByType.lighting}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Latest system alerts and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <p className="text-sm text-muted-foreground">Loading alerts...</p>
              ) : alerts && alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3 border-b border-border pb-3 last:border-0">
                      <AlertTriangle
                        className={`h-4 w-4 mt-0.5 ${
                          alert.severity === "critical"
                            ? "text-red-500"
                            : alert.severity === "high"
                              ? "text-orange-500"
                              : "text-yellow-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active alerts</p>
              )}
              {alerts && alerts.length > 5 && (
                <Link href="/alerts">
                  <Button variant="link" className="mt-4 p-0 h-auto">
                    View all alerts →
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
