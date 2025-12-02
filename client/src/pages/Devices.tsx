import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { Activity, AlertCircle, CheckCircle, Moon, Sun, XCircle } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function Devices() {
  const { theme, toggleTheme } = useTheme();
  const { data: devices, isLoading } = trpc.devices.list.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const { data: readings } = trpc.readings.getRecent.useQuery(
    { deviceId: selectedDeviceId!, limit: 10 },
    { enabled: !!selectedDeviceId, refetchInterval: 5000 }
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "offline":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      online: "default",
      offline: "secondary",
      error: "destructive",
    };
    return (
      <Badge variant={variants[status] || "secondary"} className="capitalize">
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      temperature: "bg-red-500/10 text-red-500 border-red-500/20",
      humidity: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      occupancy: "bg-green-500/10 text-green-500 border-green-500/20",
      lighting: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    };
    return (
      <Badge variant="outline" className={`capitalize ${colors[type] || ""}`}>
        {type}
      </Badge>
    );
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
              <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </a>
            </Link>
            <Link href="/devices">
              <a className="text-sm font-medium text-foreground hover:text-primary transition-colors">Devices</a>
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
          <h2 className="text-3xl font-bold text-foreground">Devices</h2>
          <p className="text-muted-foreground">Manage and monitor all IoT devices</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Device List */}
          <div className="lg:col-span-2">
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle>All Devices</CardTitle>
                <CardDescription>
                  {isLoading ? "Loading..." : `${devices?.length || 0} devices registered`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading devices...</p>
                ) : devices && devices.length > 0 ? (
                  <div className="rounded-md border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Device</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Seen</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {devices.map((device) => (
                          <TableRow
                            key={device.id}
                            className={`cursor-pointer ${selectedDeviceId === device.deviceId ? "bg-muted" : ""}`}
                            onClick={() => setSelectedDeviceId(device.deviceId)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(device.status)}
                                <span>{device.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getTypeBadge(device.type)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{device.location}</TableCell>
                            <TableCell>{getStatusBadge(device.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : "Never"}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedDeviceId(device.deviceId)}>
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No devices registered yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Device Details */}
          <div>
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle>Device Details</CardTitle>
                <CardDescription>
                  {selectedDeviceId ? "Recent sensor readings" : "Select a device to view details"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDeviceId && readings ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Recent Readings</h4>
                      <div className="space-y-2">
                        {readings.slice(0, 10).map((reading) => (
                          <div
                            key={reading.id}
                            className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0"
                          >
                            <span className="text-muted-foreground">
                              {new Date(reading.timestamp).toLocaleTimeString()}
                            </span>
                            <span className="font-medium">
                              {reading.value}
                              {reading.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Select a device from the list to view its details</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
