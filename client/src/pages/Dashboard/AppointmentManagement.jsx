import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import {
  FaSearch, FaFilter, FaFileCsv, FaFileExcel, FaPrint, FaEdit,
  FaTrash, FaEye, FaCheck, FaTimes, FaUser, FaClock, FaCalendarAlt,
  FaUndo, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { toastError } from '../../services/api';
import * as XLSX from 'xlsx';
import { appointmentService, doctorService, serviceService } from '../../services/dataService';
import { formatCurrency, formatTime, formatDate } from '../../utils/helpers';
import { STATUS_COLORS, TIME_SLOTS } from '../../utils/constants';
import { useSocket } from '../../hooks/useSocket';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [sort, setSort] = useState('a.id');
  const [order, setOrder] = useState('desc');

  // Master Data (for edit modal & filter dropdowns)
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);

  // Modals state
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [editAppt, setEditAppt] = useState(null);
  const [editSlots, setEditSlots] = useState([]);
  const [editLoadingSlots, setEditLoadingSlots] = useState(false);

  const { socket } = useSocket();

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await appointmentService.getAll({
        search,
        status,
        doctor_id: doctorId,
        date,
        sort,
        order,
        page,
        limit
      });
      setAppointments(res.data.data || []);
      setTotal(res.data.meta?.total || res.data.data?.length || 0);
    } catch (error) {
      toastError('Failed to load appointments.', error);
    } finally {
      setLoading(false);
    }
  }, [search, status, doctorId, date, sort, order, page, limit]);

  const fetchMasterData = async () => {
    try {
      const [docsRes, servsRes] = await Promise.all([
        doctorService.getAll({ is_active: 1 }),
        serviceService.getAll({ is_active: 1 })
      ]);
      setDoctors(docsRes.data.data || []);
      setServices(servsRes.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Socket.IO event listeners
  useEffect(() => {
    if (!socket) return;
    socket.emit('join:appointments');

    const handleUpdate = () => {
      fetchAppointments();
    };

    socket.on('appointment:booked', handleUpdate);
    socket.on('appointment:statusChanged', handleUpdate);

    return () => {
      socket.off('appointment:booked', handleUpdate);
      socket.off('appointment:statusChanged', handleUpdate);
    };
  }, [socket, fetchAppointments]);

  // Fetch available slots for editing
  useEffect(() => {
    if (!editAppt?.doctor_id || !editAppt?.appointment_date) return;

    const fetchSlots = async () => {
      setEditLoadingSlots(true);
      try {
        const res = await appointmentService.getSlots(editAppt.doctor_id, editAppt.appointment_date);
        let slots = res.data.data.slots || [];
        
        // Disable past slots if rescheduling for today
        const todayStr = dayjs().format('YYYY-MM-DD');
        if (editAppt.appointment_date === todayStr) {
          const currentTime = dayjs().format('HH:mm:ss');
          slots = slots.map(s => ({
            ...s,
            available: s.available && s.time >= currentTime
          }));
        }
        setEditSlots(slots);
      } catch (error) {
        toastError('Failed to load doctor slots.', error);
      } finally {
        setEditLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [editAppt?.doctor_id, editAppt?.appointment_date]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setDoctorId('');
    setDate('');
    setSort('a.id');
    setOrder('desc');
    setPage(1);
  };

  // Status Change flow
  const handleStatusChange = async (id, currentStatus, newStatus) => {
    let reason = null;

    if (newStatus === 'cancelled') {
      const { value: cancelReason } = await Swal.fire({
        title: 'Cancel Appointment',
        input: 'text',
        inputLabel: 'Reason for cancellation',
        inputPlaceholder: 'Enter cancellation reason...',
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) return 'You need to write something!';
        },
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#6B7280'
      });

      if (cancelReason === undefined) return; // User pressed cancel
      reason = cancelReason;
    } else {
      const confirmAction = await Swal.fire({
        title: `Confirm status change?`,
        text: `Are you sure you want to mark this appointment as ${newStatus}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#0077B6',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, change status'
      });

      if (!confirmAction.isConfirmed) return;
    }

    try {
      await appointmentService.updateStatus(id, { status: newStatus, reason });
      Swal.fire('Success!', `Appointment status updated to ${newStatus}.`, 'success');
      fetchAppointments();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update status.';
      Swal.fire('Error!', msg, 'error');
    }
  };

  // Edit Appointment flow
  const handleOpenEdit = (appt) => {
    setEditAppt({
      id: appt.id,
      doctor_id: appt.doctor_id,
      service_id: appt.service_id,
      appointment_date: appt.appointment_date.split('T')[0],
      appointment_time: appt.appointment_time,
      message: appt.message || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await appointmentService.update(editAppt.id, editAppt);
      toast.success('Appointment updated successfully.');
      setEditAppt(null);
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update appointment.');
    }
  };

  // Delete Appointment flow
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (confirm.isConfirmed) {
      try {
        await appointmentService.delete(id);
        Swal.fire('Deleted!', 'Appointment has been deleted.', 'success');
        fetchAppointments();
      } catch {
        toast.error('Failed to delete appointment.');
      }
    }
  };

  // Export functions
  const handleExportCSV = () => {
    const headers = ['ID', 'Patient', 'Email', 'Phone', 'Doctor', 'Service', 'Date', 'Time', 'Status'];
    const rows = appointments.map(a => [
      `APT-${String(a.id).padStart(5, '0')}`,
      a.patient_name,
      a.patient_email,
      a.patient_phone,
      a.doctor_name,
      a.service_name,
      a.appointment_date.split('T')[0],
      formatTime(a.appointment_time),
      a.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Appointments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const dataToExport = appointments.map(a => ({
      'Appointment ID': `APT-${String(a.id).padStart(5, '0')}`,
      'Patient Name': a.patient_name,
      'Patient Email': a.patient_email,
      'Patient Phone': a.patient_phone,
      'Doctor': a.doctor_name,
      'Service': a.service_name,
      'Appointment Date': a.appointment_date.split('T')[0],
      'Appointment Time': formatTime(a.appointment_time),
      'Status': a.status.toUpperCase()
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Appointments");
    XLSX.writeFile(workbook, `Appointments_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 print:p-0">
      {/* Header Banner - Hidden on print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Appointment Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">View, schedule, and change clinic appointment records.</p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={handleExportCSV} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <FaFileCsv className="text-primary" /> Export CSV
          </button>
          <button onClick={handleExportExcel} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <FaFileExcel className="text-success" /> Export Excel
          </button>
          <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            <FaPrint className="text-gray-500" /> Print
          </button>
        </div>
      </div>

      {/* Filters Card - Hidden on print */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4 print:hidden">
        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
          <FaFilter className="text-primary" /> Filter Appointments
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search patient, doctor, phone..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>

          {/* Doctor filter */}
          <select
            value={doctorId}
            onChange={e => { setDoctorId(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          >
            <option value="">All Doctors</option>
            {doctors.map(doc => (
              <option key={doc.id} value={doc.id}>{doc.name}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Date Picker */}
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={e => { setDate(e.target.value); setPage(1); }}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
          </div>
        </div>

        {(search || doctorId || status || date) && (
          <button
            onClick={handleResetFilters}
            className="text-xs text-red-500 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <FaUndo className="text-[10px]" /> Reset Filters
          </button>
        )}
      </div>

      {/* Main Table Grid */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden print:border-none print:shadow-none">
        {loading ? (
          <div className="py-20"><LoadingSpinner /></div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <FaCalendarAlt className="text-5xl mx-auto mb-3 text-gray-300" />
            <h3 className="font-semibold text-lg">No Appointments Found</h3>
            <p className="text-sm mt-1">Try adjusting your filters or searches.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  <th className="p-4">Appt ID</th>
                  <th className="p-4">Patient</th>
                  <th className="p-4">Doctor</th>
                  <th className="p-4">Service</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm text-gray-900 dark:text-gray-100">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="p-4 font-mono text-xs font-bold text-gray-500 dark:text-gray-300">
                      APT-{String(appt.id).padStart(5, '0')}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold">{appt.patient_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-300">{appt.patient_phone}</div>
                    </td>
                    <td className="p-4">Dr. {appt.doctor_name.split(' ').pop()}</td>
                    <td className="p-4">
                      <div>{appt.service_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-300 font-medium">{formatCurrency(appt.service_price)}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold flex items-center gap-1"><FaCalendarAlt className="text-primary text-xs shrink-0" /> {appt.appointment_date.split('T')[0]}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-300 flex items-center gap-1"><FaClock className="text-secondary text-xs shrink-0" /> {formatTime(appt.appointment_time)}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                        STATUS_COLORS[appt.status]?.bg} ${STATUS_COLORS[appt.status]?.text} ${STATUS_COLORS[appt.status]?.dark}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1.5 print:hidden shrink-0">
                      {/* Status changes shortcuts */}
                      {appt.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(appt.id, appt.status, 'confirmed')}
                          className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 hover:scale-105 transition-all cursor-pointer"
                          title="Confirm Appointment"
                        >
                          <FaCheck className="text-xs" />
                        </button>
                      )}
                      {appt.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusChange(appt.id, appt.status, 'completed')}
                          className="p-2 bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 rounded-lg hover:bg-sky-100 hover:scale-105 transition-all cursor-pointer"
                          title="Complete Appointment"
                        >
                          <FaCheck className="text-xs" />
                        </button>
                      )}
                      {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                        <button
                          onClick={() => handleStatusChange(appt.id, appt.status, 'cancelled')}
                          className="p-2 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 hover:scale-105 transition-all cursor-pointer"
                          title="Cancel Appointment"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      )}

                      {/* View details */}
                      <button
                        onClick={() => setSelectedAppt(appt)}
                        className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-150 hover:scale-105 transition-all cursor-pointer"
                        title="View Details"
                      >
                        <FaEye className="text-xs" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEdit(appt)}
                        className="p-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 hover:scale-105 transition-all cursor-pointer"
                        title="Edit Schedule"
                      >
                        <FaEdit className="text-xs" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(appt.id)}
                        className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 hover:scale-105 transition-all cursor-pointer"
                        title="Delete Record"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination - Hidden on print */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-800 text-sm print:hidden">
            <span className="text-gray-500 dark:text-gray-400">
              Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total records)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
              >
                <FaChevronLeft className="text-xs" />
              </button>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
              >
                <FaChevronRight className="text-xs" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: View Details */}
      <AnimatePresence>
        {selectedAppt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAppt(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Appointment Details - APT-{String(selectedAppt.id).padStart(5, '0')}
                </h3>
                <button
                  onClick={() => setSelectedAppt(null)}
                  className="text-gray-500 hover:text-gray-700 text-lg cursor-pointer"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Patient section */}
                <div className="space-y-3.5 bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <h4 className="font-bold text-primary flex items-center gap-1.5"><FaUser /> Patient Information</h4>
                  <div className="space-y-1.5 text-sm">
                    <p><span className="text-gray-500 dark:text-gray-400 font-medium">Name:</span> <strong>{selectedAppt.patient_name}</strong></p>
                    <p><span className="text-gray-500 dark:text-gray-400 font-medium">Email:</span> <strong>{selectedAppt.patient_email}</strong></p>
                    <p><span className="text-gray-500 dark:text-gray-400 font-medium">Phone:</span> <strong>{selectedAppt.patient_phone}</strong></p>
                    <p><span className="text-gray-500 dark:text-gray-400 font-medium">Age / Gender:</span> <strong>{selectedAppt.patient_age} yrs / {selectedAppt.patient_gender}</strong></p>
                    <p><span className="text-gray-500 dark:text-gray-400 font-medium">Address:</span> <strong>{selectedAppt.patient_address || 'Not specified'}</strong></p>
                  </div>
                </div>

                {/* Consultation Details */}
                <div className="space-y-3.5 bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <h4 className="font-bold text-secondary flex items-center gap-1.5"><FaCalendarAlt /> Appointment Info</h4>
                  <div className="space-y-1.5 text-sm">
                    <p><span className="text-gray-500 dark:text-gray-400/80">Doctor:</span> <strong>{selectedAppt.doctor_name}</strong></p>
                    <p><span className="text-gray-500 dark:text-gray-400/80">Service:</span> <strong>{selectedAppt.service_name}</strong></p>
                    <p><span className="text-gray-500 dark:text-gray-400/80">Price / Duration:</span> <strong>{formatCurrency(selectedAppt.service_price)} / {selectedAppt.service_duration || '30 mins'}</strong></p>
                    <p><span className="text-gray-500 dark:text-gray-400/80">Date:</span> <strong>{formatDate(selectedAppt.appointment_date)}</strong></p>
                    <p><span className="text-gray-500 dark:text-gray-400/80">Time:</span> <strong>{formatTime(selectedAppt.appointment_time)}</strong></p>
                  </div>
                </div>
              </div>

              {/* Message / Reason */}
              <div className="mt-5 space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                <p className="text-sm">
                  <span className="text-gray-500 font-semibold block mb-1">Patient message:</span>
                  <span className="text-gray-700 dark:text-gray-300 italic">
                    "{selectedAppt.message || 'No message provided'}"
                  </span>
                </p>
                {selectedAppt.status === 'cancelled' && (
                  <p className="text-sm border-t border-gray-100 dark:border-gray-800 pt-2.5">
                    <span className="text-red-500 font-semibold block mb-1">Reason for cancellation:</span>
                    <span className="text-red-700 dark:text-red-400 font-semibold">
                      "{selectedAppt.cancellation_reason || 'No reason provided'}"
                    </span>
                  </p>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedAppt(null)}
                  className="px-6 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-200 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Edit Appointment */}
      <AnimatePresence>
        {editAppt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditAppt(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-xl bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Reschedule Appointment
                </h3>
                <button
                  onClick={() => setEditAppt(null)}
                  className="text-gray-500 hover:text-gray-700 text-lg cursor-pointer"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                {/* Select Doctor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Doctor</label>
                  <select
                    value={editAppt.doctor_id}
                    onChange={e => setEditAppt(prev => ({ ...prev, doctor_id: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    required
                  >
                    {doctors.map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialization})</option>
                    ))}
                  </select>
                </div>

                {/* Select Service */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Service</label>
                  <select
                    value={editAppt.service_id}
                    onChange={e => setEditAppt(prev => ({ ...prev, service_id: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    required
                  >
                    {services.map(ser => (
                      <option key={ser.id} value={ser.id}>{ser.name} - {formatCurrency(ser.price)}</option>
                    ))}
                  </select>
                </div>

                {/* Appointment Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Appointment Date</label>
                  <input
                    type="date"
                    value={editAppt.appointment_date}
                    onChange={e => setEditAppt(prev => ({ ...prev, appointment_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    required
                  />
                </div>

                {/* Appointment Time Slots */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex justify-between items-center">
                    <span>Appointment Time</span>
                    {editLoadingSlots && <span className="text-xs text-gray-400 flex items-center gap-1"><LoadingSpinner size="sm" /> Checking availability...</span>}
                  </label>
                  <select
                    value={editAppt.appointment_time}
                    onChange={e => setEditAppt(prev => ({ ...prev, appointment_time: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    required
                  >
                    <option value="" disabled>-- Select Time Slot --</option>
                    {TIME_SLOTS.map(slot => {
                      const isTaken = editSlots.find(s => s.time === slot.value)?.available === false;
                      // Allow selecting the currently booked slot if it's the one we are editing
                      const isCurrent = slot.value === editAppt.appointment_time;
                      return (
                        <option key={slot.value} value={slot.value} disabled={isTaken && !isCurrent}>
                          {slot.label} {isTaken && !isCurrent ? '(Booked)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Note</label>
                  <textarea
                    rows={3}
                    value={editAppt.message}
                    onChange={e => setEditAppt(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
                    placeholder="Reschedule note..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditAppt(null)}
                    className="px-5 py-2.5 rounded-xl bg-gray-150 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/20 cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppointmentManagement;
