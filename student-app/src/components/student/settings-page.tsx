"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Bell,
  Wifi,
  Moon,
  Shield,
  HelpCircle,
  Info,
  ChevronRight,
  Download,
  Trash2,
  LogOut,
} from "lucide-react";
import { motion } from "framer-motion";
import { clearAuthToken } from "@/lib/api-client";
import { useStudentStore } from "@/lib/store";
import { toast } from "sonner";

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function SettingsPage({ onNavigate: _onNavigate }: SettingsPageProps) {
  const { setStudentUser } = useStudentStore();
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    autoPlay: true,
    downloadOverWifi: true,
    highQualityStreaming: false,
    showSubtitles: true,
    darkMode: true,
    soundEffects: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success("Setting updated");
  };

  const handleClearCache = () => {
    toast.success("Cache cleared successfully");
  };

  const handleLogout = () => {
    clearAuthToken();
    setStudentUser(null);
    toast.success("Logged out successfully");
  };

  const settingSections = [
    {
      title: "Notifications",
      icon: Bell,
      items: [
        { key: "pushNotifications" as const, label: "Push Notifications", description: "Receive push notifications for updates" },
        { key: "emailNotifications" as const, label: "Email Notifications", description: "Receive email updates" },
      ],
    },
    {
      title: "Video & Streaming",
      icon: Wifi,
      items: [
        { key: "autoPlay" as const, label: "Auto-play", description: "Auto-play next lesson" },
        { key: "highQualityStreaming" as const, label: "HD Streaming", description: "Stream in high quality (uses more data)" },
        { key: "downloadOverWifi" as const, label: "Download over Wi-Fi only", description: "Save mobile data" },
        { key: "showSubtitles" as const, label: "Show Subtitles", description: "Display subtitles when available" },
      ],
    },
    {
      title: "Appearance",
      icon: Moon,
      items: [
        { key: "darkMode" as const, label: "Dark Mode", description: "Use dark theme" },
        { key: "soundEffects" as const, label: "Sound Effects", description: "Play sounds for interactions" },
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 space-y-4 max-w-2xl mx-auto"
    >
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-white flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Manage your app preferences</p>
      </div>

      {/* Settings Sections */}
      {settingSections.map((section) => (
        <Card key={section.title} className="glass-card border-0">
          <CardContent className="p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <section.icon className="h-3.5 w-3.5" />
              {section.title}
            </h2>
            <div className="space-y-4">
              {section.items.map((item, idx) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <Label className="text-sm text-white">{item.label}</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                    <Switch
                      checked={settings[item.key]}
                      onCheckedChange={() => toggleSetting(item.key)}
                    />
                  </div>
                  {idx < section.items.length - 1 && <Separator className="mt-4 bg-white/5" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Other Settings */}
      <Card className="glass-card border-0">
        <CardContent className="p-2">
          <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <span className="text-sm text-white">Privacy Policy</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <span className="text-sm text-white">Help & Support</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <span className="text-sm text-white">About DAKKHO</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>

      {/* Storage */}
      <Card className="glass-card border-0">
        <CardContent className="p-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Download className="h-3.5 w-3.5" />
            Storage
          </h2>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white">Downloaded Content</span>
            <span className="text-xs text-muted-foreground">0 MB</span>
          </div>
          <Button
            onClick={handleClearCache}
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-white"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear Cache
          </Button>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        onClick={handleLogout}
        variant="ghost"
        className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 h-12"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Log Out
      </Button>
    </motion.div>
  );
}
