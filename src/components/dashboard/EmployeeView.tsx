
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
    toast({ title: "Clocked In", description: `Recorded at ${data.checkInTime}.` });
  };

  const handleClockOut = () => {
    if (!todayRecord) return;
    const checkOutTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    updateDocumentNonBlocking(doc(db, 'employees', user.id, 'attendance', todayRecord.id), { checkOutTime });
    toast({ title: "Clocked Out", description: `Recorded at ${checkOutTime}.` });
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
    toast({ title: "Success", description: "Leave request submitted." });
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
    toast({ title: "Profile Updated", description: "Changes synchronized." });
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-x-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 overflow-hidden border-none luxury-shadow glass-card">
          <div className="h-24 md:h-32 gold-gradient relative">
            <div className="absolute -bottom-8 md:-bottom-12 left-4 md:left-8">
              <div className="p-1 bg-white rounded-2xl luxury-shadow">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-xl overflow-hidden relative border-2 border-white">
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
            <div className="absolute top-3 right-3 flex gap-2">
              {!isEditingProfile ? (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="rounded-full bg-white/20 backdrop-blur-md border-white/30 text-white hover:bg-white/40 h-8 text-[10px] md:text-xs"
                  onClick={() => setIsEditingProfile(true)}
                >
                  <UserCog className="h-3.5 w-3.5 mr-1 md:mr-2" />
                  Edit Portfolio
                </Button>
              ) : (
                <>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="rounded-full bg-green-500/80 backdrop-blur-md border-white/30 text-white hover:bg-green-600 h-8 w-8 p-0"
                    onClick={handleSaveProfile}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="rounded-full bg-red-500/80 backdrop-blur-md border-white/30 text-white hover:bg-red-600 h-8 w-8 p-0"
                    onClick={() => setIsEditingProfile(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
          <CardContent className="pt-10 md:pt-16 pb-6 md:pb-8 px-4 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div className="space-y-1 w-full max-md">
                {isEditingProfile ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">Full Name</Label>
                      <Input value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest">Avatar URL</Label>
                      <Input value={profileForm.avatarUrl} onChange={e => setProfileForm({...profileForm, avatarUrl: e.target.value})} className="h-9 text-[10px]" />
                    </div>
                  </div>
                ) : (
                  <h1 className="text-xl md:text-3xl font-bold tracking-tight text-primary truncate">{user.name}</h1>
                )}
                <div className="flex items-center gap-2 text-muted-foreground text-xs md:text-sm mt-1">
                  <Briefcase className="h-3.5 w-3.5 shrink-0" />
                  {isEditingProfile ? (
                    <Input value={profileForm.team} onChange={e => setProfileForm({...profileForm, team: e.target.value})} className="h-8 text-[10px] md:text-xs flex-1" />
                  ) : (
                    <span className="truncate">{user.team}</span>
                  )}
                  {!isEditingProfile && <Badge variant="outline" className="text-[9px] md:text-[10px] text-primary border-primary/20 shrink-0">Active</Badge>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                <div className="bg-primary/5 rounded-xl p-2 md:p-3 border border-primary/10">
                  <p className="text-[8px] md:text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Leaves</p>
                  <p className="text-sm md:text-xl font-bold text-primary">{approvedLeavesCount}</p>
                </div>
                <div className="bg-accent/10 rounded-xl p-2 md:p-3 border border-accent/20">
                  <p className="text-[8px] md:text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Shift</p>
                  <p className="text-sm md:text-xl font-bold text-accent-foreground">{todayRecord ? "Logged" : "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 md:mt-10">
              {[
                { icon: Hash, label: 'Employee ID', value: user.employeeNumber || 'N/A', field: 'employeeNumber' },
                { icon: Mail, label: 'Email', value: user.email },
                { icon: Phone, label: 'Phone', value: user.phone || 'N/A', field: 'phone' },
                { icon: CalendarIcon, label: 'Joined Date', value: user.dateOfJoining || 'Jan 2023', field: 'dateOfJoining', type: 'date' }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 md:gap-3 min-w-0">
                  <div className="p-1.5 md:p-2 bg-muted rounded-lg text-primary shrink-0"><item.icon className="h-3.5 w-3.5 md:h-4 md:w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                    {isEditingProfile && item.field ? (
                      <Input 
                        type={item.type || 'text'}
                        value={(profileForm as any)[item.field]} 
                        onChange={e => setProfileForm({...profileForm, [item.field as string]: e.target.value})}
                        className="h-7 text-[10px] w-full bg-white/50 mt-0.5"
                      />
                    ) : (
                      <p className="font-medium text-[11px] md:text-sm truncate">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none luxury-shadow glass-card h-fit">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-accent" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 md:p-6 pt-0 md:pt-0">
            {!todayRecord ? (
              <Button onClick={handleClockIn} className="w-full justify-start h-10 md:h-12 rounded-xl text-xs md:text-sm" variant="outline">
                <Clock className="mr-2 h-4 w-4 text-primary" />
                Clock In
              </Button>
            ) : !todayRecord.checkOutTime ? (
              <Button onClick={handleClockOut} className="w-full justify-start h-10 md:h-12 rounded-xl text-xs md:text-sm border-destructive/20" variant="outline">
                <LogOut className="mr-2 h-4 w-4 text-destructive" />
                Clock Out
              </Button>
            ) : (
              <div className="p-3 bg-green-50 rounded-xl border border-green-100 text-center">
                <p className="text-[8px] font-bold text-green-700 uppercase tracking-widest">Shift Completed</p>
                <p className="text-xs text-green-600 mt-1">{todayRecord.checkInTime} - {todayRecord.checkOutTime}</p>
              </div>
            )}
            <Button className="w-full justify-start h-10 md:h-12 rounded-xl text-xs md:text-sm" variant="outline">
              <ClipboardList className="mr-2 h-4 w-4 text-primary" />
              Daily Report
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="w-full">
        <ScrollArea className="w-full pb-2">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 p-1 rounded-xl luxury-shadow h-auto min-h-11">
            <TabsTrigger value="tasks" className="rounded-lg py-1.5 md:py-2 text-xs md:text-sm">Tasks</TabsTrigger>
            <TabsTrigger value="leaves" className="rounded-lg py-1.5 md:py-2 text-xs md:text-sm">Leaves</TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-lg py-1.5 md:py-2 text-xs md:text-sm">Activity</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="tasks" className="mt-4 md:mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {myTasks.length === 0 ? (
              <Card className="col-span-full border-dashed border-2 py-10 text-center text-muted-foreground text-sm">No tasks assigned.</Card>
            ) : (
              myTasks.map(task => (
                <Card 
                  key={task.id} 
                  className="border-none luxury-shadow overflow-hidden group hover:scale-[1.01] transition-transform cursor-pointer"
                  onClick={() => setViewingTask(task)}
                >
                  <div className={cn("h-1 w-full", task.priority === 'high' ? 'bg-destructive' : task.priority === 'medium' ? 'bg-primary' : 'bg-muted')} />
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="text-[8px] uppercase tracking-widest">{task.priority}</Badge>
                      <Badge className={cn("text-[9px] md:text-[10px]", task.status === 'completed' ? 'bg-green-500' : task.status === 'in-progress' ? 'bg-primary' : 'bg-muted text-muted-foreground')}>
                        {task.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-base md:text-lg truncate group-hover:text-primary transition-colors">{task.title}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs">{task.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <CalendarIcon className="h-3 w-3" />
                      <span>Due: {task.dueDate}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="leaves" className="mt-4 md:mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <Card className="border-none luxury-shadow h-fit">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Request Leave</CardTitle>
                <CardDescription className="text-xs">Submit for review.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                <form onSubmit={handleLeaveSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="startDate" className="text-xs">From</Label>
                      <Input id="startDate" type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} className="h-9 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="endDate" className="text-xs">To</Label>
                      <Input id="endDate" type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} className="h-9 text-xs" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="reason" className="text-xs">Reason</Label>
                    <Textarea id="reason" placeholder="..." className="min-h-[80px] text-xs" value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} />
                  </div>
                  <Button type="submit" className="w-full h-10 rounded-xl text-sm">
                    <Send className="mr-2 h-4 w-4" />
                    Submit
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-none luxury-shadow overflow-hidden">
              <CardHeader className="p-4 md:p-6 pb-2">
                <CardTitle className="text-base md:text-lg">History</CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-6 pt-0">
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs px-4">Dates</TableHead>
                        <TableHead className="hidden sm:table-cell text-xs px-4">Reason</TableHead>
                        <TableHead className="text-xs px-4">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myLeaves.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="h-24 text-center text-xs text-muted-foreground">No records.</TableCell></TableRow>
                      ) : (
                        myLeaves.map(leave => (
                          <TableRow key={leave.id}>
                            <TableCell className="text-[10px] md:text-xs font-medium px-4">{leave.startDate} to {leave.endDate}</TableCell>
                            <TableCell className="hidden sm:table-cell text-[10px] md:text-xs max-w-[120px] truncate px-4">{leave.reason}</TableCell>
                            <TableCell className="px-4">
                              <Badge className={cn("text-[9px]", leave.status === 'approved' ? 'bg-green-500' : leave.status === 'rejected' ? 'bg-destructive' : 'bg-primary')}>
                                {leave.status}
                              </Badge>
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
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="mt-4 md:mt-6">
          <Card className="border-none luxury-shadow overflow-hidden">
            <CardHeader className="p-4 md:p-6 pb-2">
              <CardTitle className="text-base md:text-lg">Attendance Log</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 pt-0">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs px-4">Date</TableHead>
                      <TableHead className="text-xs px-4">In</TableHead>
                      <TableHead className="text-xs px-4">Out</TableHead>
                      <TableHead className="text-xs px-4">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myAttendance.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="h-24 text-center text-xs text-muted-foreground">No logs.</TableCell></TableRow>
                    ) : (
                      myAttendance.sort((a,b) => b.date.localeCompare(a.date)).map(record => (
                        <TableRow key={record.id}>
                          <TableCell className="text-[10px] md:text-xs font-medium px-4">{record.date}</TableCell>
                          <TableCell className="text-[10px] md:text-xs px-4">{record.checkInTime}</TableCell>
                          <TableCell className="text-[10px] md:text-xs px-4">{record.checkOutTime || '--'}</TableCell>
                          <TableCell className="px-4">
                            <Badge variant={record.status === 'present' ? 'default' : 'outline'} className={cn("text-[9px]", record.status === 'present' ? 'bg-green-500' : '')}>
                              {record.status}
                            </Badge>
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
      </Tabs>

      <Dialog open={!!viewingTask} onOpenChange={() => setViewingTask(null)}>
        <DialogContent className="max-w-2xl w-[95vw] md:w-full max-h-[90vh] overflow-y-auto p-4 md:p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-[9px] uppercase tracking-widest">{viewingTask?.priority}</Badge>
              <Badge className={cn("text-[10px]", viewingTask?.status === 'completed' ? 'bg-green-500' : 'bg-primary')}>
                {viewingTask?.status?.toUpperCase()}
              </Badge>
            </div>
            <DialogTitle className="text-xl md:text-2xl font-bold text-primary">{viewingTask?.title}</DialogTitle>
            <DialogDescription className="text-xs">
              Assigned: {viewingTask?.assignmentDate ? new Date(viewingTask.assignmentDate).toLocaleDateString() : 'N/A'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 md:mt-6 space-y-4 md:space-y-6">
            <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap text-xs md:text-sm leading-relaxed bg-muted/30 p-3 md:p-4 rounded-xl">
              {viewingTask?.description}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4 md:pt-6 border-t">
              <div className="flex items-center gap-2 text-xs md:text-sm font-semibold">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <span>Due: {viewingTask?.dueDate}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
