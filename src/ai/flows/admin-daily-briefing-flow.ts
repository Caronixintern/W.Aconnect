'use server';
/**
 * @fileOverview A Genkit flow for generating a daily briefing for administrators.
 *
 * - adminDailyBriefing - A function that handles the daily briefing generation process.
 * - AdminDailyBriefingInput - The input type for the adminDailyBriefing function.
 * - AdminDailyBriefingOutput - The return type for the adminDailyBriefing function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdminDailyBriefingInputSchema = z.object({
  currentDate: z.string().describe('The current date in a human-readable format.'),
  overdueTasks: z
    .array(
      z.object({
        id: z.string().describe('Unique identifier for the task.'),
        title: z.string().describe('Title or name of the task.'),
        dueDate: z.string().describe('The date the task was due.'),
        assignedTo: z.string().describe('The name of the employee assigned to the task.'),
      })
    )
    .describe('A list of tasks that are currently overdue.'),
  highPriorityLeaveRequests: z
    .array(
      z.object({
        id: z.string().describe('Unique identifier for the leave request.'),
        employeeName: z.string().describe('The name of the employee requesting leave.'),
        startDate: z.string().describe('The start date of the requested leave.'),
        endDate: z.string().describe('The end date of the requested leave.'),
        reason: z.string().describe('The reason provided for the leave.'),
        priority: z.string().describe('The priority level of the leave request (e.g., Urgent, High).'),
      })
    )
    .describe('A list of leave requests marked as high priority.'),
  attendanceAnomalies: z
    .array(
      z.object({
        id: z.string().describe('Unique identifier for the attendance anomaly.'),
        employeeName: z.string().describe('The name of the employee with the anomaly.'),
        date: z.string().describe('The date the anomaly occurred.'),
        type: z
          .string()
          .describe('The type of anomaly (e.g., Late Arrival, Early Departure, Absent).'),
        details: z.string().optional().describe('Additional details about the anomaly.'),
      })
    )
    .describe('A list of detected attendance anomalies.'),
});
export type AdminDailyBriefingInput = z.infer<typeof AdminDailyBriefingInputSchema>;

const AdminDailyBriefingOutputSchema = z.object({
  briefingText: z.string().describe('A daily briefing summary for the administrator.'),
});
export type AdminDailyBriefingOutput = z.infer<typeof AdminDailyBriefingOutputSchema>;

export async function adminDailyBriefing(
  input: Omit<AdminDailyBriefingInput, 'currentDate'>
): Promise<AdminDailyBriefingOutput> {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return adminDailyBriefingFlow({...input, currentDate});
}

const prompt = ai.definePrompt({
  name: 'adminDailyBriefingPrompt',
  input: {schema: AdminDailyBriefingInputSchema},
  output: {schema: AdminDailyBriefingOutputSchema},
  prompt: `You are an AI assistant for an office administrator. Your task is to provide a concise, professional, and action-oriented daily briefing highlighting key activities and critical updates. Focus on overdue tasks, high-priority leave requests, and attendance anomalies. Summarize each section clearly and suggest any immediate actions the administrator might need to take.

Today's Date: {{{currentDate}}}

---
### Overdue Tasks:
{{#if overdueTasks.length}}
{{#each overdueTasks}}
- **Task ID:** {{id}}
  **Title:** "{{title}}"
  **Due Date:** {{dueDate}}
  **Assigned To:** {{assignedTo}}
{{/each}}
{{else}}
No overdue tasks to report.
{{/if}}

---
### High-Priority Leave Requests:
{{#if highPriorityLeaveRequests.length}}
{{#each highPriorityLeaveRequests}}
- **Request ID:** {{id}}
  **Employee:** {{employeeName}}
  **Dates:** {{startDate}} to {{endDate}}
  **Reason:** {{reason}}
  **Priority:** {{priority}}
{{/each}}
{{else}}
No high-priority leave requests requiring immediate attention.
{{/if}}

---
### Attendance Anomalies:
{{#if attendanceAnomalies.length}}
{{#each attendanceAnomalies}}
- **Anomaly ID:** {{id}}
  **Employee:** {{employeeName}}
  **Date:** {{date}}
  **Type:** {{type}}
  {{#if details}}
  **Details:** {{details}}
  {{/if}}
{{/each}}
{{else}}
No attendance anomalies detected.
{{/if}}

---
Based on the above information, generate a comprehensive and action-oriented daily briefing. Your briefing should be structured with clear headings and bullet points for readability. Prioritize the most critical items and suggest any immediate actions the administrator might need to take to resolve or address these issues. If there are no items in a category, explicitly state that there are no updates for that category.
`,
});

const adminDailyBriefingFlow = ai.defineFlow(
  {
    name: 'adminDailyBriefingFlow',
    inputSchema: AdminDailyBriefingInputSchema,
    outputSchema: AdminDailyBriefingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
