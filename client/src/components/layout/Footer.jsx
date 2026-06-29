import { Link } from 'react-router-dom';
import { FaTooth, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaChevronRight } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/#about' },
    { name: 'Our Services', path: '/services' },
    { name: 'Our Doctors', path: '/doctors' },
    { name: 'Book Appointment', path: '/appointment' },
    { name: 'Contact Us', path: '/contact' }
  ];

  const services = [
    'Teeth Cleaning', 'Root Canal', 'Teeth Whitening',
    'Braces', 'Dental Implant', 'Cosmetic Dentistry'
  ];

  const socialLinks = [
    { icon: FaFacebookF, href: '#', label: 'Facebook' },
    { icon: FaTwitter, href: '#', label: 'Twitter' },
    { icon: FaInstagram, href: '#', label: 'Instagram' },
    { icon: FaLinkedinIn, href: '#', label: 'LinkedIn' }
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="container-custom section-padding !pt-24 md:!pt-32 !pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <FaTooth className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Denti-Choice</h3>
                <p className="text-[10px] text-gray-400 -mt-0.5">Your Smile, Our Priority</p>
              </div>
            </Link>
            <p className="text-sm leading-relaxed mb-8">
              Providing exceptional dental care with state-of-the-art technology and a compassionate team dedicated to your oral health and beautiful smile.
            </p>
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  whileHover={{ y: -3 }}
                  className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-primary flex items-center justify-center transition-colors"
                  aria-label={label}
                >
                  <Icon className="text-sm" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-4">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors group"
                  >
                    <FaChevronRight className="text-[10px] text-primary group-hover:translate-x-1 transition-transform" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-6">Our Services</h4>
            <ul className="space-y-4">
              {services.map((service) => (
                <li key={service}>
                  <Link
                    to="/services"
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors group"
                  >
                    <FaChevronRight className="text-[10px] text-primary group-hover:translate-x-1 transition-transform" />
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold text-lg mb-6">Contact Info</h4>
            <ul className="space-y-5">
              <li className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-primary mt-1 shrink-0" />
                <span className="text-sm">123 Dental Avenue, Healthcare District, New York, NY 10001</span>
              </li>
              <li className="flex items-center gap-3">
                <FaPhoneAlt className="text-primary shrink-0" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <FaEnvelope className="text-primary shrink-0" />
                <span className="text-sm">info@dentichoice.com</span>
              </li>
            </ul>

            {/* Opening Hours */}
            <div className="mt-8">
              <h5 className="text-white font-medium text-sm mb-4">Opening Hours</h5>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span>Mon - Fri</span><span className="text-primary">9:00 AM - 5:00 PM</span></div>
                <div className="flex justify-between"><span>Saturday</span><span className="text-primary">10:00 AM - 2:00 PM</span></div>
                <div className="flex justify-between"><span>Sunday</span><span className="text-red-400">Closed</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-7 flex flex-col md:flex-row justify-between items-center gap-3 text-sm">
          <p>© {currentYear} Denti-Choice. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
