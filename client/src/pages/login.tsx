import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });

  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      return apiRequest("POST", "/api/auth/login", credentials);
    },
    onSuccess: () => {
      toast({
        title: "Login Successful",
        description: "Welcome to your trading dashboard",
      });
      setLocation("/trading");
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: typeof registerForm) => {
      return apiRequest("POST", "/api/auth/register", userData);
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful",
        description: "Your account has been created. Please log in.",
      });
      setRegisterForm({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(loginForm);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.username || !registerForm.email || !registerForm.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate(registerForm);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--trading-dark))] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-[hsl(var(--profit-green))] to-[hsl(var(--info-blue))] rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-chart-line text-2xl text-white"></i>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Deriv Binary Trading</h1>
          <p className="text-gray-400">Professional Binary Options Platform</p>
        </div>

        <Card className="bg-[hsl(var(--trading-slate))] border-[hsl(var(--trading-gray))]">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[hsl(var(--trading-gray))]">
              <TabsTrigger value="login" className="text-white data-[state=active]:bg-[hsl(var(--info-blue))]">Login</TabsTrigger>
              <TabsTrigger value="register" className="text-white data-[state=active]:bg-[hsl(var(--info-blue))]">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <CardHeader>
                <CardTitle className="text-white">Welcome Back</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="username" className="text-white">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                      className="bg-[hsl(var(--trading-gray))] border-[hsl(var(--trading-gray))] text-white"
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password" className="text-white">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      className="bg-[hsl(var(--trading-gray))] border-[hsl(var(--trading-gray))] text-white"
                      placeholder="Enter your password"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="w-full bg-[hsl(var(--profit-green))] hover:bg-green-600 text-white"
                  >
                    {loginMutation.isPending ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="register">
              <CardHeader>
                <CardTitle className="text-white">Create Account</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="reg-username" className="text-white">Username *</Label>
                    <Input
                      id="reg-username"
                      type="text"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
                      className="bg-[hsl(var(--trading-gray))] border-[hsl(var(--trading-gray))] text-white"
                      placeholder="Choose a username"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="reg-email" className="text-white">Email *</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-[hsl(var(--trading-gray))] border-[hsl(var(--trading-gray))] text-white"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="firstName" className="text-white">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={registerForm.firstName}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, firstName: e.target.value }))}
                        className="bg-[hsl(var(--trading-gray))] border-[hsl(var(--trading-gray))] text-white"
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-white">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={registerForm.lastName}
                        onChange={(e) => setRegisterForm(prev => ({ ...prev, lastName: e.target.value }))}
                        className="bg-[hsl(var(--trading-gray))] border-[hsl(var(--trading-gray))] text-white"
                        placeholder="Last name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="reg-password" className="text-white">Password *</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                      className="bg-[hsl(var(--trading-gray))] border-[hsl(var(--trading-gray))] text-white"
                      placeholder="Create a strong password"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="w-full bg-[hsl(var(--info-blue))] hover:bg-blue-600 text-white"
                  >
                    {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>By signing up, you agree to our Terms of Service and Privacy Policy</p>
          <p className="mt-2">App ID: 76613 | Secure Trading Platform</p>
        </div>
      </div>
    </div>
  );
}