"use client";

import { useStudentStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  Building2,
  Cpu,
  Calendar,
  Edit3,
  Settings,
  Bookmark,
  LogOut,
} from "lucide-react";
import { motion } from "framer-motion";
import { clearAuthToken } from "@/lib/api-client";
import { toast } from "sonner";

interface ProfilePageProps {
  onNavigate: (page: string) => void;
}

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { studentUser, setStudentUser } = useStudentStore();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    clearAuthToken();
    setStudentUser(null);
    toast.success("Logged out successfully");
  };

  const profileFields = [
    { icon: Mail, label: "Email", value: studentUser?.email },
    { icon: Phone, label: "Phone", value: studentUser?.phone },
    { icon: Building2, label: "Institute", value: studentUser?.institute },
    { icon: Cpu, label: "Technology", value: studentUser?.technology },
    { icon: Calendar, label: "Semester", value: studentUser?.semester },
  ];

  const menuItems = [
    { icon: Edit3, label: "Edit Profile", page: "profile/edit" },
    { icon: Bookmark, label: "Bookmarks", page: "bookmarks" },
    { icon: Settings, label: "Settings", page: "settings" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 space-y-4 max-w-2xl mx-auto"
    >
      {/* Profile Header */}
      <Card className="glass-card border-0 overflow-hidden">
        <div className="h-24 gradient-primary relative">
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <CardContent className="p-6 pt-0 -mt-12 relative">
          <div className="flex items-end gap-4">
            <Avatar className="h-20 w-20 ring-4 ring-[#0F0F1A]">
              <AvatarImage src={studentUser?.avatarUrl} />
              <AvatarFallback className="gradient-primary text-white text-xl">
                {studentUser?.name ? getInitials(studentUser.name) : "S"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-1">
              <h1 className="text-xl font-bold text-white">{studentUser?.name || "Student"}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="gradient-primary text-white border-0 text-[10px]">
                  {studentUser?.role || "Student"}
                </Badge>
                {studentUser?.technology && (
                  <Badge className="bg-white/10 text-white border-0 text-[10px]">
                    {studentUser.technology}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info */}
      <Card className="glass-card border-0">
        <CardContent className="p-4 space-y-1">
          {profileFields.map((field) => (
            <div
              key={field.label}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                <field.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{field.label}</p>
                <p className="text-sm text-white">{field.value || "Not set"}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Menu Items */}
      <Card className="glass-card border-0">
        <CardContent className="p-2">
          {menuItems.map((item) => (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm text-white flex-1 text-left">{item.label}</span>
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
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
