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
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
            <FaHeartbeat size={20} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 dark:text-white text-base tracking-tight">AI Doctor Assistant</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Generate structured SOAP records, treatment timelines, and prescriptions.</p>
          </div>
        </div>

        {/* Appointment dropdown selector */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Active Patient:</span>
          <select
            value={selectedApptId}
            onChange={(e) => setSelectedApptId(e.target.value)}
            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 text-xs font-semibold dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs Section */}
          <div className="space-y-5">
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">1. Doctor Dictation / Symptoms Notes</label>
              <div className="relative">
                <textarea
                  value={dictationText}
                  onChange={(e) => setDictationText(e.target.value)}
                  placeholder="Record patient symptoms, diagnoses, cavity numbers, crown options, or drug requests..."
                  className="w-full h-44 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:text-white resize-none transition-all"
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`absolute bottom-4 right-4 p-3 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse shadow-red-500/30'
                      : 'bg-white dark:bg-gray-700 text-blue-500 border border-gray-200 dark:border-gray-600 hover:shadow-blue-500/20 hover:scale-110'
                  }`}
                  title={isListening ? 'Stop' : 'Voice Dictate'}
                >
                  {isListening ? <FaMicrophoneSlash size={15} /> : <FaMicrophone size={15} />}
                </button>
              </div>
            </div>

            {/* Document Uploads */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-800/80 border border-dashed border-red-200 dark:border-gray-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center group hover:border-red-400 transition-all">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-950/40 rounded-xl flex items-center justify-center mb-2">
                  <FaFilePdf size={18} className="text-red-500" />
                </div>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-2">
                  {pdfName || (pdfUrl ? '✓ PDF Attached' : 'Attach Lab PDF')}
                </span>
                <input type="file" accept=".pdf" id="pdf-upload" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], 'pdf')} />
                <label htmlFor="pdf-upload" className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-[10px] font-black rounded-lg cursor-pointer hover:bg-red-50 dark:hover:bg-gray-600 transition-all">
                  Browse PDF
                </label>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-800/80 border border-dashed border-indigo-200 dark:border-gray-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center group hover:border-indigo-400 transition-all">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center mb-2">
                  <FaImage size={18} className="text-indigo-500" />
                </div>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-2">
                  {xrayName || (xrayUrl ? '✓ X-Ray Attached' : 'Attach X-Ray Image')}
                </span>
                <input type="file" accept="image/*" id="xray-upload" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], 'xray')} />
                <label htmlFor="xray-upload" className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-[10px] font-black rounded-lg cursor-pointer hover:bg-indigo-50 dark:hover:bg-gray-600 transition-all">
                  Browse Image
                </label>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-[#0066FF] via-[#0077FF] to-[#0088FF] text-white font-black rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.01] disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer text-sm"
            >
              <FaMagic className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Analyzing & Generating...' : '✦ Generate & Save AI SOAP Chart'}</span>
            </button>
          </div>

          {/* Clinical Output Panel */}
          <div className="flex flex-col rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white/40" />
                <span className="text-[10px] font-black text-white/90 uppercase tracking-widest">2. Medical Chart</span>
                <span className="text-[9px] text-white/60 font-semibold">(double-click fields to edit)</span>
              </div>
              {recordId && (
                <button
                  onClick={handleSaveEdits}
                  disabled={saving}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 border border-white/20 text-white text-[10px] font-black rounded-lg flex items-center space-x-1.5 cursor-pointer transition-all"
                >
                  <FaSave size={9} /> <span>{saving ? 'Saving...' : 'Save Updates'}</span>
                </button>
              )}
            </div>

            {/* Panel body */}
            <div className="flex-1 bg-gray-50/50 dark:bg-gray-900/60 p-4">
              {recordId ? (
                <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
                  {[
                    { label: 'SOAP Notes', val: soapNotes, set: setSoapNotes, color: 'text-blue-500' },
                    { label: 'Diagnosis Summary', val: diagnosisSummary, set: setDiagnosisSummary, color: 'text-violet-500' },
                    { label: 'Treatment Plan', val: treatmentPlan, set: setTreatmentPlan, color: 'text-emerald-500' },
                    { label: 'Prescription Draft', val: prescriptionDraft, set: setPrescriptionDraft, color: 'text-orange-500' },
                    { label: 'Patient Summary', val: patientSummary, set: setPatientSummary, color: 'text-pink-500' }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl p-3 shadow-xs space-y-1.5 hover:shadow-md transition-all">
                      <span className={`text-[9px] font-black ${item.color} uppercase tracking-widest block`}>{item.label}</span>
                      <textarea
                        value={item.val || ''}
                        onChange={(e) => item.set(e.target.value)}
                        className="w-full bg-transparent border-none text-xs text-gray-700 dark:text-gray-300 resize-none focus:outline-none min-h-[50px] p-0 leading-relaxed"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10 h-full min-h-[320px]">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-950/40 dark:to-indigo-950/40 flex items-center justify-center mb-4 shadow-inner">
                    <FaMagic size={28} className="text-blue-400 dark:text-blue-500" />
                  </div>
                  <p className="text-sm font-bold text-gray-400 dark:text-gray-500">No chart generated yet</p>
                  <p className="text-xs text-gray-300 dark:text-gray-600 mt-1 max-w-[200px]">Enter notes and click Generate to create a SOAP record.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-gray-800/30 dark:to-gray-800/20 border border-dashed border-blue-100 dark:border-gray-700">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center mx-auto mb-3">
            <FaHeartbeat size={22} className="text-blue-400" />
          </div>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">No Patient Selected</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Choose a confirmed appointment from the dropdown above to open the clinical chart.</p>
        </div>
      )}
    </div>
  );
}

