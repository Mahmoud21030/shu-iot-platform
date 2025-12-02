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
import { Moon, Sun, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function DeviceConfig() {
  const { theme, toggleTheme } = useTheme();
  const utils = trpc.useUtils();
  
  const [deviceId, setDeviceId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"temperature" | "humidity" | "occupancy" | "lighting">("temperature");
  const [location, setLocation] = useState("");

  const registerDeviceMutation = trpc.devices.register.useMutation({
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

    registerDeviceMutation.mutate({
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
              <a className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Alerts
              </a>
            </Link>
            <Link href="/config">
              <a className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Configuration
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
          <h2 className="text-3xl font-bold text-foreground">Device Configuration</h2>
          <p className="text-muted-foreground">Register new devices and configure settings</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Register New Device */}
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Register New Device
              </CardTitle>
              <CardDescription>
                Add a new IoT device to the platform
              </CardDescription>
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
                      <SelectValue placeholder="Select device type" />
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

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={registerDeviceMutation.isPending}
                >
                  {registerDeviceMutation.isPending ? "Registering..." : "Register Device"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Configuration Guide */}
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle>Configuration Guide</CardTitle>
              <CardDescription>
                How to set up and configure devices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">1. Register the Device</h4>
                <p className="text-sm text-muted-foreground">
                  Fill in the device details in the form. The Device ID must be unique and will be used by the simulator.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">2. Start the Simulator</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Run the Python simulator with the registered device ID:
                </p>
                <code className="block bg-muted p-2 rounded text-xs">
                  python device_simulator.py --url http://localhost:3000 --device-id temp-001 --name "Temperature Sensor 1" --type temperature --location "Main Hall" --interval 10
                </code>
              </div>

              <div>
                <h4 className="font-medium mb-2">3. Monitor the Device</h4>
                <p className="text-sm text-muted-foreground">
                  Once the simulator starts, the device will appear in the dashboard with real-time data updates.
                </p>
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h4 className="font-medium mb-2">Alert Thresholds</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Default thresholds for automatic alerts:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Temperature: &lt; 15°C or &gt; 30°C</li>
                  <li>Humidity: &lt; 30% or &gt; 70%</li>
                  <li>Occupancy: &gt; 80%</li>
                  <li>Lighting: &lt; 20% or &gt; 90%</li>
                </ul>
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h4 className="font-medium mb-2">Offline Detection</h4>
                <p className="text-sm text-muted-foreground">
                  Devices are automatically marked as offline if they haven't sent data for more than 1 minute.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
