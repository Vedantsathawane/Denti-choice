-- ============================================
-- Denti-Choice Consolidated Seed Data
-- ============================================

USE dentichoice;

-- ============================================
-- 1. CLINICS
-- ============================================
INSERT IGNORE INTO clinics (id, name, subdomain, branding_color, is_active) VALUES
(1, 'Denti-Choice Dental Clinic', 'denti-choice', '#0066FF', 1);

-- ============================================
-- 2. SUBSCRIPTION PLANS
-- ============================================
INSERT IGNORE INTO subscription_plans (id, name, price, billing_cycle, features_json) VALUES 
(1, 'Free Trial', 0.00, 'monthly', '["AI Booking (Basic)", "1 Doctor slot", "Standard notifications"]'),
(2, 'Clinic Pro', 99.00, 'monthly', '["AI Booking (Uncapped)", "5 Doctors", "AI Doctor Assistant", "Premium review alerts"]'),
(3, 'Enterprise AI', 249.00, 'monthly', '["Unlimited Everything", "Custom Branding", "Predictive Analytics", "Custom Subdomain"]');

-- ============================================
-- 3. SUBSCRIPTIONS
-- ============================================
INSERT IGNORE INTO subscriptions (clinic_id, plan_id, status, current_period_end) VALUES
(1, 2, 'active', DATE_ADD(NOW(), INTERVAL 1 YEAR));

-- ============================================
-- 4. CLINIC USERS (unified admin, owner, super admin table)
-- Hashes generated with bcryptjs
-- Passwords:
-- - super@dentist-choice.com: superadmin123
-- - admin@dentichoice.com: Admin@123
-- - ved@gmail.com: 123456
-- ============================================
INSERT IGNORE INTO clinic_users (id, clinic_id, name, email, password, role, is_active) VALUES
(1, NULL, 'Super Admin', 'super@dentist-choice.com', '$2b$10$1L.aQUWx1WP9Bshi/AcIvOkAmfbjLt3sedivWlanWVE1VGtK1suo.', 'super_admin', 1),
(2, 1, 'Dr. Admin', 'admin@dentichoice.com', '$2b$10$6vadEw4ToftrYc0T90Bs/uAeppNolyyqGhNnwnVNAYiTD73Iy/vua', 'owner', 1),
(3, 1, 'ved', 'ved@gmail.com', '$2b$10$BzRWu4dp6XNQmFNjKqjHheG1r7tTZzIrXXU5fDl9kLEwrJK1Ui08C', 'admin', 1);

-- ============================================
-- 5. DOCTORS
-- ============================================
INSERT IGNORE INTO doctors (id, clinic_id, name, email, phone, qualification, experience, specialization, availability, bio, social_links, is_active) VALUES
(
  1,
  1,
  'Dr. Sarah Johnson',
  'sarah.johnson@dentichoice.com',
  '+1-555-0101',
  'DDS, MSD - Orthodontics',
  12,
  'Orthodontics',
  '["Monday","Tuesday","Wednesday","Thursday","Friday"]',
  'Dr. Sarah Johnson is a board-certified orthodontist with over 12 years of experience in creating beautiful smiles. She specializes in modern braces and clear aligner therapy.',
  '{"facebook":"#","twitter":"#","linkedin":"#","instagram":"#"}',
  1
),
(
  2,
  1,
  'Dr. Michael Chen',
  'michael.chen@dentichoice.com',
  '+1-555-0102',
  'DMD, MS - Endodontics',
  15,
  'Endodontics',
  '["Monday","Wednesday","Friday"]',
  'Dr. Michael Chen is an expert endodontist known for his painless root canal procedures. With 15 years of practice, he has treated over 10,000 patients.',
  '{"facebook":"#","twitter":"#","linkedin":"#","instagram":"#"}',
  1
),
(
  3,
  1,
  'Dr. Emily Williams',
  'emily.williams@dentichoice.com',
  '+1-555-0103',
  'DDS - Cosmetic Dentistry',
  10,
  'Cosmetic Dentistry',
  '["Tuesday","Thursday","Saturday"]',
  'Dr. Emily Williams transforms smiles with her artistic approach to cosmetic dentistry. She is passionate about smile design and teeth whitening procedures.',
  '{"facebook":"#","twitter":"#","linkedin":"#","instagram":"#"}',
  1
),
(
  4,
  1,
  'Dr. James Rodriguez',
  'james.rodriguez@dentichoice.com',
  '+1-555-0104',
  'BDS, MDS - Oral Surgery',
  18,
  'Oral Surgery',
  '["Monday","Tuesday","Thursday","Friday"]',
  'Dr. James Rodriguez is a skilled oral surgeon with 18 years of experience in dental implants, wisdom tooth extraction, and reconstructive jaw surgery.',
  '{"facebook":"#","twitter":"#","linkedin":"#","instagram":"#"}',
  1
),
(
  5,
  1,
  'Dr. Lisa Patel',
  'lisa.patel@dentichoice.com',
  '+1-555-0105',
  'DDS - Pediatric Dentistry',
  8,
  'Pediatric Dentistry',
  '["Monday","Wednesday","Thursday","Saturday"]',
  'Dr. Lisa Patel loves working with children and makes every dental visit fun and comfortable. She specializes in preventive care and early orthodontic assessment.',
  '{"facebook":"#","twitter":"#","linkedin":"#","instagram":"#"}',
  1
),
(
  6,
  1,
  'Dr. Robert Kim',
  'robert.kim@dentichoice.com',
  '+1-555-0106',
  'DMD, FICOI - Implantology',
  20,
  'Dental Implants',
  '["Tuesday","Wednesday","Friday"]',
  'Dr. Robert Kim is a leading implantologist with over 20 years of experience. He has placed thousands of dental implants with a success rate exceeding 98%.',
  '{"facebook":"#","twitter":"#","linkedin":"#","instagram":"#"}',
  1
);

