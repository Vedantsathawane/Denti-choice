const { z } = require('zod');

const aiValidator = {
  bookingChatSchema: z.object({
    messages: z.array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1, 'Message content cannot be empty')
      })
    ).min(1, 'Messages array must contain at least one message')
  }),

  soapChartSchema: z.object({
    appointmentId: z.union([z.number(), z.string().regex(/^\d+$/).transform(val => parseInt(val))]),
    rawDictation: z.string().optional(),
    pdfUrl: z.string().optional(),
    xrayUrl: z.string().optional()
  }),

  treatmentPlanSchema: z.object({
    diagnosis: z.string().min(2, 'Diagnosis must be specified'),
    severity: z.string().min(2, 'Severity must be specified'),
    patientPreferences: z.string().optional()
  }),

  dashboardAskSchema: z.object({
    question: z.string().min(3, 'Question must be specified')
  }),

  reviewGenerateSchema: z.object({
    patientName: z.string().min(2, 'Patient name is required'),
    doctorName: z.string().min(2, 'Doctor name is required')
  }),

  emailGenerateSchema: z.object({
    type: z.string().min(2, 'Email template type is required'),
    patientName: z.string().min(2, 'Patient name is required'),
    details: z.record(z.any()).optional()
  }),

  notificationAnalyzeSchema: z.object({
    contactId: z.union([z.number(), z.string().regex(/^\d+$/).transform(val => parseInt(val))]).optional(),
    name: z.string().min(2, 'Sender name is required'),
    message: z.string().min(2, 'Message text is required')
  })
};

module.exports = aiValidator;
