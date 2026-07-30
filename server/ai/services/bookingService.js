const DoctorModel = require('../../models/doctorModel');
const { pool } = require('../../config/db');
const { bookingAgentPrompt } = require('../prompts/prompts');
const tools = require('../tools/tools');
const { getStreamingResponse } = require('./openAiService');

const bookingService = {
  chat: async ({ clinicId, messages, onChunk, onFinish }) => {
    try {
      // 1. Fetch clinic details
      let clinicName = 'Denti-Choice';
      const [clinicRows] = await pool.query('SELECT name FROM clinics WHERE id = ?', [clinicId]);
      if (clinicRows.length > 0) {
        clinicName = clinicRows[0].name;
      }

      // 2. Fetch doctors mapped to this clinic
      const [doctorRows] = await pool.query(
        `SELECT d.id, d.name, d.specialization, d.availability 
         FROM doctors d
         JOIN clinic_doctors cd ON d.id = cd.doctor_id
         WHERE cd.clinic_id = ? AND d.is_active = 1`,
        [clinicId]
      );

      // Parse doctor availability arrays
      const doctors = doctorRows.map(doc => {
        let availability = [];
        try {
          availability = typeof doc.availability === 'string' 
            ? JSON.parse(doc.availability) 
            : (doc.availability || []);
        } catch (e) {
          availability = [];
        }
        return {
          id: doc.id,
          name: doc.name,
          specialization: doc.specialization,
          availability
        };
      });

      // 3. Fetch services mapped to this clinic
      const [serviceRows] = await pool.query(
        `SELECT s.id, s.name, s.duration, s.price 
         FROM services s
         JOIN clinic_services cs ON s.id = cs.service_id
         WHERE cs.clinic_id = ? AND s.is_active = 1`,
        [clinicId]
      );

      const services = serviceRows.map(serv => ({
        id: serv.id,
        name: serv.name,
        duration: serv.duration,
        price: serv.price
      }));

      // 4. Construct System Prompt
      const systemPrompt = bookingAgentPrompt(clinicName, doctors, services);

      // 5. Get Streaming AI Response passing the tools & clinicId context
      const fullResponse = await getStreamingResponse({
        clinicId,
        system: systemPrompt,
        messages,
        tools,
        onChunk,
        onFinish
      });

      return fullResponse;
    } catch (error) {
      console.error('bookingService chat error:', error);
      throw error;
    }
  }
};

module.exports = bookingService;
