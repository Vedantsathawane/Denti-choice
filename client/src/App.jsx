import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
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

function App() {
  return (
    <ThemeProvider>
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
                    <ProtectedRoute>
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
                  <Route path="profile" element={<Profile />} />
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
    </ThemeProvider>
  );
}

export default App;
