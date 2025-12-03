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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Moon, Sun, Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Link, useParams } from "wouter";
import { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DeviceDetail() {
  const { theme, toggleTheme } = useTheme();
  const params = useParams();
  const deviceId = params.deviceId as string;
  const [timeRange, setTimeRange] = useState<number>(24);

  const { data: device } = trpc.devices.list.useQuery(undefined, {
    select: (devices) => devices.find((d) => d.deviceId === deviceId),
  });

  const { data: historicalData } = trpc.readings.getHistorical.useQuery(
    { deviceId, hours: timeRange },
    { enabled: !!deviceId, refetchInterval: 30000 }
  );

  const { data: statistics } = trpc.readings.getStatistics.useQuery(
    { deviceId, hours: timeRange },
    { enabled: !!deviceId, refetchInterval: 30000 }
  );

  const { data: recentReadings } = trpc.readings.getRecent.useQuery(
    { deviceId, limit: 10 },
    { enabled: !!deviceId, refetchInterval: 5000 }
  );

  const exportCSVQuery = trpc.readings.exportCSV.useQuery(
    { deviceId, hours: timeRange },
    { enabled: false }
  );

  const handleExportCSV = async () => {
    const result = await exportCSVQuery.refetch();
    if (result.data) {
      const blob = new Blob([result.data.csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.data.filename;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  // Prepare chart data
  const chartData = historicalData
    ? {
        labels: historicalData.map((reading) =>
          new Date(reading.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        ),
        datasets: [
          {
            label: device?.type || "Sensor Reading",
            data: historicalData.map((reading) => parseFloat(reading.value)),
            borderColor: "rgb(59, 130, 246)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            fill: true,
            tension: 0.4,
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: theme === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
        },
      },
      x: {
        grid: {
          color: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: theme === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "increasing") return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === "decreasing") return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
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
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/devices" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Devices
            </Link>
            <Link href="/alerts" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Alerts
            </Link>
            <Link href="/config" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Configuration
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
          <div className="flex items-center gap-4">
            <Link href="/devices">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h2 className="text-3xl font-bold text-foreground">{device?.name || deviceId}</h2>
              <p className="text-muted-foreground">
                {device?.type} sensor at {device?.location}
              </p>
            </div>
          </div>
          <Badge variant={device?.status === "online" ? "default" : "secondary"} className="capitalize">
            {device?.status}
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-6">
          {/* Statistics Cards */}
          <Card className="bg-card text-card-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.count || 0}</div>
              <p className="text-xs text-muted-foreground">in last {timeRange}h</p>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.average ? parseFloat(statistics.average).toFixed(2) : "N/A"}
                {recentReadings?.[0]?.unit}
              </div>
              <p className="text-xs text-muted-foreground">
                Min: {statistics?.min || "N/A"} | Max: {statistics?.max || "N/A"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Trend & Std Dev</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-2xl font-bold">
                {getTrendIcon(statistics?.trend || "stable")}
                <span className="capitalize">{statistics?.trend || "stable"}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                σ = ±{statistics?.stdDev ? parseFloat(statistics.stdDev).toFixed(2) : "N/A"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Historical Chart */}
        <Card className="bg-card text-card-foreground mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Historical Data</CardTitle>
                <CardDescription>Sensor readings over time</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Select value={timeRange.toString()} onValueChange={(value) => setTimeRange(parseInt(value))}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Last 1 hour</SelectItem>
                    <SelectItem value="6">Last 6 hours</SelectItem>
                    <SelectItem value="12">Last 12 hours</SelectItem>
                    <SelectItem value="24">Last 24 hours</SelectItem>
                    <SelectItem value="48">Last 48 hours</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chartData && chartData.labels.length > 0 ? (
              <div style={{ height: "400px" }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px]">
                <p className="text-muted-foreground">No data available for the selected time range</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Readings Table */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Recent Readings</CardTitle>
            <CardDescription>Latest 10 sensor readings</CardDescription>
          </CardHeader>
          <CardContent>
            {recentReadings && recentReadings.length > 0 ? (
              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentReadings.map((reading) => (
                      <TableRow key={reading.id}>
                        <TableCell className="text-sm">
                          {new Date(reading.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">{reading.value}</TableCell>
                        <TableCell className="text-muted-foreground">{reading.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent readings available</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
