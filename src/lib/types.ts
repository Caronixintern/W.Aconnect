export type Role = 'employee' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  team: string;
  avatarUrl?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requestDate: string;
  adminId?: string;
  adminActionDate?: string;
  adminComment?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedToEmployeeId: string;
  assignedToName: string;
  assignedByAdminId: string;
  assignmentDate: string;
  dueDate: string;
  status: 'todo' | 'in-progress' | 'completed' | 'canceled';
  priority: 'low' | 'medium' | 'high';
  completionDate?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
}

export interface Notification {
  id: string;
  recipientEmployeeId?: string;
  recipientAdminId?: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}
