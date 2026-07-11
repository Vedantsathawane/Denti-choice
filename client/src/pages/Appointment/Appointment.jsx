import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { FaCalendarAlt, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaUserMd, FaConciergeBell, FaClock, FaCheckCircle } from 'react-icons/fa';
import { appointmentService, doctorService, serviceService } from '../../services/dataService';
import { useSocketEvent } from '../../hooks/useSocket';
import { TIME_SLOTS, GENDER_OPTIONS } from '../../utils/constants';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatTime } from '../../utils/helpers';

const Appointment = () => {
  const location = useLocation();
  const preselectedDoctorId = location.state?.doctorId ? String(location.state.doctorId) : (new URLSearchParams(location.search).get('doctorId') || '');

  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      doctor_id: preselectedDoctorId
    }
  });
  const watchDoctor = watch('doctor_id');

  useEffect(() => {
    Promise.all([
      doctorService.getAll({ is_active: 1 }),
      serviceService.getAll({ is_active: 1 })
    ]).then(([d, s]) => {
      setDoctors(d.data.data || []);
      setServices(s.data.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (doctors.length > 0 && preselectedDoctorId) {
      setValue('doctor_id', preselectedDoctorId);
    }
  }, [doctors, preselectedDoctorId, setValue]);

  // Fetch available slots when doctor or date changes
  const fetchSlots = useCallback(async () => {
    if (!watchDoctor || !selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    try {
      const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
      const res = await appointmentService.getSlots(watchDoctor, dateStr);
      let fetchedSlots = res.data.data?.slots || [];

      // Disable past slots if booking for today
      const todayStr = dayjs().format('YYYY-MM-DD');
      if (dateStr === todayStr) {
        const currentTime = dayjs().format('HH:mm:ss');
        fetchedSlots = fetchedSlots.map(s => ({
          ...s,
          available: s.available && s.time >= currentTime
        }));
      }
      setSlots(fetchedSlots);
    } catch {
      const todayStr = dayjs().format('YYYY-MM-DD');
      const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
      const currentTime = dayjs().format('HH:mm:ss');
      setSlots(TIME_SLOTS.map(s => ({
        time: s.value,
        available: dateStr === todayStr ? s.value >= currentTime : true
      })));
    } finally {
      setLoadingSlots(false);
    }
  }, [watchDoctor, selectedDate]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  // Real-time slot updates via Socket.IO
  useSocketEvent('slots:updated', useCallback((data) => {
    const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
    if (String(data.doctorId) === String(watchDoctor) && data.date === dateStr) {
      fetchSlots();
    }
  }, [watchDoctor, selectedDate, fetchSlots]));

  const onSubmit = async (data) => {
    if (!selectedSlot) {
      Swal.fire({ icon: 'warning', title: 'Select Time Slot', text: 'Please select an available time slot.', confirmButtonColor: '#0077B6' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...data,
        appointment_date: dayjs(selectedDate).format('YYYY-MM-DD'),
        appointment_time: selectedSlot
      };
      await appointmentService.book(payload);

      setBooked(true);
      toast.success('🎉 Appointment booked successfully!');
      reset();
      setSelectedSlot(null);
    } catch (err) {
      const message = err.response?.data?.message || 'Booking failed';
      if (err.response?.status === 409) {
        Swal.fire({ icon: 'error', title: 'Slot Already Booked', text: message, confirmButtonColor: '#0077B6' });
        fetchSlots();
      } else {
        Swal.fire({ icon: 'error', title: 'Booking Failed', text: message, confirmButtonColor: '#0077B6' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (booked) {
    return (
      <>
        <section className="pt-32 pb-28 gradient-primary relative"><div className="container-custom text-center"><h1 className="text-4xl font-bold text-white">Appointment</h1></div><div className="absolute bottom-0 left-0 right-0"><svg viewBox="0 0 1440 80" fill="none"><path d="M0 80L720 20L1440 80V80H0Z" className="fill-white dark:fill-gray-950" /></svg></div></section>
        <section className="section-padding bg-white dark:bg-gray-950 text-center">
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md mx-auto">
            <FaCheckCircle className="text-7xl text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Booking Confirmed!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Your appointment has been booked successfully. You will receive a confirmation email shortly.</p>
            <button onClick={() => setBooked(false)} className="px-6 py-3 rounded-xl gradient-primary text-white font-semibold">Book Another</button>
          </motion.div>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="pt-32 pb-28 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"><div className="absolute top-0 right-20 w-72 h-72 bg-white rounded-full blur-3xl" /></div>
        <div className="container-custom relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Book Appointment</h1>
            <p className="text-white/80 max-w-xl mx-auto">Schedule your visit in just a few steps. Choose your doctor, pick a date, and select an available time slot.</p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0"><svg viewBox="0 0 1440 80" fill="none"><path d="M0 80L720 20L1440 80V80H0Z" className="fill-white dark:fill-gray-950" /></svg></div>
      </section>

      <section className="section-padding bg-white dark:bg-gray-950 -mt-1">
        <div className="container-custom max-w-5xl">
          <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-5 gap-8">
            {/* Left - Patient Info */}
            <div className="lg:col-span-3 space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><FaUser className="text-primary" /> Patient Information</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                  <input {...register('full_name', { required: 'Full name is required' })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none text-sm transition" placeholder="John Doe" />
                  {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                  <input type="email" {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none text-sm transition" placeholder="john@example.com" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone *</label>
                  <input {...register('phone', { required: 'Phone is required' })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none text-sm transition" placeholder="+1 (555) 000-0000" />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
                  <input type="number" {...register('age', { min: { value: 1, message: 'Invalid age' } })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none text-sm transition" placeholder="25" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                  <select {...register('gender')} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none text-sm transition">
                    <option value="">Select Gender</option>
                    {GENDER_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                  <input {...register('address')} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none text-sm transition" placeholder="123 Main St" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 pt-4"><FaConciergeBell className="text-primary" /> Appointment Details</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Doctor *</label>
                  <select {...register('doctor_id', { required: 'Please select a doctor' })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none text-sm transition">
                    <option value="">Select Doctor</option>
                    {doctors.map(d => <option key={d.id} value={String(d.id)}>{d.name} - {d.specialization}</option>)}
                  </select>
                  {errors.doctor_id && <p className="text-red-500 text-xs mt-1">{errors.doctor_id.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service *</label>
                  <select {...register('service_id', { required: 'Please select a service' })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none text-sm transition">
                    <option value="">Select Service</option>
                    {services.map(s => <option key={s.id} value={String(s.id)}>{s.name} - ${s.price}</option>)}
                  </select>
                  {errors.service_id && <p className="text-red-500 text-xs mt-1">{errors.service_id.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message (Optional)</label>
                <textarea {...register('message')} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none text-sm transition resize-none" placeholder="Any specific concerns or notes..." />
              </div>
            </div>

            {/* Right - Calendar & Slots */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><FaCalendarAlt className="text-primary" /> Select Date</h2>

              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                <Calendar
                  value={selectedDate}
                  onChange={setSelectedDate}
                  minDate={new Date()}
                  className="!w-full !border-0"
                />
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><FaClock className="text-primary" /> Available Time Slots</h2>

              {!watchDoctor ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl text-center">Please select a doctor first to see available slots.</p>
              ) : loadingSlots ? (
                <LoadingSpinner size="sm" />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {slots.map((slot) => {
                    const label = formatTime(slot.time);
                    return (
                      <button
                        type="button"
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot.time)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                          !slot.available
                            ? 'bg-gray-50/50 dark:bg-gray-900/20 text-gray-300 dark:text-gray-600 border border-gray-100 dark:border-gray-800/50 cursor-not-allowed opacity-40'
                            : selectedSlot === slot.time
                            ? 'gradient-primary text-white shadow-md'
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary/10 hover:text-primary border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedSlot && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/10 dark:bg-primary/20 rounded-xl p-4">
                  <p className="text-sm text-primary font-medium">
                    📅 {dayjs(selectedDate).format('MMMM D, YYYY')} at {formatTime(selectedSlot)}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Confirm Booking Button */}
            <div className="lg:col-span-3 mt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl gradient-primary text-white font-bold text-lg hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? <LoadingSpinner size="sm" /> : <><FaCalendarAlt /> Confirm Booking</>}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
};

export default Appointment;
