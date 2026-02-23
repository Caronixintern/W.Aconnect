import { User, LeaveRequest, Task, AttendanceRecord, Notification } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'emp-1',
    name: 'Julian Sterling',
    email: 'julian@officezenith.com',
    phone: '+1 (555) 012-3456',
    role: 'employee',
    team: 'Creative Design',
    avatarUrl: 'https://picsum.photos/seed/julian/200/200'
  },
  {
    id: 'emp-2',
    name: 'Elena Vance',
    email: 'elena@officezenith.com',
    phone: '+1 (555) 098-7654',
    role: 'employee',
    team: 'Product Marketing',
    avatarUrl: 'https://picsum.photos/seed/elena/200/200'
  },
  {
    id: 'admin-1',
    name: 'Alexander Knight',
    email: 'alexander@officezenith.com',
    phone: '+1 (555) 234-5678',
    role: 'admin',
    team: 'Executive Leadership',
    avatarUrl: 'https://picsum.photos/seed/alex/200/200'
  }
];

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'leave-1',
    employeeId: 'emp-1',
    employeeName: 'Julian Sterling',
    startDate: '2024-06-15',
    endDate: '2024-06-20',
    reason: 'Family vacation in the Alps',
    status: 'approved',
    priority: 'medium',
    createdAt: '2024-06-01T10:00:00Z'
  },
  {
    id: 'leave-2',
    employeeId: 'emp-2',
    employeeName: 'Elena Vance',
    startDate: '2024-07-01',
    endDate: '2024-07-03',
    reason: 'Professional development workshop',
    status: 'pending',
    priority: 'high',
    createdAt: '2024-06-10T09:30:00Z'
  }
];

export const MOCK_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Q3 Brand Identity Refresh',
    description: 'Lead the visual update for our premium client portfolio.',
    assignedToId: 'emp-1',
    assignedToName: 'Julian Sterling',
    assignedById: 'admin-1',
    dueDate: '2024-06-30',
    status: 'in-progress',
    priority: 'high'
  },
  {
    id: 'task-2',
    title: 'Market Analysis Report',
    description: 'Compile the latest trends in high-end office solutions.',
    assignedToId: 'emp-2',
    assignedToName: 'Elena Vance',
    assignedById: 'admin-1',
    dueDate: '2024-07-15',
    status: 'todo',
    priority: 'medium'
  }
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-1',
    employeeId: 'emp-1',
    employeeName: 'Julian Sterling',
    date: '2024-06-11',
    clockIn: '08:45 AM',
    clockOut: '05:30 PM',
    status: 'present'
  },
  {
    id: 'att-2',
    employeeId: 'emp-2',
    employeeName: 'Elena Vance',
    date: '2024-06-11',
    clockIn: '09:15 AM',
    clockOut: '06:00 PM',
    status: 'late'
  }
];