-- ============================================
-- 6. SERVICES
-- ============================================
INSERT IGNORE INTO services (id, clinic_id, name, description, icon, duration, price, sort_order, is_active) VALUES
(
  1,
  1,
  'Teeth Cleaning',
  'Professional dental cleaning to remove plaque, tartar, and stains. Our hygienists use advanced ultrasonic scalers and polishing tools to leave your teeth sparkling clean and healthy.',
  'FaTooth',
  '30-45 mins',
  75.00,
  1,
  1
),
(
  2,
  1,
  'Root Canal',
  'Advanced endodontic treatment to save infected teeth. Our painless root canal procedure removes the infected pulp, cleans the canal, and seals it to prevent future infection.',
  'FaSyringe',
  '60-90 mins',
  500.00,
  2,
  1
),
(
  3,
  1,
  'Teeth Whitening',
  'Professional in-office teeth whitening that can brighten your smile by up to 8 shades. We use the latest LED-accelerated whitening technology for fast, dramatic results.',
  'FaStar',
  '45-60 mins',
  350.00,
  3,
  1
),
(
  4,
  1,
  'Braces',
  'Comprehensive orthodontic treatment with traditional metal braces, ceramic braces, or clear aligners. We create personalized treatment plans for a perfectly aligned smile.',
  'FaTeethOpen',
  'Ongoing',
  3000.00,
  4,
  1
),
(
  5,
  1,
  'Dental Implant',
  'Permanent tooth replacement solution using titanium implants. Our implants look, feel, and function like natural teeth, restoring your smile and confidence.',
  'FaCog',
  '60-120 mins',
  2500.00,
  5,
  1
),
(
  6,
  1,
  'Smile Designing',
  'Complete smile makeover combining multiple cosmetic procedures. We analyze your facial features to design a smile that complements your personality and enhances your appearance.',
  'FaSmile',
  '90-120 mins',
  1500.00,
  6,
  1
),
(
  7,
  1,
  'Cosmetic Dentistry',
  'Enhance your smile with veneers, bonding, and reshaping. Our cosmetic treatments address chips, gaps, discoloration, and misalignment for a stunning, natural-looking result.',
  'FaMagic',
  '45-90 mins',
  800.00,
  7,
  1
),
(
  8,
  1,
  'Tooth Extraction',
  'Safe and painless tooth removal performed by experienced oral surgeons. We offer both simple and surgical extractions with proper anesthesia and aftercare guidance.',
  'FaHandHoldingMedical',
  '30-60 mins',
  200.00,
  8,
  1
),
(
  9,
  1,
  'Emergency Dental Care',
  'Immediate dental care for urgent situations including severe toothache, broken teeth, knocked-out teeth, and dental abscesses. Available with priority scheduling.',
  'FaAmbulance',
  '30-60 mins',
  150.00,
  9,
  1
),
(
  10,
  1,
  'Pediatric Dentistry',
  'Gentle and fun dental care designed especially for children. Our kid-friendly environment and compassionate approach ensure stress-free visits for your little ones.',
  'FaChild',
  '30-45 mins',
  100.00,
  10,
  1
);

