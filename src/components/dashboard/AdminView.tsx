
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
  MoreHorizontal,
  BellRing
} from "lucide-react";
import { adminDailyBriefing, AdminDailyBriefingOutput } from "@/ai/flows/admin-daily-briefing-flow";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { EmployeeView } from "./EmployeeView";
import { useFirestore, setDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
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
  onDeleteEmployee: (id: string) => void;
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
  onDeleteTask,
  onDeleteEmployee
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

  // Automated Deadline Reminders Logic
  useEffect(() => {
    if (!tasks || tasks.length === 0) return;

    const checkDeadlinesAndRemind = () => {
      const now = new Date();
      const oneDayInMs = 24 * 60 * 60 * 1000;
      const tomorrow = new Date(now.getTime() + oneDayInMs);

      tasks.forEach(task => {
        // Only remind for incomplete tasks
        if (task.status === 'completed' || task.status === 'canceled') return;
        if (!task.dueDate) return;

        const dueDate = new Date(task.dueDate);
        
        // If due within the next 24 hours
        if (dueDate > now && dueDate <= tomorrow) {
          const reminderId = `deadline-reminder-${task.id}`;
          
          const notifData = {
            id: reminderId,
            recipientEmployeeId: task.assignedToEmployeeId,
            message: `URGENT: Your task "${task.title}" is due within 24 hours (${task.dueDate}).`,
            type: 'task_reminder',
            isRead: false,
            createdAt: new Date().toISOString(),
            relatedEntityId: task.id,
            relatedEntityType: 'Task'
          };

          // Use deterministic ID to prevent multiple reminders for the same task
          setDocumentNonBlocking(
            doc(db, 'employees', task.assignedToEmployeeId, 'notifications', reminderId),
            notifData,
            { merge: true }
          );
        }
      });
    };

    checkDeadlinesAndRemind();
  }, [tasks, db]);

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
      <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500 overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedEmployee(null)} className="rounded-full h-10 w-10 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">Managing: {selectedEmployee.name}</h1>
            <p className="text-muted-foreground text-xs md:text-sm">Executive Proxy Mode enabled.</p>
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
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-x-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Executive Console</h1>
          <p className="text-xs md:text-base text-muted-foreground">Comprehensive oversight and strategic resource management.</p>
        </div>
        <Button onClick={generateBriefing} disabled={isGeneratingBriefing} variant="outline" className="w-full md:w-auto rounded-xl luxury-shadow hover:bg-primary/5 h-11">
          <Sparkles className={cn("mr-2 h-4 w-4 text-accent", isGeneratingBriefing && "animate-spin")} />
          Generate AI Intelligence
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Staff', value: employees.length, icon: Users, bg: 'bg-primary/10', text: 'text-primary' },
          { label: 'Pending Approval', value: pendingLeaves.length, icon: CalendarCheck, bg: 'bg-accent/10', text: 'text-accent-foreground' },
          { label: 'Active Tasks', value: tasks.filter(t => t.status !== 'completed').length, icon: ClipboardList, bg: 'bg-green-50', text: 'text-green-600' },
          { label: 'Efficiency Index', value: `${(tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length * 100).toFixed(0) : 0)}%`, icon: TrendingUp, bg: 'bg-orange-50', text: 'text-orange-600' }
        ].map((stat, i) => (
          <Card key={i} className="border-none luxury-shadow glass-card">
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
                  <h3 className="text-2xl md:text-3xl font-bold">{stat.value}</h3>
                </div>
                <div className={cn("p-2 md:p-3 rounded-xl", stat.bg, stat.text)}><stat.icon className="h-5 w-5 md:h-6 md:w-6" /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8 min-w-0">
          {briefing && (
            <Card className="border-none bg-primary/5 luxury-shadow overflow-hidden">
              <div className="h-1 gold-gradient w-full" />
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-primary text-lg md:text-xl">
                  <Sparkles className="h-5 w-5 text-accent" />
                  Executive Intelligence Summary
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">AI-generated priorities and critical updates.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap text-xs md:text-sm leading-relaxed">
                  {briefing.briefingText}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="employees" className="w-full">
            <ScrollArea className="w-full pb-2">
              <TabsList className="bg-white/50 luxury-shadow p-1 rounded-xl w-full sm:w-auto h-auto min-h-12 flex sm:inline-flex">
                <TabsTrigger value="employees" className="rounded-lg flex-1 sm:flex-none py-2">Directory</TabsTrigger>
                <TabsTrigger value="leaves" className="rounded-lg flex-1 sm:flex-none py-2">Requests</TabsTrigger>
                <TabsTrigger value="tasks" className="rounded-lg flex-1 sm:flex-none py-2">Tasks</TabsTrigger>
                <TabsTrigger value="profile" className="rounded-lg flex-1 sm:flex-none py-2">Me</TabsTrigger>
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            <TabsContent value="employees" className="mt-4 md:mt-6">
              <Card className="border-none luxury-shadow overflow-hidden">
                <CardContent className="p-0 sm:p-6 pt-6">
                  <div className="px-4 sm:px-0 mb-4 sm:mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search staff..." className="pl-10 h-11 rounded-xl" />
                    </div>
                  </div>
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[180px]">Profile</TableHead>
                          <TableHead className="hidden sm:table-cell">Division</TableHead>
                          <TableHead className="hidden md:table-cell">Contact</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employees.map(emp => (
                          <TableRow key={emp.id}>
                            <TableCell>
                              <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-muted overflow-hidden border-2 border-primary/10 shrink-0">
                                  <img src={emp.avatarUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-xs md:text-sm truncate">{emp.name}</p>
                                  <p className="text-[10px] text-muted-foreground font-mono truncate">{emp.id.substring(0,8)}...</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-xs">{emp.team}</TableCell>
                            <TableCell className="hidden md:table-cell text-xs">{emp.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] md:text-xs">Active</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline" className="rounded-lg h-8 px-2 md:px-3 text-xs gap-1 md:gap-2 hover:bg-primary hover:text-white" onClick={() => setSelectedEmployee(emp)}>
                                  <LayoutDashboard className="h-3 w-3" />
                                  <span className="hidden xs:inline">Manage</span>
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" onClick={() => onDeleteEmployee(emp.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leaves" className="mt-4 md:mt-6">
              <Card className="border-none luxury-shadow">
                <CardContent className="p-0 sm:p-6 pt-6">
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead className="hidden sm:table-cell">Reason</TableHead>
                          <TableHead className="text-right">Decision</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingLeaves.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">No pending requests.</TableCell>
                          </TableRow>
                        ) : (
                          pendingLeaves.map(leave => (
                            <TableRow key={leave.id}>
                              <TableCell className="font-semibold text-xs md:text-sm">
                                {users.find(u => u.id === leave.employeeId)?.name || 'Unknown'}
                              </TableCell>
                              <TableCell className="text-[10px] md:text-xs whitespace-nowrap">{leave.startDate} to {leave.endDate}</TableCell>
                              <TableCell className="hidden sm:table-cell text-xs max-w-[150px] truncate">{leave.reason}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-1 md:gap-2 justify-end">
                                  <Button size="sm" className="h-7 w-7 md:h-8 md:w-8 p-0 md:p-1 rounded-lg bg-green-500" onClick={() => onUpdateLeave(leave.id, 'approved')}>
                                    <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                  </Button>
                                  <Button size="sm" className="h-7 w-7 md:h-8 md:w-8 p-0 md:p-1 rounded-lg" variant="destructive" onClick={() => onUpdateLeave(leave.id, 'rejected')}>
                                    <XCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="mt-4 md:mt-6">
              <Card className="border-none luxury-shadow">
                <CardContent className="p-0 sm:p-6 pt-6">
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[120px]">Task</TableHead>
                          <TableHead className="hidden sm:table-cell">Assignee</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasks.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-xs">No tasks yet.</TableCell>
                          </TableRow>
                        ) : (
                          tasks.map(task => (
                            <TableRow key={task.id}>
                              <TableCell className="font-semibold text-xs md:text-sm">{task.title}</TableCell>
                              <TableCell className="hidden sm:table-cell text-xs">{users.find(u => u.id === task.assignedToEmployeeId)?.name || 'Unknown'}</TableCell>
                              <TableCell>
                                <Badge variant={task.status === 'completed' ? 'default' : 'outline'} className="text-[9px] md:text-[10px]">{task.status.toUpperCase()}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={() => onUpdateTaskStatus(task.id, 'todo')}>To Do</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onUpdateTaskStatus(task.id, 'in-progress')}>In Progress</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onUpdateTaskStatus(task.id, 'completed')}>Completed</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDeleteTask(task.id)} className="text-destructive">Delete</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="mt-4 md:mt-6">
              <Card className="border-none luxury-shadow overflow-hidden glass-card">
                <div className="h-24 md:h-32 gold-gradient relative">
                  <div className="absolute -bottom-10 md:-bottom-12 left-4 md:left-8">
                    <div className="p-1 bg-white rounded-2xl luxury-shadow">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden relative border-2 border-white">
                        <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                </div>
                <CardContent className="pt-12 md:pt-16 pb-6 md:pb-8 px-4 md:px-8">
                  <div className="flex flex-col gap-4 border-b pb-6 mb-6">
                    <div className="space-y-1">
                      {isEditingProfile ? (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">Name</Label>
                            <Input value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="h-10 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">Avatar URL</Label>
                            <Input value={profileForm.avatarUrl} onChange={e => setProfileForm({...profileForm, avatarUrl: e.target.value})} className="h-10 text-sm" />
                          </div>
                        </div>
                      ) : (
                        <>
                          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-primary">{currentUser.name}</h2>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Shield className="h-3.5 w-3.5 text-accent" />
                            <Badge variant="outline" className="text-[10px] text-primary border-primary/20">Executive</Badge>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2 w-full">
                      {isEditingProfile ? (
                        <>
                          <Button onClick={handleSaveProfile} className="flex-1 h-10 text-sm">Save Sync</Button>
                          <Button variant="outline" onClick={() => setIsEditingProfile(false)} className="h-10 text-sm">Cancel</Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)} className="w-full md:w-auto rounded-xl">
                          <UserCog className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-xl text-primary"><Mail className="h-4 w-4" /></div>
                        <div className="min-w-0">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Email</p>
                          <p className="font-semibold text-xs md:text-sm truncate">{currentUser.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-xl text-primary"><Phone className="h-4 w-4" /></div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Phone</p>
                          {isEditingProfile ? (
                            <Input value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="h-8 text-xs mt-1" />
                          ) : (
                            <p className="font-semibold text-xs md:text-sm">{currentUser.phone || 'N/A'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <Card className="bg-muted/30 border-none">
                      <CardContent className="p-4">
                        <h4 className="text-xs font-bold flex items-center gap-2 mb-3">
                          <Activity className="h-3.5 w-3.5 text-primary" />
                          Management
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] md:text-xs">
                            <span className="text-muted-foreground">Tasks</span>
                            <span className="font-bold">{tasks.length}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] md:text-xs">
                            <span className="text-muted-foreground">Pending</span>
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

        <div className="space-y-6 md:space-y-8">
          <Card className="border-none luxury-shadow h-fit">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg">Delegate Responsibility</CardTitle>
              <CardDescription className="text-xs">Assign tasks to staff members.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
              <form onSubmit={handleTaskSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Task Title</Label>
                  <Input placeholder="Sync objectives..." value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} className="h-10 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Assignee</Label>
                  <Select onValueChange={v => setTaskForm({...taskForm, assignedToEmployeeId: v})} value={taskForm.assignedToEmployeeId}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Deadline</Label>
                    <Input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} className="h-10 text-sm px-2" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Priority</Label>
                    <Select onValueChange={v => setTaskForm({...taskForm, priority: v})} value={taskForm.priority}>
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Med</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Objectives</Label>
                  <Textarea placeholder="Project details..." value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} className="min-h-[80px] text-sm" />
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
