import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlus, FaSearch, FaEdit, FaTrash, FaCheck, FaTimes, FaDollarSign, FaClock,
  FaTooth, FaSyringe, FaStar, FaTeethOpen, FaCog, FaSmile, FaMagic,
  FaHandHoldingMedical, FaAmbulance, FaChild
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { toastError } from '../../services/api';
import { serviceService } from '../../services/dataService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/helpers';

const AVAILABLE_ICONS = {
  FaTooth: { icon: FaTooth, label: 'Tooth (Teeth Cleaning)' },
  FaSyringe: { icon: FaSyringe, label: 'Syringe (Root Canal)' },
  FaStar: { icon: FaStar, label: 'Star (Teeth Whitening)' },
  FaTeethOpen: { icon: FaTeethOpen, label: 'Teeth Align (Braces)' },
  FaCog: { icon: FaCog, label: 'Gear (Implants)' },
  FaSmile: { icon: FaSmile, label: 'Smile (Designing)' },
  FaMagic: { icon: FaMagic, label: 'Wand (Cosmetics)' },
  FaHandHoldingMedical: { icon: FaHandHoldingMedical, label: 'Hand Support (Extraction)' },
  FaAmbulance: { icon: FaAmbulance, label: 'Ambulance (Emergency)' },
  FaChild: { icon: FaChild, label: 'Child (Pediatric)' }
};

const ServiceManagement = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('30 mins');
  const [price, setPrice] = useState(0);
  const [icon, setIcon] = useState('FaTooth');
  const [isActive, setIsActive] = useState(true);

  const fetchServices = async () => {
    try {
      const res = await serviceService.getAll({ search });
      setServices(res.data.data || []);
    } catch (error) {
      toastError('Failed to load services.', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setDuration('30 mins');
    setPrice(0);
    setIcon('FaTooth');
    setIsActive(true);
    setShowModal(true);
  };

  const handleOpenEdit = (ser) => {
    setEditingService(ser);
    setName(ser.name);
    setDescription(ser.description);
    setDuration(ser.duration);
    setPrice(ser.price);
    setIcon(ser.icon || 'FaTooth');
    setIsActive(ser.is_active === 1);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      name,
      description,
      duration,
      price: parseFloat(price) || 0,
      icon,
      is_active: isActive ? 1 : 0
    };

    try {
      if (editingService) {
        await serviceService.update(editingService.id, data);
        toast.success('Service details updated.');
      } else {
        await serviceService.create(data);
        toast.success('New service added successfully.');
      }
      setShowModal(false);
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    }
  };

  const handleStatusToggle = async (ser) => {
    const nextStatus = ser.is_active === 1 ? 0 : 1;
    try {
      await serviceService.update(ser.id, {
        name: ser.name,
        description: ser.description,
        duration: ser.duration,
        price: ser.price,
        is_active: nextStatus
      });
      toast.success(`Service marked as ${nextStatus === 1 ? 'active' : 'inactive'}`);
      fetchServices();
    } catch {
      toast.error('Failed to change service status.');
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: 'Removing this service will delete it from all client pages.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete service'
    });

    if (confirm.isConfirmed) {
      try {
        await serviceService.delete(id);
        Swal.fire('Deleted!', 'Service has been deleted.', 'success');
        fetchServices();
      } catch {
        toast.error('Failed to delete service.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Service Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Add, edit, or adjust clinical dentistry treatments, durations, and base prices.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl gradient-primary text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all cursor-pointer"
        >
          <FaPlus /> Add New Service
        </button>
      </div>

      {/* Filter/Search Bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search treatments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>
      </div>

      {/* Services List/Grid */}
      {loading ? (
        <div className="py-20"><LoadingSpinner /></div>
      ) : services.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
          <FaTooth className="text-6xl mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No services found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((ser) => {
            const IconWrapper = AVAILABLE_ICONS[ser.icon]?.icon || FaTooth;
            return (
              <div
                key={ser.id}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm relative flex flex-col justify-between"
              >
                {/* Status indicator */}
                <span className={`absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  ser.is_active === 1 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                }`}>
                  {ser.is_active === 1 ? 'Active' : 'Inactive'}
                </span>

                <div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4">
                    <IconWrapper className="text-2xl text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">{ser.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-3 leading-relaxed">{ser.description}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-50 dark:border-gray-800/60 flex flex-col gap-4">
                  {/* Meta stats */}
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5"><FaClock className="text-primary" /> {ser.duration}</span>
                    <span className="flex items-center gap-1.5"><FaDollarSign className="text-success" /> From {formatCurrency(ser.price)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800/50">
                    <button
                      onClick={() => handleStatusToggle(ser)}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                        ser.is_active === 1 ? 'text-danger hover:underline' : 'text-success hover:underline'
                      }`}
                    >
                      {ser.is_active === 1 ? <><FaTimes /> Deactivate</> : <><FaCheck /> Activate</>}
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(ser)}
                        className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 cursor-pointer"
                        title="Edit Service"
                      >
                        <FaEdit className="text-xs" />
                      </button>
                      <button
                        onClick={() => handleDelete(ser.id)}
                        className="p-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 cursor-pointer"
                        title="Delete Service"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form: Create / Edit Service */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
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
                  {editingService ? 'Edit Treatment Details' : 'Add New Dental Service'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-lg cursor-pointer">
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Service Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Teeth Cleaning"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Estimated Duration</label>
                    <input
                      type="text"
                      value={duration}
                      onChange={e => setDuration(e.target.value)}
                      placeholder="e.g. 45 mins"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Starting Price ($)</label>
                    <input
                      type="number"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="e.g. 150"
                      min={0}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Select Icon Representative</label>
                  <select
                    value={icon}
                    onChange={e => setIcon(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    required
                  >
                    {Object.entries(AVAILABLE_ICONS).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Treatment Description</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Enter comprehensive treatment details, procedure notes..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    id="isActiveCheckService"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
                  />
                  <label htmlFor="isActiveCheckService" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                    Service is active & bookable by patients
                  </label>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 cursor-pointer"
                  >
                    {editingService ? 'Save Updates' : 'Add Treatment'}
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

export default ServiceManagement;
