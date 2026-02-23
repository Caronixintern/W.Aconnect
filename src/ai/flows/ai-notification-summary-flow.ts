'use server';
/**
 * @fileOverview A Genkit flow for generating clear, concise, and personalized summaries of notifications using AI.
 *
 * - aiNotificationSummary - A function that handles generating a notification summary.
 * - AiNotificationSummaryInput - The input type for the aiNotificationSummary function.
 * - AiNotificationSummaryOutput - The return type for the aiNotificationSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Specific schemas for different notification detail types
const BaseNotificationDetailsSchema = z.object({
  // Common fields, if any, could go here
});

const LeaveApprovedDetailsSchema = BaseNotificationDetailsSchema.extend({
  leaveStartDate: z.string().describe('The start date of the leave.'),
  leaveEndDate: z.string().describe('The end date of the leave.'),
  adminName: z.string().describe('The name of the admin who approved the leave.'),
  employeeName: z.string().optional().describe('The name of the employee whose leave was approved (for admin recipient).'),
});

const LeaveRejectedDetailsSchema = BaseNotificationDetailsSchema.extend({
  leaveStartDate: z.string().describe('The start date of the leave.'),
  leaveEndDate: z.string().describe('The end date of the leave.'),
  adminName: z.string().describe('The name of the admin who rejected the leave.'),
  employeeName: z.string().optional().describe('The name of the employee whose leave was rejected (for admin recipient).'),
});

const LeavePendingDetailsSchema = BaseNotificationDetailsSchema.extend({
  leaveStartDate: z.string().describe('The start date of the leave.'),
  leaveEndDate: z.string().describe('The end date of the leave.'),
  adminName: z.string().describe('The name of the admin who is reviewing the leave.'),
  employeeName: z.string().optional().describe('The name of the employee whose leave is pending (for admin recipient).'),
});

const LeaveRequestedDetailsSchema = BaseNotificationDetailsSchema.extend({
  employeeName: z.string().describe('The name of the employee who requested the leave.'),
  leaveStartDate: z.string().describe('The start date of the leave.'),
  leaveEndDate: z.string().describe('The end date of the leave.'),
});

const TaskAssignedDetailsSchema = BaseNotificationDetailsSchema.extend({
  assignedToEmployeeName: z.string().describe('The name of the employee to whom the task is assigned.'),
  taskDescription: z.string().describe('A brief description of the assigned task.'),
  assignedByAdminName: z.string().describe('The name of the admin who assigned the task.'),
  dueDate: z.string().describe('The due date for the task.'),
});

const AiNotificationSummaryInputSchema = z.object({
  notificationType: z.enum([
    'leave_approved',
    'leave_rejected',
    'leave_pending',
    'leave_requested',
    'task_assigned',
  ]).describe('The type of notification (e.g., leave_approved, task_assigned).'),
  recipientRole: z.enum(['employee', 'admin']).describe('The role of the recipient (employee or admin) to personalize the summary.'),
  notificationDetails: z.union([
    LeaveApprovedDetailsSchema,
    LeaveRejectedDetailsSchema,
    LeavePendingDetailsSchema,
    LeaveRequestedDetailsSchema,
    TaskAssignedDetailsSchema,
  ]).describe('Specific details relevant to the notification type. The structure depends on `notificationType`.'),
});
export type AiNotificationSummaryInput = z.infer<typeof AiNotificationSummaryInputSchema>;

const AiNotificationSummaryOutputSchema = z.object({
  summary: z.string().describe('A clear, concise, and personalized summary of the notification.'),
});
export type AiNotificationSummaryOutput = z.infer<typeof AiNotificationSummaryOutputSchema>;

export async function aiNotificationSummary(input: AiNotificationSummaryInput): Promise<AiNotificationSummaryOutput> {
  return aiNotificationSummaryFlow(input);
}

const aiNotificationSummaryPrompt = ai.definePrompt({
  name: 'aiNotificationSummaryPrompt',
  input: {schema: AiNotificationSummaryInputSchema},
  output: {schema: AiNotificationSummaryOutputSchema},
  prompt: `You are an AI assistant for an office management system called WonderlightAdventure. Your task is to generate a clear, concise, and personalized summary of a notification for the specified recipient. The summary should be easy to understand at a glance and capture the most important information. Keep the summary under 20 words.\n\nRecipient Role: {{{recipientRole}}}\nNotification Type: {{{notificationType}}}\n\nHere are the details:\n\n{{#eq notificationType "leave_approved"}}\n  {{#eq recipientRole "employee"}}\n    Your leave from {{notificationDetails.leaveStartDate}} to {{notificationDetails.leaveEndDate}} has been APPROVED by {{notificationDetails.adminName}}.\n  {{else}} {{!-- admin recipient --}}\n    Leave for {{notificationDetails.employeeName}} from {{notificationDetails.leaveStartDate}} to {{notificationDetails.leaveEndDate}} was APPROVED.\n  {{/eq}}\n{{/eq}}\n\n{{#eq notificationType "leave_rejected"}}\n  {{#eq recipientRole "employee"}}\n    Your leave from {{notificationDetails.leaveStartDate}} to {{notificationDetails.leaveEndDate}} has been REJECTED by {{notificationDetails.adminName}}.\n  {{else}} {{!-- admin recipient --}}\n    Leave for {{notificationDetails.employeeName}} from {{notificationDetails.leaveStartDate}} to {{notificationDetails.leaveEndDate}} was REJECTED.\n  {{/eq}}\n{{/eq}}\n\n{{#eq notificationType "leave_pending"}}\n  {{#eq recipientRole "employee"}}\n    Your leave request from {{notificationDetails.leaveStartDate}} to {{notificationDetails.leaveEndDate}} is PENDING review by {{notificationDetails.adminName}}.\n  {{else}} {{!-- admin recipient --}}\n    Leave request from {{notificationDetails.employeeName}} for {{notificationDetails.leaveStartDate}} to {{notificationDetails.leaveEndDate}} is PENDING.\n  {{/eq}}\n{{/eq}}\n\n{{#eq notificationType "leave_requested"}}\n  {{#eq recipientRole "employee"}}\n    You requested leave from {{notificationDetails.leaveStartDate}} to {{notificationDetails.leaveEndDate}}. Status is PENDING.\n  {{else}} {{!-- admin recipient --}}\n    New leave request from {{notificationDetails.employeeName}} for {{notificationDetails.leaveStartDate}} to {{notificationDetails.leaveEndDate}}.\n  {{/eq}}\n{{/eq}}\n\n{{#eq notificationType "task_assigned"}}\n  {{#eq recipientRole "employee"}}\n    New task '{{notificationDetails.taskDescription}}' assigned to you by {{notificationDetails.assignedByAdminName}}. Due: {{notificationDetails.dueDate}}.\n  {{else}} {{!-- admin recipient --}}\n    You assigned task '{{notificationDetails.taskDescription}}' to {{notificationDetails.assignedToEmployeeName}}. Due: {{notificationDetails.dueDate}}.\n  {{/eq}}\n{{/eq}}\n\nGenerate the summary in the following JSON format:\n{ "summary": "..." }\n`,
});

const aiNotificationSummaryFlow = ai.defineFlow(
  {
    name: 'aiNotificationSummaryFlow',
    inputSchema: AiNotificationSummaryInputSchema,
    outputSchema: AiNotificationSummaryOutputSchema,
  },
  async (input) => {
    const {output} = await aiNotificationSummaryPrompt(input);
    if (!output) {
      throw new Error('Failed to generate notification summary.');
    }
    return output;
  }
);
