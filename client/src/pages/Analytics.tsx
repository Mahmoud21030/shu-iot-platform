import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { ArrowDown, ArrowUp, Minus, Moon, Sun } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
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
} from 'chart.js';
import { Line } from 'react-chartjs-2';

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

export default function Analytics() {
  const { theme, toggleTheme } = useTheme();
  const [timeRange, setTimeRange] = useState("24");
  
  const { data: devices, isLoading: devicesLoading } = trpc.devices.list.useQuery();

  // Fetch historical data for all devices
  const deviceReadings = devices?.map(device => ({
    device,
    data: trpc.readings.getHistorical.useQuery({
      deviceId: device.deviceId,
      hours: parseInt(timeRange),
    }),
    stats: trpc.readings.getStatistics.useQuery({
      deviceId: device.deviceId,
      hours: parseInt(timeRange),
    }),
  })) || [];

  // Prepare chart data
  const getChartData = () => {
    const colors = [
      { border: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.1)' }, // blue
      { border: 'rgb(34, 197, 94)', bg: 'rgba(34, 197, 94, 0.1)' }, // green
      { border: 'rgb(251, 146, 60)', bg: 'rgba(251, 146, 60, 0.1)' }, // orange
      { border: 'rgb(168, 85, 247)', bg: 'rgba(168, 85, 247, 0.1)' }, // purple
      { border: 'rgb(236, 72, 153)', bg: 'rgba(236, 72, 153, 0.1)' }, // pink
      { border: 'rgb(14, 165, 233)', bg: 'rgba(14, 165, 233, 0.1)' }, // cyan
    ];

    const datasets = deviceReadings
      .filter(dr => dr.data.data && dr.data.data.length > 0)
      .map((dr, index) => {
        const readings = dr.data.data || [];
        const color = colors[index % colors.length];
        
        return {
          label: `${dr.device.name} (${dr.device.location})`,
          data: readings.map(r => ({
            x: new Date(r.timestamp).toLocaleTimeString(),
            y: parseFloat(r.value),
          })),
          borderColor: color.border,
          backgroundColor: color.bg,
          fill: true,
          tension: 0.4,
        };
      });

    // Get all unique timestamps
    const allTimestamps = new Set<string>();
    deviceReadings.forEach(dr => {
      dr.data.data?.forEach(r => {
        allTimestamps.add(new Date(r.timestamp).toLocaleTimeString());
      });
    });

    return {
      labels: Array.from(allTimestamps).sort(),
      datasets,
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
        },
      },
      title: {
        display: true,
        text: 'Device Readings Over Time',
        color: theme === 'dark' ? '#e5e7eb' : '#1f2937',
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        ticks: {
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
          maxTicksLimit: 12,
        },
        grid: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        ticks: {
          color: theme === 'dark' ? '#9ca3af' : '#6b7280',
        },
        grid: {
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "increasing") return <ArrowUp className="h-4 w-4 text-red-500" />;
    if (trend === "decreasing") return <ArrowDown className="h-4 w-4 text-blue-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  if (devicesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

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
            <Link href="/devices" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Devices
            </Link>
            <Link href="/alerts" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Alerts
            </Link>
            <Link href="/analytics" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Analytics
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
          <div>
            <h2 className="text-3xl font-bold text-foreground">Data Analytics</h2>
            <p className="text-muted-foreground">Comprehensive statistics and trends across all devices</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 1 Hour</SelectItem>
                <SelectItem value="6">Last 6 Hours</SelectItem>
                <SelectItem value="12">Last 12 Hours</SelectItem>
                <SelectItem value="24">Last 24 Hours</SelectItem>
                <SelectItem value="48">Last 48 Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Charts Section */}
        <Card className="mb-8 bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Historical Data Comparison</CardTitle>
            <CardDescription>
              Real-time sensor readings across all devices for the past {timeRange} hour{timeRange !== "1" ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              {deviceReadings.some(dr => dr.data.data && dr.data.data.length > 0) ? (
                <Line data={getChartData()} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No data available for the selected time range
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistics Grid */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-foreground mb-4">Device Statistics</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {deviceReadings.map(({ device, stats }) => {
              const statsData = stats.data;
              
              return (
                <Card key={device.deviceId} className="bg-card text-card-foreground">
                  <CardHeader>
                    <CardTitle className="text-lg">{device.name}</CardTitle>
                    <CardDescription>{device.location}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {statsData && statsData.count > 0 ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Data Points</span>
                          <span className="font-medium">{statsData.count}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Average</span>
                          <span className="font-medium">{statsData.average}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Min / Max</span>
                          <span className="font-medium">{statsData.min} / {statsData.max}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Std Deviation</span>
                          <span className="font-medium">{statsData.stdDev}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Trend</span>
                          <div className="flex items-center gap-2">
                            {getTrendIcon(statsData.trend)}
                            <span className="font-medium capitalize">{statsData.trend}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No data available</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Summary Statistics */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Platform Summary</CardTitle>
            <CardDescription>Overall statistics for the past {timeRange} hour{timeRange !== "1" ? "s" : ""}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Devices</p>
                <p className="text-2xl font-bold">{devices?.length || 0}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Online Devices</p>
                <p className="text-2xl font-bold text-green-500">
                  {devices?.filter(d => d.status === "online").length || 0}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Offline Devices</p>
                <p className="text-2xl font-bold text-red-500">
                  {devices?.filter(d => d.status === "offline").length || 0}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Readings</p>
                <p className="text-2xl font-bold">
                  {deviceReadings.reduce((sum, dr) => sum + (dr.stats.data?.count || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
