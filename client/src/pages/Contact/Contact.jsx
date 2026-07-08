import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock, FaPaperPlane } from 'react-icons/fa';
import { contactService } from '../../services/dataService';
import { useSettings } from '../../hooks/useSettings';

const Contact = () => {
  const { settings } = useSettings();
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await contactService.submit(data);
      toast.success('Message sent successfully! We will get back to you soon.');
      reset();
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const contactInfo = [
    { icon: FaPhoneAlt, title: 'Call Us', detail: settings.clinic_phone, sub: settings.clinic_phone_secondary },
    { icon: FaEnvelope, title: 'Email Us', detail: settings.clinic_email, sub: 'support@dentichoice.com' },
    { icon: FaMapMarkerAlt, title: 'Visit Us', detail: settings.clinic_address || '123 Dental Avenue', sub: '' },
    { icon: FaClock, title: 'Working Hours', detail: `Mon-Fri: ${settings.opening_hours?.monday || '9AM - 5PM'}`, sub: `Sat: ${settings.opening_hours?.saturday || '10AM - 2PM'}` }
  ];

  return (
    <>
      <section className="pt-32 pb-28 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"><div className="absolute top-0 left-20 w-72 h-72 bg-white rounded-full blur-3xl" /></div>
        <div className="container-custom relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Contact Us</h1>
            <p className="text-white/80 max-w-xl mx-auto">Have questions? We would love to hear from you. Send us a message and we will respond as soon as possible.</p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0"><svg viewBox="0 0 1440 80" fill="none"><path d="M0 80L720 20L1440 80V80H0Z" className="fill-white dark:fill-gray-950" /></svg></div>
      </section>

      <section className="section-padding bg-white dark:bg-gray-950 -mt-1">
        <div className="container-custom">
          {/* Contact Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
            {contactInfo.map(({ icon: Icon, title, detail, sub }, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 text-center hover:shadow-card transition-all"
              >
                <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                  <Icon className="text-white text-xl" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{detail}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">{sub}</p>
                {title === 'Visit Us' && settings.google_maps_url && (
                  <div className="mt-3">
                    <a
                      href={settings.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary dark:text-secondary hover:underline font-semibold"
                    >
                      Show on Map →
                    </a>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">Send Us a Message</h2>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <input {...register('name', { required: 'Name is required' })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none text-sm" placeholder="Your Name *" />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <input type="email" {...register('email', { required: 'Email is required' })} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none text-sm" placeholder="Your Email *" />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <input {...register('phone')} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none text-sm" placeholder="Phone Number" />
                  <input {...register('subject')} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none text-sm" placeholder="Subject" />
                </div>
                <div>
                  <textarea {...register('message', { required: 'Message is required' })} rows={5} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none text-sm resize-none" placeholder="Your Message *" />
                  {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
                </div>
                <button type="submit" disabled={submitting} className="w-full py-3.5 rounded-xl gradient-primary text-white font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? 'Sending...' : <><FaPaperPlane /> Send Message</>}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;
