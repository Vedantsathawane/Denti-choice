import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUserMd, FaPlus, FaSearch, FaEdit, FaTrash, FaCheck, FaTimes,
  FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaCamera, FaEnvelope, FaPhone
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { toastError } from '../../services/api';
import { doctorService } from '../../services/dataService';
import { SPECIALIZATIONS } from '../../utils/constants';
import { getApiImageUrl } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const defaultSocials = { facebook: '', twitter: '', linkedin: '', instagram: '' };

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState(0);
  const [spec, setSpec] = useState(SPECIALIZATIONS[0]);
  const [bio, setBio] = useState('');
  const [availability, setAvailability] = useState([]);
  const [socialLinks, setSocialLinks] = useState(defaultSocials);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchDoctors = async () => {
    try {
      const res = await doctorService.getAll({ search, specialization });
      setDoctors(res.data.data || []);
    } catch (error) {
      toastError('Failed to load doctors.', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [search, specialization]);

  const handleOpenAdd = () => {
    setEditingDoc(null);
    setName('');
    setEmail('');
    setPhone('');
    setQualification('');
    setExperience(0);
    setSpec(SPECIALIZATIONS[0]);
    setBio('');
    setAvailability(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
    setSocialLinks(defaultSocials);
    setImageFile(null);
    setImagePreview('');
    setIsActive(true);
    setShowModal(true);
  };

  const handleOpenEdit = (doc) => {
    setEditingDoc(doc);
    setName(doc.name);
    setEmail(doc.email);
    setPhone(doc.phone);
    setQualification(doc.qualification);
    setExperience(doc.experience);
    setSpec(doc.specialization);
    setBio(doc.bio || '');
    setIsActive(doc.is_active === 1);

    let parsedAvail = [];
    try {
      parsedAvail = typeof doc.availability === 'string' ? JSON.parse(doc.availability) : (doc.availability || []);
    } catch {
      parsedAvail = [];
    }
    setAvailability(parsedAvail);

    let parsedSocials = { ...defaultSocials };
    try {
      parsedSocials = typeof doc.social_links === 'string' ? JSON.parse(doc.social_links) : (doc.social_links || defaultSocials);
    } catch {
      parsedSocials = defaultSocials;
    }
    setSocialLinks(parsedSocials);

    setImageFile(null);
    setImagePreview(getApiImageUrl(doc.image) || '');
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDayToggle = (day) => {
    setAvailability(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSocialChange = (key, value) => {
    setSocialLinks(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('qualification', qualification);
    formData.append('experience', experience);
    formData.append('specialization', spec);
    formData.append('bio', bio);
    formData.append('availability', JSON.stringify(availability));
    formData.append('social_links', JSON.stringify(socialLinks));
    formData.append('is_active', isActive ? 1 : 0);

    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      if (editingDoc) {
        await doctorService.update(editingDoc.id, formData);
        toast.success('Doctor details updated.');
      } else {
        await doctorService.create(formData);
        toast.success('New doctor registered.');
      }
      setShowModal(false);
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    }
  };

  const handleStatusToggle = async (doc) => {
    const nextStatus = doc.is_active === 1 ? 0 : 1;
    try {
      const formData = new FormData();
      formData.append('name', doc.name);
      formData.append('email', doc.email);
      formData.append('phone', doc.phone);
      formData.append('qualification', doc.qualification);
      formData.append('specialization', doc.specialization);
      formData.append('experience', doc.experience);
      formData.append('is_active', nextStatus);
      await doctorService.update(doc.id, formData);
      toast.success(`Doctor marked as ${nextStatus === 1 ? 'active' : 'inactive'}`);
      fetchDoctors();
    } catch {
      toast.error('Failed to change doctor status.');
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to remove this doctor from the clinic registry?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete doctor'
    });

    if (confirm.isConfirmed) {
      try {
        await doctorService.delete(id);
        Swal.fire('Deleted!', 'Doctor has been removed.', 'success');
        fetchDoctors();
      } catch {
        toast.error('Failed to delete doctor.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Doctor Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage dental specialists, qualifications, schedules, and profile images.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl gradient-primary text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all cursor-pointer"
        >
          <FaPlus /> Add New Doctor
        </button>
      </div>

      {/* Filters Banner */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by name, qualification..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>

        <select
          value={specialization}
          onChange={e => setSpecialization(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm md:w-64"
        >
          <option value="">All Specializations</option>
          {SPECIALIZATIONS.map(sp => (
            <option key={sp} value={sp}>{sp}</option>
          ))}
        </select>
      </div>

      {/* Grid of Doctor Cards */}
      {loading ? (
        <div className="py-20"><LoadingSpinner /></div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
          <FaUserMd className="text-6xl mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No doctors found matching your query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => {
            let parsedAvail = [];
            try {
              parsedAvail = typeof doc.availability === 'string' ? JSON.parse(doc.availability) : (doc.availability || []);
            } catch {
              parsedAvail = [];
            }

            return (
              <div
                key={doc.id}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between"
              >
                {/* Visual Status Indicator */}
                <span className={`absolute top-4 right-4 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  doc.is_active === 1 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                }`}>
                  {doc.is_active === 1 ? 'Active' : 'Inactive'}
                </span>

                <div>
                  {/* Photo area */}
                  <div className="h-44 bg-gray-100 dark:bg-gray-950 flex items-center justify-center overflow-hidden relative">
                    {doc.image ? (
                      <img src={getApiImageUrl(doc.image)} alt={doc.name} className="w-full h-full object-cover" />
                    ) : (
                      <FaUserMd className="text-6xl text-gray-300 dark:text-gray-700" />
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">{doc.name}</h3>
                    <p className="text-sm text-primary font-semibold mb-3">{doc.specialization}</p>

                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4 border-b border-gray-50 dark:border-gray-800/60 pb-3">
                      <p className="flex items-center gap-1.5"><span className="text-gray-400 font-medium">Qual:</span> {doc.qualification}</p>
                      <p className="flex items-center gap-1.5"><span className="text-gray-400 font-medium">Exp:</span> {doc.experience} years</p>
                      <p className="flex items-center gap-1.5"><FaEnvelope className="text-gray-400 shrink-0" /> {doc.email}</p>
                      <p className="flex items-center gap-1.5"><FaPhone className="text-gray-400 shrink-0" /> {doc.phone}</p>
                    </div>

                    {/* Schedule */}
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Schedule</p>
                      <div className="flex flex-wrap gap-1">
                        {parsedAvail.map(day => (
                          <span key={day} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-150 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            {day.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="bg-gray-50 dark:bg-gray-800/40 px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between mt-auto">
                  <button
                    onClick={() => handleStatusToggle(doc)}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                      doc.is_active === 1 ? 'text-danger hover:underline' : 'text-success hover:underline'
                    }`}
                  >
                    {doc.is_active === 1 ? <><FaTimes /> Deactivate</> : <><FaCheck /> Activate</>}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(doc)}
                      className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                      title="Edit Profile"
                    >
                      <FaEdit className="text-xs" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                      title="Remove Doctor"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form: Add / Edit Doctor */}
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
              className="relative z-10 w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingDoc ? 'Edit Doctor Profile' : 'Register New Doctor'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-lg cursor-pointer">
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Photo upload container */}
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 dark:bg-gray-850 p-4 rounded-2xl border border-gray-150 dark:border-gray-800">
                  <div className="w-24 h-24 rounded-2xl bg-gray-200 dark:bg-gray-800 overflow-hidden relative group border border-gray-300 dark:border-gray-750 flex items-center justify-center shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <FaUserMd className="text-4xl text-gray-400" />
                    )}
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs cursor-pointer transition-opacity">
                      <FaCamera className="text-lg" />
                      <input type="file" onChange={handleImageChange} accept="image/*" className="hidden" />
                    </label>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Doctor Profile Photo</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Click photo to upload. Suggest square image, max 5MB (JPG, PNG).</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Doctor Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Dr. John Doe"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Specialization</label>
                    <select
                      value={spec}
                      onChange={e => setSpec(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      required
                    >
                      {SPECIALIZATIONS.map(sp => (
                        <option key={sp} value={sp}>{sp}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="john.doe@dentichoice.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+1-555-0100"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Qualification</label>
                    <input
                      type="text"
                      value={qualification}
                      onChange={e => setQualification(e.target.value)}
                      placeholder="DDS, DMD, MS"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Experience (Years)</label>
                    <input
                      type="number"
                      value={experience}
                      onChange={e => setExperience(parseInt(e.target.value) || 0)}
                      min={0}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Day selector checkboxes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Availability Schedule</label>
                  <div className="flex flex-wrap gap-2.5 bg-gray-50 dark:bg-gray-850 p-4 border border-gray-150 dark:border-gray-800 rounded-2xl">
                    {DAYS_OF_WEEK.map(day => {
                      const checked = availability.includes(day);
                      return (
                        <button
                          type="button"
                          key={day}
                          onClick={() => handleDayToggle(day)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            checked
                              ? 'gradient-primary text-white border-primary shadow-sm'
                              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-850 text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bio text area */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Short Bio</label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Enter short biography details..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm resize-none"
                  />
                </div>

                {/* Social Handles */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Social Network Profiles</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <FaFacebook className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1877F2]" />
                      <input
                        type="text"
                        placeholder="Facebook URL"
                        value={socialLinks.facebook}
                        onChange={e => handleSocialChange('facebook', e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-gray-50 dark:bg-gray-950 text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div className="relative">
                      <FaTwitter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1DA1F2]" />
                      <input
                        type="text"
                        placeholder="Twitter URL"
                        value={socialLinks.twitter}
                        onChange={e => handleSocialChange('twitter', e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-gray-50 dark:bg-gray-950 text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div className="relative">
                      <FaLinkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0A66C2]" />
                      <input
                        type="text"
                        placeholder="LinkedIn URL"
                        value={socialLinks.linkedin}
                        onChange={e => handleSocialChange('linkedin', e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-gray-50 dark:bg-gray-950 text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div className="relative">
                      <FaInstagram className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#E1306C]" />
                      <input
                        type="text"
                        placeholder="Instagram URL"
                        value={socialLinks.instagram}
                        onChange={e => handleSocialChange('instagram', e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-gray-50 dark:bg-gray-950 text-gray-900 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
                  />
                  <label htmlFor="isActiveCheck" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                    Doctor is active & accepting appointments
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
                    {editingDoc ? 'Save Updates' : 'Add Doctor'}
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

export default DoctorManagement;
