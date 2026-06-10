"use client";

import { useState } from "react";
import { setAuthToken } from "@/lib/api-client";
import { useStudentStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, Eye, EyeOff, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface LoginFormProps {
  onLogin: () => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const { setStudentUser } = useStudentStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    institute: "",
    technology: "",
    semester: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      const endpoint = isLogin ? "/student/auth/login" : "/student/auth/register";
      const body = isLogin
        ? { email: form.email, password: form.password }
        : form;

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Authentication failed");
      }

      if (data.token) {
        setAuthToken(data.token);
      }

      if (data.user) {
        setStudentUser(data.user);
      }

      toast.success(isLogin ? "Welcome back!" : "Account created successfully!");
      onLogin();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#0F0F1A" }}>
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #3B82F6, transparent)" }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #06B6D4, transparent)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-3 mb-4"
          >
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl font-bold gradient-text">DAKKHO</span>
          </motion.div>
          <p className="text-muted-foreground text-sm">
            Polytechnic Engineering Learning Platform
          </p>
        </div>

        <Card className="glass-card border-white/10 shadow-2xl">
          <CardHeader className="pb-4">
            <div className="flex gap-2 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  isLogin
                    ? "gradient-primary text-white shadow-lg"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  !isLogin
                    ? "gradient-primary text-white shadow-lg"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                Register
              </button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm text-muted-foreground">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter your full name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50 focus:border-blue-500/50 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm text-muted-foreground">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="01XXXXXXXXX"
                      value={form.phone}
                      onChange={handleChange}
                      className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50 focus:border-blue-500/50 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="institute" className="text-sm text-muted-foreground">Institute</Label>
                      <Input
                        id="institute"
                        name="institute"
                        placeholder="Institute name"
                        value={form.institute}
                        onChange={handleChange}
                        className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50 focus:border-blue-500/50 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="technology" className="text-sm text-muted-foreground">Technology</Label>
                      <Input
                        id="technology"
                        name="technology"
                        placeholder="e.g. CSE"
                        value={form.technology}
                        onChange={handleChange}
                        className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50 focus:border-blue-500/50 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="semester" className="text-sm text-muted-foreground">Semester</Label>
                    <Input
                      id="semester"
                      name="semester"
                      placeholder="e.g. 5th"
                      value={form.semester}
                      onChange={handleChange}
                      className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50 focus:border-blue-500/50 focus:ring-blue-500/20"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50 focus:border-blue-500/50 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/50 focus:border-blue-500/50 focus:ring-blue-500/20 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full gradient-primary text-white font-medium h-11 hover:opacity-90 transition-opacity"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isLogin ? "Signing In..." : "Creating Account..."}
                  </>
                ) : (
                  isLogin ? "Sign In" : "Create Account"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to DAKKHO&apos;s Terms of Service
        </p>
      </motion.div>
    </div>
  );
}
