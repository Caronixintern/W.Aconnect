
"use client"

import { useState, useEffect } from "react";
import { User, LeaveRequest, Task, AttendanceRecord } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  CalendarCheck, 
  Clock, 
  ClipboardList, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Search, 
  ArrowLeft, 
  LayoutDashboard, 
  UserCog, 
  Mail, 
  Phone, 
  Image as ImageIcon, 
  Shield, 
  Activity, 
  Trash2, 
  MoreHorizontal 
} from "lucide-react";
import { adminDailyBriefing, AdminDailyBriefingOutput } from "@/ai/flows/admin-daily-briefing-flow";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { EmployeeView } from "./EmployeeView";
import { useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminViewProps {
  currentUser: User;
  users: User[];
  leaveRequests: LeaveRequest[];
  tasks: Task[];
  attendance: AttendanceRecord[];
  onUpdateLeave: (id: string, status: LeaveRequest['status']) => void;
  onAssignTask: (task: any) => void;
  onUpdateTaskStatus: (id: string, status: Task['status']) => void;
  onDeleteTask: (id: string) => void;
}

export function AdminView({ 
  currentUser, 
  users, 
  leaveRequests, 
  tasks, 
  attendance, 
  onUpdateLeave, 
  onAssignTask,
  onUpdateTaskStatus,
  onDeleteTask
}: AdminViewProps) {
  const db = useFirestore();
  const [briefing, setBriefing] = useState<AdminDailyBriefingOutput | null>(null);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedToEmployeeId: '',
    dueDate: '',
    priority: 'medium' as any
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    phone: currentUser.phone,
    avatarUrl: currentUser.avatarUrl || ''
  });

  const employees = users.filter(u => u.role === 'employee');
  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending');

  useEffect(() => {
    generateBriefing();
  }, [tasks.length, leaveRequests.length]);

  const generateBriefing = async () => {
    if (isGeneratingBriefing) return;
    setIsGeneratingBriefing(true);
    try {
      const result = await adminDailyBriefing({
        overdueTasks: tasks
          .filter(t => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date())
          .map(t => ({ 
            id: t.id, 
            title: t.title, 
            dueDate: t.dueDate, 
            assignedTo: users.find(u => u.id === t.assignedToEmployeeId)?.name || 'Unknown' 
          })),
        highPriorityLeaveRequests: leaveRequests
          .filter(l => l.status === 'pending')
          .map(l => ({ 
            id: l.id, 
            employeeName: users.find(u => u.id === l.employeeId)?.name || 'Unknown', 
            startDate: l.startDate, 
            endDate: l.endDate, 
            reason: l.reason, 
            priority: 'High' 
          })),
        attendanceAnomalies: attendance
          .filter(a => a.status === 'late' || a.status === 'absent')
          .map(a => ({ 
            id: a.id, 
            employeeName: users.find(u => u.id === a.employeeId)?.name || 'Unknown', 
            date: a.date, 
            type: a.status.toUpperCase() 
          }))
      });
      setBriefing(result);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Briefing Service Busy",
        description: error.message || "The AI engine is at capacity. Please try again later.",
      });
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.assignedToEmployeeId || !taskForm.dueDate) {
      toast({ title: "Error", description: "Missing required fields.", variant: "destructive" });
      return;
    }
    const assignee = users.find(u => u.id === taskForm.assignedToEmployeeId);
    onAssignTask({
      ...taskForm,
      assignedToName: assignee?.name || 'Unknown',
    });
    setTaskForm({ title: '', description: '', assignedToEmployeeId: '', dueDate: '', priority: 'medium' });
  };

  const handleSaveProfile = () => {
    const names = profileForm.name.trim().split(/\s+/);
    const firstName = names[0] || 'Executive';
    const lastName = names.slice(1).join(' ') || 'Admin';

    const updateData = {
      id: currentUser.id,
      firstName,
      lastName,
      email: currentUser.email,
      phoneNumber: profileForm.phone,
      avatarUrl: profileForm.avatarUrl
    };

    setDocumentNonBlocking(doc(db, 'admins', currentUser.id), updateData, { merge: true });
    setIsEditingProfile(false);
    toast({ title: "Profile Synchronized", description: "Executive credentials have been updated." });
  };

  if (selectedEmployee) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedEmployee(null)} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Managing Dashboard: {selectedEmployee.name}</h1>
            <p className="text-muted-foreground text-sm">Executive Proxy Mode enabled.</p>
          </div>
        </div>
        <EmployeeView 
          user={selectedEmployee} 
          attendance={attendance.filter(a => a.employeeId === selectedEmployee.id)} 
          tasks={tasks.filter(t => t.assignedToEmployeeId === selectedEmployee.id)} 
          leaveRequests={leaveRequests.filter(l => l.employeeId === selectedEmployee.id)}
          onRequestLeave={(req) => {
            toast({ title: "Admin Action", description: "Processing leave request as administrator." });
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Executive Console</h1>
          <p className="text-muted-foreground">Comprehensive oversight and strategic resource management.</p>
        </div>
        <Button onClick={generateBriefing} disabled={isGeneratingBriefing} variant="outline" className="rounded-xl luxury-shadow hover:bg-primary/5">
          <Sparkles className={cn("mr-2 h-4 w-4 text-accent", isGeneratingBriefing && "animate-spin")} />
          Generate AI Intelligence
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none luxury-shadow glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Staff</p>
                <h3 className="text-3xl font-bold">{employees.length}</h3>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl text-primary"><Users className="h-6 w-6" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none luxury-shadow glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <h3 className="text-3xl font-bold">{pendingLeaves.length}</h3>
              </div>
              <div className="p-3 bg-accent/10 rounded-xl text-accent-foreground"><CalendarCheck className="h-6 w-6" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none luxury-shadow glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Tasks</p>
                <h3 className="text-3xl font-bold">{tasks.filter(t => t.status !== 'completed').length}</h3>
              </div>
              <div className="p-3 bg-green-50 rounded-xl text-green-600"><ClipboardList className="h-6 w-6" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none luxury-shadow glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Efficiency Index</p>
                <h3 className="text-3xl font-bold">{(tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length * 100).toFixed(0) : 0)}%</h3>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl text-orange-600"><TrendingUp className="h-6 w-6" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {briefing && (
            <Card className="border-none bg-primary/5 luxury-shadow overflow-hidden">
              <div className="h-1 gold-gradient w-full" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-5 w-5 text-accent" />
                  Executive Intelligence Summary
                </CardTitle>
                <CardDescription>AI-generated priorities and critical updates.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                  {briefing.briefingText}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="employees" className="w-full">
            <TabsList className="bg-white/50 luxury-shadow p-1 rounded-xl">
              <TabsTrigger value="employees" className="rounded-lg">Staff Directory</TabsTrigger>
              <TabsTrigger value="leaves" className="rounded-lg">Leave Requests</TabsTrigger>
              <TabsTrigger value="tasks" className="rounded-lg">Active Projects</TabsTrigger>
              <TabsTrigger value="profile" className="rounded-lg">My Portfolio</TabsTrigger>
            </TabsList>

            <TabsContent value="employees" className="mt-6">
              <Card className="border-none luxury-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search staff members..." className="pl-10 h-11 rounded-xl" />
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Professional Profile</TableHead>
                        <TableHead>Division</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map(emp => (
                        <TableRow key={emp.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border-2 border-primary/10">
                                <img src={emp.avatarUrl} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="font-semibold">{emp.name}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">{emp.id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{emp.team}</TableCell>
                          <TableCell>
                            <p className="text-xs">{emp.email}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" className="rounded-lg h-8 gap-2 hover:bg-primary hover:text-white transition-all" onClick={() => setSelectedEmployee(emp)}>
                              <LayoutDashboard className="h-3 w-3" />
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leaves" className="mt-6">
              <Card className="border-none luxury-shadow">
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Requested Dates</TableHead>
                        <TableHead>Justification</TableHead>
                        <TableHead className="text-right">Decision</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingLeaves.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No pending leave requests at this time.</TableCell>
                        </TableRow>
                      ) : (
                        pendingLeaves.map(leave => (
                          <TableRow key={leave.id}>
                            <TableCell className="font-semibold">
                              {users.find(u => u.id === leave.employeeId)?.name || 'Unknown'}
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{leave.startDate} to {leave.endDate}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{leave.reason}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" className="h-8 rounded-lg bg-green-500 hover:bg-green-600" onClick={() => onUpdateLeave(leave.id, 'approved')}>
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button size="sm" className="h-8 rounded-lg" variant="destructive" onClick={() => onUpdateLeave(leave.id, 'rejected')}>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="mt-6">
              <Card className="border-none luxury-shadow">
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task Title</TableHead>
                        <TableHead>Assignee</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Manage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No tasks assigned yet.</TableCell>
                        </TableRow>
                      ) : (
                        tasks.map(task => (
                          <TableRow key={task.id}>
                            <TableCell className="font-semibold">{task.title}</TableCell>
                            <TableCell>{users.find(u => u.id === task.assignedToEmployeeId)?.name || 'Unknown'}</TableCell>
                            <TableCell className="text-xs">{task.dueDate}</TableCell>
                            <TableCell>
                              <Badge variant={task.status === 'completed' ? 'default' : 'outline'}>{task.status.toUpperCase()}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => onUpdateTaskStatus(task.id, 'todo')}>To Do</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onUpdateTaskStatus(task.id, 'in-progress')}>In Progress</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onUpdateTaskStatus(task.id, 'completed')}>Completed</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onUpdateTaskStatus(task.id, 'canceled')}>Canceled</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => onDeleteTask(task.id)} className="text-destructive">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete Task
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="mt-6 space-y-6">
              <Card className="border-none luxury-shadow overflow-hidden glass-card">
                <div className="h-32 gold-gradient relative">
                  <div className="absolute -bottom-12 left-8">
                    <div className="p-1 bg-white rounded-2xl luxury-shadow">
                      <div className="w-24 h-24 rounded-xl overflow-hidden relative border-2 border-white">
                        <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="rounded-full bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/40"
                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                    >
                      <UserCog className="h-4 w-4 mr-2" />
                      {isEditingProfile ? "Cancel" : "Edit Credentials"}
                    </Button>
                  </div>
                </div>
                <CardContent className="pt-16 pb-8 px-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-8 mb-8">
                    <div className="space-y-1 w-full max-w-md">
                      {isEditingProfile ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">Executive Name</Label>
                            <input 
                              value={profileForm.name} 
                              onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                              className="text-xl font-bold h-11 w-full bg-white/50 border rounded-md px-3"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">Avatar URL</Label>
                            <div className="relative">
                              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                value={profileForm.avatarUrl} 
                                onChange={e => setProfileForm({...profileForm, avatarUrl: e.target.value})}
                                className="pl-10 h-10 bg-white/50"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h2 className="text-3xl font-bold tracking-tight text-primary">{currentUser.name}</h2>
                          <div className="flex items-center gap-2 text-muted-foreground mt-2">
                            <Shield className="h-4 w-4 text-accent" />
                            <Badge variant="outline" className="text-primary border-primary/20">Authorized Executive</Badge>
                          </div>
                        </>
                      )}
                    </div>
                    {isEditingProfile && (
                      <Button onClick={handleSaveProfile} className="w-full md:w-auto luxury-shadow">
                        Synchronize Profile
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-muted rounded-xl text-primary"><Mail className="h-5 w-5" /></div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Professional Email</p>
                          <p className="font-semibold">{currentUser.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-muted rounded-xl text-primary"><Phone className="h-5 w-5" /></div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Secure Line</p>
                          {isEditingProfile ? (
                            <Input 
                              value={profileForm.phone} 
                              onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                              className="h-9 mt-1 bg-white/50"
                            />
                          ) : (
                            <p className="font-semibold">{currentUser.phone || 'Not configured'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <Card className="bg-muted/30 border-none">
                      <CardContent className="pt-6">
                        <h4 className="text-sm font-bold flex items-center gap-2 mb-4">
                          <Activity className="h-4 w-4 text-primary" />
                          Management Activity
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Delegated Tasks</span>
                            <span className="font-bold">{tasks.length}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Decisions Pending</span>
                            <span className="font-bold text-accent-foreground">{pendingLeaves.length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-8">
          <Card className="border-none luxury-shadow h-fit">
            <CardHeader>
              <CardTitle>Delegate Responsibility</CardTitle>
              <CardDescription>Assign new tasks to team members.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTaskSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Task Title</Label>
                  <Input 
                    placeholder="e.g. Q3 Strategic Sync" 
                    value={taskForm.title}
                    onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <Select onValueChange={v => setTaskForm({...taskForm, assignedToEmployeeId: v})} value={taskForm.assignedToEmployeeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Deadline</Label>
                    <Input 
                      type="date"
                      value={taskForm.dueDate}
                      onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select onValueChange={v => setTaskForm({...taskForm, priority: v})} value={taskForm.priority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Objectives</Label>
                  <Textarea 
                    placeholder="Brief description of project goals..." 
                    value={taskForm.description}
                    onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                  />
                </div>
                <Button type="submit" className="w-full h-11 rounded-xl shadow-lg">
                  Assign Responsibility
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
