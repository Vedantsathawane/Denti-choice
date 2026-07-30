const { pool } = require('../config/db');

const ClinicalRecordModel = {
  async findByAppointmentId(appointmentId) {
    const [rows] = await pool.query(
      `SELECT cr.*, 
              p.full_name as patient_name,
              d.name as doctor_name
       FROM clinical_records cr
       JOIN patients p ON cr.patient_id = p.id
       JOIN doctors d ON cr.doctor_id = d.id
       WHERE cr.appointment_id = ?`,
      [appointmentId]
    );
    return rows[0] || null;
  },

  async upsert(data) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if record exists
      const [existing] = await connection.query(
        'SELECT id FROM clinical_records WHERE appointment_id = ?',
        [data.appointment_id]
      );

      let recordId;
      if (existing.length > 0) {
        recordId = existing[0].id;
        const fields = [];
        const values = [];
        const allowedFields = [
          'raw_dictation', 'pdf_url', 'xray_url', 'soap_notes', 
          'diagnosis_summary', 'treatment_plan', 'prescription_draft', 'patient_summary'
        ];

        allowedFields.forEach(field => {
          if (data[field] !== undefined) {
            fields.push(`${field} = ?`);
            values.push(data[field]);
          }
        });

        if (fields.length > 0) {
          values.push(recordId);
          await connection.query(
            `UPDATE clinical_records SET ${fields.join(', ')} WHERE id = ?`,
            values
          );
        }
      } else {
        const [insert] = await connection.query(
          `INSERT INTO clinical_records 
            (appointment_id, patient_id, doctor_id, raw_dictation, pdf_url, xray_url, 
             soap_notes, diagnosis_summary, treatment_plan, prescription_draft, patient_summary) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            data.appointment_id, data.patient_id, data.doctor_id, data.raw_dictation || null, 
            data.pdf_url || null, data.xray_url || null, data.soap_notes || null, 
            data.diagnosis_summary || null, data.treatment_plan || null, 
            data.prescription_draft || null, data.patient_summary || null
          ]
        );
        recordId = insert.insertId;
      }

      await connection.commit();
      return recordId;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    const allowedFields = [
      'soap_notes', 'diagnosis_summary', 'treatment_plan', 'prescription_draft', 'patient_summary'
    ];

    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    });

    if (fields.length === 0) return false;
    values.push(id);

    const [result] = await pool.query(
      `UPDATE clinical_records SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  }
};

module.exports = ClinicalRecordModel;
