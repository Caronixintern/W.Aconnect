"use client"

import { useState, useEffect } from 'react';
import { MOCK_USERS, MOCK_LEAVE_REQUESTS, MOCK_TASKS, MOCK_ATTENDANCE } from '@/lib/mock-data';
import { User, LeaveRequest, Task, AttendanceRecord, Notification } from '@/lib/types';

export function useOfficeData() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(MOCK_LEAVE_REQUESTS);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  const addNotification = (notif: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotif: Notification = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);
    setHasNewNotification(true);
  };

  const clearNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setHasNewNotification(false);
  };

  const updateLeaveStatus = (id: string, status: LeaveRequest['status']) => {
    setLeaveRequests(prev => prev.map(req => {
      if (req.id === id) {
        const updated = { ...req, status };
        addNotification({
          userId: req.employeeId,
          title: `Leave ${status.toUpperCase()}`,
          message: `Your leave request for ${req.startDate} has been ${status}.`,
          type: 'leave_status'
        });
        return updated;
      }
      return req;
    }));
  };

  const assignTask = (task: Omit<Task, 'id' | 'status'>) => {
    const newTask: Task = {
      ...task,
      id: `task-${Math.random().toString(36).substr(2, 5)}`,
      status: 'todo',
    };
    setTasks(prev => [newTask, ...prev]);
    addNotification({
      userId: task.assignedToId,
      title: 'New Task Assigned',
      message: `You have a new task: ${task.title}`,
      type: 'task_assigned'
    });
  };

  const requestLeave = (request: Omit<LeaveRequest, 'id' | 'status' | 'createdAt' | 'employeeName'>) => {
    const employee = users.find(u => u.id === request.employeeId);
    const newReq: LeaveRequest = {
      ...request,
      id: `leave-${Math.random().toString(36).substr(2, 5)}`,
      status: 'pending',
      employeeName: employee?.name || 'Unknown',
      createdAt: new Date().toISOString(),
    };
    setLeaveRequests(prev => [newReq, ...prev]);
    
    // Notify all admins
    users.filter(u => u.role === 'admin').forEach(admin => {
      addNotification({
        userId: admin.id,
        title: 'New Leave Request',
        message: `${newReq.employeeName} requested leave from ${newReq.startDate}.`,
        type: 'leave_status'
      });
    });
  };

  return {
    users,
    leaveRequests,
    tasks,
    attendance,
    notifications,
    hasNewNotification,
    updateLeaveStatus,
    assignTask,
    requestLeave,
    clearNotifications
  };
}
