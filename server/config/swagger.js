const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Denti-Choice AI SaaS API',
    version: '1.0.0',
    description: 'API Documentation for Denti-Choice Dental Clinic Management System upgraded with AI and multi-tenant SaaS features.'
  },
  servers: [
    {
      url: '/api',
      description: 'Main API Path'
    }
  ],
  paths: {
    '/ai/booking/chat': {
      post: {
        summary: 'Stream AI booking agent conversational chat',
        description: 'Send messages array to book, reschedule, cancel, or ask FAQs. Returns chunked streaming response.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  messages: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        role: { type: 'string', example: 'user' },
                        content: { type: 'string', example: 'I want to book an appointment with Dr Smith tomorrow.' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Successful stream output' }
        }
      }
    },
    '/ai/doctor/chart': {
      post: {
        summary: 'Generate formal SOAP clinical notes',
        description: 'Converts doctor raw notes dictation into chief complaint, history, diagnosis, etc.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  rawDictation: { type: 'string', example: 'Patient complains of sensitivity in upper left molar. Swollen gum near tooth 14.' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Formatted SOAP JSON chart' }
        }
      }
    },
    '/ai/treatment/plan': {
      post: {
        summary: 'AI Treatment Planning & Pricing',
        description: 'Generates structured treatment plans with timelines and estimated cost breakdowns.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  diagnosis: { type: 'string', example: 'Moderate tooth decay on lower molars' },
                  severity: { type: 'string', example: 'moderate' },
                  patientPreferences: { type: 'string', example: 'wants tooth-colored fillings' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Markdown formatted treatment planner summary' }
        }
      }
    },
    '/ai/dashboard/ask': {
      post: {
        summary: 'Query operational clinic stats with natural language',
        description: 'Ask business questions like: Revenue this month? Cancellations count? or Popular treatment?',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  question: { type: 'string', example: 'How much revenue did we make this month?' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Summarized metric response' }
        }
      }
    },
    '/ai/analytics/predict': {
      get: {
        summary: 'Get predictive stats for clinic',
        description: 'Forecasts upcoming revenue trends, busy days distribution, and patient retention metrics.',
        responses: {
          200: { description: 'Predictive statistical JSON report' }
        }
      }
    }
  }
};

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('📖 Swagger Docs setup at http://localhost:5000/api-docs');
};

module.exports = { setupSwagger };
