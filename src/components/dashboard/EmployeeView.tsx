"use client"

import { useState } from "react";
import { User, AttendanceRecord, Task, LeaveRequest } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, ClipboardList, User as UserIcon, Send, Briefcase, Mail, Phone, Hash } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface EmployeeViewProps {
  user: User;
  attendance: AttendanceRecord[];
  tasks: Task[];
  leaveRequests: LeaveRequest[];
  onRequestLeave: (req: any) => void;
}

export function EmployeeView({ user, attendance, tasks, leaveRequests, onRequestLeave }: EmployeeViewProps) {
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    priority: 'medium' as any
  });

  const myTasks = tasks.filter(t => t.assignedToId === user.id);
  const myAttendance = attendance.filter(a => a.employeeId === user.id);
  const myLeaves = leaveRequests.filter(l => l.employeeId === user.id);

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      toast({ title: "Error", description: "Please fill all fields.", variant: "destructive" });
      return;
    }
    onRequestLeave({
      employeeId: user.id,
      ...leaveForm
    });
    setLeaveForm({ startDate: '', endDate: '', reason: '', priority: 'medium' });
    toast({ title: "Success", description: "Leave request submitted successfully." });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 overflow-hidden border-none luxury-shadow glass-card">
          <div className="h-32 gold-gradient relative">
            <div className="absolute -bottom-12 left-8">
              <div className="p-1 bg-white rounded-2xl luxury-shadow">
                <div className="w-24 h-24 rounded-xl overflow-hidden">
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
          <CardContent className="pt-16 pb-8 px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary">{user.name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Briefcase className="h-4 w-4" />
                  <span>{user.team}</span>
                  <span className="mx-1">•</span>
                  <Badge variant="outline" className="text-primary border-primary/20">Active Employee</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Leave Balance</p>
                  <p className="text-xl font-bold text-primary">12 Days</p>
                </div>
                <div className="bg-accent/10 rounded-xl p-3 border border-accent/20">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Attendance</p>
                  <p className="text-xl font-bold text-accent-foreground">98%</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg text-primary"><Hash className="h-4 w-4" /></div>
                <div><p className="text-xs text-muted-foreground">Employee ID</p><p className="font-medium">{user.id}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg text-primary"><Mail className="h-4 w-4" /></div>
                <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium truncate max-w-[150px]">{user.email}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg text-primary"><Phone className="h-4 w-4" /></div>
                <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{user.phone}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg text-primary"><Calendar className="h-4 w-4" /></div>
                <div><p className="text-xs text-muted-foreground">Joined Date</p><p className="font-medium">Jan 2023</p></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none luxury-shadow glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start h-12 rounded-xl" variant="outline">
              <Clock className="mr-2 h-4 w-4 text-primary" />
              Clock In Now
            </Button>
            <Button className="w-full justify-start h-12 rounded-xl" variant="outline">
              <ClipboardList className="mr-2 h-4 w-4 text-primary" />
              View Daily Report
            </Button>
            <div className="pt-4 border-t">
              <p className="text-sm font-semibold mb-3">Today's Schedule</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Daily Standup</span>
                  <span className="font-medium">09:30 AM</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Design Sync</span>
                  <span className="font-medium">02:00 PM</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-white/50 p-1 rounded-xl luxury-shadow">
          <TabsTrigger value="tasks" className="rounded-lg">My Tasks</TabsTrigger>
          <TabsTrigger value="leaves" className="rounded-lg">Leave Requests</TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-lg">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myTasks.length === 0 ? (
              <Card className="col-span-full border-dashed border-2 bg-transparent">
                <CardContent className="py-12 flex flex-col items-center justify-center text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mb-4 opacity-20" />
                  <p>No tasks assigned to you yet.</p>
                </CardContent>
              </Card>
            ) : (
              myTasks.map(task => (
                <Card key={task.id} className="border-none luxury-shadow overflow-hidden group hover:scale-[1.02] transition-transform">
                  <div className={cn("h-1.5 w-full", task.priority === 'high' ? 'bg-destructive' : task.priority === 'medium' ? 'bg-primary' : 'bg-muted')} />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest">{task.priority}</Badge>
                      <Badge className={cn(task.status === 'completed' ? 'bg-green-500' : task.status === 'in-progress' ? 'bg-primary' : 'bg-muted text-muted-foreground')}>
                        {task.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mt-2 group-hover:text-primary transition-colors">{task.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{task.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <Calendar className="h-4 w-4" />
                      <span>Due: {task.dueDate}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="leaves" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 border-none luxury-shadow h-fit">
              <CardHeader>
                <CardTitle>Request Leave</CardTitle>
                <CardDescription>Submit a new leave application for review.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLeaveSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input 
                        id="startDate" 
                        type="date" 
                        value={leaveForm.startDate} 
                        onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input 
                        id="endDate" 
                        type="date" 
                        value={leaveForm.endDate} 
                        onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea 
                      id="reason" 
                      placeholder="Why are you requesting leave?" 
                      className="min-h-[100px]"
                      value={leaveForm.reason}
                      onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})}
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 rounded-xl shadow-lg hover:shadow-primary/20 transition-all">
                    <Send className="mr-2 h-4 w-4" />
                    Submit Application
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-none luxury-shadow">
              <CardHeader>
                <CardTitle>Request History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dates</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myLeaves.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No leave requests found.</TableCell>
                      </TableRow>
                    ) : (
                      myLeaves.map(leave => (
                        <TableRow key={leave.id}>
                          <TableCell className="font-medium">{leave.startDate} to {leave.endDate}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{leave.reason}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{leave.priority}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              leave.status === 'approved' ? 'bg-green-500' : 
                              leave.status === 'rejected' ? 'bg-destructive' : 'bg-primary'
                            )}>
                              {leave.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <Card className="border-none luxury-shadow">
            <CardHeader>
              <CardTitle>Attendance Record</CardTitle>
              <CardDescription>Overview of your clock-in/out times for this month.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myAttendance.map(record => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.date}</TableCell>
                      <TableCell>{record.clockIn}</TableCell>
                      <TableCell>{record.clockOut || 'Pending'}</TableCell>
                      <TableCell>
                        <Badge variant={record.status === 'present' ? 'default' : 'outline'} className={record.status === 'present' ? 'bg-green-500' : ''}>
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
  );
}
