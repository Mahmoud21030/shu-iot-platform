import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Activity, AlertTriangle, Database, Gauge } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />
            <h1 className="text-xl font-bold text-foreground">{APP_TITLE}</h1>
          </div>
          <Link href="/dashboard">
            <Button variant="default">Go to Dashboard</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Smart Campus IoT Management
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            A comprehensive IoT platform for monitoring and managing Sheffield Hallam University's smart campus
            infrastructure. Real-time monitoring, intelligent alerts, and data-driven insights.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" variant="default">
                View Dashboard
              </Button>
            </Link>
            <Link href="/devices">
              <Button size="lg" variant="outline">
                Explore Devices
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20">
        <div className="mx-auto max-w-6xl">
          <h3 className="mb-12 text-center text-3xl font-bold text-foreground">Platform Features</h3>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <Activity className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Real-time Monitoring</CardTitle>
                <CardDescription>
                  Monitor all IoT devices across campus in real-time with live data updates
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <Gauge className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Device Management</CardTitle>
                <CardDescription>
                  Manage and control all connected devices from a centralized dashboard
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <AlertTriangle className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Intelligent Alerts</CardTitle>
                <CardDescription>
                  Receive instant notifications when sensor readings exceed defined thresholds
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <Database className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Data Analytics</CardTitle>
                <CardDescription>
                  Analyze historical data and generate insights for better decision-making
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Device Types Section */}
      <section className="bg-muted/30 py-20">
        <div className="container">
          <div className="mx-auto max-w-6xl">
            <h3 className="mb-12 text-center text-3xl font-bold text-foreground">Supported Device Types</h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-card text-card-foreground">
                <CardHeader>
                  <CardTitle className="text-lg">Temperature Sensors</CardTitle>
                  <CardDescription>Monitor ambient temperature across campus buildings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Range: 15-35°C</p>
                  <p className="text-sm text-muted-foreground">Alert thresholds: &lt;15°C, &gt;30°C</p>
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground">
                <CardHeader>
                  <CardTitle className="text-lg">Humidity Sensors</CardTitle>
                  <CardDescription>Track relative humidity levels in indoor spaces</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Range: 30-80%</p>
                  <p className="text-sm text-muted-foreground">Alert thresholds: &lt;30%, &gt;70%</p>
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground">
                <CardHeader>
                  <CardTitle className="text-lg">Occupancy Sensors</CardTitle>
                  <CardDescription>Count people in rooms and common areas</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Range: 0-100 people</p>
                  <p className="text-sm text-muted-foreground">Optimizes space utilization</p>
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground">
                <CardHeader>
                  <CardTitle className="text-lg">Smart Lighting</CardTitle>
                  <CardDescription>Control and monitor lighting systems</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Status: On/Off</p>
                  <p className="text-sm text-muted-foreground">Brightness: 0-100%</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Sheffield Hallam University. IoT Platform - Graduation Project.</p>
        </div>
      </footer>
    </div>
  );
}