-- ============================================
-- 7. TESTIMONIALS
-- ============================================
INSERT IGNORE INTO testimonials (id, clinic_id, patient_name, review, rating, is_visible) VALUES
(
  1,
  1,
  'Amanda Sterling',
  'Denti-Choice completely transformed my smile! Dr. Williams did an amazing job with my veneers. The entire team is professional, caring, and makes you feel right at home. I cannot recommend them enough!',
  5,
  1
),
(
  2,
  1,
  'Marcus Thompson',
  'I was terrified of dentists until I visited Denti-Choice. Dr. Chen performed my root canal with zero pain - I could not believe it! The clinic is state-of-the-art and the staff is incredibly friendly.',
  5,
  1
),
(
  3,
  1,
  'Priya Sharma',
  'My kids love going to Dr. Patel! She is so patient and gentle with them. The pediatric department is colorful and fun. Finally found a dentist my children actually look forward to visiting.',
  5,
  1
),
(
  4,
  1,
  'David Mitchell',
  'Got my dental implants done by Dr. Kim and the results are phenomenal. They look and feel exactly like natural teeth. Worth every penny. The follow-up care has been exceptional too.',
  4,
  1
),
(
  5,
  1,
  'Sofia Rodriguez',
  'The teeth whitening service here is fantastic! My teeth are 6 shades brighter and the results have lasted months. Dr. Williams explained everything clearly and made me very comfortable.',
  5,
  1
),
(
  6,
  1,
  'James O''Brien',
  'Emergency dental care when I chipped my front tooth on a Saturday. They fit me in within an hour and Dr. Rodriguez fixed it perfectly. Incredibly grateful for their prompt and professional service.',
  5,
  1
);

-- ============================================
-- 8. DEFAULT SETTINGS
-- ============================================
INSERT IGNORE INTO settings (clinic_id, setting_key, setting_value, setting_type) VALUES
(1, 'clinic_name', 'Denti-Choice Dental Clinic', 'text'),
(1, 'clinic_logo', '/images/logo.png', 'url'),
(1, 'clinic_address', '123 Dental Avenue, Healthcare District, New York, NY 10001', 'text'),
(1, 'clinic_email', 'info@dentichoice.com', 'email'),
(1, 'clinic_phone', '+1 (555) 123-4567', 'text'),
(1, 'clinic_phone_secondary', '+1 (555) 987-6543', 'text'),
(1, 'social_facebook', 'https://facebook.com/dentichoice', 'url'),
(1, 'social_twitter', 'https://twitter.com/dentichoice', 'url'),
(1, 'social_instagram', 'https://instagram.com/dentichoice', 'url'),
(1, 'social_linkedin', 'https://linkedin.com/company/dentichoice', 'url'),
(1, 'opening_hours', '{"monday":"9:00 AM - 5:00 PM","tuesday":"9:00 AM - 5:00 PM","wednesday":"9:00 AM - 5:00 PM","thursday":"9:00 AM - 5:00 PM","friday":"9:00 AM - 5:00 PM","saturday":"10:00 AM - 2:00 PM","sunday":"Closed"}', 'json'),
(1, 'google_maps_url', 'https://maps.google.com/?q=123+Dental+Avenue+New+York', 'url'),
(1, 'smtp_host', 'smtp.gmail.com', 'text'),
(1, 'smtp_port', '587', 'number'),
(1, 'smtp_user', 'sathawanevedant2503@gmail.com', 'email'),
(1, 'smtp_pass', 'kcsbrnrmkbcghbik', 'text');

-- ============================================
-- 9. MAPPING TABLES (AI / Compatibility Layer)
-- ============================================
INSERT IGNORE INTO clinic_admins (clinic_id, admin_id) VALUES
(1, 2),
(1, 3);

INSERT IGNORE INTO clinic_doctors (clinic_id, doctor_id) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6);

INSERT IGNORE INTO clinic_services (clinic_id, service_id) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 8),
(1, 9),
(1, 10);

INSERT IGNORE INTO clinic_settings (clinic_id, setting_key, setting_value) VALUES
(1, 'clinic_name', 'Denti-Choice Dental Clinic'),
(1, 'clinic_logo', '/images/logo.png'),
(1, 'clinic_address', '123 Dental Avenue, Healthcare District, New York, NY 10001'),
(1, 'clinic_email', 'info@dentichoice.com'),
(1, 'clinic_phone', '+1 (555) 123-4567'),
(1, 'clinic_phone_secondary', '+1 (555) 987-6543'),
(1, 'social_facebook', 'https://facebook.com/dentichoice'),
(1, 'social_twitter', 'https://twitter.com/dentichoice'),
(1, 'social_instagram', 'https://instagram.com/dentichoice'),
(1, 'social_linkedin', 'https://linkedin.com/company/dentichoice'),
(1, 'opening_hours', '{"monday":"9:00 AM - 5:00 PM","tuesday":"9:00 AM - 5:00 PM","wednesday":"9:00 AM - 5:00 PM","thursday":"9:00 AM - 5:00 PM","friday":"9:00 AM - 5:00 PM","saturday":"10:00 AM - 2:00 PM","sunday":"Closed"}'),
(1, 'google_maps_url', 'https://maps.google.com/?q=123+Dental+Avenue+New+York'),
(1, 'smtp_host', 'smtp.gmail.com'),
(1, 'smtp_port', '587'),
(1, 'smtp_user', 'sathawanevedant2503@gmail.com'),
(1, 'smtp_pass', 'kcsbrnrmkbcghbik');
