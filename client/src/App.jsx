import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import ScrollToTop from './components/common/ScrollToTop';

// Lazy-loaded pages
const Home = lazy(() => import('./pages/Home/Home'));
const Services = lazy(() => import('./pages/Services/Services'));
const Doctors = lazy(() => import('./pages/Doctors/Doctors'));
const Appointment = lazy(() => import('./pages/Appointment/Appointment'));
const Contact = lazy(() => import('./pages/Contact/Contact'));
const Login = lazy(() => import('./pages/Login/Login'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Dashboard pages
const DashboardHome = lazy(() => import('./pages/Dashboard/DashboardHome'));
const AppointmentManagement = lazy(() => import('./pages/Dashboard/AppointmentManagement'));
const DoctorManagement = lazy(() => import('./pages/Dashboard/DoctorManagement'));
const ServiceManagement = lazy(() => import('./pages/Dashboard/ServiceManagement'));
const TestimonialManagement = lazy(() => import('./pages/Dashboard/TestimonialManagement'));
const ContactMessages = lazy(() => import('./pages/Dashboard/ContactMessages'));
const Settings = lazy(() => import('./pages/Dashboard/Settings'));
const Profile = lazy(() => import('./pages/Dashboard/Profile'));
const WhatsAppManagement = lazy(() => import('./pages/Dashboard/WhatsAppManagement'));
const SaaSBilling = lazy(() => import('./pages/Dashboard/SaaSBilling'));

// Super Admin pages
const SuperAdminDashboard = lazy(() => import('./pages/super-admin/SuperAdminDashboard'));
const ClinicManagement = lazy(() => import('./pages/super-admin/ClinicManagement'));
const SubscriptionPlans = lazy(() => import('./pages/super-admin/SubscriptionPlans'));
const Payments = lazy(() => import('./pages/super-admin/Payments'));
const SupportTickets = lazy(() => import('./pages/super-admin/SupportTickets'));
const AuditLogs = lazy(() => import('./pages/super-admin/AuditLogs'));
const PlatformSettings = lazy(() => import('./pages/super-admin/PlatformSettings'));
const SuperAdminWebsiteBuilder = lazy(() => import('./pages/super-admin/WebsiteBuilder'));
const SuperAdminAIInsights = lazy(() => import('./pages/super-admin/AIInsights'));
const SuperAdminWhatsApp = lazy(() => import('./pages/super-admin/SuperAdminWhatsApp'));
const SuperAdminBilling = lazy(() => import('./pages/super-admin/SuperAdminBilling'));
const SuperAdminBranding = lazy(() => import('./pages/super-admin/SuperAdminBranding'));

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AuthProvider>
          <SocketProvider>
          <Router>
            <ScrollToTop />
            <Suspense fallback={<LoadingSpinner fullPage />}>
              <Routes>
                {/* Public Routes */}
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/doctors" element={<Doctors />} />
                  <Route path="/appointment" element={<Appointment />} />
                  <Route path="/contact" element={<Contact />} />
                </Route>

                <Route path="/login" element={<Login />} />

                {/* Admin Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['owner', 'admin', 'receptionist', 'doctor']}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardHome />} />
                  <Route path="appointments" element={<AppointmentManagement />} />
                  <Route path="doctors" element={<DoctorManagement />} />
                  <Route path="services" element={<ServiceManagement />} />
                  <Route path="testimonials" element={<TestimonialManagement />} />
                  <Route path="messages" element={<ContactMessages />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="whatsapp" element={<WhatsAppManagement />} />
                  <Route path="billing" element={<SaaSBilling />} />
                  <Route path="profile" element={<Profile />} />
                </Route>

                {/* Super Admin Routes */}
                <Route
                  path="/super-admin"
                  element={
                    <ProtectedRoute allowedRoles={['super_admin']}>
                      <SuperAdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="dashboard" element={<SuperAdminDashboard />} />
                  <Route path="whatsapp" element={<SuperAdminWhatsApp />} />
                  <Route path="ai-insights" element={<SuperAdminAIInsights />} />
                  <Route path="clinics" element={<ClinicManagement />} />
                  <Route path="website-builder" element={<SuperAdminWebsiteBuilder />} />
                  <Route path="subscriptions" element={<SubscriptionPlans />} />
                  <Route path="billing" element={<SuperAdminBilling />} />
                  <Route path="branding" element={<SuperAdminBranding />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="support" element={<SupportTickets />} />
                  <Route path="settings" element={<PlatformSettings />} />
                  <Route path="logs" element={<AuditLogs />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </SocketProvider>
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
