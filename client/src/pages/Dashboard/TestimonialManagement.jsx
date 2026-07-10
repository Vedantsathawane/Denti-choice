import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlus, FaSearch, FaEdit, FaTrash, FaCheck, FaTimes, FaStar, FaCamera, FaUserCircle
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { toastError } from '../../services/api';
import { testimonialService } from '../../services/dataService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getApiImageUrl } from '../../utils/helpers';

const TestimonialManagement = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);

  // Form state
  const [patientName, setPatientName] = useState('');
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(5);
  const [isVisible, setIsVisible] = useState(true);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const fetchTestimonials = async () => {
    try {
      const res = await testimonialService.getAll({ search });
      setTestimonials(res.data.data || []);
    } catch (error) {
      toastError('Failed to load testimonials.', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingTestimonial(null);
    setPatientName('');
    setReview('');
    setRating(5);
    setIsVisible(true);
    setPhotoFile(null);
    setPhotoPreview('');
    setShowModal(true);
  };

  const handleOpenEdit = (testi) => {
    setEditingTestimonial(testi);
    setPatientName(testi.patient_name);
    setReview(testi.review);
    setRating(testi.rating);
    setIsVisible(testi.is_visible === 1);
    setPhotoFile(null);
    setPhotoPreview(getApiImageUrl(testi.patient_photo) || '');
    setShowModal(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('patient_name', patientName);
    formData.append('review', review);
    formData.append('rating', rating);
    formData.append('is_visible', isVisible ? 1 : 0);

    if (photoFile) {
      formData.append('patient_photo', photoFile);
    }

    try {
      if (editingTestimonial) {
        await testimonialService.update(editingTestimonial.id, formData);
        toast.success('Testimonial details updated.');
      } else {
        await testimonialService.create(formData);
        toast.success('New testimonial added.');
      }
      setShowModal(false);
      fetchTestimonials();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    }
  };

  const handleVisibilityToggle = async (id) => {
    try {
      await testimonialService.toggleVisibility(id);
      toast.success('Visibility status updated.');
      fetchTestimonials();
    } catch {
      toast.error('Failed to update visibility.');
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this testimonial?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete testimonial'
    });

    if (confirm.isConfirmed) {
      try {
        await testimonialService.delete(id);
        Swal.fire('Deleted!', 'Testimonial has been deleted.', 'success');
        fetchTestimonials();
      } catch {
        toast.error('Failed to delete testimonial.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Patient Testimonials</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage patient reviews, toggle their visibility on the home page, and add custom entries.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl gradient-primary text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all cursor-pointer"
        >
          <FaPlus /> Add Testimonial
        </button>
      </div>

      {/* Filter Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search patient names, reviews..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>
      </div>

      {/* Grid of Reviews */}
      {loading ? (
        <div className="py-20"><LoadingSpinner /></div>
      ) : testimonials.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
          <FaStar className="text-6xl mx-auto mb-3 text-gray-300 animate-pulse" />
          <p className="text-gray-500">No testimonials found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testi) => (
            <div
              key={testi.id}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm relative flex flex-col justify-between"
            >
              {/* Header */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 border border-gray-200 dark:border-gray-700">
                    {testi.patient_photo ? (
                      <img src={getApiImageUrl(testi.patient_photo)} alt={testi.patient_name} className="w-full h-full object-cover" />
                    ) : (
                      <FaUserCircle className="text-2xl text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{testi.patient_name}</h3>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          className={`text-xs ${i < testi.rating ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-xs italic leading-relaxed mb-4">
                  "{testi.review}"
                </p>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-50 dark:border-gray-800/80 pt-4 flex items-center justify-between mt-auto">
                <button
                  onClick={() => handleVisibilityToggle(testi.id)}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                    testi.is_visible === 1 ? 'text-success hover:underline' : 'text-gray-400 hover:underline'
                  }`}
                >
                  {testi.is_visible === 1 ? <><FaCheck className="text-[10px]" /> Published</> : <><FaTimes className="text-[10px]" /> Hidden</>}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(testi)}
                    className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                    title="Edit Review"
                  >
                    <FaEdit className="text-xs" />
                  </button>
                  <button
                    onClick={() => handleDelete(testi.id)}
                    className="p-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                    title="Remove Review"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form: Add / Edit Testimonial */}
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
                  {editingTestimonial ? 'Edit Patient Testimonial' : 'Add New Patient Review'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-lg cursor-pointer">
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Photo upload */}
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
                  <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden relative group border border-gray-300 dark:border-gray-700 flex items-center justify-center shrink-0">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <FaUserCircle className="text-3xl text-gray-400" />
                    )}
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] cursor-pointer transition-opacity">
                      <FaCamera className="text-sm" />
                      <input type="file" onChange={handlePhotoChange} accept="image/*" className="hidden" />
                    </label>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-xs">Patient Avatar Photo (Optional)</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">Click photo area to select. Max file size: 5MB.</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Patient Name</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={e => setPatientName(e.target.value)}
                      placeholder="Amanda Sterling"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Rating (Stars)</label>
                    <select
                      value={rating}
                      onChange={e => setRating(parseInt(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      required
                    >
                      <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                      <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                      <option value="3">⭐⭐⭐ (3 Stars)</option>
                      <option value="2">⭐⭐ (2 Stars)</option>
                      <option value="1">⭐ (1 Star)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Patient Review Text</label>
                  <textarea
                    rows={4}
                    value={review}
                    onChange={e => setReview(e.target.value)}
                    placeholder="Describe their experience..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    id="isVisibleCheck"
                    checked={isVisible}
                    onChange={e => setIsVisible(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
                  />
                  <label htmlFor="isVisibleCheck" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                    Publish this review on the landing page testimonials slider
                  </label>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 rounded-xl bg-gray-lighter hover:bg-gray-lighter-hover text-dark font-semibold text-sm transition-colors duration-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl gradient-primary text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 cursor-pointer"
                  >
                    {editingTestimonial ? 'Save Changes' : 'Publish Testimonial'}
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

export default TestimonialManagement;
