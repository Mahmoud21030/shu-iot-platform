import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Moon, Sun } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function DeviceConfig() {
  const { theme, toggleTheme } = useTheme();
  const utils = trpc.useUtils();
  
  const [deviceId, setDeviceId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"temperature" | "humidity" | "occupancy" | "lighting">("temperature");
  const [location, setLocation] = useState("");

  const registerMutation = trpc.devices.register.useMutation({
    onSuccess: () => {
      toast.success("Device registered successfully");
      utils.devices.list.invalidate();
      // Reset form
      setDeviceId("");
      setName("");
      setType("temperature");
      setLocation("");
    },
    onError: (error) => {
      toast.error(`Failed to register device: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deviceId || !name || !location) {
      toast.error("Please fill in all fields");
      return;
    }

    registerMutation.mutate({
      deviceId,
      name,
      type,
      location,
    });
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
            <Link href="/devices" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Devices
            </Link>
            <Link href="/alerts" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Alerts
            </Link>
            <Link href="/config" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Device Configuration</h2>
          <p className="text-muted-foreground">Register new IoT devices to the platform</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Registration Form */}
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle>Register New Device</CardTitle>
              <CardDescription>Add a new IoT device to start monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deviceId">Device ID</Label>
                  <Input
                    id="deviceId"
                    placeholder="e.g., temp-001"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique identifier for the device
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Device Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Temperature Sensor 1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Device Type</Label>
                  <Select value={type} onValueChange={(value: any) => setType(value)}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="temperature">Temperature Sensor</SelectItem>
                      <SelectItem value="humidity">Humidity Sensor</SelectItem>
                      <SelectItem value="occupancy">Occupancy Sensor</SelectItem>
                      <SelectItem value="lighting">Smart Lighting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Main Hall"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? "Registering..." : "Register Device"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle>Device Types</CardTitle>
              <CardDescription>Supported IoT device types and their uses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Temperature Sensor</h4>
                <p className="text-sm text-muted-foreground">
                  Monitors ambient temperature in °C. Alerts when temperature exceeds 30°C or drops below 15°C.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1">Humidity Sensor</h4>
                <p className="text-sm text-muted-foreground">
                  Measures relative humidity in %. Alerts when humidity exceeds 70% or drops below 30%.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1">Occupancy Sensor</h4>
                <p className="text-sm text-muted-foreground">
                  Detects presence and counts people in a space. Useful for space utilization tracking.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1">Smart Lighting</h4>
                <p className="text-sm text-muted-foreground">
                  Controls and monitors lighting systems. Reports power consumption and status.
                </p>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="font-medium mb-2">Using the Simulator</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  After registering a device, start the simulator with:
                </p>
                <code className="text-xs bg-muted p-2 rounded block">
                  python device_simulator.py --url http://localhost:3000 --device-id {deviceId || "your-device-id"} --name "{name || "Your Device"}" --type {type} --location "{location || "Your Location"}" --interval 10
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
