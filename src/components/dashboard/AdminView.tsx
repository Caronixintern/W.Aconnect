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
import { Users, CalendarCheck, Clock, ClipboardList, TrendingUp, CheckCircle2, XCircle, Sparkles, Plus, Search } from "lucide-react";
import { adminDailyBriefing, AdminDailyBriefingOutput } from "@/ai/flows/admin-daily-briefing-flow";
import { toast } from "@/hooks/use-toast";

interface AdminViewProps {
  users: User[];
  leaveRequests: LeaveRequest[];
  tasks: Task[];
  attendance: AttendanceRecord[];
  onUpdateLeave: (id: string, status: LeaveRequest['status']) => void;
  onAssignTask: (task: any) => void;
}

export function AdminView({ users, leaveRequests, tasks, attendance, onUpdateLeave, onAssignTask }: AdminViewProps) {
  const [briefing, setBriefing] = useState<AdminDailyBriefingOutput | null>(null);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedToId: '',
    dueDate: '',
    priority: 'medium' as any
  });

  const employees = users.filter(u => u.role === 'employee');
  const pendingLeaves = leaveRequests.filter(l => l.status === 'pending');

  useEffect(() => {
    generateBriefing();
  }, []);

  const generateBriefing = async () => {
    setIsGeneratingBriefing(true);
    try {
      const result = await adminDailyBriefing({
        overdueTasks: tasks
          .filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date())
          .map(t => ({ id: t.id, title: t.title, dueDate: t.dueDate, assignedTo: t.assignedToName })),
        highPriorityLeaveRequests: leaveRequests
          .filter(l => l.status === 'pending' && (l.priority === 'high' || l.priority === 'urgent'))
          .map(l => ({ id: l.id, employeeName: l.employeeName, startDate: l.startDate, endDate: l.endDate, reason: l.reason, priority: l.priority })),
        attendanceAnomalies: attendance
          .filter(a => a.status === 'late' || a.status === 'absent')
          .map(a => ({ id: a.id, employeeName: a.employeeName, date: a.date, type: a.status.toUpperCase() }))
      });
      setBriefing(result);
    } catch (error) {
      console.error("Briefing failed", error);
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.assignedToId || !taskForm.dueDate) {
      toast({ title: "Error", description: "Missing required fields.", variant: "destructive" });
      return;
    }
    const assignee = users.find(u => u.id === taskForm.assignedToId);
    onAssignTask({
      ...taskForm,
      assignedToName: assignee?.name || 'Unknown',
      assignedById: 'admin-1' // Mocking logged in admin
    });
    setTaskForm({ title: '', description: '', assignedToId: '', dueDate: '', priority: 'medium' });
    toast({ title: "Task Assigned", description: `Task assigned to ${assignee?.name}` });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Admin Console</h1>
          <p className="text-muted-foreground">Manage employees, tasks, and leave requests.</p>
        </div>
        <Button onClick={generateBriefing} disabled={isGeneratingBriefing} variant="outline" className="rounded-xl luxury-shadow hover:bg-primary/5">
          <Sparkles className={cn("mr-2 h-4 w-4 text-accent", isGeneratingBriefing && "animate-spin")} />
          Refresh AI Briefing
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none luxury-shadow glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
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
                <p className="text-sm text-muted-foreground">Pending Leaves</p>
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
                <p className="text-sm text-muted-foreground">Open Tasks</p>
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
                <p className="text-sm text-muted-foreground">Avg Attendance</p>
                <h3 className="text-3xl font-bold">94%</h3>
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
                  AI Intelligence Briefing
                </CardTitle>
                <CardDescription>Automated insights for today's priorities.</CardDescription>
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
              <TabsTrigger value="employees" className="rounded-lg">Directory</TabsTrigger>
              <TabsTrigger value="attendance" className="rounded-lg">Attendance Logs</TabsTrigger>
              <TabsTrigger value="leaves" className="rounded-lg">Leave Approvals</TabsTrigger>
            </TabsList>

            <TabsContent value="employees" className="mt-6">
              <Card className="border-none luxury-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search employees..." className="pl-10 h-11 rounded-xl" />
                    </div>
                    <Button variant="outline" className="h-11 rounded-xl"><Plus className="mr-2 h-4 w-4" /> Add User</Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map(emp => (
                        <TableRow key={emp.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                                <img src={emp.avatarUrl} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{emp.name}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">{emp.id}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{emp.team}</TableCell>
                          <TableCell>
                            <p className="text-xs">{emp.email}</p>
                            <p className="text-[10px] text-muted-foreground">{emp.phone}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="rounded-lg text-primary">Edit</Button>
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
                        <TableHead>Dates</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingLeaves.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No pending leave requests.</TableCell>
                        </TableRow>
                      ) : (
                        pendingLeaves.map(leave => (
                          <TableRow key={leave.id}>
                            <TableCell className="font-semibold">{leave.employeeName}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{leave.startDate} to {leave.endDate}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{leave.reason}</TableCell>
                            <TableCell><Badge variant="outline">{leave.priority}</Badge></TableCell>
                            <TableCell>
                              <div className="flex gap-2">
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

            <TabsContent value="attendance" className="mt-6">
              <Card className="border-none luxury-shadow">
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Clock In</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.map(record => (
                        <TableRow key={record.id}>
                          <TableCell className="font-semibold text-sm">{record.employeeName}</TableCell>
                          <TableCell className="text-xs">{record.date}</TableCell>
                          <TableCell className="text-xs">{record.clockIn}</TableCell>
                          <TableCell>
                            <Badge className={cn(
                              record.status === 'present' ? 'bg-green-500' :
                              record.status === 'late' ? 'bg-orange-500' : 'bg-destructive'
                            )}>
                              {record.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-8">
          <Card className="border-none luxury-shadow h-fit">
            <CardHeader>
              <CardTitle>Assign New Task</CardTitle>
              <CardDescription>Delegate responsibilities to team members.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTaskSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="taskTitle">Task Title</Label>
                  <Input 
                    id="taskTitle" 
                    placeholder="e.g. Design Sync" 
                    value={taskForm.title}
                    onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignee">Assign To</Label>
                  <Select onValueChange={v => setTaskForm({...taskForm, assignedToId: v})} value={taskForm.assignedToId}>
                    <SelectTrigger id="assignee">
                      <SelectValue placeholder="Select employee" />
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
                    <Label htmlFor="taskDueDate">Due Date</Label>
                    <Input 
                      id="taskDueDate" 
                      type="date" 
                      value={taskForm.dueDate}
                      onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select onValueChange={v => setTaskForm({...taskForm, priority: v})} value={taskForm.priority}>
                      <SelectTrigger id="priority">
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
                  <Label htmlFor="taskDesc">Description</Label>
                  <Textarea 
                    id="taskDesc" 
                    placeholder="Brief description of the work..." 
                    value={taskForm.description}
                    onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                  />
                </div>
                <Button type="submit" className="w-full h-11 rounded-xl shadow-lg">
                  Assign Task
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none luxury-shadow">
            <CardHeader>
              <CardTitle className="text-lg">Recent Activities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {tasks.slice(0, 3).map(task => (
                <div key={task.id} className="flex gap-4 items-start">
                  <div className="p-2 rounded-lg bg-muted text-primary"><Clock className="h-4 w-4" /></div>
                  <div>
                    <p className="text-sm font-semibold">New Task Assigned</p>
                    <p className="text-xs text-muted-foreground">{task.assignedToName} was assigned "{task.title}"</p>
                  </div>
                </div>
              ))}
              {attendance.slice(0, 2).map(record => (
                <div key={record.id} className="flex gap-4 items-start">
                  <div className="p-2 rounded-lg bg-muted text-accent-foreground"><TrendingUp className="h-4 w-4" /></div>
                  <div>
                    <p className="text-sm font-semibold">Attendance Log</p>
                    <p className="text-xs text-muted-foreground">{record.employeeName} clocked in at {record.clockIn}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
