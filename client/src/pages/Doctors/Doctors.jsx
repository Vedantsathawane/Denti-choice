import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUserMd, FaCalendarCheck, FaBriefcase, FaGraduationCap, FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from 'react-icons/fa';
import { doctorService } from '../../services/dataService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getApiImageUrl } from '../../utils/helpers';
import { useSocketEvent } from '../../hooks/useSocket';

const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const socialIcons = { facebook: FaFacebookF, twitter: FaTwitter, linkedin: FaLinkedinIn, instagram: FaInstagram };

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    doctorService.getAll({ is_active: 1 })
      .then(r => setDoctors(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useSocketEvent('doctors:updated', () => {
    doctorService.getAll({ is_active: 1 })
      .then(r => setDoctors(r.data.data || []))
      .catch(() => {});
  });

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <>
      <section className="pt-32 pb-28 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"><div className="absolute top-0 left-20 w-72 h-72 bg-white rounded-full blur-3xl" /></div>
        <div className="container-custom relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Doctors</h1>
            <p className="text-white/80 max-w-xl mx-auto">Meet our team of experienced and passionate dental specialists dedicated to your oral health.</p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0"><svg viewBox="0 0 1440 80" fill="none"><path d="M0 80L720 20L1440 80V80H0Z" className="fill-white dark:fill-gray-950" /></svg></div>
      </section>

      <section className="section-padding bg-white dark:bg-gray-950 -mt-1">
        <div className="container-custom">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {doctors.map((doctor, idx) => {
              let socialLinks = {};
              try { socialLinks = typeof doctor.social_links === 'string' ? JSON.parse(doctor.social_links) : (doctor.social_links || {}); } catch { socialLinks = {}; }
              let availability = [];
              try { availability = typeof doctor.availability === 'string' ? JSON.parse(doctor.availability) : (doctor.availability || []); } catch { availability = []; }

              return (
                <motion.div
                  key={doctor.id || idx}
                  variants={fadeInUp}
                  whileHover={{ y: -5 }}
                  className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-card-hover transition-all"
                >
                  {/* Avatar */}
                  <div className="relative h-56 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center overflow-hidden">
                    {doctor.image ? (
                      <img
                        src={getApiImageUrl(doctor.image)}
                        alt={doctor.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <FaUserMd className="text-8xl text-primary/20" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{doctor.name}</h3>
                    <p className="text-primary font-medium text-sm mb-3">{doctor.specialization}</p>

                    <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <div className="flex items-center gap-2"><FaGraduationCap className="text-primary" /> {doctor.qualification}</div>
                      <div className="flex items-center gap-2"><FaBriefcase className="text-primary" /> {doctor.experience} years experience</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="shrink-0">Available:</span>
                        {availability.slice(0, 3).map(d => (
                          <span key={d} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{d.slice(0, 3)}</span>
                        ))}
                        {availability.length > 3 && <span className="text-xs text-gray-400">+{availability.length - 3}</span>}
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="flex items-center gap-2 mb-4">
                      {Object.entries(socialLinks).filter(([, v]) => v && v !== '#').length === 0 && Object.entries(socialLinks).map(([key]) => {
                        const Icon = socialIcons[key];
                        if (!Icon) return null;
                        return (
                          <span key={key} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-xs">
                            <Icon />
                          </span>
                        );
                      })}
                      {Object.entries(socialLinks).filter(([, v]) => v && v !== '#').map(([key, url]) => {
                        const Icon = socialIcons[key];
                        if (!Icon) return null;
                        return (
                          <a key={key} href={url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:text-white flex items-center justify-center text-gray-500 text-xs transition-colors">
                            <Icon />
                          </a>
                        );
                      })}
                    </div>

                    <Link
                      to={`/appointment?doctorId=${doctor.id}`}
                      state={{ doctorId: doctor.id }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all"
                    >
                      <FaCalendarCheck /> Book Appointment
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Doctors;
