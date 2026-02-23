
"use client"

import { useState } from "react";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { EmployeeView } from "@/components/dashboard/EmployeeView";
import { AdminView } from "@/components/dashboard/AdminView";
import { useOfficeData } from "@/hooks/use-office-data";
import { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, UserCircle2, ArrowRight } from "lucide-react";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const { 
    users, 
    leaveRequests, 
    tasks, 
    attendance, 
    updateLeaveStatus, 
    assignTask, 
    requestLeave 
  } = useOfficeData();

  const handleLogin = (role: 'employee' | 'admin') => {
    const user = users.find(u => u.role === role);
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen gold-gradient flex flex-col items-center justify-center p-6 bg-fixed bg-cover">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-white space-y-6">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl rotate-3">
              <span className="text-4xl font-black italic">OZ</span>
            </div>
            <h1 className="text-6xl font-black tracking-tight leading-tight">Office<br/><span className="text-accent">Zenith</span></h1>
            <p className="text-xl text-white/80 max-w-md">Experience the pinnacle of luxury office management. Seamlessly track attendance, manage leaves, and coordinate teams.</p>
          </div>

          <div className="space-y-6">
            <Card className="border-none luxury-shadow backdrop-blur-2xl bg-white/90 transform hover:-translate-y-1 transition-transform duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary"><ShieldCheck className="h-6 w-6" /></div>
                  <div>
                    <CardTitle className="text-xl">Executive Portal</CardTitle>
                    <CardDescription>Administrative controls and oversight</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button onClick={() => handleLogin('admin')} className="w-full h-12 rounded-xl text-lg group">
                  Login as Admin
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none luxury-shadow backdrop-blur-2xl bg-white/90 transform hover:-translate-y-1 transition-transform duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-accent/10 rounded-2xl text-accent-foreground"><UserCircle2 className="h-6 w-6" /></div>
                  <div>
                    <CardTitle className="text-xl">Employee Lounge</CardTitle>
                    <CardDescription>Personal dashboard and team sync</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button onClick={() => handleLogin('employee')} variant="secondary" className="w-full h-12 rounded-xl text-lg group">
                  Employee Login
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-sm">
          &copy; 2024 OfficeZenith Luxury Systems. All rights reserved.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <AppNavbar currentUser={currentUser} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-7xl">
        {currentUser.role === 'admin' ? (
          <AdminView 
            users={users} 
            leaveRequests={leaveRequests} 
            tasks={tasks} 
            attendance={attendance}
            onUpdateLeave={updateLeaveStatus}
            onAssignTask={assignTask}
          />
        ) : (
          <EmployeeView 
            user={currentUser} 
            attendance={attendance} 
            tasks={tasks} 
            leaveRequests={leaveRequests}
            onRequestLeave={requestLeave}
          />
        )}
      </main>
    </div>
  );
}
