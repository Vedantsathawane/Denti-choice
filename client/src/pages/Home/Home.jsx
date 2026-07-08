import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTooth, FaCalendarCheck, FaUserMd, FaAward, FaSmile, FaShieldAlt,
  FaClock, FaStethoscope, FaHeart, FaStar, FaQuoteLeft, FaPhone,
  FaEnvelope, FaMapMarkerAlt, FaChevronDown, FaChevronUp, FaArrowRight,
  FaSyringe, FaMagic, FaChild, FaAmbulance, FaCog, FaTeethOpen,
  FaHandHoldingMedical, FaPaperPlane
} from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { testimonialService, doctorService, serviceService } from '../../services/dataService';
import { useSettings } from '../../hooks/useSettings';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

// Counter component
const Counter = ({ end, label, icon: Icon, suffix = '' }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end]);

  return (
    <div className="text-center">
      <Icon className="text-3xl text-primary mx-auto mb-3" />
      <div className="text-4xl font-bold text-white mb-1">{count}{suffix}</div>
      <p className="text-gray-300 text-sm">{label}</p>
    </div>
  );
};

const Home = () => {
  const { settings } = useSettings();
  const [testimonials, setTestimonials] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    testimonialService.getAll({ is_visible: 1 }).then(r => setTestimonials(r.data.data)).catch(() => {});
    doctorService.getAll({ is_active: 1 }).then(r => setDoctors(r.data.data?.slice(0, 3) || [])).catch(() => {});
    serviceService.getAll({ is_active: 1 }).then(r => setServices(r.data.data?.slice(0, 6) || [])).catch(() => {});
  }, []);

  const serviceIcons = { 'Teeth Cleaning': FaTooth, 'Root Canal': FaSyringe, 'Teeth Whitening': FaStar, 'Braces': FaTeethOpen, 'Dental Implant': FaCog, 'Smile Designing': FaSmile, 'Cosmetic Dentistry': FaMagic, 'Tooth Extraction': FaHandHoldingMedical, 'Emergency Dental Care': FaAmbulance, 'Pediatric Dentistry': FaChild };

  const faqs = [
    { q: 'How often should I visit the dentist?', a: 'We recommend visiting the dentist every 6 months for regular check-ups and professional cleaning. However, if you have specific dental concerns, more frequent visits may be necessary.' },
    { q: 'Does teeth whitening damage enamel?', a: 'Professional teeth whitening performed at our clinic is completely safe for your enamel. We use FDA-approved products and carefully control the concentration and application time.' },
    { q: 'What should I do in a dental emergency?', a: `Contact us immediately at ${settings.clinic_phone || '+1 (555) 123-4567'}. We offer priority emergency scheduling. For knocked-out teeth, keep the tooth moist and come in within 30 minutes for the best chance of saving it.` },
    { q: 'Are dental implants painful?', a: 'The implant procedure is performed under local anesthesia, so you will not feel pain during the procedure. Post-operative discomfort is typically mild and managed with over-the-counter pain medication.' },
    { q: 'Do you accept dental insurance?', a: 'Yes, we accept most major dental insurance plans. Our front desk team will help you verify your coverage and maximize your benefits. We also offer flexible payment plans.' }
  ];

  const whyChooseUs = [
    { icon: FaUserMd, title: 'Expert Doctors', desc: 'Board-certified specialists with decades of combined experience' },
    { icon: FaStethoscope, title: 'Advanced Technology', desc: 'State-of-the-art equipment for precise diagnostics and treatment' },
    { icon: FaClock, title: 'Flexible Scheduling', desc: 'Convenient appointment times including weekends' },
    { icon: FaShieldAlt, title: 'Safe & Sterile', desc: 'Highest standards of sterilization and infection control' },
    { icon: FaHeart, title: 'Patient Comfort', desc: 'Gentle care with sedation options for anxious patients' },
    { icon: FaAward, title: 'Award Winning', desc: 'Recognized for excellence in dental care and patient satisfaction' }
  ];

  return (
    <>
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-secondary" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>

        <div className="container-custom relative z-10 py-32 lg:py-0">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.span
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6"
              >
                🦷 Welcome to Denti-Choice Dental Clinic
              </motion.span>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Your Smile
                <br />
                <span className="text-accent">Deserves the Best</span>
                <br />
                Dental Care
              </h1>

              <p className="text-lg text-white/80 mb-8 max-w-lg">
                Experience world-class dental care with our team of expert specialists.
                Modern technology, gentle care, and beautiful results — all under one roof.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/appointment"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-primary font-semibold hover:bg-accent transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-lg"
                >
                  <FaCalendarCheck />
                  Book Appointment
                </Link>
                <Link
                  to="/services"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1"
                >
                  Our Services
                  <FaArrowRight className="text-sm" />
                </Link>
              </div>

              {/* Quick stats */}
              <div className="flex gap-8 mt-12">
                {[
                  { val: '15+', label: 'Years Experience' },
                  { val: '10K+', label: 'Happy Patients' },
                  { val: '6', label: 'Expert Doctors' }
                ].map(({ val, label }) => (
                  <div key={label}>
                    <div className="text-2xl font-bold text-white">{val}</div>
                    <div className="text-sm text-white/60">{label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Hero visual - dental illustration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:flex justify-center"
            >
              <div className="relative">
                <div className="w-96 h-96 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center animate-float">
                  <FaTooth className="text-white/30 text-[200px]" />
                </div>
                {/* Floating cards */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute top-10 -left-10 bg-white rounded-2xl p-4 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><FaCalendarCheck className="text-green-600" /></div>
                    <div>
                      <p className="text-xs text-gray-500">Next Slot</p>
                      <p className="text-sm font-semibold text-gray-800">Today, 2:00 PM</p>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity }}
                  className="absolute bottom-16 -right-10 bg-white rounded-2xl p-4 shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center"><FaStar className="text-yellow-500" /></div>
                    <div>
                      <p className="text-xs text-gray-500">Rating</p>
                      <p className="text-sm font-semibold text-gray-800">4.9/5 ★★★★★</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" className="fill-white dark:fill-gray-950" />
          </svg>
        </div>
      </section>

      {/* ==================== STATS SECTION ==================== */}
      <section className="py-16 bg-gray-900 relative -mt-1">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <Counter end={15} label="Years of Experience" icon={FaAward} suffix="+" />
            <Counter end={10000} label="Happy Patients" icon={FaSmile} suffix="+" />
            <Counter end={6} label="Expert Doctors" icon={FaUserMd} />
            <Counter end={10} label="Dental Services" icon={FaTooth} />
          </div>
        </div>
      </section>

      {/* ==================== SERVICES PREVIEW ==================== */}
      <section className="section-padding bg-white dark:bg-gray-950">
        <div className="container-custom">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">What We Offer</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-gray-900 dark:text-white">Our Featured Services</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">We provide comprehensive dental care services using the latest technology and techniques to ensure your comfort and satisfaction.</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, idx) => {
              const Icon = serviceIcons[service.name] || FaTooth;
              return (
                <motion.div
                  key={service.id || idx}
                  variants={fadeInUp}
                  whileHover={{ y: -5 }}
                  className="group bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:border-primary/30 hover:shadow-card-hover transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="text-2xl text-primary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{service.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4">{service.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-semibold">From ${service.price}</span>
                    <span className="text-xs text-gray-400">{service.duration}</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          <div className="text-center mt-10">
            <Link to="/services" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all hover:-translate-y-0.5">
              View All Services <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== WHY CHOOSE US ==================== */}
      <section className="section-padding bg-gray-50 dark:bg-gray-900">
        <div className="container-custom">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Why Denti-Choice</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-gray-900 dark:text-white">Why Choose Us</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">We are committed to providing the highest quality dental care in a comfortable and welcoming environment.</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyChooseUs.map(({ icon: Icon, title, desc }, idx) => (
              <motion.div key={idx} variants={fadeInUp} className="flex gap-4 p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-card transition-all">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                  <Icon className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==================== DOCTOR HIGHLIGHTS ==================== */}
      <section className="section-padding bg-white dark:bg-gray-950">
        <div className="container-custom">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Meet Our Team</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-gray-900 dark:text-white">Expert Dental Specialists</h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="grid md:grid-cols-3 gap-8">
            {doctors.map((doctor, idx) => (
              <motion.div key={doctor.id || idx} variants={fadeInUp} whileHover={{ y: -5 }} className="group text-center">
                <div className="relative mb-5 mx-auto w-48 h-48 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <FaUserMd className="text-6xl text-primary/40" />
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors rounded-full" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{doctor.name}</h3>
                <p className="text-primary text-sm font-medium">{doctor.specialization}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{doctor.qualification}</p>
                <p className="text-xs text-gray-400 mt-1">{doctor.experience} years experience</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-10">
            <Link to="/doctors" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-white transition-all">
              View All Doctors <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== ABOUT CLINIC ==================== */}
      <section id="about" className="section-padding bg-gray-50 dark:bg-gray-900">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">About Us</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-6 text-gray-900 dark:text-white">
                Dedicated to Your
                <span className="gradient-text"> Dental Health</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                At Denti-Choice, we believe everyone deserves a beautiful, healthy smile. Founded over 15 years ago,
                our clinic has grown into one of the most trusted dental care providers in the region.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Our team of expert dentists uses cutting-edge technology combined with a patient-first approach
                to deliver exceptional results. From routine check-ups to complex procedures, we provide
                comprehensive care tailored to your individual needs.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { icon: FaShieldAlt, text: '100% Safe Procedures' },
                  { icon: FaClock, text: 'On-Time Appointments' },
                  { icon: FaAward, text: 'Certified Specialists' },
                  { icon: FaHeart, text: 'Patient Focused Care' }
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Icon className="text-primary" /> {text}
                  </div>
                ))}
              </div>
              <Link to="/appointment" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:shadow-lg transition-all">
                <FaCalendarCheck /> Make an Appointment
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <div className="relative">
                <div className="w-full h-96 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <FaTooth className="text-[120px] text-primary/20" />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-xl">
                  <div className="text-3xl font-bold gradient-text">15+</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Years of Excellence</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==================== TESTIMONIALS ==================== */}
      <section className="section-padding bg-white dark:bg-gray-950">
        <div className="container-custom">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-gray-900 dark:text-white">What Our Patients Say</h2>
          </motion.div>

          {testimonials.length > 0 ? (
            <Swiper
              modules={[Autoplay, Pagination]}
              spaceBetween={24}
              slidesPerView={1}
              breakpoints={{ 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              className="pb-14"
            >
              {testimonials.map((t, idx) => (
                <SwiperSlide key={t.id || idx}>
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 h-full">
                    <FaQuoteLeft className="text-primary/20 text-3xl mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-4">{t.review}</p>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm">
                        {t.patient_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.patient_name}</p>
                        <div className="flex gap-0.5">
                          {[...Array(t.rating || 5)].map((_, i) => (
                            <FaStar key={i} className="text-yellow-400 text-xs" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                  <FaQuoteLeft className="text-primary/20 text-3xl mb-4" />
                  <div className="skeleton-loader h-20 mb-4" />
                  <div className="flex items-center gap-3">
                    <div className="skeleton-loader w-11 h-11 rounded-full" />
                    <div><div className="skeleton-loader h-4 w-24 mb-1" /><div className="skeleton-loader h-3 w-16" /></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section className="section-padding bg-gray-50 dark:bg-gray-900">
        <div className="container-custom max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-4 text-gray-900 dark:text-white">Frequently Asked Questions</h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-semibold text-gray-900 dark:text-white text-sm pr-4">{faq.q}</span>
                  {openFaq === idx ? <FaChevronUp className="text-primary shrink-0" /> : <FaChevronDown className="text-gray-400 shrink-0" />}
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-4 text-sm text-gray-600 dark:text-gray-400">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CTA / CONTACT PREVIEW ==================== */}
      <section className="section-padding gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent rounded-full blur-3xl" />
        </div>
        <div className="container-custom relative z-10 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready for a Beautiful Smile?</h2>
            <p className="text-white/80 max-w-xl mx-auto mb-8">Book your appointment today and take the first step towards better dental health. Our team is ready to welcome you!</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/appointment"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-primary font-bold hover:bg-accent transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <FaCalendarCheck /> Book Appointment
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-white/30 text-white font-bold hover:bg-white/10 backdrop-blur-sm transition-all hover:-translate-y-1"
              >
                <FaPhone /> Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== NEWSLETTER ==================== */}
      <section className="section-padding bg-white dark:bg-gray-950">
        <div className="container-custom max-w-2xl text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
            <FaEnvelope className="text-4xl text-primary mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">Stay Updated</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Subscribe to our newsletter for dental tips, clinic updates, and special offers.</p>
            <form className="flex gap-3 max-w-md mx-auto" onSubmit={e => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
              <button className="px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center gap-2">
                <FaPaperPlane /> Subscribe
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Home;
