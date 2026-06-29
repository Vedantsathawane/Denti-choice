import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaTooth, FaSyringe, FaStar, FaTeethOpen, FaCog, FaSmile, FaMagic, FaHandHoldingMedical, FaAmbulance, FaChild, FaClock, FaDollarSign, FaArrowRight } from 'react-icons/fa';
import { serviceService } from '../../services/dataService';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const serviceIcons = { 'Teeth Cleaning': FaTooth, 'Root Canal': FaSyringe, 'Teeth Whitening': FaStar, 'Braces': FaTeethOpen, 'Dental Implant': FaCog, 'Smile Designing': FaSmile, 'Cosmetic Dentistry': FaMagic, 'Tooth Extraction': FaHandHoldingMedical, 'Emergency Dental Care': FaAmbulance, 'Pediatric Dentistry': FaChild };

const fadeInUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    serviceService.getAll({ is_active: 1 })
      .then(r => setServices(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <>
      {/* Header */}
      <section className="pt-32 pb-28 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-20 w-72 h-72 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container-custom relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Services</h1>
            <p className="text-white/80 max-w-xl mx-auto">Comprehensive dental care services using the latest technology for your comfort and beautiful smile.</p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none"><path d="M0 80L720 20L1440 80V80H0Z" className="fill-white dark:fill-gray-950" /></svg>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-padding bg-white dark:bg-gray-950 -mt-1">
        <div className="container-custom">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, idx) => {
              const Icon = serviceIcons[service.name] || FaTooth;
              return (
                <motion.div
                  key={service.id || idx}
                  variants={fadeInUp}
                  whileHover={{ y: -8 }}
                  className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-card-hover transition-all duration-300"
                >
                  {/* Card top gradient */}
                  <div className="h-2 gradient-primary" />

                  <div className="p-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                      <Icon className="text-3xl text-primary" />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{service.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-5 line-clamp-3">{service.description}</p>

                    <div className="flex items-center gap-4 mb-5 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5"><FaClock className="text-primary" /> {service.duration}</span>
                      <span className="flex items-center gap-1.5"><FaDollarSign className="text-primary" /> From ${service.price}</span>
                    </div>

                    <Link
                      to="/appointment"
                      className="inline-flex items-center gap-2 text-primary font-semibold text-sm hover:gap-3 transition-all"
                    >
                      Book Now <FaArrowRight />
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

export default Services;
