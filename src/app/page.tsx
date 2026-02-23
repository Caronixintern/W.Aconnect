"use client"

import { useState, useEffect } from "react";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { EmployeeView } from "@/components/dashboard/EmployeeView";
import { AdminView } from "@/components/dashboard/AdminView";
import { useOfficeData } from "@/hooks/use-office-data";
import { User as AppUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, UserCircle2, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase, initiateEmailSignUp, initiateEmailSignIn } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

export default function Home() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const [authMode, setAuthMode] = useState<'initial' | 'employee-options' | 'employee-login' | 'employee-signup' | 'admin-login'>('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if current user is admin or employee
  const adminRef = useMemoFirebase(() => user ? doc(db, 'admins', user.uid) : null, [db, user]);
  const employeeRef = useMemoFirebase(() => user ? doc(db, 'employees', user.uid) : null, [db, user]);
  
  const { data: adminProfile, isLoading: isAdminLoading } = useDoc(adminRef);
  const { data: employeeProfile, isLoading: isEmployeeLoading } = useDoc(employeeRef);

  const { 
    leaveRequests, 
    tasks, 
    attendance, 
    updateLeaveStatus, 
    assignTask, 
    requestLeave 
  } = useOfficeData();

  const handleAuth = (mode: 'signin' | 'signup', role: 'employee' | 'admin') => {
    if (!email || !password) {
      toast({ title: "Error", description: "Please enter email and password.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      if (mode === 'signup') {
        initiateEmailSignUp(auth, email, password);
      } else {
        initiateEmailSignIn(auth, email, password);
      }
    } catch (error: any) {
      toast({ title: "Auth Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignOut = () => {
    auth.signOut();
    setAuthMode('initial');
    setEmail('');
    setPassword('');
    setName('');
  };

  if (isUserLoading || isAdminLoading || isEmployeeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    // Bridge real user to AppUser type for components
    const currentUser: AppUser = {
      id: user.uid,
      name: adminProfile?.firstName ? `${adminProfile.firstName} ${adminProfile.lastName}` : (employeeProfile?.firstName ? `${employeeProfile.firstName} ${employeeProfile.lastName}` : user.email?.split('@')[0] || 'User'),
      email: user.email || '',
      phone: adminProfile?.phoneNumber || employeeProfile?.phoneNumber || '',
      role: adminProfile ? 'admin' : 'employee',
      team: employeeProfile?.teamId || 'Executive',
      avatarUrl: `https://picsum.photos/seed/${user.uid}/200/200`
    };

    return (
      <div className="min-h-screen bg-background text-foreground pb-20">
        <AppNavbar currentUser={currentUser} onLogout={handleSignOut} />
        
        <main className="container mx-auto px-4 pt-24 pb-12 max-w-7xl">
          {currentUser.role === 'admin' ? (
            <AdminView 
              users={[]} // Real app would fetch this via useCollection
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
          {/* Admin Portal */}
          {authMode === 'admin-login' ? (
            <Card className="border-none luxury-shadow backdrop-blur-2xl bg-white/90 animate-in fade-in slide-in-from-bottom-2">
              <CardHeader>
                <CardTitle>Admin Login</CardTitle>
                <CardDescription>Enter your administrative credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@officezenith.com" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => handleAuth('signin', 'admin')} disabled={isProcessing} className="w-full h-11">
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                  </Button>
                  <Button variant="ghost" onClick={() => setAuthMode('initial')} className="h-11">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          ) : authMode === 'initial' || authMode === 'employee-options' || authMode === 'employee-login' || authMode === 'employee-signup' ? (
            <>
              {/* Admin Portal Button */}
              {authMode === 'initial' && (
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
                    <Button onClick={() => setAuthMode('admin-login')} className="w-full h-12 rounded-xl text-lg group">
                      Login as Admin
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Employee Lounge */}
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
                  {authMode === 'initial' ? (
                    <Button 
                      onClick={() => setAuthMode('employee-options')} 
                      variant="secondary" 
                      className="w-full h-12 rounded-xl text-lg group"
                    >
                      Employee Access
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  ) : authMode === 'employee-options' ? (
                    <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2">
                      <Button onClick={() => setAuthMode('employee-login')} className="h-11 rounded-xl">
                        Sign In
                      </Button>
                      <Button onClick={() => setAuthMode('employee-signup')} variant="outline" className="h-11 rounded-xl">
                        Sign Up
                      </Button>
                      <Button 
                        onClick={() => setAuthMode('initial')} 
                        variant="ghost" 
                        size="sm" 
                        className="col-span-2 text-xs opacity-50 h-8"
                      >
                        <ArrowLeft className="mr-1 h-3 w-3" />
                        Back
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="employee@officezenith.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button onClick={() => handleAuth(authMode === 'employee-signup' ? 'signup' : 'signin', 'employee')} disabled={isProcessing} className="w-full h-11">
                          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : (authMode === 'employee-signup' ? 'Sign Up' : 'Sign In')}
                        </Button>
                        <Button variant="ghost" onClick={() => setAuthMode('employee-options')} className="h-11">Back</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-sm">
        &copy; 2024 OfficeZenith Luxury Systems. All rights reserved.
      </div>
    </div>
  );
}
