import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Download, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useRoute } from "wouter";
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
  const { user, loading: authLoading } = useAuth();
  const [, params] = useRoute("/devices/:deviceId");
  const deviceId = params?.deviceId || "";
  const [timeRange, setTimeRange] = useState(24);

  const { data: device, isLoading: deviceLoading } = trpc.devices.get.useQuery(
    { deviceId },
    { enabled: !!deviceId }
  );

  const { data: historical, isLoading: historicalLoading } = trpc.readings.getHistorical.useQuery(
    { deviceId, hours: timeRange },
    { enabled: !!deviceId, refetchInterval: 30000 }
  );

  const { data: statistics, isLoading: statsLoading } = trpc.readings.getStatistics.useQuery(
    { deviceId, hours: timeRange },
    { enabled: !!deviceId, refetchInterval: 30000 }
  );

  const exportCSVMutation = trpc.readings.exportCSV.useQuery(
    { deviceId, hours: timeRange },
    { enabled: false }
  );

  const handleExportCSV = async () => {
    const result = await exportCSVMutation.refetch();
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

  // Prepare chart data
  const chartData = {
    labels: historical?.map(r => {
      const date = new Date(r.timestamp);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }) || [],
    datasets: [
      {
        label: device?.name || 'Device',
        data: historical?.map(r => parseFloat(r.value)) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const unit = historical?.[context.dataIndex]?.unit || '';
            return `${context.parsed.y}${unit}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  if (authLoading || deviceLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading device details...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!device) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-muted-foreground">Device not found</div>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const getTrendIcon = () => {
    if (!statistics) return null;
    if (statistics.trend === 'increasing') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (statistics.trend === 'decreasing') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <div className="h-4 w-4 text-yellow-500">→</div>;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      case 'error': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{device.name}</h1>
              <p className="text-muted-foreground">
                {device.location} • {device.type}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${getStatusColor(device.status)}`}>
              <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
              <span className="font-medium capitalize">{device.status}</span>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {[1, 6, 12, 24, 48].map(hours => (
            <Button
              key={hours}
              variant={timeRange === hours ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(hours)}
            >
              {hours}h
            </Button>
          ))}
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Data Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.count || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.average || 0}
                <span className="text-sm text-muted-foreground ml-1">
                  {historical?.[0]?.unit || ''}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Min / Max
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statistics?.min || 0} / {statistics?.max || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Std Deviation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ±{statistics?.stdDev || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {getTrendIcon()}
                <span className="text-lg font-medium capitalize">
                  {statistics?.trend || 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historical Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Historical Data</CardTitle>
              <CardDescription>
                Last {timeRange} hours of sensor readings
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            {historicalLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-muted-foreground">Loading chart...</div>
              </div>
            ) : historical && historical.length > 0 ? (
              <div className="h-[400px]">
                <Line data={chartData} options={chartOptions} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-muted-foreground">No data available for this time range</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Readings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Readings</CardTitle>
            <CardDescription>Latest 10 sensor readings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">
                      Timestamp
                    </th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">
                      Value
                    </th>
                    <th className="text-left py-2 px-4 text-sm font-medium text-muted-foreground">
                      Unit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {historical?.slice(-10).reverse().map((reading, index) => (
                    <tr key={index} className="border-b border-border/50">
                      <td className="py-2 px-4 text-sm">
                        {new Date(reading.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2 px-4 text-sm font-medium">{reading.value}</td>
                      <td className="py-2 px-4 text-sm text-muted-foreground">
                        {reading.unit || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
