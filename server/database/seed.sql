-- ============================================
-- Denti-Choice Seed Data
-- ============================================

USE dentichoice;

-- ============================================
-- 1. ADMINS (password: Admin@123 for Dr. Admin, 123456 for ved)
-- Hash generated with bcryptjs (10 rounds)
-- ============================================
INSERT INTO admins (name, email, password, role) VALUES
('Dr. Admin', 'admin@dentichoice.com', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfl7f2vEXh0S6u6w6p5C3Y5j6M7E1G6S', 'admin'),
('ved', 'ved@gmail.com', '$2b$10$qMw3vU15I22tL/PvUGCADeN.KYLCzpaN5xEthQcf2BDPfcd5vKH8G', 'admin');

-- ============================================
-- 2. DOCTORS
-- ============================================
INSERT INTO doctors (name, email, phone, qualification, experience, specialization, availability, bio, social_links) VALUES
(
  'Dr. Sarah Johnson',
  'sarah.johnson@dentichoice.com',
  '+1-555-0101',
  'DDS, MSD - Orthodontics',
  12,
  'Orthodontics',
  '["Monday","Tuesday","Wednesday","Thursday","Friday"]',
  'Dr. Sarah Johnson is a board-certified orthodontist with over 12 years of experience in creating beautiful smiles. She specializes in modern braces and clear aligner therapy.',
  '{"facebook":"#","twitter":"#","linkedin":"#","instagram":"#"}'
),
(
  'Dr. Michael Chen',
  'michael.chen@dentichoice.com',
  '+1-555-0102',
  'DMD, MS - Endodontics',
  15,
  'Endodontics',
  '["Monday","Wednesday","Friday"]',
  'Dr. Michael Chen is an expert endodontist known for his painless root canal procedures. With 15 years of practice, he has treated over 10,000 patients.',
  '{"facebook":"#","twitter":"#","linkedin":"#","instagram":"#"}'
),
(
  'Dr. Emily Williams',
  'emily.williams@dentichoice.com',
  '+1-555-0103',
  'DDS - Cosmetic Dentistry',
  10,
  'Cosmetic Dentistry',
  '["Tuesday","Thursday","Saturday"]',
  'Dr. Emily Williams transforms smiles with her artistic approach to cosmetic dentistry. She is passionate about smile design and teeth whitening procedures.',
  '{"facebook":"#","twitter":"#","linkedin":"#","instagram":"#"}'
),
(
  'Dr. James Rodriguez',
  'james.rodriguez@dentichoice.com',
  '+1-555-0104',
  'BDS, MDS - Oral Surgery',
  18,
  'Oral Surgery',
  '["Monday","Tuesday","Thursday","Friday"]',
  'Dr. James Rodriguez is a skilled oral surgeon with 18 years of experience in dental implants, wisdom tooth extraction, and reconstructive jaw surgery.',
  '{"facebook":"#","twitter":"#","linkedin":"#","instagram":"#"}'
),
(
  'Dr. Lisa Patel',
  'lisa.patel@dentichoice.com',
  '+1-555-0105',
  'DDS - Pediatric Dentistry',
  8,
  'Pediatric Dentistry',
  '["Monday","Wednesday","Thursday","Saturday"]',
  'Dr. Lisa Patel loves working with children and makes every dental visit fun and comfortable. She specializes in preventive care and early orthodontic assessment.',
  '{"facebook":"#","twitter":"#","linkedin":"#","instagram":"#"}'
),
(
  'Dr. Robert Kim',
  'robert.kim@dentichoice.com',
  '+1-555-0106',
  'DMD, FICOI - Implantology',
  20,
  'Dental Implants',
  '["Tuesday","Wednesday","Friday"]',
  'Dr. Robert Kim is a leading implantologist with over 20 years of experience. He has placed thousands of dental implants with a success rate exceeding 98%.',
  '{"facebook":"#","twitter":"#","linkedin":"#","instagram":"#"}'
);

-- ============================================
-- 3. SERVICES
-- ============================================
INSERT INTO services (name, description, icon, duration, price, sort_order) VALUES
(
  'Teeth Cleaning',
  'Professional dental cleaning to remove plaque, tartar, and stains. Our hygienists use advanced ultrasonic scalers and polishing tools to leave your teeth sparkling clean and healthy.',
  'FaTooth',
  '30-45 mins',
  75.00,
  1
),
(
  'Root Canal',
  'Advanced endodontic treatment to save infected teeth. Our painless root canal procedure removes the infected pulp, cleans the canal, and seals it to prevent future infection.',
  'FaSyringe',
  '60-90 mins',
  500.00,
  2
),
(
  'Teeth Whitening',
  'Professional in-office teeth whitening that can brighten your smile by up to 8 shades. We use the latest LED-accelerated whitening technology for fast, dramatic results.',
  'FaStar',
  '45-60 mins',
  350.00,
  3
),
(
  'Braces',
  'Comprehensive orthodontic treatment with traditional metal braces, ceramic braces, or clear aligners. We create personalized treatment plans for a perfectly aligned smile.',
  'FaTeethOpen',
  'Ongoing',
  3000.00,
  4
),
(
  'Dental Implant',
  'Permanent tooth replacement solution using titanium implants. Our implants look, feel, and function like natural teeth, restoring your smile and confidence.',
  'FaCog',
  '60-120 mins',
  2500.00,
  5
),
(
  'Smile Designing',
  'Complete smile makeover combining multiple cosmetic procedures. We analyze your facial features to design a smile that complements your personality and enhances your appearance.',
  'FaSmile',
  '90-120 mins',
  1500.00,
  6
),
(
  'Cosmetic Dentistry',
  'Enhance your smile with veneers, bonding, and reshaping. Our cosmetic treatments address chips, gaps, discoloration, and misalignment for a stunning, natural-looking result.',
  'FaMagic',
  '45-90 mins',
  800.00,
  7
),
(
  'Tooth Extraction',
  'Safe and painless tooth removal performed by experienced oral surgeons. We offer both simple and surgical extractions with proper anesthesia and aftercare guidance.',
  'FaHandHoldingMedical',
  '30-60 mins',
  200.00,
  8
),
(
  'Emergency Dental Care',
  'Immediate dental care for urgent situations including severe toothache, broken teeth, knocked-out teeth, and dental abscesses. Available with priority scheduling.',
  'FaAmbulance',
  '30-60 mins',
  150.00,
  9
),
(
  'Pediatric Dentistry',
  'Gentle and fun dental care designed especially for children. Our kid-friendly environment and compassionate approach ensure stress-free visits for your little ones.',
  'FaChild',
  '30-45 mins',
  100.00,
  10
);

-- ============================================
-- 4. TESTIMONIALS
-- ============================================
INSERT INTO testimonials (patient_name, review, rating, is_visible) VALUES
(
  'Amanda Sterling',
  'Denti-Choice completely transformed my smile! Dr. Williams did an amazing job with my veneers. The entire team is professional, caring, and makes you feel right at home. I cannot recommend them enough!',
  5,
  1
),
(
  'Marcus Thompson',
  'I was terrified of dentists until I visited Denti-Choice. Dr. Chen performed my root canal with zero pain - I could not believe it! The clinic is state-of-the-art and the staff is incredibly friendly.',
  5,
  1
),
(
  'Priya Sharma',
  'My kids love going to Dr. Patel! She is so patient and gentle with them. The pediatric department is colorful and fun. Finally found a dentist my children actually look forward to visiting.',
  5,
  1
),
(
  'David Mitchell',
  'Got my dental implants done by Dr. Kim and the results are phenomenal. They look and feel exactly like natural teeth. Worth every penny. The follow-up care has been exceptional too.',
  4,
  1
),
(
  'Sofia Rodriguez',
  'The teeth whitening service here is fantastic! My teeth are 6 shades brighter and the results have lasted months. Dr. Williams explained everything clearly and made me very comfortable.',
  5,
  1
),
(
  'James O''Brien',
  'Emergency dental care when I chipped my front tooth on a Saturday. They fit me in within an hour and Dr. Rodriguez fixed it perfectly. Incredibly grateful for their prompt and professional service.',
  5,
  1
);

-- ============================================
-- 5. DEFAULT SETTINGS
-- ============================================
INSERT INTO settings (setting_key, setting_value, setting_type) VALUES
('clinic_name', 'Denti-Choice Dental Clinic', 'text'),
('clinic_logo', '/images/logo.png', 'url'),
('clinic_address', '123 Dental Avenue, Healthcare District, New York, NY 10001', 'text'),
('clinic_email', 'info@dentichoice.com', 'email'),
('clinic_phone', '+1 (555) 123-4567', 'text'),
('clinic_phone_secondary', '+1 (555) 987-6543', 'text'),
('social_facebook', 'https://facebook.com/dentichoice', 'url'),
('social_twitter', 'https://twitter.com/dentichoice', 'url'),
('social_instagram', 'https://instagram.com/dentichoice', 'url'),
('social_linkedin', 'https://linkedin.com/company/dentichoice', 'url'),
('opening_hours', '{"monday":"9:00 AM - 5:00 PM","tuesday":"9:00 AM - 5:00 PM","wednesday":"9:00 AM - 5:00 PM","thursday":"9:00 AM - 5:00 PM","friday":"9:00 AM - 5:00 PM","saturday":"10:00 AM - 2:00 PM","sunday":"Closed"}', 'json'),
('google_maps_url', 'https://maps.google.com/?q=123+Dental+Avenue+New+York', 'url'),
('smtp_host', 'smtp.gmail.com', 'text'),
('smtp_port', '587', 'number'),
('smtp_user', '', 'email'),
('smtp_pass', '', 'text');
