import { motion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';
import { useSettings } from '../../hooks/useSettings';

export default function WhatsAppButton() {
  const { settings } = useSettings();

  // Retrieve configured phone number, falling back to main clinic phone
  const rawPhone = settings?.whatsapp_phone_number || settings?.whatsappPhoneNumber || settings?.clinic_phone || '';
  const cleanPhone = rawPhone.replace(/\D/g, '');

  if (!cleanPhone) return null;

  // Meta Link for direct WhatsApp chat
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=Hi`;

  return (
    <div className="fixed bottom-24 right-6 z-50">
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
        className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-green-400 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-emerald-500/25 hover:shadow-xl focus:outline-none transition-shadow duration-300"
        title="Chat with us on WhatsApp"
      >
        <FaWhatsapp size={28} />
      </motion.a>
    </div>
  );
}
