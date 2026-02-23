
"use client"

import { useState, useEffect, use } from "react";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { EmployeeView } from "@/components/dashboard/EmployeeView";
import { AdminView } from "@/components/dashboard/AdminView";
import { User as AppUser, LeaveRequest, Task, AttendanceRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, UserCircle2, ArrowRight, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { 
  useAuth, 
  useUser, 
  useFirestore, 
  useDoc, 
  useCollection,
  useMemoFirebase, 
  initiateEmailSignUp, 
  initiateEmailSignIn, 
  setDocumentNonBlocking,
  updateDocumentNonBlocking
} from "@/firebase";
import { doc, collection, query, where, serverTimestamp } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";

export default function Home(props: { params: Promise<any>; searchParams: Promise<any> }) {
  // Unwrap Next.js 15 params/searchParams to avoid "enumerated" errors
  use(props.params);
  use(props.searchParams);

  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const [authMode, setAuthMode] = useState<'initial' | 'employee-options' | 'employee-login' | 'employee-signup' | 'admin-login'>('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Pre-fill admin credentials when switching to admin login
  useEffect(() => {
    if (authMode === 'admin-login') {
      setEmail('qwer@gmail.com');
      setPassword('Dh123@');
    } else if (authMode === 'initial') {
      setEmail('');
      setPassword('');
    }
  }, [authMode]);

  // Real-time data from Firestore
  const adminProfileRef = useMemoFirebase(() => user ? doc(db, 'admins', user.uid) : null, [db, user]);
  const employeeProfileRef = useMemoFirebase(() => user ? doc(db, 'employees', user.uid) : null, [db, user]);
  
  const { data: adminProfile, isLoading: isAdminLoading } = useDoc(adminProfileRef);
  const { data: employeeProfile, isLoading: isEmployeeLoading } = useDoc(employeeProfileRef);

  // Global collections for admin overview
  const employeesQuery = useMemoFirebase(() => query(collection(db, 'employees')), [db]);
  const adminsQuery = useMemoFirebase(() => query(collection(db, 'admins')), [db]);
  const allLeavesQuery = useMemoFirebase(() => query(collection(db, 'leaveRequests')), [db]);
  const allTasksQuery = useMemoFirebase(() => query(collection(db, 'tasks')), [db]);
  const allAttendanceQuery = useMemoFirebase(() => query(collection(db, 'attendance')), [db]);

  const { data: employeesData } = useCollection(employeesQuery);
  const { data: adminsData } = useCollection(adminsQuery);
  const { data: leavesData } = useCollection(allLeavesQuery);
  const { data: tasksData } = useCollection(allTasksQuery);
  const { data: attendanceData } = useCollection(allAttendanceQuery);

  const handleAuth = (mode: 'signin' | 'signup', role: 'employee' | 'admin') => {
    if (!email || !password) {
      toast({ title: "Error", description: "Please enter email and password.", variant: "destructive" });
      return;
    }
    if (mode === 'signup' && !name) {
      toast({ title: "Error", description: "Please enter your full name.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    const authPromise = mode === 'signup' 
      ? initiateEmailSignUp(auth, email, password) 
      : initiateEmailSignIn(auth, email, password);

    authPromise
      .then((userCredential) => {
        if (mode === 'signup' || (mode === 'signin' && role === 'admin' && email === 'qwer@gmail.com')) {
          const profileData = role === 'employee' ? {
            id: userCredential.user.uid,
            firstName: name.split(' ')[0] || 'Employee',
            lastName: name.split(' ').slice(1).join(' ') || 'User',
            employeeNumber: `EMP-${Math.floor(Math.random() * 10000)}`,
            email: email,
            dateOfJoining: new Date().toISOString().split('T')[0],
            leaveBalance: 0,
            teamId: 'General'
          } : {
            id: userCredential.user.uid,
            firstName: name ? name.split(' ')[0] : 'Executive',
            lastName: name ? name.split(' ').slice(1).join(' ') : 'Admin',
            email: email,
            phoneNumber: ''
          };

          const collectionName = role === 'employee' ? 'employees' : 'admins';
          setDocumentNonBlocking(doc(db, collectionName, userCredential.user.uid), profileData, { merge: true });
        }
        setIsProcessing(false);
      })
      .catch((error: any) => {
        toast({ title: "Auth Error", description: error.message, variant: "destructive" });
        setIsProcessing(false);
      });
  };

  const handleSignOut = () => {
    auth.signOut();
    setAuthMode('initial');
    setEmail('');
    setPassword('');
    setName('');
  };

  const updateLeaveStatus = (id: string, status: 'approved' | 'rejected') => {
    // In a real app, you'd update both the global and employee-specific subcollection
    // For this MVP, we update the global one
    updateDocumentNonBlocking(doc(db, 'leaveRequests', id), { status });
    toast({ title: "Status Updated", description: `Request has been ${status}.` });
  };

  const assignTask = (taskData: any) => {
    const taskId = `task-${Date.now()}`;
    const taskRef = doc(db, 'tasks', taskId);
    setDocumentNonBlocking(taskRef, {
      ...taskData,
      id: taskId,
      status: 'todo',
      assignmentDate: new Date().toISOString()
    }, { merge: true });
  };

  const requestLeave = (leaveData: any) => {
    const leaveId = `leave-${Date.now()}`;
    const leaveRef = doc(db, 'leaveRequests', leaveId);
    setDocumentNonBlocking(leaveRef, {
      ...leaveData,
      id: leaveId,
      status: 'pending',
      requestDate: new Date().toISOString()
    }, { merge: true });
  };

  if (isUserLoading || (user && (isAdminLoading || isEmployeeLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    const isActuallyAdmin = !!adminProfile || user.email === 'qwer@gmail.com';
    
    const currentUser: AppUser = {
      id: user.uid,
      name: adminProfile?.firstName ? `${adminProfile.firstName} ${adminProfile.lastName}` : (employeeProfile?.firstName ? `${employeeProfile.firstName} ${employeeProfile.lastName}` : user.email?.split('@')[0] || 'User'),
      email: user.email || '',
      phone: adminProfile?.phoneNumber || employeeProfile?.phoneNumber || '',
      role: isActuallyAdmin ? 'admin' : 'employee',
      team: employeeProfile?.teamId || (isActuallyAdmin ? 'Executive Leadership' : 'General'),
      avatarUrl: `https://picsum.photos/seed/${user.uid}/200/200`
    };

    // Prepare data for views
    const allUsers: AppUser[] = [
      ...(adminsData || []).map(a => ({ id: a.id, name: `${a.firstName} ${a.lastName}`, email: a.email, role: 'admin' as const, team: 'Executive', phone: a.phoneNumber || '' })),
      ...(employeesData || []).map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}`, email: e.email, role: 'employee' as const, team: e.teamId || 'General', phone: e.phoneNumber || '' }))
    ];

    const allLeaves: any[] = (leavesData || []).map(l => ({
      ...l,
      employeeName: allUsers.find(u => u.id === l.employeeId)?.name || 'Unknown'
    }));

    const allTasks: any[] = (tasksData || []).map(t => ({
      ...t,
      assignedToName: allUsers.find(u => u.id === t.assignedToEmployeeId)?.name || 'Unknown'
    }));

    const allAttendance: any[] = (attendanceData || []).map(a => ({
      ...a,
      employeeName: allUsers.find(u => u.id === a.employeeId)?.name || 'Unknown',
      clockIn: a.checkInTime ? new Date(a.checkInTime).toLocaleTimeString() : 'N/A'
    }));

    return (
      <div className="min-h-screen bg-background text-foreground pb-20">
        <AppNavbar currentUser={currentUser} onLogout={handleSignOut} />
        
        <main className="container mx-auto px-4 pt-24 pb-12 max-w-7xl">
          {currentUser.role === 'admin' ? (
            <AdminView 
              users={allUsers} 
              leaveRequests={allLeaves} 
              tasks={allTasks} 
              attendance={allAttendance}
              onUpdateLeave={updateLeaveStatus}
              onAssignTask={assignTask}
            />
          ) : (
            <EmployeeView 
              user={currentUser} 
              attendance={allAttendance} 
              tasks={allTasks} 
              leaveRequests={allLeaves}
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
          <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-2xl rotate-3 relative border border-white/20">
            <Image 
              src="https://img.sanishtech.com/u/ceb6a7135c1691ad1881a0eaea4200e9.jpg" 
              alt="Logo" 
              fill
              className="object-cover"
            />
          </div>
          <h1 className="text-6xl font-black tracking-tight leading-tight">Wonderlight<br/><span className="text-accent">Adventure</span></h1>
          <p className="text-xl text-white/80 max-w-md">Experience the pinnacle of luxury office management. Seamlessly track attendance, manage leaves, and coordinate teams.</p>
        </div>

        <div className="space-y-6">
          {authMode === 'admin-login' ? (
            <Card className="border-none luxury-shadow backdrop-blur-2xl bg-white/90 animate-in fade-in slide-in-from-bottom-2">
              <CardHeader>
                <CardTitle>Admin Login</CardTitle>
                <CardDescription>Enter your administrative credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="qwer@gmail.com" />
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
          ) : (
            <>
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
                      Employee Login
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
                      {authMode === 'employee-signup' && (
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Julian Sterling" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="employee@wonderlight.com" />
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
          )}
        </div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-sm">
        &copy; 2024 WonderlightAdventure Luxury Systems. All rights reserved.
      </div>
    </div>
  );
}
