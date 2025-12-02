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
import { AlertTriangle, CheckCircle, Moon, Sun, Download } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Alerts() {
  const { theme, toggleTheme } = useTheme();
  const utils = trpc.useUtils();
  const { data: alerts, isLoading } = trpc.alerts.list.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const exportCSVQuery = trpc.alerts.exportCSV.useQuery(undefined, { enabled: false });

  const handleExportCSV = async () => {
    const result = await exportCSVQuery.refetch();
    if (result.data) {
      const blob = new Blob([result.data.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.data.filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const resolveAlertMutation = trpc.alerts.resolve.useMutation({
    onSuccess: () => {
      utils.alerts.list.invalidate();
      toast.success("Alert resolved successfully");
    },
    onError: (error) => {
      toast.error(`Failed to resolve alert: ${error.message}`);
    },
  });

  const handleResolveAlert = (alertId: number) => {
    resolveAlertMutation.mutate({ alertId });
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; className: string }> = {
      critical: { variant: "destructive", className: "bg-red-500" },
      high: { variant: "destructive", className: "bg-orange-500" },
      medium: { variant: "default", className: "bg-yellow-500" },
      low: { variant: "secondary", className: "bg-blue-500" },
    };
    const config = variants[severity] || variants.medium;
    return (
      <Badge variant={config.variant} className={`capitalize ${config.className}`}>
        {severity}
      </Badge>
    );
  };

  const getAlertTypeIcon = (type: string) => {
    return <AlertTriangle className="h-4 w-4" />;
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
              <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Devices
              </a>
            </Link>
            <Link href="/alerts">
              <a className="text-sm font-medium text-foreground hover:text-primary transition-colors">Alerts</a>
            </Link>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Alerts</h2>
            <p className="text-muted-foreground">Monitor and manage system alerts</p>
          </div>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="bg-card text-card-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? "..." : alerts?.length || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {isLoading ? "..." : alerts?.filter((a) => a.severity === "critical").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">High</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {isLoading ? "..." : alerts?.filter((a) => a.severity === "high").length || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Medium/Low</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {isLoading
                  ? "..."
                  : alerts?.filter((a) => a.severity === "medium" || a.severity === "low").length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Table */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
            <CardDescription>
              {isLoading ? "Loading..." : `${alerts?.length || 0} unresolved alerts`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading alerts...</p>
            ) : alerts && alerts.length > 0 ? (
              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Device ID</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getAlertTypeIcon(alert.alertType)}
                            <span className="capitalize">{alert.alertType}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{alert.deviceId}</TableCell>
                        <TableCell className="max-w-md truncate">{alert.message}</TableCell>
                        <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResolveAlert(alert.id)}
                            disabled={resolveAlertMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground">No active alerts</p>
                <p className="text-sm text-muted-foreground">All systems are operating normally</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
