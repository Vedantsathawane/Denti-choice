import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaHeartbeat, FaMagic, FaMicrophone, FaMicrophoneSlash, FaFilePdf, FaImage, FaSave, FaEdit, FaCheck } from 'react-icons/fa';
import api, { toastError } from '../../services/api';
import Swal from 'sweetalert2';

export default function AIDoctorAssistant() {
  const [appointments, setAppointments] = useState([]);
  const [selectedApptId, setSelectedApptId] = useState('');
  const [selectedAppt, setSelectedAppt] = useState(null);
  
  const [dictationText, setDictationText] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [xrayFile, setXrayFile] = useState(null);
  
  const [pdfUrl, setPdfUrl] = useState('');
  const [xrayUrl, setXrayUrl] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [xrayName, setXrayName] = useState('');

  // Structured record states
  const [recordId, setRecordId] = useState(null);
  const [soapNotes, setSoapNotes] = useState('');
  const [diagnosisSummary, setDiagnosisSummary] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [prescriptionDraft, setPrescriptionDraft] = useState('');
  const [patientSummary, setPatientSummary] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Fetch appointments on mount
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await api.post('/appointments/all', { limit: 50, status: 'confirmed' });
        if (response.data.success) {
          setAppointments(response.data.data || []);
        }
      } catch (err) {
        console.error('Error fetching appointments for assistant:', err);
      }
    };
    fetchAppointments();
  }, []);

  // Fetch existing clinical record when appointment is selected
  useEffect(() => {
    if (!selectedApptId) {
      setSelectedAppt(null);
      resetChartStates();
      return;
    }
    const appt = appointments.find(a => a.id === parseInt(selectedApptId));
    setSelectedAppt(appt || null);

    const fetchExistingRecord = async () => {
      resetChartStates();
      try {
        const response = await api.get(`/ai/doctor/chart/${selectedApptId}`);
        if (response.data.success && response.data.chart) {
          const chart = response.data.chart;
          setRecordId(chart.id);
          setDictationText(chart.raw_dictation || '');
          setPdfUrl(chart.pdf_url || '');
          setXrayUrl(chart.xray_url || '');
          setSoapNotes(chart.soap_notes || '');
          setDiagnosisSummary(chart.diagnosis_summary || '');
          setTreatmentPlan(chart.treatment_plan || '');
          setPrescriptionDraft(chart.prescription_draft || '');
          setPatientSummary(chart.patient_summary || '');
        }
      } catch (err) {
        // 404 is expected if no chart exists yet
        if (err.response?.status !== 404) {
          console.error('Error fetching clinical chart:', err);
        }
      }
    };
    fetchExistingRecord();
  }, [selectedApptId, appointments]);

  const resetChartStates = () => {
    setRecordId(null);
    setDictationText('');
    setPdfUrl('');
    setXrayUrl('');
    setPdfName('');
    setXrayName('');
    setSoapNotes('');
    setDiagnosisSummary('');
    setTreatmentPlan('');
    setPrescriptionDraft('');
    setPatientSummary('');
  };

  // Setup Voice Dictation
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onresult = (e) => {
        let finalTranscript = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalTranscript += e.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setDictationText(prev => {
            const cleanPrev = prev.trim();
            return cleanPrev + (cleanPrev ? ' ' : '') + finalTranscript.trim();
          });
        }
      };
      rec.onerror = (err) => {
        console.error('Dictation error:', err.error);
        if (err.error === 'not-allowed') {
          Swal.fire('Microphone Blocked', 'Please allow microphone access in your browser settings (and ensure you are using localhost or HTTPS).', 'warning');
        }
        setIsListening(false);
      };
      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      Swal.fire('Speech Recognition Missing', 'Voice dictation is only supported in Chrome or Safari.', 'warning');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Speech start error:', err);
      }
    }
  };

  // Document uploader helper
  const handleFileUpload = async (file, fileType) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/ai/doctor/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        if (fileType === 'pdf') {
          setPdfUrl(response.data.filePath);
          setPdfName(response.data.fileName);
        } else {
          setXrayUrl(response.data.filePath);
          setXrayName(response.data.fileName);
        }
        Swal.fire('Uploaded', `${response.data.fileName} uploaded successfully.`, 'success');
      }
    } catch (err) {
      console.error(err);
      toastError('File upload failed.', err);
    }
  };

  // AI chart generation
  const handleGenerate = async () => {
    if (!selectedApptId) {
      Swal.fire('Select Appointment', 'Please pick a patient appointment first.', 'info');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/ai/doctor/chart', {
        appointmentId: selectedApptId,
        rawDictation: dictationText,
        pdfUrl,
        xrayUrl
      });

      if (response.data.success) {
        const chart = response.data.chart;
        setRecordId(chart.id);
        setSoapNotes(chart.soap_notes);
        setDiagnosisSummary(chart.diagnosis_summary);
        setTreatmentPlan(chart.treatment_plan);
        setPrescriptionDraft(chart.prescription_draft);
        setPatientSummary(chart.patient_summary);
        Swal.fire('AI SOAP Chart Generated', 'Medical chart created and saved to database.', 'success');
      }
    } catch (err) {
      console.error(err);
      toastError('AI Chart generation failed.', err);
    } finally {
      setLoading(false);
    }
  };

  // Manual Doctor Save / Edit
  const handleSaveEdits = async () => {
    if (!recordId) return;
    setSaving(true);
    try {
      const response = await api.put(`/ai/doctor/chart/${recordId}`, {
        soap_notes: soapNotes,
        diagnosis_summary: diagnosisSummary,
        treatment_plan: treatmentPlan,
        prescription_draft: prescriptionDraft,
        patient_summary: patientSummary
      });

      if (response.data.success) {
        Swal.fire('Saved', 'Clinical record successfully updated.', 'success');
      }
    } catch (err) {
      console.error(err);
      toastError('Failed to save manual edits.', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950 text-[#0066FF] rounded-2xl">
            <FaHeartbeat size={22} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">AI Doctor Assistant</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Generate structured medical files, treatment timelines, and copy-paste prescriptions.</p>
          </div>
        </div>

        {/* Appointment dropdown selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Active Patient:</span>
          <select
            value={selectedApptId}
            onChange={(e) => setSelectedApptId(e.target.value)}
            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 text-xs font-semibold dark:text-white"
          >
            <option value="">-- Choose Appointment --</option>
            {appointments.map(a => (
              <option key={a.id} value={a.id}>
                {a.patient_name} ({a.appointment_date})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedApptId ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs Section (dictations, uploads) */}
          <div className="space-y-6">
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">1. Doctor Dictation / Symptoms notes</label>
              <div className="relative">
                <textarea
                  value={dictationText}
                  onChange={(e) => setDictationText(e.target.value)}
                  placeholder="Record patient symptoms, diagnoses, cavity numbers, crown options, or drug requests..."
                  className="w-full h-44 bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066FF] dark:text-white"
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`absolute bottom-4 right-4 p-3 rounded-full flex items-center justify-center cursor-pointer shadow-md transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-white dark:bg-gray-850 text-[#0066FF] border border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                  }`}
                  title={isListening ? 'Stop' : 'Voice Dictate'}
                >
                  {isListening ? <FaMicrophoneSlash size={16} /> : <FaMicrophone size={16} />}
                </button>
              </div>
            </div>

            {/* Document attachment files uploads */}
            <div className="grid grid-cols-2 gap-4">
              {/* PDF uploader */}
              <div className="bg-gray-50 dark:bg-gray-850 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <FaFilePdf size={24} className="text-gray-400 mb-2" />
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  {pdfName || (pdfUrl ? 'PDF Attached' : 'Attach Lab PDF')}
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  id="pdf-upload"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files[0], 'pdf')}
                />
                <label
                  htmlFor="pdf-upload"
                  className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-gray-100"
                >
                  Browse PDF
                </label>
              </div>

              {/* X-ray image uploader */}
              <div className="bg-gray-50 dark:bg-gray-850 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <FaImage size={24} className="text-gray-400 mb-2" />
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  {xrayName || (xrayUrl ? 'X-Ray Attached' : 'Attach X-Ray image')}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  id="xray-upload"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files[0], 'xray')}
                />
                <label
                  htmlFor="xray-upload"
                  className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-gray-100"
                >
                  Browse Image
                </label>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-tr from-[#0066FF] to-[#0088FF] text-white font-bold rounded-2xl flex items-center justify-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <FaMagic />
              <span>{loading ? 'Analyzing Clinical Files...' : 'Generate & Save AI SOAP Chart'}</span>
            </button>
          </div>

          {/* Clinical Output display and Doctor Edits Form */}
          <div className="flex flex-col bg-gray-50/50 dark:bg-gray-850/30 border border-gray-150 dark:border-gray-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">2. Medical Chart (Double-click fields to edit)</span>
              {recordId && (
                <button
                  onClick={handleSaveEdits}
                  disabled={saving}
                  className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 cursor-pointer"
                >
                  <FaSave size={10} /> <span>{saving ? 'Saving...' : 'Save Updates'}</span>
                </button>
              )}
            </div>

            {recordId ? (
              <div className="space-y-4 overflow-y-auto max-h-[380px] pr-1">
                {[
                  { label: 'SOAP Notes (Clinical)', val: soapNotes, set: setSoapNotes },
                  { label: 'Diagnosis Summary', val: diagnosisSummary, set: setDiagnosisSummary },
                  { label: 'Treatment Plan Details', val: treatmentPlan, set: setTreatmentPlan },
                  { label: 'Prescription Draft', val: prescriptionDraft, set: setPrescriptionDraft },
                  { label: 'Patient Friendly Summary', val: patientSummary, set: setPatientSummary }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-xl p-3 shadow-xs space-y-1">
                    <span className="text-[10px] font-extrabold text-[#0066FF] uppercase tracking-wider block">{item.label}</span>
                    <textarea
                      value={item.val || ''}
                      onChange={(e) => item.set(e.target.value)}
                      className="w-full bg-transparent border-none text-xs text-gray-700 dark:text-gray-300 resize-none focus:outline-none min-h-[50px] p-0"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <FaMagic size={36} className="text-gray-300 dark:text-gray-700 mb-2 animate-bounce" />
                <p className="text-sm text-gray-400">SOAP structure will render here after clicking "Generate".</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-850 rounded-2xl">
          <p className="text-sm text-gray-400">Please choose a patient appointment at the top right to open clinical chart record.</p>
        </div>
      )}
    </div>
  );
}
