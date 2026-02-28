
"use client"

import { useState, useEffect } from "react";
import { User, AttendanceRecord, Task, LeaveRequest } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Clock, ClipboardList, Send, Briefcase, Mail, Phone, Hash, UserCog, Check, X, LogOut, Image as ImageIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFirestore, setDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";

interface EmployeeViewProps {
  user: User;
  attendance: AttendanceRecord[];
  tasks: Task[];
  leaveRequests: LeaveRequest[];
  onRequestLeave: (req: any) => void;
}

export function EmployeeView({ user, attendance, tasks, leaveRequests, onRequestLeave }: EmployeeViewProps) {
  const db = useFirestore();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    phone: user.phone,
    team: user.team,
    employeeNumber: user.employeeNumber || '',
    dateOfJoining: user.dateOfJoining || '',
    avatarUrl: user.avatarUrl || ''
  });

  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    priority: 'medium' as any
  });

  useEffect(() => {
    if (!isEditingProfile) {
      setProfileForm({
        name: user.name,
        phone: user.phone,
        team: user.team,
        employeeNumber: user.employeeNumber || '',
        dateOfJoining: user.dateOfJoining || '',
        avatarUrl: user.avatarUrl || ''
      });
    }
  }, [user, isEditingProfile]);

  const myTasks = tasks.filter(t => t.assignedToEmployeeId === user.id);
  const myAttendance = attendance.filter(a => a.employeeId === user.id);
  const myLeaves = leaveRequests.filter(l => l.employeeId === user.id);
  const approvedLeavesCount = myLeaves.filter(l => l.status === 'approved').length;

  const today = new Date().toISOString().split('T')[0];
  const todayRecord = myAttendance.find(a => a.date === today);

  const handleClockIn = () => {
    const attendanceId = `att-${today}-${user.id}`;
    const data = {
      id: attendanceId,
      employeeId: user.id,
      employeeName: user.name,
      date: today,
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'present'
    };
    setDocumentNonBlocking(doc(db, 'employees', user.id, 'attendance', attendanceId), data, { merge: true });
    toast({ title: "Attendance Logged", description: `Executive clock-in recorded at ${data.checkInTime}.` });
  };

  const handleClockOut = () => {
    if (!todayRecord) return;
    const checkOutTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    updateDocumentNonBlocking(doc(db, 'employees', user.id, 'attendance', todayRecord.id), { checkOutTime });
    toast({ title: "Attendance Logged", description: `Executive clock-out recorded at ${checkOutTime}.` });
  };

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

  const handleSaveProfile = () => {
    const names = profileForm.name.trim().split(/\s+/);
    const firstName = names[0] || 'User';
    const lastName = names.slice(1).join(' ') || '';

    const isUserAdmin = user.role === 'admin';
    const collectionName = isUserAdmin ? 'admins' : 'employees';
    const profileRef = doc(db, collectionName, user.id);
    
    const updatedData = {
      id: user.id,
      firstName,
      lastName,
      email: user.email,
      phoneNumber: profileForm.phone,
      avatarUrl: profileForm.avatarUrl,
      ...(isUserAdmin ? {} : {
        teamId: profileForm.team,
        employeeNumber: profileForm.employeeNumber,
        dateOfJoining: profileForm.dateOfJoining,
        leaveBalance: approvedLeavesCount
      })
    };

    setDocumentNonBlocking(profileRef, updatedData, { merge: true });
    setIsEditingProfile(false);
    toast({ title: "Profile Updated", description: "The professional portfolio has been synchronized." });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 overflow-hidden border-none luxury-shadow glass-card">
          <div className="h-32 gold-gradient relative">
            <div className="absolute -bottom-12 left-8">
              <div className="p-1 bg-white rounded-2xl luxury-shadow">
                <div className="w-24 h-24 rounded-xl overflow-hidden relative">
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
            <div className="absolute top-4 right-4">
              {!isEditingProfile ? (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="rounded-full bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/40"
                  onClick={() => setIsEditingProfile(true)}
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  Edit Portfolio
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="rounded-full bg-green-500/80 backdrop-blur-md border-white/30 text-white hover:bg-green-600"
                    onClick={handleSaveProfile}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Save Sync
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="rounded-full bg-red-500/80 backdrop-blur-md border-white/30 text-white hover:bg-red-600"
                    onClick={() => setIsEditingProfile(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <CardContent className="pt-16 pb-8 px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div className="space-y-1 w-full max-md">
                {isEditingProfile ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">Full Name</Label>
                      <Input 
                        value={profileForm.name} 
                        onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                        className="text-xl font-bold h-11 w-full bg-white/50"
                        placeholder="e.g. Julian Sterling"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">Profile Image URL</Label>
                      <div className="relative">
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          value={profileForm.avatarUrl} 
                          onChange={e => setProfileForm({...profileForm, avatarUrl: e.target.value})}
                          className="pl-10 h-10 w-full bg-white/50 text-sm"
                          placeholder="https://example.com/photo.jpg"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <h1 className="text-3xl font-bold tracking-tight text-primary">{user.name}</h1>
                )}
                <div className="flex items-center gap-2 text-muted-foreground mt-2">
                  <Briefcase className="h-4 w-4" />
                  {isEditingProfile ? (
                    <div className="flex-1">
                      <Input 
                        value={profileForm.team} 
                        onChange={e => setProfileForm({...profileForm, team: e.target.value})}
                        className="h-9 text-sm bg-white/50"
                        placeholder="Division/Team Name"
                      />
                    </div>
                  ) : (
                    <span>{user.team}</span>
                  )}
                  {!isEditingProfile && (
                    <>
                      <span className="mx-1">•</span>
                      <Badge variant="outline" className="text-primary border-primary/20">Active {user.role === 'admin' ? 'Executive' : 'Employee'}</Badge>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Approved Leaves</p>
                  <p className="text-xl font-bold text-primary">{approvedLeavesCount} Requests</p>
                </div>
                <div className="bg-accent/10 rounded-xl p-3 border border-accent/20">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Attendance</p>
                  <p className="text-xl font-bold text-accent-foreground">{myAttendance.length > 0 ? "Present" : "Pending"}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg text-primary"><Hash className="h-4 w-4" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Employee ID</p>
                  {isEditingProfile ? (
                    <Input 
                      value={profileForm.employeeNumber} 
                      onChange={e => setProfileForm({...profileForm, employeeNumber: e.target.value})}
                      className="h-8 text-xs max-w-[120px] bg-white/50 mt-1"
                      placeholder="EMP-0000"
                    />
                  ) : (
                    <p className="font-medium truncate max-w-[120px]">{user.employeeNumber || 'Not assigned'}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg text-primary"><Mail className="h-4 w-4" /></div>
                <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium truncate max-w-[150px]">{user.email}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg text-primary"><Phone className="h-4 w-4" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  {isEditingProfile ? (
                    <Input 
                      value={profileForm.phone} 
                      onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                      className="h-8 text-xs max-w-[150px] bg-white/50 mt-1"
                      placeholder="+1 (000) 000-0000"
                    />
                  ) : (
                    <p className="font-medium">{user.phone || 'Not set'}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-muted rounded-lg text-primary"><CalendarIcon className="h-4 w-4" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Joined Date</p>
                  {isEditingProfile ? (
                    <Input 
                      type="date"
                      value={profileForm.dateOfJoining}
                      onChange={e => setProfileForm({...profileForm, dateOfJoining: e.target.value})}
                      className="h-8 text-xs bg-white/50 mt-1"
                    />
                  ) : (
                    <p className="font-medium">{user.dateOfJoining || 'Jan 2023'}</p>
                  )}
                </div>
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
            {!todayRecord ? (
              <Button 
                onClick={handleClockIn}
                className="w-full justify-start h-12 rounded-xl group hover:bg-primary hover:text-white transition-all" 
                variant="outline"
              >
                <Clock className="mr-2 h-4 w-4 text-primary group-hover:text-white" />
                Clock In Now
              </Button>
            ) : !todayRecord.checkOutTime ? (
              <Button 
                onClick={handleClockOut}
                className="w-full justify-start h-12 rounded-xl group hover:bg-destructive hover:text-white transition-all border-destructive/20" 
                variant="outline"
              >
                <LogOut className="mr-2 h-4 w-4 text-destructive group-hover:text-white" />
                Clock Out Now
              </Button>
            ) : (
              <div className="p-4 bg-green-50 rounded-xl border border-green-100 text-center">
                <p className="text-xs font-bold text-green-700 uppercase tracking-widest">Shift Completed</p>
                <p className="text-sm text-green-600 mt-1">{todayRecord.checkInTime} - {todayRecord.checkOutTime}</p>
              </div>
            )}
            
            <Button className="w-full justify-start h-12 rounded-xl" variant="outline" onClick={() => toast({ title: "Daily Report", description: "Executive summary is being prepared." })}>
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
                  <span className="text-muted-foreground">Executive Sync</span>
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
                <Card 
                  key={task.id} 
                  className="border-none luxury-shadow overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer"
                  onClick={() => setViewingTask(task)}
                >
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
                      <CalendarIcon className="h-4 w-4" />
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
                  {myAttendance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No attendance records found.</TableCell>
                    </TableRow>
                  ) : (
                    myAttendance.sort((a,b) => b.date.localeCompare(a.date)).map(record => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.date}</TableCell>
                        <TableCell>{record.checkInTime}</TableCell>
                        <TableCell>{record.checkOutTime || 'Shift in progress'}</TableCell>
                        <TableCell>
                          <Badge variant={record.status === 'present' ? 'default' : 'outline'} className={record.status === 'present' ? 'bg-green-500' : ''}>
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!viewingTask} onOpenChange={() => setViewingTask(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest">{viewingTask?.priority}</Badge>
              <Badge className={cn(
                viewingTask?.status === 'completed' ? 'bg-green-500' : 
                viewingTask?.status === 'in-progress' ? 'bg-primary' : 'bg-muted text-muted-foreground'
              )}>
                {viewingTask?.status?.toUpperCase()}
              </Badge>
            </div>
            <DialogTitle className="text-2xl font-bold text-primary">{viewingTask?.title}</DialogTitle>
            <DialogDescription>
              Assigned on {viewingTask?.assignmentDate ? new Date(viewingTask.assignmentDate).toLocaleDateString() : 'N/A'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-6">
            <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 p-4 rounded-xl">
              {viewingTask?.description}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-6 border-t">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <span>Deadline: {viewingTask?.dueDate}</span>
              </div>
              {viewingTask?.completionDate && (
                <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                  <Check className="h-4 w-4" />
                  <span>Completed: {new Date(viewingTask.completionDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
