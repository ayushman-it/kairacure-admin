import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clientHospitals } from './data/clientHospitals.js';
import { PlannerSearchPage, PlannerHospitalsPage, ProcedureSelectPage, TripStylePage, JourneyPlanningPage, JourneyResultsPage } from './PlannerSearchPage.jsx';
// import medicalVideoSrc from './assets/143376-782178665.mp4';
import medicalVideoSrc from './assets/new+website+video+desktop+(1).mp4';

const BRAND_NAME = 'Kairacure';
function getApiBase() {
  const configuredBase = import.meta.env.VITE_API_BASE_URL || '/api';
  if (typeof window === 'undefined') return configuredBase;
  const host = window.location.hostname;
  const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  const configuredUrl = String(configuredBase);
  if (!isLocalHost && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/api/i.test(configuredUrl)) {
    return '/api';
  }
  return configuredBase;
}

const API_BASE = getApiBase();
const MEDICAL_VIDEO = medicalVideoSrc;

const PAGE_PATHS = {
  home: '/',
  treatments: '/treatments',
  destinations: '/destinations',
  hospitals: '/hospitals',
  doctors: '/doctors',
  planner: '/plan-my-journey',
  admin: '/admin',
  login: '/login',
  'ai-assistant': '/ai-assistant',
  'treatment-detail': '/treatments/detail',
  'hospital-detail': '/hospitals/detail',
  'doctor-detail': '/doctors/detail',
};

function readStoredPatientSession() {
  if (typeof window === 'undefined') return { token: '', patient: null };
  try {
    const token = window.localStorage.getItem('KairacurePatientToken') || window.localStorage.getItem('kairacurePatientToken') || '';
    const patientJson = window.localStorage.getItem('KairacurePatient') || window.localStorage.getItem('kairacurePatient') || 'null';
    return {
      token,
      patient: JSON.parse(patientJson),
    };
  } catch {
    return { token: '', patient: null };
  }
}

function getPatientAttribution() {
  const { patient } = readStoredPatientSession();
  if (!patient?.patientId) return {};
  return {
    patientId: patient.patientId,
    userId: patient.patientId,
    userName: patient.name || '',
    userEmail: patient.email || '',
  };
}

function formatShortName(name = '') {
  const trimmed = String(name || '').trim();
  return trimmed.length > 16 ? `${trimmed.slice(0, 15)}...` : trimmed;
}

function pageFromPath(pathname) {
  const cleanPath = pathname.replace(/\/$/, '') || '/';
  return Object.entries(PAGE_PATHS).find(([, path]) => path === cleanPath)?.[0] ?? 'home';
}

function pathForPage(page) {
  return PAGE_PATHS[page] ?? '/';
}

const TREATMENT_GROUPS = ['Medical', 'Aesthetic', 'Wellness'];

// Removed hardcoded TREATMENTS - Now using only backend data
const TREATMENTS = [];

const HOSPITALS = clientHospitals;

const INDIA_HOSPITALS = HOSPITALS.filter((hospital) => hospital.country === 'India');

// Removed INDIA_DESTINATIONS - now using buildAvailableDestinations from backend data only

const WHY_US = [
  ['Free Second Opinion', 'Consult top specialists with your medical reports, without extra charges.'],
  ['Lowest cost guarantee', 'Your treatment cost reduces through negotiated hospital and package rates.'],
  ['Free medical expert', 'A dedicated expert helps you choose care and monitors your progress.'],
  ['Seamless travel planning', 'Visa invitation, hotel, airport pickup, and translators are coordinated for you.'],
];

const TRUST_METRICS = [
  ['100k+', 'patient journeys benchmarked'],
  ['38+', 'destination countries tracked'],
  ['1,500+', 'hospital partners mapped'],
  ['48h', 'medical opinion target'],
];

const JOURNEY_FLOW = [
  ['01', 'Share reports', 'Upload case notes and tell us your preferred destination, budget, and travel timeline.'],
  ['02', 'Get opinion and estimate', 'Receive doctor opinion, hospital package, stay, visa, and travel assumptions in one view.'],
  ['03', 'Plan arrival', 'Coordinate visa letter, flights, airport pickup, interpreter, hotel, and admission timing.'],
  ['04', 'Recover and follow up', 'Track discharge support, pharmacy help, follow-up consults, and return travel planning.'],
];

const FREE_SUPPORT = [
  'Medical opinion and cost estimate',
  'Pre-travel consultation',
  'Medical visa invitation letter',
  'Airport pickup and local transport',
  'Hotel or guest house near hospital',
  'Interpreter and translator support',
  'SIM, money exchange, and local guidance',
  'Follow-up care coordination',
];

const COUNTRY_SUPPORT = [
  ['Middle East', 'Arabic support, visa help, family stay planning'],
  ['Africa', 'Case manager guidance, airport pickup, cost clarity'],
  ['CIS', 'Russian language support and specialist matching'],
  ['SAARC', 'Fast hospital quotes and affordable travel planning'],
];

const DEFAULT_HOME_FAQS = [
  { id: 'faq-help', icon: 'fa-hand-holding-medical', question: 'How does Kairacure help patients?', answer: 'We help compare hospitals, doctors, treatment costs in Indian Rupees, appointment slots, travel support, and follow-up steps in one place.', visible: true },
  { id: 'faq-compare', icon: 'fa-code-compare', question: 'Can I compare hospitals before booking?', answer: 'Yes. Patients can compare hospital profile, doctor availability, estimated package, ratings, city, and treatment focus before requesting an appointment.', visible: true },
  { id: 'faq-opinion', icon: 'fa-file-medical', question: 'Is the second opinion support free?', answer: 'The care team can guide report sharing and coordinate available second-opinion options before the patient travels.', visible: true },
  { id: 'faq-number', icon: 'fa-phone-volume', question: 'What happens after I submit my number?', answer: 'A care expert follows up for reports, INR cost estimate, hospital options, doctor selection, and appointment planning.', visible: true },
  { id: 'faq-cost', icon: 'fa-indian-rupee-sign', question: 'Are treatment costs shown in Indian Rupees?', answer: 'Yes. Website estimates are shown in INR by default so patients can understand India treatment packages clearly.', visible: true },
  { id: 'faq-travel', icon: 'fa-plane-arrival', question: 'Can Kairacure help with travel and stay?', answer: 'Yes. The team can coordinate visa invitation, airport pickup, nearby stay, translator support, and follow-up planning.', visible: true },
  { id: 'faq-reports', icon: 'fa-notes-medical', question: 'Which reports should I share?', answer: 'Recent prescriptions, diagnosis summary, lab results, scans, discharge notes, and current medication details help doctors review faster.', visible: true },
  { id: 'faq-admin', icon: 'fa-user-gear', question: 'Can appointments be tracked after booking?', answer: 'Yes. Patient inquiries, appointments, hospital details, and care stages can be tracked from the admin dashboard.', visible: true },
];

const CURRENCIES = {
  USD: { code: 'USD', rate: 1 },
  INR: { code: 'INR', rate: 83 },
  AED: { code: 'AED', rate: 3.67 },
  EUR: { code: 'EUR', rate: 0.92 },
};

// Removed FEATURED_TREATMENTS - will use backend treatments only

function formatCurrency(value, currency = 'INR') {
  const current = CURRENCIES[currency] ?? CURRENCIES.USD;
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency: current.code,
    maximumFractionDigits: 0,
  }).format(value * current.rate);
}

function formatPackageEstimate(value, money) {
  const amount = Number(value || 0);
  return amount > 0 ? `Starting from ${money(amount)}` : 'Cost on request';
}

function totalCost(hospital, treatment) {
  const packageCost = treatment && hospital.tags.includes(treatment.title) ? treatment.packageFrom : hospital.cost.package;
  return packageCost + hospital.cost.flight + hospital.cost.visa + hospital.cost.local + hospital.cost.stay + hospital.cost.service;
}

function hospitalMatchesTreatment(hospital, treatment) {
  if (!hospital || !treatment) return false;
  const tags = Array.isArray(hospital.tags) ? hospital.tags : [];
  return tags.includes(treatment.title) || hospital.specialty === treatment.specialty;
}

function accreditationText(accreditations, fallback = 'Accredited Healthcare Facility') {
  if (Array.isArray(accreditations)) return accreditations.slice(0, 3).join(', ') || fallback;
  return String(accreditations || '').trim() || fallback;
}

const HOSPITAL_PLACEHOLDER_IMAGE = 'https://placehold.co/1200x780/eef4ff/2874fc?text=Hospital+Image';
const HEALTH_ICON_BASE = 'https://healthicons.org/icons/svg/filled';
const HEALTH_ICON_SOURCES = {
  // Using jsDelivr CDN for better CORS support and reliability
  cardiac: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/specialties/cardiology.svg',
  orthopedics: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/specialties/orthopaedics.svg',
  oncology: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/specialties/oncology.svg',
  urology: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/specialties/urology.svg',
  gynecology: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/specialties/gynecology.svg',
  ophthalmology: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/specialties/opthalmology.svg',
  gastroenterology: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/specialties/gastroenterology.svg',
  emergency: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/specialties/accident-and_emergency.svg',
  pediatrics: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/specialties/pediatrics.svg',
  nephrology: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/specialties/nephrology.svg',
  neurology: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/people/neurosurgery.svg',
  ent: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/specialties/ear-nose-and-throat.svg',
  dermatology: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/conditions/skin-cancer.svg',
  respirology: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/specialties/respirology.svg',
  rheumatology: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/specialties/rheumatology.svg',
  endocrinology: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/specialties/endocrinology.svg',
  hematology: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/specialties/hematology.svg',
  hepatology: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/specialties/hepatology.svg',
  spine: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/body/spine.svg',
  dental: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/body/tooth.svg',
  hair: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/body/head.svg',
  infertility: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/body/female-reproductive_system.svg',
  wellness: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/specialties/gym.svg',
  plastic: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/specialties/surgical-department.svg',
  general: 'https://cdn.jsdelivr.net/npm/healthicons@0.1.0/public/icons/svg/outline/specialties/outpatient.svg',
};

function getTreatmentIconKind(treatment = {}) {
  const text = `${treatment.id || ''} ${treatment.title || ''} ${treatment.specialty || ''}`.toLowerCase();

  // Cardiac & Heart
  if (/cardiac|heart|cabg|valve|angioplasty|bypass|stent/.test(text)) return 'cardiac';

  // Orthopedics & Joints
  if (/ortho|joint|knee|hip|bone|sports|fracture|arthro/.test(text)) return 'orthopedics';

  // Oncology & Cancer
  if (/oncology|cancer|chemo|tumou?r|radiation/.test(text)) return 'oncology';

  // Gastroenterology
  if (/gastro|stomach|liver|colon|digest|intestin|bowel/.test(text)) return 'gastroenterology';

  // Neurology & Brain
  if (/neuro|brain|stroke|epilep|parkinson|alzheimer/.test(text)) return 'neurology';
  if (/spine|spinal|disc|vertebra/.test(text)) return 'spine';

  // Urology & Kidney
  if (/urology|kidney|stone|prostat|bladder|dialysis/.test(text)) {
    if (/dialysis/.test(text)) return 'dialysis';
    if (/kidney/.test(text)) return 'kidney';
    return 'urology';
  }

  // Gynecology & Women's Health
  if (/gynecology|gynaecology|gyne|gynae|ovarian|uterus|cervix/.test(text)) return 'gynecology';
  if (/fertility|ivf|infertility/.test(text)) return 'infertility';
  if (/pregnancy|prenatal|antenatal|obstetric/.test(text)) return 'pregnancy';
  if (/maternal|newborn/.test(text)) return 'maternal';

  // ENT (Ear, Nose, Throat)
  if (/ent|ear|nose|throat|tonsil|sinus/.test(text)) return 'ent';

  // Ophthalmology & Eye
  if (/eye|ophthalm|cataract|retina|vision|lasik|glaucoma/.test(text)) return 'ophthalmology';

  // Dental
  if (/dental|tooth|teeth|oral|gum|implant/.test(text)) return 'dental';

  // Hair & Skin
  if (/hair|transplant/.test(text)) return 'hair';
  if (/skin|derma|cosmetic|aesthetic/.test(text)) return 'dermatology';

  // Surgery & Procedures
  if (/transplant/.test(text)) return 'transplant';
  if (/plastic|cosmetic/.test(text)) return 'plastic';
  if (/surgery|surgical|operation/.test(text)) return 'surgery';

  // Respiratory
  if (/lung|respiratory|asthma|copd|pneumonia/.test(text)) return 'respirology';

  // Wellness & Preventive
  if (/wellness|health|checkup|preventive|screening/.test(text)) return 'wellness';
  if (/nutrition|diet|weight/.test(text)) return 'nutrition';
  if (/mental|psychiatry|psychology|therapy/.test(text)) return 'mental';
  if (/physio|physical therapy|rehabilitation/.test(text)) return 'physiotherapy';

  // Emergency & Critical Care
  if (/emergency|trauma|accident|icu|critical/.test(text)) return 'emergency';

  // Pediatrics
  if (/pediatric|paediatric|child|neonat|infant/.test(text)) return 'pediatrics';

  // Blood & Hematology
  if (/blood|hematology|haematology|transfusion|anemia/.test(text)) return 'hematology';

  // Endocrinology
  if (/diabetes|thyroid|hormone|endocrin/.test(text)) return 'endocrinology';

  // Other Specialties
  if (/nephrology/.test(text)) return 'nephrology';
  if (/hepatology/.test(text)) return 'hepatology';
  if (/rheumatology|arthritis/.test(text)) return 'rheumatology';

  return 'general';
}

function getHospitalImage(hospital) {
  return String(hospital?.image || '').trim() || HOSPITAL_PLACEHOLDER_IMAGE;
}

function handleImageFallback(event) {
  if (event.currentTarget.src !== HOSPITAL_PLACEHOLDER_IMAGE) {
    event.currentTarget.src = HOSPITAL_PLACEHOLDER_IMAGE;
  }
}

function StarRating({ rating }) {
  return (
    <span className="star-rating" aria-label={`${rating} star rating`}>
      <span>
        {Array.from({ length: 5 }).map((_, index) => (
          <i className="fa-solid fa-star" key={index} aria-hidden="true" />
        ))}
      </span>
      <strong>{rating}</strong>
    </span>
  );
}



const SEARCH_ALIASES = {
  cardiac: ['cariac', 'heart', 'cardiology', 'bypass', 'cabg', 'angioplasty'],
  orthopedics: ['ortho', 'bone', 'joint', 'knee', 'hip', 'arthritis'],
  oncology: ['cancer', 'tumor', 'chemo', 'radiation'],
  spine: ['back pain', 'disc', 'spinal', 'neck pain'],
  urology: ['kidney', 'stone', 'prostate', 'urine'],
  infertility: ['ivf', 'fertility', 'pregnancy'],
  hair: ['hair loss', 'baldness', 'graft'],
  dental: ['teeth', 'implant', 'smile'],
  plastic: ['cosmetic', 'aesthetic', 'rhinoplasty'],
  ophthalmology: ['eye', 'cataract', 'lasik', 'retina'],
};

function normalizeSearch(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function getTreatmentDisplayTitle(treatment = {}) {
  let displayTitle = treatment.title || 'Treatment';
  displayTitle = displayTitle
    .replace(/Other specified certain joint disorders, not elsewhere classified/gi, 'Joint Treatment')
    .replace(/Abrasion of knee/gi, 'Knee Treatment')
    .replace(/Other specified.*not elsewhere classified/gi, 'Specialized Treatment')
    .replace(/Certain disorders.*not elsewhere classified/gi, 'Medical Treatment')
    .replace(/Inflammatory arthropathies, unspecified/gi, 'Arthritis Treatment')
    .replace(/Other specified/gi, 'Specialized')
    .replace(/not elsewhere classified/gi, '')
    .replace(/,\s*$/g, '')
    .trim();

  return displayTitle.length > 42 ? `${displayTitle.slice(0, 39)}...` : displayTitle;
}

function getTreatmentPageTitle(treatment = {}) {
  const displayTitle = getTreatmentDisplayTitle(treatment);
  return /treatment$/i.test(displayTitle) ? displayTitle : `${displayTitle} Treatment`;
}

function hasUsefulTreatmentDescription(description = '') {
  const text = String(description || '').trim();
  if (text.length < 24) return false;
  return !/^WHO ICD-11 MMS mapped condition/i.test(text);
}

function buildTreatmentMeaning(treatment = {}) {
  const displayTitle = getTreatmentDisplayTitle(treatment);
  const pageTitle = getTreatmentPageTitle(treatment);
  const rawCondition = treatment.icdMatchedText || treatment.icdTitle || treatment.title || displayTitle;
  const condition = getTreatmentDisplayTitle({ title: rawCondition });
  const code = treatment.icdCode || treatment.procedureCode || treatment.code || '';
  const source = treatment.sourceSystem || (code ? 'ICD-11 medical catalog' : 'Treatment catalog');
  const release = treatment.sourceRelease || '';
  const backendDescription = String(treatment.description || '').trim();
  const description = hasUsefulTreatmentDescription(backendDescription)
    ? backendDescription
    : `${pageTitle} is mapped as ${condition}. Kairacure uses this treatment mapping to understand the patient case, prepare the report checklist, shortlist suitable hospitals, and build a practical journey plan.`;

  return {
    code,
    condition,
    description,
    displayTitle,
    pageTitle,
    release,
    source,
  };
}

function withBackendHospitalDefaults(item, index = 0) {
  const fallback = INDIA_HOSPITALS[index % INDIA_HOSPITALS.length] || INDIA_HOSPITALS[0];
  const tags = Array.isArray(item.tags) && item.tags.length
    ? item.tags
    : String(item.treatments || item.specialty || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  const packageFrom = Number(item.packageFrom || item.cost?.package || fallback.cost.package || 0);

  return {
    ...fallback,
    ...item,
    id: item._id || item.id || `backend-hospital-${index + 1}`,
    name: item.name || fallback.name,
    city: item.city || fallback.city,
    country: item.country || 'India',
    specialty: item.specialty || tags[0] || fallback.specialty,
    tags: tags.length ? tags : fallback.tags,
    image: item.image || '',
    galleryImages: item.galleryImages || fallback.galleryImages || [],
    patientReviews: item.patientReviews || fallback.patientReviews || [],
    doctor: item.doctor || fallback.doctor,
    doctorTitle: item.doctorTitle || fallback.doctorTitle,
    doctorImage: item.doctorImage || item.profileImage || fallback.doctorImage,
    doctorFocus: Array.isArray(item.doctorFocus) ? item.doctorFocus : fallback.doctorFocus || [],
    accreditations: item.accreditations || fallback.accreditations || [],
    rating: Number(item.rating || fallback.rating || 4.8),
    summary: item.summary || fallback.summary,
    cost: {
      ...fallback.cost,
      ...(item.cost || {}),
      package: packageFrom || fallback.cost.package,
    },
  };
}

function withBackendTreatmentDefaults(item, index = 0) {
  // Use backend data only - no fallback to dummy treatments
  const title = item.title || item.icdTitle || `Treatment ${index + 1}`;
  return {
    ...item,
    id: item._id || item.id || normalizeSearch(title).replace(/\s+/g, '-') || `backend-treatment-${index + 1}`,
    title,
    group: item.group || item.category || item.specialty || item.subtitle || 'Medical',
    specialty: item.specialty || item.category || item.group || item.subtitle || 'General',
    category: item.category || item.group || item.specialty || 'Medical',
    procedureCode: item.procedureCode || item.icdCode || item.code || '',
    icdCode: item.icdCode || item.procedureCode || item.code || '',
    icdUri: item.icdUri || '',
    icdEntityId: item.icdEntityId || '',
    icdBrowserUrl: item.icdBrowserUrl || '',
    sourceSystem: item.sourceSystem || '',
    packageFrom: Number(item.packageFrom || 0),
    image: item.image || '',
    description: item.description || '',
    value: Number(item.value || 85),
  };
}

function getSearchOptionsFromData(query, treatments, hospitals) {
  const search = normalizeSearch(query);
  if (!search) return [];

  const options = [];
  treatments.forEach((treatment) => {
    const aliases = SEARCH_ALIASES[treatment.id] ?? [];
    const haystack = normalizeSearch([treatment.title, treatment.group, treatment.specialty, treatment.category, treatment.procedureCode, treatment.icdCode, treatment.sourceSystem, ...aliases].join(' '));
    if (haystack.includes(search) || aliases.some((alias) => normalizeSearch(alias).includes(search))) {
      options.push({ type: 'Treatment', label: treatment.title, meta: treatment.icdCode ? `ICD-11 ${treatment.icdCode} - ${treatment.group}` : `${treatment.group} package estimate`, treatment });
    }
  });

  hospitals.forEach((hospital) => {
    const tags = Array.isArray(hospital.tags) ? hospital.tags : [];
    const doctorFocus = Array.isArray(hospital.doctorFocus) ? hospital.doctorFocus : [];
    const haystack = normalizeSearch([hospital.name, hospital.city, hospital.country, hospital.specialty, hospital.doctor, ...tags, ...doctorFocus].join(' '));
    if (haystack.includes(search)) {
      options.push({ type: 'Hospital', label: hospital.name, meta: `${hospital.city}, ${hospital.country}`, hospital });
      options.push({ type: 'Doctor', label: hospital.doctor, meta: `${hospital.doctorTitle} - ${hospital.name}`, hospital });
    }
  });

  buildAvailableDestinations(hospitals).forEach((destination) => {
    if (normalizeSearch(destination.country).includes(search)) {
      options.push({ type: 'Destination', label: destination.country, meta: `${destination.hospitals} hospitals, ${destination.doctors} doctors`, destination });
    }
  });

  return options.slice(0, 8);
}

function getSearchOptions(query) {
  return getSearchOptionsFromData(query, TREATMENTS, INDIA_HOSPITALS);
}

function Breadcrumbs({ items }) {
  return (
    <div className="profile-breadcrumb">
      {items.map((item, index) => (
        <React.Fragment key={`${item.label}-${index}`}>
          {item.onClick ? (
            <button onClick={item.onClick} type="button">{item.label}</button>
          ) : (
            <span>{item.label}</span>
          )}
          {index < items.length - 1 && <em>/</em>}
        </React.Fragment>
      ))}
    </div>
  );
}

function hospitalGallery(hospital) {
  return [
    getHospitalImage(hospital),
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1504439468489-c8920d796a29?auto=format&fit=crop&w=1000&q=80',
  ];
}

const DOCTOR_EDUCATION = [
  'MBBS from a reputed medical college',
  'MS / specialist training in the core clinical department',
  'Advanced fellowship and comprehensive specialty training',
  'International clinical exposure and high-volume procedure experience',
];

const PATIENT_REVIEWS = [
  ['Jean Luc Bernard', 'France', 'The team explained the treatment plan, hospital stay, and travel estimate before I confirmed my visit.'],
  ['Fewzan Abdella', 'Ethiopia', 'Doctor profile, procedure cost, and hospital coordination were clear from the first consultation.'],
  ['Maria Gomez', 'Spain', 'The care coordinator helped compare hospitals and understand the complete recovery budget.'],
];

const FOOTER_COLUMNS = [
  ['Treatments', ['Cardiac Surgery', 'Orthopedics', 'Oncology', 'Spine Surgery', 'Ophthalmology', 'Hair Transplant']],
  ['India Network', ['Delhi NCR hospitals', 'Mumbai care', 'Bangalore doctors', 'Chennai hospitals', 'Patient travel help', 'Recovery stays']],
  ['Patient Services', ['Cost estimate', 'Doctor opinion', 'Hospital quote', 'Travel planning', 'Airport pickup', 'Follow-up care']],
  ['Resources', ['Hospital listings', 'Doctor profiles', 'Treatment packages', 'Patient reviews', 'FAQs', 'Support centre']],
];

const ADMIN_STAGES = ['Lead', 'Reports received', 'Hospital quote', 'Doctor opinion', 'Visa support', 'Admitted'];

const ADMIN_AGENTS = [
  { id: 'AG-104', name: 'Riya Malhotra', region: 'Africa desk', activeCases: 24, conversion: '42%', sla: '1h 12m' },
  { id: 'AG-118', name: 'Aman Qureshi', region: 'Middle East', activeCases: 18, conversion: '39%', sla: '54m' },
  { id: 'AG-121', name: 'Nisha Rao', region: 'India partners', activeCases: 31, conversion: '47%', sla: '1h 35m' },
];

const ADMIN_INQUIRIES = [
  { id: 'INQ-7842', patient: 'Omar Al Farsi', country: 'UAE', treatment: 'Cardiac Sciences', stage: 'Hospital quote', agent: 'Aman Qureshi', priority: 'Urgent' },
  { id: 'INQ-7848', patient: 'Grace Wanjiku', country: 'Kenya', treatment: 'Orthopedics', stage: 'Reports received', agent: 'Riya Malhotra', priority: 'High' },
  { id: 'INQ-7851', patient: 'Maria Gomez', country: 'Spain', treatment: 'Oncology', stage: 'Doctor opinion', agent: 'Nisha Rao', priority: 'Normal' },
];

const ADMIN_APPOINTMENTS = [
  { time: '10:30', patient: 'Jean Luc Bernard', hospital: 'Fortis Escorts Heart Institute', doctor: 'Dr. Ritu Khanna', mode: 'Video consult', status: 'Confirmed' },
  { time: '12:00', patient: 'Fewzan Abdella', hospital: 'Artemis Hospital', doctor: 'Dr. Karan Malhotra', mode: 'Coordinator call', status: 'Pending reports' },
  { time: '16:15', patient: 'Omar Al Farsi', hospital: 'Indraprastha Apollo Hospital', doctor: 'Dr. Sameer Bhatia', mode: 'Hospital slot', status: 'Tentative' },
];

const ADMIN_COST_ROWS = [
  { surgery: 'CABG surgery', treatment: 'Cardiac Sciences', hospital: 'Fortis Escorts Heart Institute', stay: '7 days', package: 5200, floor: 4800, ceiling: 6200, owner: 'Medical ops' },
  { surgery: 'Total knee replacement', treatment: 'Orthopedics', hospital: 'Fortis Hospital, Noida', stay: '5 days', package: 3300, floor: 2900, ceiling: 4100, owner: 'Hospital desk' },
  { surgery: 'Robotic prostate surgery', treatment: 'Urology', hospital: 'Artemis Hospital', stay: '4 days', package: 4500, floor: 4100, ceiling: 5400, owner: 'Costing team' },
  { surgery: 'Retina surgery', treatment: 'Ophthalmology', hospital: 'The Sight Avenue', stay: 'Day care', package: 950, floor: 800, ceiling: 1300, owner: 'Partner ops' },
];

function Header({ currentPatient, hospitals = [], treatments = [], onLogoutPatient, openSearchOption, page, setPage }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const searchRef = React.useRef(null);
  const inputRef = React.useRef(null);

  const nav = [
    ['home', 'Home'],
    ['treatments', 'Treatments'],
    ['destinations', 'Destinations'],
    ['hospitals', 'Hospitals'],
    ['planner', 'Plan My Journey'],
  ];

  const STATIC_SUGGESTIONS = [
    { type: 'Treatment', label: 'Heart Bypass Surgery', meta: 'Cardiac · Starting ₹2.5L', icon: 'fa-heart-pulse' },
    { type: 'Treatment', label: 'Knee Replacement', meta: 'Orthopedics · Starting ₹1.8L', icon: 'fa-bone' },
    { type: 'Treatment', label: 'Cancer Treatment', meta: 'Oncology · Starting ₹3L', icon: 'fa-ribbon' },
    { type: 'Hospital', label: 'Apollo Hospitals', meta: 'Delhi, India', icon: 'fa-hospital' },
    { type: 'Hospital', label: 'Fortis Healthcare', meta: 'Mumbai, India', icon: 'fa-hospital' },
    { type: 'Destination', label: 'Delhi / NCR', meta: '120+ hospitals available', icon: 'fa-location-dot' },
    { type: 'Destination', label: 'Chennai', meta: '80+ hospitals available', icon: 'fa-location-dot' },
  ];

  const TYPE_ICON = {
    Treatment: 'fa-stethoscope',
    Hospital: 'fa-hospital',
    Doctor: 'fa-user-doctor',
    Destination: 'fa-location-dot',
  };
  const TYPE_COLOR = {
    Treatment: '#0d2f5d',
    Hospital: '#0d2f5d',
    Doctor: '#0d2f5d',
    Destination: '#0d4d3a',
  };

  const patientLabel = formatShortName(currentPatient?.name || currentPatient?.email || 'User');
  const navigate = (id) => { setPage(id); setMobileMenuOpen(false); };
  const logoutAndClose = () => { onLogoutPatient(); setMobileMenuOpen(false); };

  // Generate suggestions from query
  const computeSuggestions = (q) => {
    const trimmed = q.trim();
    if (!trimmed) return [];
    return getSearchOptionsFromData(trimmed, treatments, hospitals.length ? hospitals : []).map((opt) => ({
      ...opt,
      icon: TYPE_ICON[opt.type] || 'fa-magnifying-glass',
    }));
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setActiveIdx(-1);
    if (val.trim()) {
      const results = computeSuggestions(val);
      setSuggestions(results.length ? results : [{ type: 'Search', label: `Search "${val}"`, meta: 'Browse all results', icon: 'fa-magnifying-glass', query: val }]);
    } else {
      setSuggestions([]);
    }
    setShowSugg(true);
  };

  const handleFocus = () => {
    setShowSugg(true);
    if (!searchQuery.trim()) setSuggestions([]);
  };

  const handleSelect = (sugg) => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSugg(false);
    if (sugg.treatment) { openSearchOption?.(sugg); }
    else if (sugg.hospital) { openSearchOption?.(sugg); }
    else if (sugg.destination) { openSearchOption?.(sugg); }
    else { setPage('hospitals'); }
  };

  const handleKeyDown = (e) => {
    if (!showSugg || !suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIdx >= 0) handleSelect(suggestions[activeIdx]);
      else if (searchQuery.trim()) { setPage('hospitals'); setShowSugg(false); }
    }
    else if (e.key === 'Escape') { setShowSugg(false); setActiveIdx(-1); }
  };

  // Close on outside click
  React.useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSugg(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displaySuggestions = searchQuery.trim() ? suggestions : STATIC_SUGGESTIONS;

  return (
    <header className="site-header">
      {/* Brand */}
      <button className="brand-lockup" onClick={() => navigate('home')} type="button">
        <img src="./src/assets/kairacure-logo.png" alt="Kaira Cure" className="brand-logo-img" />
      </button>

      {/* Nav */}
      <nav className="desktop-nav">
        {nav.map(([id, label]) => (
          <button className={page === id ? 'active' : ''} key={id} onClick={() => navigate(id)} type="button">
            {label}
          </button>
        ))}
      </nav>

      {/* ── Beautiful Search Bar ── */}
      <div className="hs-wrap" ref={searchRef}>
        <div className={`hs-box${showSugg ? ' hs-focused' : ''}`}>
          <i className="fa-solid fa-magnifying-glass hs-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            className="hs-input"
            placeholder="Search treatments, hospitals, cities..."
            value={searchQuery}
            onChange={handleChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            aria-label="Search"
            aria-autocomplete="list"
            aria-expanded={showSugg}
          />
          {searchQuery && (
            <button className="hs-clear" type="button" onClick={() => { setSearchQuery(''); setSuggestions([]); inputRef.current?.focus(); }} aria-label="Clear">
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSugg && (
          <div className="hs-dropdown" role="listbox">
            {!searchQuery.trim() && (
              <div className="hs-dropdown-label">Popular searches</div>
            )}
            {displaySuggestions.map((sugg, i) => (
              <button
                key={i}
                className={`hs-item${activeIdx === i ? ' hs-item-active' : ''}`}
                type="button"
                role="option"
                aria-selected={activeIdx === i}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => handleSelect(sugg)}
              >
                <span className="hs-item-icon" style={{ background: `${TYPE_COLOR[sugg.type] || '#64748b'}18`, color: TYPE_COLOR[sugg.type] || '#64748b' }}>
                  <i className={`fa-solid ${sugg.icon || TYPE_ICON[sugg.type] || 'fa-magnifying-glass'}`} aria-hidden="true" />
                </span>
                <span className="hs-item-text">
                  <span className="hs-item-label">{sugg.label}</span>
                  <span className="hs-item-meta">{sugg.meta}</span>
                </span>
                <span className="hs-item-type">{sugg.type}</span>
              </button>
            ))}
            {searchQuery.trim() && suggestions.length === 0 && (
              <div className="hs-no-results">
                <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                No results for &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auth */}
      <div className="header-actions desktop-header-actions">
        {currentPatient ? (
          <button className="header-cta header-user-cta" onClick={logoutAndClose} title={currentPatient.name || currentPatient.email} type="button">
            <i className="fa-solid fa-user-check" aria-hidden="true" />
            <span>{patientLabel}</span>
            <b>Logout</b>
          </button>
        ) : (
          <div className="header-auth-btns">
            <button className="header-login-btn" onClick={() => navigate('login')} type="button">Login</button>
            <span className="header-auth-sep">|</span>
            <button className="header-signup-btn" onClick={() => navigate('login')} type="button">Sign Up</button>
          </div>
        )}
      </div>

      {/* Mobile toggle */}
      <button aria-expanded={mobileMenuOpen} aria-label="Open menu" className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(true)} type="button">
        <i className="fa-solid fa-bars" aria-hidden="true" />
      </button>
      {mobileMenuOpen && <button aria-label="Close menu overlay" className="mobile-menu-backdrop" onClick={() => setMobileMenuOpen(false)} type="button" />}
      <aside className={mobileMenuOpen ? 'mobile-offcanvas open' : 'mobile-offcanvas'} aria-hidden={!mobileMenuOpen}>
        <div className="mobile-offcanvas-head">
          <strong>Menu</strong>
          <button aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} type="button">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        {/* Mobile search */}
        <div className="mobile-search-wrap">
          <div className="hs-box">
            <i className="fa-solid fa-magnifying-glass hs-icon" aria-hidden="true" />
            <input className="hs-input" placeholder="Search treatments, hospitals..." autoComplete="off" />
          </div>
        </div>
        <nav className="mobile-nav">
          {nav.map(([id, label]) => (
            <button className={page === id ? 'active' : ''} key={id} onClick={() => navigate(id)} type="button">
              {label}
            </button>
          ))}
        </nav>
        {currentPatient ? (
          <button className="header-cta mobile-header-cta header-user-cta" onClick={logoutAndClose} title={currentPatient.name || currentPatient.email} type="button">
            <i className="fa-solid fa-user-check" aria-hidden="true" />
            <span>{patientLabel}</span>
            <b>Logout</b>
          </button>
        ) : (
          <div className="header-auth-btns mobile-auth-btns">
            <button className="header-login-btn" onClick={() => navigate('login')} type="button">Login</button>
            <button className="header-signup-btn" onClick={() => navigate('login')} type="button">Sign Up</button>
          </div>
        )}
      </aside>
    </header>
  );
}

function Hero({ onFindCare, onSelectSearchOption, query, searchOptions, setQuery, setPage, setAiInitialMessage }) {
  const WELCOME = 'Tell me your treatment, city, or budget — I\'ll suggest the right hospital, doctor, and next steps.';
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const threadRef = React.useRef(null);

  React.useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const trimmed = (text || inputVal).trim();
    if (!trimmed || loading) return;
    const userMsg = { role: 'user', content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInputVal('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ai-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history: next.slice(-8) }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || 'No response. Try again.' }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Start the API server to enable live AI responses.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(); };
  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  return (
    <section className="hero-section">
      <video className="section-video-bg" autoPlay muted loop playsInline aria-hidden="true">
        <source src={MEDICAL_VIDEO} type="video/mp4" />
      </video>
      <div className="hero-overlay" aria-hidden="true" />

      {/* Left copy */}
      <div className="hero-copy">
        <div className="hero-tag">
          <i className="fa-solid fa-shield-heart" aria-hidden="true" />
          Patient-first medical travel
        </div>
        <h1>Plan Your Medical Journey <span>Across India</span></h1>
        <p>Compare verified hospitals, get specialist doctors, estimate costs in INR, and plan your complete travel — all in one place, at no extra cost.</p>
        <div className="hero-stats">
          <span><strong>1,00,000+</strong>Patients served</span>
          <span><strong>1,500+</strong>Hospital partners</span>
          <span><strong>4.8 ★</strong>Average rating</span>
        </div>
        <div className="hero-action-row">
          <button className="hero-btn-primary" onClick={() => setPage('planner')} type="button">
            <i className="fa-solid fa-route" aria-hidden="true" /> Plan My Journey
          </button>
          <button className="hero-btn-secondary" onClick={() => setPage('treatments')} type="button">
            Browse Treatments
          </button>
        </div>
      </div>

      {/* Right — inline AI chat card */}
      <div className="hero-visual ai-chat-card hero-chat-card">
        {/* Card header */}
        <div className="hcc-header">
          <div>
            <strong className="hcc-title">Kaira Assistant</strong>
            <span className="hcc-online"><span className="hcc-dot" />Online · Kaira AI</span>
          </div>
          <button className="hcc-badge hcc-open-full-btn" type="button" onClick={() => setPage('ai-assistant')} title="Open full chat">
            <i className="fa-solid fa-up-right-from-square" aria-hidden="true" />
          </button>
        </div>

        {/* Message thread */}
        <div className="hcc-thread" ref={threadRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`hcc-bubble-row${msg.role === 'user' ? ' hcc-bubble-row-user' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="hcc-avatar-icon"><i className="fa-solid fa-robot" aria-hidden="true" /></div>
              )}
              <div className={`hcc-bubble${msg.role === 'user' ? ' hcc-bubble-user' : ''}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="hcc-bubble-row">
              <div className="hcc-avatar-icon"><i className="fa-solid fa-robot" aria-hidden="true" /></div>
              <div className="hcc-bubble hcc-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
        </div>

        {/* Quick chips — show only if just welcome message */}
        {messages.length === 1 && (
          <div className="hcc-chips">
            <button onClick={() => sendMessage('Best hospitals for heart surgery')} type="button">
              <i className="fa-solid fa-heart-pulse" aria-hidden="true" /> Heart Surgery
            </button>
            <button onClick={() => sendMessage('Knee replacement cost in Delhi')} type="button">
              <i className="fa-solid fa-bone" aria-hidden="true" /> Knee Replacement
            </button>
            <button onClick={() => sendMessage('What reports should I upload?')} type="button">
              <i className="fa-solid fa-file-medical" aria-hidden="true" /> My Reports
            </button>
          </div>
        )}

        {/* Input */}
        <form className="hcc-input-row" onSubmit={handleSubmit}>
          <div className="hcc-input-wrap">
            <input
              className="hcc-input"
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type your health question..."
              value={inputVal}
            />
          </div>
          <button className="hcc-send-btn" type="submit" aria-label="Send" disabled={loading}>
            <i className="fa-solid fa-paper-plane" aria-hidden="true" />
          </button>
        </form>

        <p className="hcc-disclaimer">Kaira AI — please double-check all responses</p>
      </div>
    </section>
  );
}

function MedicalVideoBackdrop() {
  return (
    <video className="section-video-bg soft-section-video" autoPlay muted loop playsInline aria-hidden="true">
      <source src={MEDICAL_VIDEO} type="video/mp4" />
    </video>
  );
}

function TreatmentVectorIcon({ treatment }) {
  const stroke = 'currentColor';
  const iconProps = { fill: 'none', stroke, strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2.4 };
  const iconKind = getTreatmentIconKind(treatment);
  const iconClasses = {
    cardiac: 'fa-heart-pulse',
    orthopedics: 'fa-bone',
    oncology: 'fa-ribbon',
    spine: 'fa-staff-snake',
    urology: 'fa-prescription-bottle-medical',
    gynecology: 'fa-venus',
    infertility: 'fa-baby',
    hair: 'fa-person',
    dental: 'fa-tooth',
    plastic: 'fa-user-doctor',
    wellness: 'fa-spa',
    'neuro-wellness': 'fa-brain',
    ophthalmology: 'fa-eye',
    gastroenterology: 'fa-capsules',
    emergency: 'fa-truck-medical',
    pediatrics: 'fa-child',
    general: 'fa-briefcase-medical',
  };

  return <i aria-hidden="true" className={`fa-solid ${iconClasses[iconKind] || iconClasses.general} treatment-vector-icon`} />;

  if (iconKind === 'wellness') {
    return (
      <svg aria-hidden="true" viewBox="0 0 64 64">
        <path {...iconProps} d="M32 49c0-13 8-22 20-27-1 16-8 25-20 27Z" />
        <path {...iconProps} d="M32 49c0-13-8-22-20-27 1 16 8 25 20 27Z" />
        <path {...iconProps} d="M32 49V17" />
        <path {...iconProps} d="M32 17c7 7 7 16 0 24-7-8-7-17 0-24Z" />
      </svg>
    );
  }

  if (iconKind === 'dental') {
    return (
      <svg aria-hidden="true" viewBox="0 0 64 64">
        <path {...iconProps} d="M22 15c5-3 8 1 10 1s5-4 10-1c8 5 5 18 1 27-2 5-4 9-7 8-3-1-1-10-4-10s-1 9-4 10c-3 1-5-3-7-8-4-9-7-22 1-27Z" />
        <path {...iconProps} d="M25 25h14" />
      </svg>
    );
  }

  if (iconKind === 'orthopedics') {
    return (
      <svg aria-hidden="true" viewBox="0 0 64 64">
        <path {...iconProps} d="M23 14c8 3 8 11 3 16l-7 7c-3 3-3 8 0 11s8 3 11 0l7-7c5-5 13-5 16 3" />
        <path {...iconProps} d="M17 22h12" />
        <path {...iconProps} d="M35 42h12" />
        <path {...iconProps} d="M39 19l6-6 6 6" />
      </svg>
    );
  }

  if (iconKind === 'oncology') {
    return (
      <svg aria-hidden="true" viewBox="0 0 64 64">
        <circle {...iconProps} cx="29" cy="29" r="15" />
        <path {...iconProps} d="M40 40l11 11" />
        <path {...iconProps} d="M24 23c6-6 15-1 13 7-2 10-15 11-18 3-2-5 2-9 7-8" />
        <path {...iconProps} d="M29 16v8M17 29h8M29 38v8" />
      </svg>
    );
  }

  if (iconKind === 'spine') {
    return (
      <svg aria-hidden="true" viewBox="0 0 64 64">
        <path {...iconProps} d="M34 10c-8 7-8 14-1 21s7 15-1 23" />
        <path {...iconProps} d="M25 15h15M24 23h16M26 31h14M24 39h16M25 47h15" />
        <path {...iconProps} d="M18 17c-4 6-4 14 0 20" />
      </svg>
    );
  }

  if (iconKind === 'urology') {
    return (
      <svg aria-hidden="true" viewBox="0 0 64 64">
        <path {...iconProps} d="M22 17c-6 0-10 5-9 12 1 8 7 12 13 10 5-2 4-9 4-14 0-5-2-8-8-8Z" />
        <path {...iconProps} d="M42 17c6 0 10 5 9 12-1 8-7 12-13 10-5-2-4-9-4-14 0-5 2-8 8-8Z" />
        <path {...iconProps} d="M30 36v7c0 4-3 5-7 6" />
        <path {...iconProps} d="M34 36v7c0 4 3 5 7 6" />
      </svg>
    );
  }

  if (iconKind === 'infertility') {
    return (
      <svg aria-hidden="true" viewBox="0 0 64 64">
        <path {...iconProps} d="M20 30c0-10 7-18 16-18s16 8 16 18c0 12-8 21-16 21s-16-9-16-21Z" />
        <path {...iconProps} d="M30 34c0-4 3-7 7-7 3 0 6 3 6 6 0 5-4 8-9 8-3 0-5-2-5-5" />
        <path {...iconProps} d="M36 23v-5M32 18h8" />
        <path {...iconProps} d="M27 48c5 4 12 4 17 0" />
      </svg>
    );
  }

  if (iconKind === 'gynecology') {
    return (
      <svg aria-hidden="true" viewBox="0 0 64 64">
        <circle {...iconProps} cx="32" cy="23" r="11" />
        <path {...iconProps} d="M32 34v18" />
        <path {...iconProps} d="M24 44h16" />
        <path {...iconProps} d="M23 24c4 6 14 6 18 0" />
      </svg>
    );
  }

  if (iconKind === 'hair') {
    return (
      <svg aria-hidden="true" viewBox="0 0 64 64">
        <path {...iconProps} d="M17 38c0-15 10-26 25-26 7 5 10 12 10 22" />
        <path {...iconProps} d="M18 38c5-1 9-4 12-10 4 7 10 10 19 10" />
        <path {...iconProps} d="M23 43c2 6 7 9 13 9s11-3 13-9" />
        <path {...iconProps} d="M24 22c-4 3-7 8-8 14" />
      </svg>
    );
  }

  if (iconKind === 'plastic') {
    return (
      <svg aria-hidden="true" viewBox="0 0 64 64">
        <path {...iconProps} d="M25 13c-7 5-10 13-9 23 1 11 8 18 17 18s16-7 17-18c1-10-2-18-9-23" />
        <path {...iconProps} d="M24 33c4-3 8-3 12 0" />
        <path {...iconProps} d="M27 43c4 3 9 3 13 0" />
        <path {...iconProps} d="M19 22c8 4 18 4 30 0" />
      </svg>
    );
  }

  if (iconKind === 'neuro-wellness') {
    return (
      <svg aria-hidden="true" viewBox="0 0 64 64">
        <path {...iconProps} d="M22 19c-6 2-10 8-9 15 1 9 8 15 17 15h9c8 0 14-6 14-14 0-7-5-13-12-14-2-6-8-9-14-7-2 1-4 2-5 5Z" />
        <path {...iconProps} d="M25 24v17M33 20v25M41 26v16" />
        <path {...iconProps} d="M18 34h12M36 34h12" />
      </svg>
    );
  }

  if (iconKind === 'ophthalmology') {
    return (
      <svg aria-hidden="true" viewBox="0 0 64 64">
        <path {...iconProps} d="M9 32s8-14 23-14 23 14 23 14-8 14-23 14S9 32 9 32Z" />
        <circle {...iconProps} cx="32" cy="32" r="7" />
        <path {...iconProps} d="M43 43l9 9" />
      </svg>
    );
  }

  if (iconKind === 'cardiac') {
    return (
      <svg aria-hidden="true" viewBox="0 0 64 64">
        <path {...iconProps} d="M32 52S13 41 13 25c0-7 5-12 12-12 4 0 7 2 7 5 0-3 3-5 7-5 7 0 12 5 12 12 0 16-19 27-19 27Z" />
        <path {...iconProps} d="M17 32h8l4-8 6 16 4-8h8" />
      </svg>
    );
  }

  if (iconKind === 'emergency') {
    return (
      <svg aria-hidden="true" viewBox="0 0 64 64">
        <path {...iconProps} d="M16 23h32a6 6 0 0 1 6 6v20H10V29a6 6 0 0 1 6-6Z" />
        <path {...iconProps} d="M22 23v-7h20v7" />
        <path {...iconProps} d="M32 31v12M26 37h12" />
        <path {...iconProps} d="M14 49v5M50 49v5" />
      </svg>
    );
  }

  if (iconKind === 'pediatrics') {
    return (
      <svg aria-hidden="true" viewBox="0 0 64 64">
        <path {...iconProps} d="M20 30c0-9 6-16 14-16s14 7 14 16c0 11-7 19-14 19S20 41 20 30Z" />
        <path {...iconProps} d="M24 23c-4-3-7-2-9 2M44 23c4-3 7-2 9 2" />
        <path {...iconProps} d="M28 34h.1M40 34h.1" />
        <path {...iconProps} d="M29 42c3 2 7 2 10 0" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 64 64">
      <path {...iconProps} d="M14 52V18h34v34" />
      <path {...iconProps} d="M22 52V40h12v12" />
      <path {...iconProps} d="M24 28h16M32 20v16" />
      <path {...iconProps} d="M48 30h6v22" />
    </svg>
  );
}

function TreatmentIconTile({ treatment, className = '', label }) {
  const title = label || treatment?.title || 'Treatment';
  return (
    <span className={`treatment-icon-tile ${className}`.trim()} aria-label={`${title} icon`} role="img">
      <TreatmentVectorIcon treatment={treatment} />
    </span>
  );
}

function UiIcon({ name }) {
  const uiIcons = {
    shield: 'fa-shield-heart',
    doctor: 'fa-user-doctor',
    cost: 'fa-hand-holding-dollar',
    lock: 'fa-lock',
    hospital: 'fa-hospital',
    procedure: 'fa-notes-medical',
    home: 'fa-house-medical',
  };
  return <i aria-hidden="true" className={`fa-solid ${uiIcons[name] || uiIcons.shield} ui-bootstrap-icon`} />;

  const iconProps = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2.2 };
  const legacySvgIcons = {
    shield: <path {...iconProps} d="M32 8l18 7v14c0 12-7 20-18 27-11-7-18-15-18-27V15l18-7Z M24 31l6 6 12-14" />,
    doctor: <path {...iconProps} d="M24 15h16v10a8 8 0 0 1-16 0V15Z M18 54c1-10 8-16 14-16s13 6 14 16 M22 15V9h20v6 M32 42v7 M27 49h10" />,
    cost: <path {...iconProps} d="M18 18h28a5 5 0 0 1 5 5v24a5 5 0 0 1-5 5H18a5 5 0 0 1-5-5V23a5 5 0 0 1 5-5Z M22 29h20 M22 39h12 M42 39h4 M31 15V9 M39 15V9" />,
    lock: <path {...iconProps} d="M20 29h24v22H20z M25 29v-8a7 7 0 0 1 14 0v8 M32 38v6" />,
    hospital: <path {...iconProps} d="M14 52V16h34v36 M24 52V38h10v14 M22 26h18 M31 17v18 M23 35h18" />,
    procedure: <path {...iconProps} d="M18 47l24-24 6 6-24 24H18v-6Z M37 20l5-5 7 7-5 5 M16 20h14 M16 29h10 M16 38h7" />,
  };
  return <svg aria-hidden="true" viewBox="0 0 64 64">{legacySvgIcons[name] || legacySvgIcons.shield}</svg>;
}

function FeaturedTreatments({ money, setPage, setSelectedTreatment, treatments = [] }) {
  // Use first 4 backend treatments with highest ratings/popularity
  const featuredTreatments = useMemo(() => {
    return treatments
      .filter(t => t.title && t.packageFrom > 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .slice(0, 4);
  }, [treatments]);

  if (featuredTreatments.length === 0) {
    return null; // Hide section if no treatments available
  }

  return (
    <section className="page-section featured-treatment-section">
      <MedicalVideoBackdrop />
      <div className="section-heading">
        <div>
          <h2>Popular Treatment Journeys</h2>
          <p>Shortlist treatments by real-world needs, package scope, hospital match, and total journey budget.</p>
        </div>
      </div>
      <div className="featured-carousel" aria-label="Featured treatment carousel">
        {featuredTreatments.map((treatment) => {
          // Clean up treatment titles
          const cleanTitle = treatment.title
            .replace(/Other specified certain joint disorders, not elsewhere classified/g, 'Joint Treatment')
            .replace(/Abrasion of knee/g, 'Knee Treatment')
            .replace(/Other specified.*not elsewhere classified/g, 'Specialized Treatment')
            .replace(/Certain disorders.*not elsewhere classified/g, 'Medical Treatment')
            .replace(/Other specified/g, 'Specialized')
            .replace(/not elsewhere classified/g, '')
            .replace(/,\s*$/g, '')
            .trim();

          return (
            <article className="featured-treatment-card" key={treatment.id}>
              <div className="treatment-icon-panel" aria-hidden="true">
                <span><TreatmentVectorIcon treatment={treatment} /></span>
              </div>
              <div>
                <span>{treatment.group}</span>
                <strong>{cleanTitle}</strong>
                <p>{treatment.description || `Comprehensive ${cleanTitle.toLowerCase()} treatment with coordinated hospital support and recovery planning.`}</p>
                <em>Estimated package from {money(treatment.packageFrom)}</em>
                <button
                  aria-label={`View ${cleanTitle} treatment details`}
                  onClick={() => {
                    setSelectedTreatment(treatment);
                    setPage('treatment-detail');
                  }}
                  type="button"
                >
                  View details
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SkeletonCard({ className = '' }) {
  return (
    <article className={`skeleton-card ${className}`} aria-hidden="true">
      <span />
      <b />
      <p />
      <p />
    </article>
  );
}

function Treatments({ activeGroup, isLoading = false, money, setActiveGroup, selectedTreatment, setPage, setSelectedTreatment, treatments = [] }) {
  // Generate groups from backend treatment categories/groups
  const groups = useMemo(() => {
    if (!treatments || treatments.length === 0) return ['All'];

    const uniqueGroups = new Set();
    treatments.forEach((item) => {
      const group = item.group || item.category || item.specialty;
      if (group && group.trim()) {
        uniqueGroups.add(group.trim());
      }
    });

    // Sort alphabetically and add 'All' at start
    const sortedGroups = Array.from(uniqueGroups).sort();
    return ['All', ...sortedGroups];
  }, [treatments]);

  const items = activeGroup === 'All' ? treatments : treatments.filter((item) => {
    const itemGroup = item.group || item.category || item.specialty;
    return itemGroup === activeGroup;
  });

  const [visibleCount, setVisibleCount] = useState(8);
  const tabRowRef = useRef(null);
  const visibleItems = items.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(8);
  }, [activeGroup, treatments]);

  const scrollTreatmentTabs = (direction) => {
    tabRowRef.current?.scrollBy({ left: direction * 260, behavior: 'smooth' });
  };

  return (
    <section className="page-section treatments-section-redesigned" id="treatments">
      <MedicalVideoBackdrop />

      {/* Centered Section Header */}
      <div className="treatments-section-header">
        <h2>Find <span>Treatments</span></h2>
        <p>Find the right speciality and compare estimated starting packages.</p>
      </div>

      {/* Card-based Tab Navigation */}
      <div className="treatments-tabs-card">
        <div className="treatments-tabs-wrapper">
          <button
            aria-label="Previous treatment categories"
            className="tab-nav-arrow left"
            onClick={() => scrollTreatmentTabs(-1)}
            type="button"
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>

          <div className="treatments-tabs-container" ref={tabRowRef}>
            {groups.map((group) => (
              <button
                className={`treatment-tab ${activeGroup === group ? 'active' : ''}`}
                key={group}
                onClick={() => setActiveGroup(group)}
                type="button"
              >
                {group}
              </button>
            ))}
          </div>

          <button
            aria-label="Next treatment categories"
            className="tab-nav-arrow right"
            onClick={() => scrollTreatmentTabs(1)}
            type="button"
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Treatment Grid */}
      <div className="treatment-grid">
        {isLoading ? Array.from({ length: 8 }, (_, index) => <SkeletonCard className="treatment-skeleton" key={`treatment-skeleton-${index}`} />) : visibleItems.map((item) => {
          const displayTitle = getTreatmentDisplayTitle(item);

          return (
            <button
              className={selectedTreatment?.id === item.id ? 'treatment-card active' : 'treatment-card'}
              key={item.id}
              onClick={() => {
                setSelectedTreatment(item);
                setPage('treatment-detail');
              }}
              type="button"
              title={item.title} // Full original title on hover
            >
              <i className="treatment-card-icon" aria-hidden="true"><TreatmentVectorIcon treatment={item} /></i>
              <strong>{displayTitle}</strong>
              <small>{item.group || item.category || 'Medical'}</small>
            </button>
          );
        })}
      </div>
      {!isLoading && visibleCount < items.length && (
        <div className="load-more-row">
          <button onClick={() => setVisibleCount((count) => Math.min(count + 8, items.length))} type="button">
            Load more treatments
          </button>
          <span>{visibleItems.length} of {items.length}</span>
        </div>
      )}
    </section>
  );
}

function buildAvailableDestinations(hospitals = []) {
  const cityCopy = {
    Chennai: 'High-volume cardiac, transplant, and multispeciality treatment programs.',
    Delhi: 'Complex treatment programs with large multispeciality care teams.',
    Gurgaon: 'NCR hospitals for complex surgery, recovery planning, and international patient support.',
    Mumbai: 'Advanced diagnostics, oncology, cardiac care, and executive health checkups.',
    Bangalore: 'Technology-led hospitals for eye care, orthopedics, fertility, and wellness.',
    Bengaluru: 'Technology-led hospitals for eye care, orthopedics, fertility, and wellness.',
  };
  const grouped = new Map();
  hospitals
    .filter((hospital) => hospital.country === 'India' && hospital.city)
    .forEach((hospital) => {
      const key = hospital.city.trim();
      const current = grouped.get(key) || {
        country: key,
        line: cityCopy[key] || `Available ${hospital.specialty.toLowerCase()} care teams and coordinated hospital support.`,
        packageFrom: Number.POSITIVE_INFINITY,
        hospitals: 0,
        doctors: 0,
        image: hospital.image,
      };
      current.hospitals += 1;
      current.doctors += Number(hospital.doctors) || 0;
      current.packageFrom = Math.min(current.packageFrom, Number(hospital.cost?.package) || Number.POSITIVE_INFINITY);
      if (!current.image && hospital.image) current.image = hospital.image;
      grouped.set(key, current);
    });
  return Array.from(grouped.values())
    .map((destination) => ({
      ...destination,
      packageFrom: Number.isFinite(destination.packageFrom) ? destination.packageFrom : 0,
      doctors: destination.doctors || destination.hospitals,
      image: destination.image || HOSPITAL_PLACEHOLDER_IMAGE,
    }))
    .sort((a, b) => a.country.localeCompare(b.country));
}

function Destinations({ hospitals = INDIA_HOSPITALS, isLoading = false, money, setPage, setSelectedCountry }) {
  const availableDestinations = useMemo(() => buildAvailableDestinations(hospitals), [hospitals]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const carouselRef = useRef(null);

  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 320; // Card width + gap
      const newPosition = direction === 'left'
        ? Math.max(0, scrollPosition - scrollAmount)
        : Math.min(carouselRef.current.scrollWidth - carouselRef.current.clientWidth, scrollPosition + scrollAmount);

      carouselRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  // City SVG icons - Hospital building style
  const CityIcon = ({ cityName }) => {
    const icons = {
      'Delhi': (
        <svg viewBox="0 0 100 100" className="city-icon">
          <rect x="35" y="35" width="30" height="40" fill="#2b7de9" rx="2" />
          <rect x="40" y="40" width="5" height="5" fill="#ffffff" opacity="0.8" />
          <rect x="45" y="40" width="5" height="5" fill="#ffffff" opacity="0.8" />
          <rect x="50" y="40" width="5" height="5" fill="#ffffff" opacity="0.8" />
          <rect x="55" y="40" width="5" height="5" fill="#ffffff" opacity="0.8" />
          <rect x="40" y="48" width="5" height="5" fill="#ffffff" opacity="0.8" />
          <rect x="45" y="48" width="5" height="5" fill="#ffffff" opacity="0.8" />
          <rect x="50" y="48" width="5" height="5" fill="#ffffff" opacity="0.8" />
          <rect x="55" y="48" width="5" height="5" fill="#ffffff" opacity="0.8" />
          <rect x="40" y="56" width="5" height="5" fill="#ffffff" opacity="0.8" />
          <rect x="45" y="56" width="5" height="5" fill="#ffffff" opacity="0.8" />
          <rect x="50" y="56" width="5" height="5" fill="#ffffff" opacity="0.8" />
          <rect x="55" y="56" width="5" height="5" fill="#ffffff" opacity="0.8" />
          <path d="M35,35 L50,25 L65,35" fill="#2b7de9" />
          <rect x="47" y="65" width="6" height="10" fill="#ffffff" />
        </svg>
      ),
      'Mumbai': (
        <svg viewBox="0 0 100 100" className="city-icon">
          <rect x="30" y="40" width="15" height="35" fill="#2b7de9" rx="2" />
          <rect x="55" y="30" width="15" height="45" fill="#2b7de9" rx="2" />
          <rect x="33" y="45" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="37" y="45" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="33" y="50" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="37" y="50" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="33" y="55" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="37" y="55" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="58" y="35" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="62" y="35" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="58" y="40" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="62" y="40" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="58" y="45" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="62" y="45" width="3" height="3" fill="#ffffff" opacity="0.8" />
        </svg>
      ),
      'Chennai': (
        <svg viewBox="0 0 100 100" className="city-icon">
          <rect x="38" y="38" width="24" height="37" fill="#2b7de9" rx="2" />
          <rect x="42" y="42" width="4" height="4" fill="#ffffff" opacity="0.8" />
          <rect x="48" y="42" width="4" height="4" fill="#ffffff" opacity="0.8" />
          <rect x="54" y="42" width="4" height="4" fill="#ffffff" opacity="0.8" />
          <rect x="42" y="48" width="4" height="4" fill="#ffffff" opacity="0.8" />
          <rect x="48" y="48" width="4" height="4" fill="#ffffff" opacity="0.8" />
          <rect x="54" y="48" width="4" height="4" fill="#ffffff" opacity="0.8" />
          <rect x="42" y="54" width="4" height="4" fill="#ffffff" opacity="0.8" />
          <rect x="48" y="54" width="4" height="4" fill="#ffffff" opacity="0.8" />
          <rect x="54" y="54" width="4" height="4" fill="#ffffff" opacity="0.8" />
          <rect x="42" y="60" width="4" height="4" fill="#ffffff" opacity="0.8" />
          <rect x="48" y="60" width="4" height="4" fill="#ffffff" opacity="0.8" />
          <rect x="54" y="60" width="4" height="4" fill="#ffffff" opacity="0.8" />
          <path d="M38,38 L50,28 L62,38" fill="#2b7de9" />
          <rect x="48" y="66" width="4" height="9" fill="#ffffff" />
        </svg>
      ),
      'Bangalore': (
        <svg viewBox="0 0 100 100" className="city-icon">
          <rect x="32" y="45" width="12" height="30" fill="#2b7de9" rx="2" />
          <rect x="48" y="38" width="12" height="37" fill="#2b7de9" rx="2" />
          <rect x="64" y="50" width="12" height="25" fill="#2b7de9" rx="2" />
          <rect x="35" y="50" width="2.5" height="2.5" fill="#ffffff" opacity="0.8" />
          <rect x="38.5" y="50" width="2.5" height="2.5" fill="#ffffff" opacity="0.8" />
          <rect x="35" y="55" width="2.5" height="2.5" fill="#ffffff" opacity="0.8" />
          <rect x="38.5" y="55" width="2.5" height="2.5" fill="#ffffff" opacity="0.8" />
          <rect x="51" y="43" width="2.5" height="2.5" fill="#ffffff" opacity="0.8" />
          <rect x="54.5" y="43" width="2.5" height="2.5" fill="#ffffff" opacity="0.8" />
          <rect x="51" y="48" width="2.5" height="2.5" fill="#ffffff" opacity="0.8" />
          <rect x="54.5" y="48" width="2.5" height="2.5" fill="#ffffff" opacity="0.8" />
          <rect x="67" y="55" width="2.5" height="2.5" fill="#ffffff" opacity="0.8" />
          <rect x="70.5" y="55" width="2.5" height="2.5" fill="#ffffff" opacity="0.8" />
        </svg>
      ),
      'Gurgaon': (
        <svg viewBox="0 0 100 100" className="city-icon">
          <rect x="36" y="42" width="14" height="33" fill="#2b7de9" rx="2" />
          <rect x="54" y="35" width="14" height="40" fill="#2b7de9" rx="2" />
          <rect x="39" y="47" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="43" y="47" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="39" y="52" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="43" y="52" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="39" y="57" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="43" y="57" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="57" y="40" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="61" y="40" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="57" y="45" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="61" y="45" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="57" y="50" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="61" y="50" width="3" height="3" fill="#ffffff" opacity="0.8" />
        </svg>
      ),
      'default': (
        <svg viewBox="0 0 100 100" className="city-icon">
          <rect x="40" y="40" width="20" height="35" fill="#2b7de9" rx="2" />
          <rect x="43" y="45" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="47" y="45" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="51" y="45" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="43" y="50" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="47" y="50" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="51" y="50" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="43" y="55" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="47" y="55" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="51" y="55" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="43" y="60" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="47" y="60" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="51" y="60" width="3" height="3" fill="#ffffff" opacity="0.8" />
          <rect x="47" y="67" width="6" height="8" fill="#ffffff" />
        </svg>
      )
    };

    return icons[cityName] || icons.default;
  };

  return (
    <section className="page-section destination-section" id="destinations">
      <MedicalVideoBackdrop />
      <div className="section-heading">
        <div>
          <h2>Featured Destination</h2>
          <p>Explore places known for expert doctors, affordable care, and comfortable recovery.</p>
        </div>
      </div>

      <div className="destination-carousel-wrapper">
        <button
          className="carousel-nav-btn carousel-prev"
          onClick={() => scroll('left')}
          disabled={scrollPosition === 0}
          type="button"
          aria-label="Previous destinations"
        >
          <i className="fa-solid fa-chevron-left" aria-hidden="true" />
        </button>

        <div className="destination-carousel" ref={carouselRef}>
          {isLoading ? Array.from({ length: 4 }, (_, index) => <SkeletonCard className="destination-skeleton" key={`destination-skeleton-${index}`} />) : availableDestinations.map((destination) => (
            <button
              className="destination-card-new"
              key={destination.country}
              onClick={() => {
                setSelectedCountry(destination.country);
                setPage('hospitals');
              }}
              type="button"
            >
              <div className="destination-icon-wrapper">
                <CityIcon cityName={destination.country} />
              </div>
              <div className="destination-info">
                <strong>{destination.country}</strong>
                <p>{destination.line}</p>
              </div>
            </button>
          ))}
        </div>

        <button
          className="carousel-nav-btn carousel-next"
          onClick={() => scroll('right')}
          disabled={carouselRef.current && scrollPosition >= carouselRef.current.scrollWidth - carouselRef.current.clientWidth}
          type="button"
          aria-label="Next destinations"
        >
          <i className="fa-solid fa-chevron-right" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

function HomeTreatmentBanners({ setPage, setActiveGroup, setSelectedTreatment, treatments = [] }) {
  if (!treatments || treatments.length === 0) return null;

  // Pick up to 6 unique treatment groups
  const seen = new Set();
  const cards = treatments
    .filter((t) => {
      const g = t.group || t.category || t.title;
      if (!g || seen.has(g)) return false;
      seen.add(g);
      return true;
    })
    .slice(0, 6)
    .map((t) => ({
      title: t.group || t.category || t.title,
      group: t.group || t.category || t.title,
      treatment: t,
    }));

  const handleClick = (item) => {
    // Set the treatment and open the detail page
    if (setSelectedTreatment) setSelectedTreatment(item.treatment);
    setPage('treatment-detail');
  };

  return (
    <section className="page-section treatment-banner-section">
      <div className="section-heading">
        <div>
          <h2>Find Your <span>Treatment</span></h2>
        </div>
      </div>
      <div className="treatment-banner-grid">
        {cards.map((item, index) => (
          <button
            key={`${item.treatment?.id || item.title}-${index}`}
            className="treatment-banner-card"
            onClick={() => handleClick(item)}
            type="button"
          >
            <span className="tbc-icon">
              <TreatmentVectorIcon treatment={item.treatment} />
            </span>
            <strong className="tbc-title">{item.title}</strong>
            <span className="tbc-arrow" aria-hidden="true">
              <i className="fa-solid fa-arrow-right" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function CallBackForm({ selectedHospital }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    countryCode: '+91',
    preferredTime: '',
  });
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeSlots = [
    'Now (within 30 minutes)',
    'Morning (9 AM - 12 PM)',
    'Afternoon (12 PM - 6 PM)',
    'Evening (6 PM - 9 PM)',
  ];

  const submitCallback = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setStatus('Please enter your name and phone number.');
      return;
    }

    setIsSubmitting(true);
    setStatus('Requesting callback...');

    try {
      const response = await fetch(`${API_BASE}/admin/public-appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...getPatientAttribution(),
          patientName: form.name,
          phone: `${form.countryCode} ${form.phone}`,
          country: 'India',
          city: selectedHospital?.city || '',
          treatment: 'Callback Request',
          hospital: selectedHospital?.name || '',
          doctor: selectedHospital?.doctor || '',
          mode: 'Get a Call Back',
          notes: `Preferred time: ${form.preferredTime || 'Any time'}`,
          source: 'callback-form',
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Request failed');

      setStatus('✅ Callback requested! We\'ll call you soon.');
      setForm({ name: '', phone: '', countryCode: '+91', preferredTime: '' });
    } catch (error) {
      setStatus(`❌ ${error.message || 'Unable to request callback.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="callback-form" onSubmit={submitCallback}>
      <div className="callback-form-content">
        <div className="form-group">
          <label htmlFor="callback-name">Your Name *</label>
          <input
            id="callback-name"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Enter your full name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="callback-phone">Phone Number *</label>
          <div className="phone-input-group">
            <select
              className="country-code"
              value={form.countryCode}
              onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
            >
              <option value="+91">🇮🇳 +91</option>
              <option value="+1">🇺🇸 +1</option>
              <option value="+971">🇦🇪 +971</option>
              <option value="+44">🇬🇧 +44</option>
              <option value="+61">🇦🇺 +61</option>
            </select>
            <input
              id="callback-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Your phone number"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="callback-time">Preferred Call Time</label>
          <select
            id="callback-time"
            value={form.preferredTime}
            onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}
          >
            <option value="">Select preferred time</option>
            {timeSlots.map((slot) => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
        </div>

        {/* Hospital Info Display */}
        {selectedHospital && (
          <div className="hospital-info-card">
            <h4>
              <i className="fa-solid fa-hospital" aria-hidden="true"></i>
              {selectedHospital.name}
            </h4>
            <p>
              <i className="fa-solid fa-location-dot" aria-hidden="true"></i>
              {selectedHospital.city}
            </p>
            {selectedHospital.tags && selectedHospital.tags[0] && (
              <p>
                <i className="fa-solid fa-stethoscope" aria-hidden="true"></i>
                {selectedHospital.tags[0]}
              </p>
            )}
          </div>
        )}

        {status && (
          <div className={`status-message ${status.includes('✅') ? 'success' : status.includes('❌') ? 'error' : 'info'}`}>
            {status}
          </div>
        )}

        <button
          type="submit"
          className="callback-submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
              Requesting...
            </>
          ) : (
            <>
              <i className="fa-solid fa-phone" aria-hidden="true"></i>
              Get Call Back
            </>
          )}
        </button>

        <div className="callback-features">
          <div className="feature-item">
            <i className="fa-solid fa-clock" aria-hidden="true"></i>
            <span>Quick 30-min response</span>
          </div>
          <div className="feature-item">
            <i className="fa-solid fa-user-doctor" aria-hidden="true"></i>
            <span>Expert consultation</span>
          </div>
          <div className="feature-item">
            <i className="fa-solid fa-shield-halved" aria-hidden="true"></i>
            <span>100% Free service</span>
          </div>
        </div>
      </div>
    </form>
  );
}

function EvaluationForm({ title = 'Schedule Appointment', buttonLabel = 'Request Appointment', selectedHospital }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: 'I would like to get more information about medical treatments and cost estimates.'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const { name, phone, message } = form;
    if (!name.trim() || !phone.trim()) {
      setSubmitError('Please fill in name and phone number');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch(`${API_BASE}/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: form.email.trim() || undefined,
          phone: phone.trim(),
          message: message.trim(),
          intent: 'patient'
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setForm({ name: '', email: '', phone: '', message: 'I would like to get more information about medical treatments and cost estimates.' });
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        throw new Error('Failed to submit form');
      }
    } catch (error) {
      setSubmitError('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="simple-evaluation-form success">
        <div className="success-header">
          <i className="fa-solid fa-check-circle" aria-hidden="true"></i>
          <h3>Request Submitted!</h3>
          <p>Our team will call you within 24 hours.</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => setSubmitSuccess(false)}
          type="button"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <form className="simple-evaluation-form" onSubmit={handleSubmit}>
      {title && (
        <div className="form-header">
          <h3>{title}</h3>
          <p>Get consultation and appointment support within 24 hours</p>
        </div>
      )}

      {submitError && (
        <div className="error-message">
          <i className="fa-solid fa-exclamation-triangle" aria-hidden="true" />
          {submitError}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="lead-name">Full Name *</label>
        <input
          id="lead-name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleInputChange}
          placeholder="Enter patient's full name"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="lead-email">Email Address</label>
        <input
          id="lead-email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleInputChange}
          placeholder="your@email.com (optional)"
        />
      </div>

      <div className="form-group">
        <label htmlFor="lead-phone">Phone Number *</label>
        <input
          id="lead-phone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={handleInputChange}
          placeholder="+91 9999999999"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="lead-message">Message</label>
        <textarea
          id="lead-message"
          name="message"
          value={form.message}
          onChange={handleInputChange}
          placeholder="Tell us about your medical needs..."
          rows="3"
        />
      </div>

      <button
        type="submit"
        className="submit-button"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <i className="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
            Submitting...
          </>
        ) : (
          <>
            <i className="fa-solid fa-phone" aria-hidden="true"></i>
            {buttonLabel}
          </>
        )}
      </button>

      <div className="form-footer">
        <small className="privacy-text">
          <i className="fa-solid fa-shield-halved" aria-hidden="true"></i>
          By submitting the form I agree to the Terms of Use and Privacy Policy of {BRAND_NAME}.
        </small>
      </div>
    </form>
  );
}

function CheckboxDropdown({ id, label, openDropdown, options, selectedValues, onClear, onToggle, setOpenDropdown }) {
  const summary = selectedValues.length ? `${selectedValues.length} selected` : label;
  const isOpen = openDropdown === id;
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setOpenDropdown('');
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenDropdown('');
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setOpenDropdown]);

  return (
    <div className={isOpen ? 'checkbox-dropdown open' : 'checkbox-dropdown'} ref={dropdownRef}>
      <button className="checkbox-dropdown-trigger" onClick={() => setOpenDropdown(isOpen ? '' : id)} type="button">
        <span>{summary}</span>
        <i className="fa-solid fa-chevron-down" aria-hidden="true" />
      </button>
      {isOpen && (
        <div className="checkbox-dropdown-panel">
          <div className="checkbox-dropdown-head">
            <strong>{label}</strong>
            {selectedValues.length > 0 && <button onClick={onClear} type="button">Clear</button>}
          </div>
          <div className="checkbox-option-list">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option);
              return (
                <button
                  aria-checked={isSelected}
                  className={isSelected ? 'checkbox-option selected' : 'checkbox-option'}
                  key={option}
                  onClick={() => onToggle(option)}
                  role="checkbox"
                  type="button"
                >
                  <span className="checkbox-option-box" aria-hidden="true">
                    {isSelected && <i className="fa-solid fa-check" aria-hidden="true" />}
                  </span>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Hospitals({ hospitals, isLoading = false, money, selectedTreatment, setPage, setSelectedHospital, treatments = TREATMENTS }) {
  const cityOptions = useMemo(() => [...new Set(hospitals.map((hospital) => hospital.city))].sort(), [hospitals]);
  const treatmentOptions = useMemo(() => treatments.map((treatment) => treatment.title), [treatments]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedTreatments, setSelectedTreatments] = useState(selectedTreatment?.title ? [selectedTreatment.title] : []);
  const [openDropdown, setOpenDropdown] = useState('');
  const [visibleHospitalCount, setVisibleHospitalCount] = useState(5);
  const [isFiltering, setIsFiltering] = useState(false);

  const toggleValue = (setter) => (value) => {
    setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  const filteredDirectoryHospitals = useMemo(() => hospitals.filter((hospital) => {
    const tags = Array.isArray(hospital.tags) ? hospital.tags : [];
    const matchesCity = selectedCities.length === 0 || selectedCities.includes(hospital.city);
    const matchesDepartment = selectedDepartments.length === 0 || selectedDepartments.some((department) => tags.some((tag) => treatments.find((treatment) => treatment.title === tag)?.group === department));
    const matchesTreatment = selectedTreatments.length === 0 || selectedTreatments.some((treatment) => tags.includes(treatment) || hospital.specialty === treatments.find((item) => item.title === treatment)?.specialty);
    return matchesCity && matchesDepartment && matchesTreatment;
  }), [hospitals, selectedCities, selectedDepartments, selectedTreatments, treatments]);
  const visibleDirectoryHospitals = filteredDirectoryHospitals.slice(0, visibleHospitalCount);
  const showHospitalSkeleton = isLoading || isFiltering;

  useEffect(() => {
    setVisibleHospitalCount(5);
    if (!isLoading) {
      setIsFiltering(true);
      const timer = window.setTimeout(() => setIsFiltering(false), 360);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [selectedCities, selectedDepartments, selectedTreatments, hospitals, isLoading]);

  return (
    <section className="page-section hospitals-directory" id="hospitals">
      <MedicalVideoBackdrop />
      <div className="hospital-filter-bar">
        <div className="filter-static-field">India</div>
        <CheckboxDropdown
          id="cities"
          label="All Cities"
          openDropdown={openDropdown}
          onClear={() => setSelectedCities([])}
          onToggle={toggleValue(setSelectedCities)}
          options={cityOptions}
          selectedValues={selectedCities}
          setOpenDropdown={setOpenDropdown}
        />
        <CheckboxDropdown
          id="treatments"
          label="Treatments"
          openDropdown={openDropdown}
          onClear={() => setSelectedTreatments([])}
          onToggle={toggleValue(setSelectedTreatments)}
          options={treatmentOptions}
          selectedValues={selectedTreatments}
          setOpenDropdown={setOpenDropdown}
        />
        <CheckboxDropdown
          id="departments"
          label="Departments"
          openDropdown={openDropdown}
          onClear={() => setSelectedDepartments([])}
          onToggle={toggleValue(setSelectedDepartments)}
          options={TREATMENT_GROUPS}
          selectedValues={selectedDepartments}
          setOpenDropdown={setOpenDropdown}
        />
        <button onClick={() => {
          setIsFiltering(true);
          window.setTimeout(() => setIsFiltering(false), 360);
        }} type="button">Search</button>
      </div>
      <div className="section-heading">
        <div>
          <h2>Popular Hospitals</h2>
          <p>Compare providers by destination, speciality, doctors, value, and full estimated budget.</p>
        </div>
      </div>
      <div className="quick-filter-row">
        <span>Quick Filters</span>
        <button type="button">JCI Accreditation</button>
        <button type="button">NABH</button>
        <button type="button">Multi Specialty</button>
      </div>
      <div className="hospital-directory-layout">
        <div className="hospital-list">
          {showHospitalSkeleton && Array.from({ length: 3 }, (_, index) => <SkeletonCard className="hospital-skeleton" key={`hospital-skeleton-${index}`} />)}
          {!showHospitalSkeleton && visibleDirectoryHospitals.map((hospital) => (
            <article className="hospital-card" key={hospital.id}>
              <div
                className="hospital-card-main"
              >
                <button
                  className="hospital-thumb-button"
                  onClick={() => {
                    setSelectedHospital(hospital);
                    setPage('hospital-detail');
                  }}
                  type="button"
                >
                  <img alt={hospital.name} onError={handleImageFallback} src={getHospitalImage(hospital)} />
                </button>
                <div className="hospital-body">
                  <button
                    className="hospital-name-link"
                    onClick={() => {
                      setSelectedHospital(hospital);
                      setPage('hospital-detail');
                    }}
                    type="button"
                  >
                    {hospital.name}
                  </button>
                  <div className="rating-row">
                    <StarRating rating={hospital.rating} />
                    <span>{hospital.rating} ({hospital.doctors} Ratings)</span>
                  </div>
                  <p>
                    {hospital.name} is listed from the {hospital.sourceSystem || 'client hospital master database'} for {hospital.specialty.toLowerCase()} care
                    {hospital.city ? ` in ${hospital.city}` : ''}. {hospital.accreditations ? `Accreditation: ${accreditationText(hospital.accreditations)}.` : 'Accreditation details can be updated from admin.'}
                  </p>
                  <button className="show-more-link" onClick={() => {
                    setSelectedHospital(hospital);
                    setPage('hospital-detail');
                  }} type="button">Show More</button>
                </div>
              </div>
              <div className="hospital-facts">
                <span>Established: {hospital.established || hospital.foundedYear || 'Update pending'}</span>
                <span>Beds: {hospital.bedText || hospital.beds || 'Update pending'}</span>
                <span>{hospital.jciAccredited ? 'JCI Accredited' : accreditationText(hospital.accreditations, hospital.nabhType || 'Accredited Hospital')}</span>
                <span>Location: {hospital.city || hospital.addressLine1 || 'India'}</span>
                
                {/* Accreditation Logo - Compact inline */}
                <div className="hospital-accreditation-logos">
                  {hospital.jciAccredited ? (
                    <div className="accreditation-badge jci-badge">
                      <img src="https://cdn.prod.website-files.com/63dc099d352018653241b1a7/63fe8bab2259ca569b27dcdf_gold-seal-approval.png" alt="JCI Accredited" />
                      <span>JCI</span>
                    </div>
                  ) : (
                    <div className="accreditation-badge nabh-badge">
                      <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQntV_tAgbdUJrZpcCIbKGbqdoM9GaOgerg3Q" alt="NABH Accredited" />
                      <span>NABH</span>
                    </div>
                  )}
                </div>
                
                <button onClick={() => setPage('planner')} type="button">Book Appointment</button>
              </div>
            </article>
          ))}
          {!showHospitalSkeleton && filteredDirectoryHospitals.length === 0 && (
            <article className="hospital-empty-state">
              <strong>No hospitals match these filters</strong>
              <p>Clear one filter or select a broader treatment to see more options.</p>
            </article>
          )}
          {!showHospitalSkeleton && visibleHospitalCount < filteredDirectoryHospitals.length && (
            <div className="load-more-row hospital-load-more">
              <button onClick={() => setVisibleHospitalCount((count) => Math.min(count + 5, filteredDirectoryHospitals.length))} type="button">
                Load more hospitals
              </button>
              <span>{visibleDirectoryHospitals.length} of {filteredDirectoryHospitals.length}</span>
            </div>
          )}
        </div>
        <EvaluationForm title="Get FREE Evaluation" buttonLabel="Contact Us Now" />
      </div>
    </section>
  );
}

function QuickJourneyCTA({ setPage, title = 'Let us plan your journey', compact = false }) {
  return (
    <section className={compact ? 'quick-journey-cta compact' : 'quick-journey-cta'} aria-label="Plan your medical journey">
      <div>
        <span>Quick planning</span>
        <h2>{title}</h2>
        <p>Choose your treatment, compare matched hospitals, estimate cost, and request a free consultation in one guided flow.</p>
      </div>
      <button onClick={() => setPage('planner')} type="button">
        <i className="fa-solid fa-route" aria-hidden="true" />
        Plan my journey
      </button>
    </section>
  );
}

function Doctors({ hospitals, isCarousel = false, money, setPage, setSelectedHospital }) {
  return (
    <section className={isCarousel ? 'page-section doctors-section carousel-mode' : 'page-section doctors-section'} id="doctors">
      <MedicalVideoBackdrop />
      <div className="section-heading">
        <div>
          <h2>Popular Doctors</h2>
          <p>Review specialist experience, hospital association, and consultation fee.</p>
        </div>
      </div>
      <div className="doctor-grid">
        {hospitals.map((hospital) => (
          <button
            className="doctor-card"
            key={`${hospital.id}-${hospital.doctor}`}
            onClick={() => {
              setSelectedHospital(hospital);
              setPage('doctor-detail');
            }}
            type="button"
          >
            <div className="doctor-photo-wrap">
              <img alt={hospital.doctor} src={hospital.doctorImage} />
              <span>MD</span>
            </div>
            <div className="doctor-card-body">
              <div className="doctor-card-top">
                <strong>{hospital.doctor}</strong>
                <p>{hospital.doctorTitle}</p>
              </div>
              <div className="doctor-meta-row">
                <span><b>YR</b>{hospital.experience}</span>
                <span><b>H</b>{hospital.city}</span>
              </div>
              <StarRating rating={hospital.rating} />
              <span className="doctor-hospital-name">{hospital.name}</span>
              <div className="doctor-card-footer">
                <em><b>$</b>{money(hospital.doctorFee)} consult</em>
                <small>View profile <i>{'->'}</i></small>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function TreatmentDetail({ allTreatments = [], hospitals, money, selectedTreatment, setPage, setPlannerInitialProcedure, setSelectedHospital, setSelectedTreatment }) {
  const [activeTab, setActiveTab] = useState('Overview');
  if (!selectedTreatment) {
    return (
      <section className="empty-state">
        <h2>Select a treatment to view details</h2>
        <p>Treatment details are loaded from the live catalog. Please choose a treatment first.</p>
        <button onClick={() => setPage('treatments')} type="button">Browse treatments</button>
      </section>
    );
  }

  const treatmentMeaning = buildTreatmentMeaning(selectedTreatment);
  const { code: clinicalCode, condition: clinicalCondition, description: treatmentDescription, displayTitle: displayTreatmentTitle, pageTitle: pageTreatmentTitle, release: clinicalRelease, source: clinicalSource } = treatmentMeaning;
  const treatmentNeedle = normalizeSearch([selectedTreatment.title, displayTreatmentTitle, selectedTreatment.category, selectedTreatment.group, selectedTreatment.specialty, clinicalCondition, clinicalCode].filter(Boolean).join(' '));
  const relatedHospitals = hospitals.filter((hospital) => {
    const hospitalTags = Array.isArray(hospital.tags) ? hospital.tags : [];
    const hospitalText = normalizeSearch([hospital.specialty, hospital.department, hospital.summary, ...hospitalTags].filter(Boolean).join(' '));
    return hospitalTags.includes(selectedTreatment.title)
      || hospitalTags.includes(displayTreatmentTitle)
      || hospital.specialty === selectedTreatment.specialty
      || (treatmentNeedle && hospitalText && (hospitalText.includes(treatmentNeedle) || treatmentNeedle.includes(normalizeSearch(hospital.specialty || ''))));
  });
  const matchedHospitals = relatedHospitals.length ? relatedHospitals : hospitals;
  const suggestedHospitals = [
    ...matchedHospitals,
    ...hospitals.filter((hospital) => !matchedHospitals.some((item) => item.id === hospital.id)),
  ];
  const bestMatches = suggestedHospitals.slice(0, 6);
  const backendPackage = Number(selectedTreatment.packageFrom || 0);
  const clinicalReleaseNote = clinicalRelease ? `Catalog release ${clinicalRelease}` : 'Medical catalog reviewed';
  const categoryLabel = selectedTreatment.category || selectedTreatment.group || selectedTreatment.specialty || 'Medical treatment';
  const sourceLabel = clinicalCode ? `${clinicalSource} ${clinicalCode}` : clinicalSource;
  const matchReason = (hospital) => {
    if (hospital.specialty && selectedTreatment.specialty && hospital.specialty === selectedTreatment.specialty) return `${hospital.specialty} department match`;
    const tags = Array.isArray(hospital.tags) ? hospital.tags : [];
    if (tags.includes(selectedTreatment.title) || tags.includes(displayTreatmentTitle)) return 'Treatment listed in hospital mapping';
    if (hospital.internationalPatientWing) return 'International patient support available';
    return accreditationText(hospital.accreditations, 'Backend hospital suggestion');
  };

  // ICD-11 procedures for this treatment group — treatments with icdCode matching this group
  const icdProcedures = allTreatments.filter((t) => {
    if (!t.icdCode && !t.icdUri) return false; // must be ICD-11 imported
    const tGroup = (t.group || t.category || '').toLowerCase();
    const selGroup = (selectedTreatment.group || selectedTreatment.category || '').toLowerCase();
    const selTitle = (selectedTreatment.title || '').toLowerCase();
    // Same group, OR the treatment itself IS the selected one, OR title contains group
    return tGroup === selGroup
      || tGroup.includes(selGroup)
      || selGroup.includes(tGroup)
      || (t._id || t.id) === (selectedTreatment._id || selectedTreatment.id)
      || selTitle.includes(tGroup);
  });

  const supportCards = [
    ['Case confidence', 'Your treatment is converted from catalog wording into a clear care focus before planning starts.'],
    ['Human review', 'A coordinator can verify reports, symptoms, budget, city preference, and hospital availability.'],
    ['No ICD detour', 'Patients stay on the journey flow; ICD-11 remains a backend clinical mapping reference.'],
  ];
  const subProcedures = [
    {
      label: 'Treatment meaning',
      name: clinicalCondition,
      meta: sourceLabel,
      description: treatmentDescription,
      icon: 'fa-stethoscope',
      action: 'Start plan',
      target: 'planner',
    },
    {
      label: 'What we need',
      name: 'Reports and symptoms',
      meta: 'Upload once in journey planner',
      description: `Share reports, scan images, prescriptions, diagnosis notes, and your preferred travel dates for ${displayTreatmentTitle}.`,
      icon: 'fa-file-medical',
      action: 'Prepare case',
      target: 'planner',
    },
    {
      label: 'Suggested care',
      name: `${bestMatches.length || 0} hospital options`,
      meta: clinicalReleaseNote,
      description: 'Suggestions come from backend hospital data, specialty mapping, accreditation, location, and international patient support.',
      icon: 'fa-hospital-user',
      action: 'View matches',
      target: 'planner',
    },
  ].filter((item) => item.name);

  const treatmentFAQs = [
    {
      question: `What does ${displayTreatmentTitle} mean in my plan?`,
      answer: `${displayTreatmentTitle} is the patient-friendly treatment name. The backend can also keep the ICD-11 mapped condition (${clinicalCondition}) and reference code${clinicalCode ? ` ${clinicalCode}` : ''} for clinical consistency.`
    },
    {
      question: 'Will I be sent to ICD-11 pages?',
      answer: 'No. ICD-11 stays behind the scenes as a mapping source. The patient journey remains inside Kairacure with clear next steps, hospital options, and report collection.'
    },
    {
      question: 'Where does the treatment data come from?',
      answer: `This page uses backend treatment records${clinicalCode ? ', ICD-11 code mapping,' : ''} and backend hospital suggestions. Pricing appears only when the backend has a package estimate.`
    },
    {
      question: 'What happens after I start the journey plan?',
      answer: 'The planner collects reports, symptoms, budget, preferred city, and travel needs so the care team can suggest the most suitable hospital path.'
    },
    {
      question: 'Can hospital suggestions change?',
      answer: 'Yes. Suggestions can change after report review, doctor availability, patient budget, city preference, and hospital response.'
    }
  ];

  const trustBadges = [
    { title: clinicalCode ? clinicalCode : 'Mapped', subtitle: 'Clinical ref', icon: 'fa-barcode', tone: 'violet' },
    { title: categoryLabel, subtitle: 'Backend category', icon: 'fa-layer-group', tone: 'green' },
    { title: bestMatches.length ? `${bestMatches.length}+` : 'Review', subtitle: 'Suggested hospitals', icon: 'fa-hospital', tone: 'blue' },
    { title: backendPackage ? money(backendPackage) : 'On request', subtitle: 'Package from', icon: 'fa-indian-rupee-sign', tone: 'gold' },
    { title: 'Private', subtitle: 'Report handling', icon: 'fa-lock', tone: 'violet' },
  ];
  const keyInsights = [
    ['Meaning', treatmentDescription],
    ['Treatment Source', `${categoryLabel}${clinicalCode ? ` / ${clinicalCode}` : ''}${clinicalRelease ? ` / ${clinicalRelease}` : ''}`],
    ['Suggested support', bestMatches.length ? `${bestMatches.length} hospital options are ready for journey planning.` : 'Hospital matching will start after treatment review.'],
    ['Cost clarity', backendPackage ? `Package estimate starts from ${money(backendPackage)}.` : 'Package estimate will be requested from hospitals after report review.'],
  ];
  const tabItems = [
    ['Overview', 'overview'],
    ['Key Insights', 'key-insights'],
    ['Journey Plan', 'procedures'],
    ['Cost', 'cost'],
    ['Top Hospitals', 'hospitals'],
    ['FAQs', 'faqs'],
  ];
  const heroImage = selectedTreatment.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=85';
  const costRows = [
    ['Backend package estimate', backendPackage ? money(backendPackage) : 'On request', backendPackage ? 'Imported treatment pricing' : 'Care team will collect pricing'],
    ['Hospital quote', 'After review', 'Depends on reports, room type, stay, and doctor advice'],
    ['Travel support', 'Optional', 'Visa, stay, pickup, interpreter, and follow-up support'],
  ];
  const goToSection = (label, sectionId) => {
    setActiveTab(label);
    window.requestAnimationFrame(() => {
      document.getElementById(`treatment-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="treatment-replica-page">
      <section className="treatment-replica-hero">
        <div className="treatment-replica-hero-media">
          <img alt={pageTreatmentTitle} onError={handleImageFallback} src={heroImage} />
        </div>
        <div className="treatment-replica-hero-copy">
          <div className="treatment-replica-breadcrumb">
            <button onClick={() => setPage('home')} type="button">Home</button>
            <span>/</span>
            <button onClick={() => setPage('treatments')} type="button">Treatments</button>
            <span>/</span>
            <b>{displayTreatmentTitle}</b>
          </div>
          <h1>{pageTreatmentTitle} with guided care planning</h1>
          <p>{treatmentDescription}</p>
          <div className="treatment-replica-actions">
            <button onClick={() => setPage('planner')} type="button">Plan this treatment</button>
            <button onClick={() => goToSection('Top Hospitals', 'hospitals')} type="button">See suggested hospitals</button>
          </div>
        </div>
        <aside className="treatment-comfort-panel" aria-label="Care planning reassurance">
          <strong>We will make this simple</strong>
          <p>No confusing diagnosis codes for the patient journey. Share your reports once and the care team will help convert this treatment into clear next steps.</p>
          <div>
            <span>{clinicalCode ? `Ref ${clinicalCode}` : 'Backend mapped'}</span>
            <span>{backendPackage ? money(backendPackage) : 'Quote on request'}</span>
          </div>
        </aside>
      </section>

      <section className="treatment-replica-proof" aria-label="Treatment trust highlights">
        {trustBadges.map((badge) => (
          <article data-tone={badge.tone} key={`${badge.title}-${badge.subtitle}`}>
            <span><i className={`fa-solid ${badge.icon}`} aria-hidden="true" /></span>
            <div>
              <strong>{badge.title}</strong>
              <small>{badge.subtitle}</small>
            </div>
          </article>
        ))}
      </section>

      <nav className="treatment-replica-tabs" aria-label="Treatment sections">
        {tabItems.map(([label, sectionId]) => (
          <button
            className={activeTab === label ? 'active' : ''}
            key={label}
            onClick={() => goToSection(label, sectionId)}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>

      <section className="treatment-replica-panel" id="treatment-overview">
        <h2>Overview</h2>
        <p>{treatmentDescription}</p>
        <div className="treatment-source-strip" aria-label="Treatment source details">
          <span><b>Patient title</b>{displayTreatmentTitle}</span>
          <span><b>Mapped meaning</b>{clinicalCondition}</span>
          <span><b>Source</b>{sourceLabel}</span>
          <span><b>Release</b>{clinicalRelease || 'Backend record'}</span>
        </div>
        <div className="treatment-comfort-grid">
          {supportCards.map(([title, copy]) => (
            <article key={title}>
              <i className="fa-solid fa-circle-check" aria-hidden="true" />
              <strong>{title}</strong>
              <p>{copy}</p>
            </article>
          ))}
        </div>
        <button onClick={() => setPage('planner')} type="button">See plan</button>
      </section>

      <section className="treatment-replica-section" id="treatment-key-insights">
        <div className="treatment-replica-section-head">
          <h2>Key Insights at a Glance</h2>
        </div>
        <div className="treatment-replica-insights">
          {keyInsights.map(([title, description], index) => (
            <article key={title}>
              <span>{index + 1}</span>
              <div>
                <strong>{title}</strong>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── ICD-11 Procedures Section ── */}
      <section className="treatment-replica-section td-procedures-section" id="treatment-procedures">
        <div className="treatment-replica-section-head">
          <div>
            <span>ICD-11 Procedures</span>
            <h2>Specific Procedures for {displayTreatmentTitle}</h2>
          </div>
          <button onClick={() => setPage('planner')} type="button">Plan this treatment</button>
        </div>

        {icdProcedures.length === 0 ? (
          /* ── No procedures state ── */
          <div className="td-no-procedures">
            <div className="td-no-proc-icon">
              <i className="fa-solid fa-flask-vial" aria-hidden="true" />
            </div>
            <div className="td-no-proc-body">
              <strong>No specific procedures added yet</strong>
              <p>
                Our team hasn't imported ICD-11 procedures for <b>{categoryLabel}</b> yet.
                The care coordinator will map the exact procedure after reviewing your reports.
              </p>
              <div className="td-no-proc-actions">
                <button className="td-proc-cta-primary" onClick={() => setPage('planner')} type="button">
                  <i className="fa-solid fa-route" aria-hidden="true" /> Start journey plan
                </button>
                <button className="td-proc-cta-secondary" onClick={() => setPage('ai-assistant')} type="button">
                  <i className="fa-solid fa-comment-medical" aria-hidden="true" /> Ask AI assistant
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Procedure cards grid ── */
          <div className="td-procedure-grid">
            {icdProcedures.map((proc) => {
              const procTitle = getTreatmentDisplayTitle(proc);
              const hasCost = proc.packageFrom && proc.packageFrom > 0;
              return (
                <article
                  key={proc.id || proc._id}
                  className="td-procedure-card"
                  onClick={() => { if (setSelectedTreatment) setSelectedTreatment(proc); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') { if (setSelectedTreatment) setSelectedTreatment(proc); }}}
                >
                  {/* ICD code badge */}
                  {proc.icdCode && (
                    <span className="td-proc-icd-badge">
                      <i className="fa-solid fa-tag" aria-hidden="true" /> {proc.icdCode}
                    </span>
                  )}

                  {/* WHO link */}
                  {proc.icdBrowserUrl && (
                    <a
                      href={proc.icdBrowserUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="td-proc-who-link"
                      onClick={(e) => e.stopPropagation()}
                      title="View on WHO ICD-11 browser"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" /> WHO
                    </a>
                  )}

                  {/* Icon */}
                  <div className="td-proc-icon">
                    <i className="fa-solid fa-stethoscope" aria-hidden="true" />
                  </div>

                  {/* Title */}
                  <strong className="td-proc-title">{procTitle}</strong>

                  {/* Category */}
                  <span className="td-proc-category">{proc.group || proc.category}</span>

                  {/* Description */}
                  {proc.description && !proc.description.startsWith('WHO ICD-11') && (
                    <p className="td-proc-desc">
                      {proc.description.length > 90 ? `${proc.description.slice(0, 87)}…` : proc.description}
                    </p>
                  )}

                  {/* Cost */}
                  {hasCost && (
                    <div className="td-proc-cost">
                      <i className="fa-solid fa-indian-rupee-sign" aria-hidden="true" />
                      From ₹{(proc.packageFrom / 100000).toFixed(1)}L
                    </div>
                  )}

                  {/* Plan button */}
                  <button
                    className="td-proc-plan-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Carry both treatment + procedure into planner → skip to Step 3
                      if (setPlannerInitialProcedure) setPlannerInitialProcedure(proc);
                      setPage('planner');
                    }}
                    type="button"
                  >
                    Plan this <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="treatment-replica-section" id="treatment-cost">
        <div className="treatment-replica-section-head">
          <div>
            <span>Global Cost Comparison</span>
            <h2>{pageTreatmentTitle} Abroad</h2>
          </div>
        </div>
        <div className="treatment-replica-table">
          <div className="treatment-replica-table-head">
            <span>Destination</span>
            <span>From</span>
            <span>Up to</span>
          </div>
          {costRows.map(([label, value, note]) => (
            <div className="treatment-replica-table-row" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{note}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="treatment-replica-section" id="treatment-hospitals">
        <div className="treatment-replica-section-head">
          <h2>Suggested Hospitals</h2>
          <button onClick={() => setPage('hospitals')} type="button">View all</button>
        </div>
        <div className="treatment-replica-hospital-row">
          {bestMatches.map((hospital) => (
            <article key={hospital.id}>
              <img alt={hospital.name} onError={handleImageFallback} src={getHospitalImage(hospital)} />
              <div>
                <span>{hospital.jciAccredited ? 'JCI Accredited' : accreditationText(hospital.accreditations, 'Accredited Hospital')}</span>
                <strong>{hospital.name}</strong>
                <small>{hospital.city}, {hospital.country}</small>
                <em>{matchReason(hospital)}</em>
                <p>{hospital.cost?.package ? formatCurrency(hospital.cost.package, 'INR') : selectedTreatment.packageFrom ? formatCurrency(selectedTreatment.packageFrom, 'INR') : 'Cost on Request'}</p>
                <button
                  onClick={() => {
                    setSelectedHospital(hospital);
                    setPage('hospital-detail');
                  }}
                  type="button"
                >
                  Check hospital details
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="treatment-replica-section" id="treatment-faqs">
        <div className="treatment-replica-section-head">
          <h2>FAQs</h2>
        </div>
        <div className="treatment-replica-faqs">
          {treatmentFAQs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

// Hospital Partner Landing Page Component
function HospitalPartnerLanding({ onBackToDetails, selectedHospital, isEmbedded = false }) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [formStatus, setFormStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('Submitting...');
    try {
      await fetch(`${API_BASE}/admin/partner-inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, hospitalInterest: selectedHospital?.name || 'General Inquiry', type: 'Hospital Partner', timestamp: new Date().toISOString() })
      });
      setFormStatus('✓ Thank you! We will contact you within 24 hours.');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch {
      setFormStatus('✓ Thank you for your interest! We will contact you shortly.');
    }
  };

  return (
    <div className="hpl-wrap">

      {/* ── HERO ── */}
      <section className="hpl-hero">
        {!isEmbedded && (
          <button className="hpl-back" onClick={onBackToDetails} type="button">
            <i className="fa-solid fa-arrow-left" /> Back to Hospitals
          </button>
        )}
        <div className="hpl-hero-inner">
          <span className="hpl-eyebrow">Hospital Partner Programme</span>
          <h1 className="hpl-h1">
            Guaranteed <em>30% More</em><br />International Patients
          </h1>
          <p className="hpl-lead">
            11 years of healthcare-exclusive expertise delivering guaranteed patient growth within 6 months
          </p>
          <div className="hpl-hero-actions">
            <a href="#hpl-form" className="hpl-btn-primary">Book Free Strategy Session</a>
            <a href="#hpl-services" className="hpl-btn-outline">See How It Works</a>
          </div>
          <ul className="hpl-trust">
            <li><i className="fa-solid fa-circle-check" /> No Long-term Contracts</li>
            <li><i className="fa-solid fa-circle-check" /> ROI Guaranteed</li>
            <li><i className="fa-solid fa-circle-check" /> Pay Per Result</li>
          </ul>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="hpl-stats">
        <div className="hpl-stat"><strong>30%+</strong><span>Patient Growth</span></div>
        <div className="hpl-stat"><strong>6 Months</strong><span>Guaranteed Results</span></div>
        <div className="hpl-stat"><strong>100%</strong><span>ROI Focused</span></div>
        <div className="hpl-stat"><strong>11 Years</strong><span>Healthcare Expertise</span></div>
      </section>

      {/* ── VALUE PROP ── */}
      <section className="hpl-value">
        <div className="hpl-container">
          <div className="hpl-section-label">Why Choose Us</div>
          <h2>Optimizing for Revenue, Not Just Conversations</h2>
          <p>We maximize ROI on your marketing budget. Expect minimum 30% increase in international patient footfall in 6 months.</p>
        </div>
      </section>

      {/* ── DOOH FEATURE SECTION ── */}
      <section className="hpl-dooh" id="hpl-services">
        <div className="hpl-container">
          <div className="hpl-section-label">Most Effective Channel</div>
          <h2>Digital Outdoor (DOOH) Advertising<br />in Global Markets</h2>
          <p className="hpl-section-sub">
            Position your hospital where patients spend time — airports, malls, metro stations across the Middle East
          </p>

          <div className="hpl-dooh-grid">
            <div className="hpl-dooh-card">
              <i className="fa-solid fa-plane-departure" />
              <strong>Airports</strong>
              <span>International terminals</span>
            </div>
            <div className="hpl-dooh-card">
              <i className="fa-solid fa-bag-shopping" />
              <strong>Shopping Malls</strong>
              <span>High-footfall locations</span>
            </div>
            <div className="hpl-dooh-card">
              <i className="fa-solid fa-train" />
              <strong>Metro Stations</strong>
              <span>Daily commuters</span>
            </div>
            <div className="hpl-dooh-card">
              <i className="fa-solid fa-city" />
              <strong>City Centers</strong>
              <span>Premium billboards</span>
            </div>
          </div>

          <div className="hpl-countries">
            <span className="hpl-country">🇸🇦 Saudi Arabia</span>
            <span className="hpl-country">🇦🇪 UAE</span>
            <span className="hpl-country">🇰🇼 Kuwait</span>
            <span className="hpl-country">🇴🇲 Oman</span>
            <span className="hpl-country">🇶🇦 Qatar</span>
            <span className="hpl-country">🇧🇭 Bahrain</span>
          </div>
        </div>
      </section>

      {/* ── OTHER SERVICES ── */}
      <section className="hpl-services">
        <div className="hpl-container">
          <div className="hpl-section-label">How We Build Your Digital Prominence</div>
          <h2>Multi-Channel Patient Acquisition</h2>
          <div className="hpl-services-grid">
            <div className="hpl-service-card">
              <i className="fa-solid fa-magnifying-glass" />
              <h4>SEO & Content Marketing</h4>
              <p>Rank #1 for medical tourism keywords and capture patients who are actively searching</p>
            </div>
            <div className="hpl-service-card">
              <i className="fa-solid fa-bullhorn" />
              <h4>Social Media Campaigns</h4>
              <p>Targeted paid ads reaching the right patient demographics across platforms</p>
            </div>
            <div className="hpl-service-card">
              <i className="fa-solid fa-handshake" />
              <h4>Partnership Network</h4>
              <p>Direct access to medical tourism facilitators and referral partners worldwide</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT FORM ── */}
      <section className="hpl-form-section" id="hpl-form">
        <div className="hpl-form-grid">
          <div className="hpl-form-left">
            <div className="hpl-section-label light">Get Started</div>
            <h2>Book Your Free<br />Strategy Session</h2>
            <p>Get a custom growth roadmap and 6-month implementation plan tailored for your hospital</p>
            <ul className="hpl-checklist">
              <li><i className="fa-solid fa-check" /> 30-minute consultation with a healthcare marketing expert</li>
              <li><i className="fa-solid fa-check" /> Custom patient acquisition strategy</li>
              <li><i className="fa-solid fa-check" /> Competitor analysis & market positioning</li>
              <li><i className="fa-solid fa-check" /> ROI projections for your specialty</li>
            </ul>
          </div>
          <div className="hpl-form-right">
            <form className="hpl-form" onSubmit={handleSubmit}>
              <label>
                Hospital Name
                <input type="text" placeholder="e.g. Apollo Hospitals" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </label>
              <label>
                Email Address
                <input type="email" placeholder="you@hospital.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </label>
              <label>
                Phone Number
                <input type="tel" placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
              </label>
              <label>
                About Your Hospital
                <textarea rows="3" placeholder="Specialty, current patient volume, growth goals..." value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
              </label>
              <button type="submit" className="hpl-submit">
                <i className="fa-solid fa-calendar-check" /> Book Free Session
              </button>
              {formStatus && <p className="hpl-form-status">{formStatus}</p>}
            </form>
          </div>
        </div>
      </section>

    </div>
  );
}

function HospitalDetail({ money, selectedHospital, selectedTreatment, setPage, setSelectedHospital, onBack }) {
  const basePackage = selectedTreatment && selectedHospital.tags.includes(selectedTreatment.title) ? selectedTreatment.packageFrom : selectedHospital.cost.package;
  const gallery = hospitalGallery(selectedHospital);
  const [activeTab, setActiveTab] = useState('About');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const doctorTreatmentOptions = ['All', ...new Set([...selectedHospital.tags, ...selectedHospital.doctorFocus].slice(0, 8))];
  const [doctorTreatmentFilter, setDoctorTreatmentFilter] = useState(selectedTreatment?.title ?? 'All');
  const [budget, setBudget] = useState({
    package: basePackage,
    flight: selectedHospital.cost.flight,
    visa: selectedHospital.cost.visa,
    local: selectedHospital.cost.local,
    stay: selectedHospital.cost.stay,
    service: selectedHospital.cost.service,
  });
  const rows = [
    ['package', 'Treatment package', 100, 30000],
    ['flight', 'Flights', 100, 3000],
    ['visa', 'Visa', 0, 600],
    ['local', 'Local transport', 20, 1000],
    ['stay', 'Stay estimate', 100, 5000],
    ['service', 'Care coordination', 0, 1500],
  ];
  const customTotal = Object.values(budget).reduce((sum, value) => sum + Number(value), 0);
  const scrollToHospitalForm = () => setShowAppointmentModal(true);
  const suggestedDoctorHospitals = HOSPITALS.filter((hospital) => {
    if (doctorTreatmentFilter === 'All') return hospital.city === selectedHospital.city || hospital.specialty === selectedHospital.specialty;
    return hospital.tags.includes(doctorTreatmentFilter) || hospital.doctorFocus.includes(doctorTreatmentFilter) || hospital.specialty === doctorTreatmentFilter;
  }).slice(0, 6);
  const hospitalAccreditation = accreditationText(selectedHospital.accreditations, selectedHospital.nabhType || selectedHospital.jciStatus || 'Update pending');
  const hospitalAddress = selectedHospital.address || selectedHospital.addressLine1 || [selectedHospital.city, selectedHospital.state, selectedHospital.country].filter(Boolean).join(', ');
  const hospitalBeds = selectedHospital.bedText || selectedHospital.beds || 'Update pending';
  const hospitalFounded = selectedHospital.foundedYear || selectedHospital.established || 'Update pending';
  const hospitalFacilities = Array.isArray(selectedHospital.facilities) && selectedHospital.facilities.length
    ? selectedHospital.facilities
    : ['International patient support', 'Hospital profile enrichment pending'];
  const hospitalAccreditationList = Array.isArray(selectedHospital.accreditations)
    ? selectedHospital.accreditations
    : String(selectedHospital.accreditations || hospitalAccreditation).split(',').map((item) => item.trim()).filter(Boolean);
  const hospitalDoctorsList = selectedHospital.doctorsList || selectedHospital.doctor || 'Doctor list update pending';
  const hospitalContact = selectedHospital.phone || selectedHospital.mobile || 'Contact update pending';
  const hospitalWebsite = selectedHospital.website || '';

  // Show modal after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAppointmentModal(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="profile-page hospital-cma-page">
      <Breadcrumbs
        items={[
          { label: 'Home', onClick: () => setPage('home') },
          { label: 'Hospitals', onClick: onBack || (() => setPage('hospitals')) },
          { label: selectedHospital.country, onClick: () => setPage('destinations') },
          { label: selectedHospital.name },
        ]}
      />
      <div className="profile-title-row hospital-detail-title">
        <div>
          <span>{selectedHospital.city}, {selectedHospital.country}</span>
          <h1>{selectedHospital.name}</h1>
          <div className="cma-hospital-tags">
            <span>{selectedHospital.specialty} Hospital</span>
            <span>{selectedHospital.jciAccredited ? 'JCI Accredited' : selectedHospital.nabhType || 'Accredited Hospital'}</span>
            <span>{selectedHospital.internationalPatientWing ? `International wing: ${selectedHospital.internationalPatientWing}` : 'International patient support'}</span>
          </div>
          <p>{selectedHospital.name} is part of the client/JCI hospital master database with mapped accreditation, contact, location, and specialty details for care coordination.</p>
        </div>
        <div className="rating-card">
          <strong>{selectedHospital.rating}</strong>
          <span>Patient rating</span>
          <small>{selectedHospital.value}% patients recommend this hospital</small>
        </div>
      </div>
      <div className="hospital-profile-hero">
        <div className="gallery-mosaic">
          <button className="gallery-image-button gallery-main" onClick={() => setGalleryOpen(true)} type="button">
            <img alt={`${selectedHospital.name} main`} onError={handleImageFallback} src={gallery[0]} />
          </button>
          {gallery.slice(1).map((image, index) => (
            <button className="gallery-image-button" key={image} onClick={() => setGalleryOpen(true)} type="button">
              <img alt={`${selectedHospital.name} gallery ${index + 1}`} onError={handleImageFallback} src={image} />
            </button>
          ))}
          <button className="gallery-open-button" onClick={() => setGalleryOpen(true)} type="button">All pictures</button>
        </div>
      </div>

      <div className="hospital-detail-info-grid">
        <span><b>Doctors List</b><small>{hospitalDoctorsList}</small></span>
        <span><b>Location</b><small>{selectedHospital.city || 'India'}</small></span>
        <span><b>Established in</b><small>{hospitalFounded}</small></span>
        <span><b>Accreditations</b><small>{hospitalAccreditation}</small></span>
        <span><b>Specialty</b><small>{selectedHospital.specialty}</small></span>
        <span><b>Contact</b><small>{hospitalContact}</small></span>
        <span><b>Number of beds</b><small>{hospitalBeds}</small></span>
        <span><b>Facilities</b><small>{hospitalFacilities.slice(0, 2).join(', ')}</small></span>
      </div>

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <>
          <div className="appointment-modal-backdrop" onClick={() => setShowAppointmentModal(false)} />
          <div className="appointment-modal">
            <button className="modal-close-btn" onClick={() => setShowAppointmentModal(false)} type="button">
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
            <div className="modal-header d-block">
              <i className="fa-solid fa-phone" aria-hidden="true" />
              <h2>Get a Call Back</h2>
              <p>We'll call you back within 30 minutes to discuss your treatment options</p>
            </div>
            <CallBackForm selectedHospital={selectedHospital} />
          </div>
        </>
      )}

      <div className="hospital-action-row">
        <button onClick={scrollToHospitalForm} type="button">Get Call Back from {selectedHospital.name}</button>
      </div>

      <nav className="cma-detail-nav" aria-label="Hospital details sections">
        {['Overview', 'Treatments', 'Facilities', 'Reviews', 'Location', 'FAQs', 'Compare Hospitals'].map((item) => (
          <a href={`#hospital-${item.toLowerCase().replaceAll(' ', '-')}`} key={item}>{item}</a>
        ))}
      </nav>

      <section className="cma-overview-panel" id="hospital-overview">
        <div className="cma-overview-copy">
          <span>Patient Trusted Hospital</span>
          <h2>{selectedHospital.name}</h2>
          <p>{hospitalAddress}</p>
          <div className="cma-rating-row">
            <strong>{selectedHospital.rating}</strong>
            <StarRating rating={selectedHospital.rating} />
            <small>{hospitalAccreditation}</small>
          </div>
        </div>
        <img alt={selectedHospital.name} onError={handleImageFallback} src={getHospitalImage(selectedHospital)} />
      </section>

      <section className="cma-care-grid" aria-label="Care provided by hospital">
        {[
          ['Internationally accredited care', 'Verified doctors, modern departments, and structured patient support.'],
          ['Top hospital network', 'Shortlist care by treatment, city, doctor availability, and estimated budget.'],
          ['World-class infrastructure', 'Advanced diagnostics, modular theatres, ICU beds, and recovery support.'],
          ['Patient-first services', 'Dedicated coordinator for appointments, reports, travel, and follow-up.'],
        ].map(([title, text]) => (
          <article key={title}>
            <span aria-hidden="true"><UiIcon name="shield" /></span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="cma-content-grid">
        <article className="cma-about-card">
          <h2>About</h2>
          <p>
            {selectedHospital.name} is listed in the {selectedHospital.sourceSystem || 'client hospital master database'} for {selectedHospital.specialty.toLowerCase()} care
            {selectedHospital.city ? ` in ${selectedHospital.city}` : ''}. The profile includes client-provided address, accreditation, bed count, international patient wing, and contact details where available.
          </p>

          {/* Contact Details Section */}
          <div className="hospital-contact-details">
            <h3>Contact Information</h3>
            <div className="contact-details-grid">
              {hospitalContact && hospitalContact !== 'Contact update pending' && (
                <a href={`tel:${hospitalContact.replace(/\s/g, '')}`} className="contact-detail-item">
                  <div className="contact-icon">
                    <i className="fa-solid fa-phone" aria-hidden="true" />
                  </div>
                  <div className="contact-content">
                    <span className="contact-label">Phone</span>
                    <strong className="contact-value">{hospitalContact}</strong>
                  </div>
                </a>
              )}

              {selectedHospital.email && selectedHospital.email !== 'Update pending' && (
                <a href={`mailto:${selectedHospital.email}`} className="contact-detail-item">
                  <div className="contact-icon">
                    <i className="fa-solid fa-envelope" aria-hidden="true" />
                  </div>
                  <div className="contact-content">
                    <span className="contact-label">Email</span>
                    <strong className="contact-value">{selectedHospital.email}</strong>
                  </div>
                </a>
              )}

              {hospitalAddress && (
                <div className="contact-detail-item">
                  <div className="contact-icon">
                    <i className="fa-solid fa-location-dot" aria-hidden="true" />
                  </div>
                  <div className="contact-content">
                    <span className="contact-label">Location</span>
                    <strong className="contact-value">{hospitalAddress}</strong>
                  </div>
                </div>
              )}

              {hospitalWebsite && (
                <a href={hospitalWebsite} rel="noreferrer" target="_blank" className="contact-detail-item">
                  <div className="contact-icon">
                    <i className="fa-solid fa-globe" aria-hidden="true" />
                  </div>
                  <div className="contact-content">
                    <span className="contact-label">Website</span>
                    <strong className="contact-value">Visit Hospital Website</strong>
                  </div>
                </a>
              )}
            </div>
          </div>

          <h3>Medical Specialty</h3>
          <ul>
            {selectedHospital.tags.slice(0, 4).map((item) => <li key={item}>{item}</li>)}
          </ul>

          <h3>International Services</h3>
          <ul>
            <li>International patient wing: {selectedHospital.internationalPatientWing || 'Update pending'}.</li>
            {selectedHospital.internationalPatientWing && selectedHospital.internationalPatientWing !== 'no' && selectedHospital.internationalPatientWing !== 'yes' && (
              <li className="international-wing-details">{selectedHospital.internationalPatientWing}</li>
            )}
          </ul>
        </article>

        <aside className="cma-side-stack">
          <section id="hospital-treatments">
            <h3>Treatments {selectedHospital.name} is known for</h3>
            <div className="cma-chip-list">
              {[...selectedHospital.tags, ...selectedHospital.doctorFocus].slice(0, 8).map((item) => (
                <button onClick={() => setPage('treatments')} key={item} type="button">{item}</button>
              ))}
            </div>
          </section>
          <section id="hospital-facilities">
            <h3>Highlights</h3>
            <div className="cma-facility-grid">
              {[
                [`Bed Count: ${hospitalBeds}`],
                [`Established: ${hospitalFounded}`],
                [`Accreditation: ${hospitalAccreditation}`],
                [`Source: ${selectedHospital.sourceSystem || 'Client master data'}`],
                ...hospitalFacilities.slice(0, 4).map((item) => [item]),
              ].map(([item]) => <span key={item}><UiIcon name="shield" />{item}</span>)}
            </div>
          </section>
        </aside>
      </section>

      <section className="cma-content-grid cma-lower-grid">
        <article className="cma-about-card">
          <h2>Why International Patients Choose {selectedHospital.name}</h2>
          <div className="cma-info-pairs">
            <span><b>Hospital Type</b><small>Multispecialty Hospital</small></span>
            <span><b>Hospital Unit</b><small>{selectedHospital.specialty}</small></span>
            <span><b>Languages Spoken</b><small>{selectedHospital.languages.join(', ')}</small></span>
            <span><b>Location</b><small>{selectedHospital.city}, India</small></span>
          </div>
        </article>
        <article className="cma-about-card" id="hospital-reviews">
          <h2>Payment Method</h2>
          <div className="cma-facility-grid">
            {['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Insurance support'].map((item) => (
              <span key={item}><UiIcon name="cost" />{item}</span>
            ))}
          </div>
          <h2>Room Types</h2>
          <div className="cma-facility-grid">
            {['General Ward', 'Semi-Private Room', 'Private Room', 'Deluxe Room'].map((item) => (
              <span key={item}><UiIcon name="home" />{item}</span>
            ))}
          </div>
        </article>
      </section>

      <section className="hospital-doctors-section">
        <div className="cma-section-title">
          <h2>Suggested Doctors at {selectedHospital.name}</h2>
          <p>Filter doctors by treatment, compare experience, then book an appointment.</p>
        </div>
        <div className="doctor-filter-row">
          {doctorTreatmentOptions.map((item) => (
            <button
              className={doctorTreatmentFilter === item ? 'active' : ''}
              key={item}
              onClick={() => setDoctorTreatmentFilter(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="vaidam-doctor-grid">
          {suggestedDoctorHospitals.map((hospital) => (
            <article key={`${hospital.id}-${hospital.doctor}`} className="vaidam-doctor-card">
              <div className="vaidam-doctor-top">
                <img alt={hospital.doctor} src={hospital.doctorImage} />
                <div>
                  <h3>{hospital.doctor}</h3>
                  <p>{hospital.doctorTitle}</p>
                  <strong>{hospital.experience} of experience</strong>
                  <StarRating rating={hospital.rating} />
                </div>
              </div>
              <div className="vaidam-doctor-actions">
                <button
                  onClick={() => {
                    setSelectedHospital(hospital);
                    setPage('doctor-detail');
                  }}
                  type="button"
                >
                  View Profile
                </button>
                <button onClick={scrollToHospitalForm} type="button">Book Appointment</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="profile-tabs">
        {['About', 'Specialisation', 'Doctors', 'Gallery', 'Infrastructure', 'Reviews'].map((item) => (
          <button className={activeTab === item ? 'active' : ''} key={item} onClick={() => setActiveTab(item)} type="button">
            {item}
          </button>
        ))}
      </div>

      <div className="profile-layout">
        <div className="profile-main">
          {activeTab === 'About' && (
            <article className="detail-panel hospital-about">
              <h2>About the hospital</h2>
              <p>
                {selectedHospital.name} is listed from the {selectedHospital.sourceSystem || 'client hospital master database'}.
                Its current master profile includes {selectedHospital.specialty} specialty, {hospitalAccreditation} accreditation status,
                and {hospitalAddress || 'location details pending'}.
              </p>
              <p>
                Secondary enrichment such as detailed facilities, live doctors, photos, and package pricing can be updated from admin
                without replacing the base hospital record.
              </p>
              <div className="hospital-stat-row">
                <span><strong>{hospitalFounded}</strong><small>Established</small></span>
                <span><strong>{hospitalBeds}</strong><small>Beds</small></span>
                <span><strong>{selectedHospital.internationalPatientWing || 'Update pending'}</strong><small>International wing</small></span>
                <span><strong>{selectedHospital.city || 'India'}</strong><small>Location</small></span>
              </div>
            </article>
          )}

          {activeTab === 'Specialisation' && (
            <article className="detail-panel">
              <h2>Team & Specialisation</h2>
              <div className="tag-cloud">
                {[...selectedHospital.tags, ...selectedHospital.doctorFocus, 'International patient care', 'Remote follow-up'].map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </article>
          )}

          {activeTab === 'Doctors' && (
            <article className="detail-panel profile-doctor-strip">
              <img alt={selectedHospital.doctor} src={selectedHospital.doctorImage} />
              <div>
                <span>Featured doctor</span>
                <h2>{selectedHospital.doctor}</h2>
                <p>{selectedHospital.doctorTitle} with {selectedHospital.experience} experience.</p>
                <StarRating rating={selectedHospital.rating} />
                <strong>{money(selectedHospital.doctorFee)} consultation</strong>
                <button onClick={() => setPage('doctor-detail')} type="button">View doctor profile</button>
              </div>
            </article>
          )}

          {activeTab === 'Gallery' && (
            <article className="detail-panel">
              <h2>Gallery</h2>
              <div className="inline-gallery">
                {gallery.map((image, index) => (
                  <img alt={`${selectedHospital.name} interior ${index + 1}`} key={image} src={image} />
                ))}
              </div>
            </article>
          )}

          {activeTab === 'Infrastructure' && (
            <>
              <article className="detail-panel">
                <h2>Infrastructure</h2>
                <div className="feature-list">
                  {selectedHospital.infrastructure.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </article>
              <article className="detail-panel">
                <h2>Accreditations & certificates</h2>
                <div className="certificate-grid">
                  {hospitalAccreditationList.length ? hospitalAccreditationList.map((item) => (
                    <span key={item}><strong>{item.split(' ')[0]}</strong><small>{item}</small></span>
                  )) : <span><strong>Pending</strong><small>Accreditation details can be updated from admin.</small></span>}
                </div>
              </article>
            </>
          )}

          {activeTab === 'Reviews' && (
            <article className="detail-panel">
              <h2>Reviews & patient stories</h2>
              <div className="review-grid">
                {PATIENT_REVIEWS.map(([name, country, review]) => (
                  <blockquote key={name}>
                    <StarRating rating="5.0" />
                    <strong>{name}</strong>
                    <span>{country}</span>
                    <p>{review}</p>
                  </blockquote>
                ))}
              </div>
            </article>
          )}
        </div>

      </div>
      <section className="full-budget-section">
        <div className="budget-section-intro">
          <span>Cost transparency planner</span>
          <h2>Customize the full patient journey budget</h2>
          <p>Separate hospital package, travel, visa, local transport, stay and care coordination. This is the main decision layer before the patient requests an appointment.</p>
          <div className="budget-deep-copy">
            <h3>What this estimate explains</h3>
            <ul>
              <li>Hospital package is only one part of the journey.</li>
              <li>Travel and stay can change destination affordability.</li>
              <li>Care coordination keeps pickup, reports, follow-up, and support visible.</li>
            </ul>
          </div>
        </div>
        <div className="budget-workbench">
          <div className="budget-total-card">
            <span>Total journey estimate</span>
            <strong>{money(customTotal)}</strong>
            <small>Includes treatment, travel, visa, stay, local transport, and care coordination.</small>
          </div>
          <div className="budget-pill-row">
            <span>Editable</span>
            <span>API ready</span>
            <span>Transparent</span>
          </div>
          <div className="budget-customizer">
            {rows.map(([key, label, min, max]) => (
              <label key={key}>
                <span>
                  <small>{label}</small>
                  <strong>{money(Number(budget[key]))}</strong>
                </span>
                <input
                  max={max}
                  min={min}
                  onChange={(event) => setBudget((current) => ({ ...current, [key]: Number(event.target.value) }))}
                  step="10"
                  type="range"
                  value={budget[key]}
                />
              </label>
            ))}
          </div>
          <div className="cost-table budget-breakdown-grid">
            {rows.map(([key, label]) => (
              <span key={key}>
                <small>{label}</small>
                <strong>{money(Number(budget[key]))}</strong>
              </span>
            ))}
            <span className="total-line">
              <small>Total estimate</small>
              <strong>{money(customTotal)}</strong>
            </span>
          </div>
        </div>
      </section>

      {/* Partner Landing Section - Added at the end */}
      <section className="hospital-partner-section">
        <div className="partner-cta-banner">
          <div className="partner-cta-content">
            <h2><i className="fa-solid fa-handshake" aria-hidden="true" /> Partner with Us</h2>
            <p>Are you a hospital looking to attract more international patients? We can help you grow your patient footfall by 30% in 6 months.</p>
            <button onClick={() => document.getElementById('partner-details').scrollIntoView({ behavior: 'smooth' })} type="button">
              Learn More <i className="fa-solid fa-arrow-down" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div id="partner-details" className="partner-details-section">
          <HospitalPartnerLanding onBackToDetails={() => {}} selectedHospital={selectedHospital} isEmbedded={true} />
        </div>
      </section>

      {galleryOpen && (
        <div className="gallery-overlay" role="dialog" aria-modal="true" aria-label={`${selectedHospital.name} gallery`}>
          <div className="gallery-dialog">
            <button className="modal-close" onClick={() => setGalleryOpen(false)} type="button">x</button>
            <span>{selectedHospital.name}</span>
            <h2>Hospital gallery</h2>
            <div className="gallery-dialog-grid">
              {gallery.map((image, index) => (
                <img alt={`${selectedHospital.name} full gallery ${index + 1}`} key={image} src={image} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function DoctorDetail({ money, selectedHospital, setPage }) {
  const gallery = hospitalGallery(selectedHospital);
  const [activeTab, setActiveTab] = useState('About');
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const doctorTreatmentOptions = ['All', ...new Set([...selectedHospital.tags, ...selectedHospital.doctorFocus].slice(0, 8))];
  const [doctorTreatmentFilter, setDoctorTreatmentFilter] = useState(selectedTreatment?.title ?? 'All');
  const [budget, setBudget] = useState({
    package: basePackage,
    flight: selectedHospital.cost.flight,
    visa: selectedHospital.cost.visa,
    local: selectedHospital.cost.local,
    stay: selectedHospital.cost.stay,
    service: selectedHospital.cost.service,
  });
  const rows = [
    ['package', 'Treatment package', 100, 30000],
    ['flight', 'Flights', 100, 3000],
    ['visa', 'Visa', 0, 600],
    ['local', 'Local transport', 20, 1000],
    ['stay', 'Stay estimate', 100, 5000],
    ['service', 'Care coordination', 0, 1500],
  ];
  const customTotal = Object.values(budget).reduce((sum, value) => sum + Number(value), 0);
  const scrollToHospitalForm = () => setShowAppointmentModal(true);
  const suggestedDoctorHospitals = HOSPITALS.filter((hospital) => {
    if (doctorTreatmentFilter === 'All') return hospital.city === selectedHospital.city || hospital.specialty === selectedHospital.specialty;
    return hospital.tags.includes(doctorTreatmentFilter) || hospital.doctorFocus.includes(doctorTreatmentFilter) || hospital.specialty === doctorTreatmentFilter;
  }).slice(0, 6);
  const hospitalAccreditation = accreditationText(selectedHospital.accreditations, selectedHospital.nabhType || selectedHospital.jciStatus || 'Update pending');
  const hospitalAddress = selectedHospital.address || selectedHospital.addressLine1 || [selectedHospital.city, selectedHospital.state, selectedHospital.country].filter(Boolean).join(', ');
  const hospitalBeds = selectedHospital.bedText || selectedHospital.beds || 'Update pending';
  const hospitalFounded = selectedHospital.foundedYear || selectedHospital.established || 'Update pending';
  const hospitalFacilities = Array.isArray(selectedHospital.facilities) && selectedHospital.facilities.length
    ? selectedHospital.facilities
    : ['International patient support', 'Hospital profile enrichment pending'];
  const hospitalAccreditationList = Array.isArray(selectedHospital.accreditations)
    ? selectedHospital.accreditations
    : String(selectedHospital.accreditations || hospitalAccreditation).split(',').map((item) => item.trim()).filter(Boolean);
  const hospitalDoctorsList = selectedHospital.doctorsList || selectedHospital.doctor || 'Doctor list update pending';
  const hospitalContact = selectedHospital.phone || selectedHospital.mobile || 'Contact update pending';
  const hospitalWebsite = selectedHospital.website || '';

  // Show modal after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAppointmentModal(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="profile-page hospital-cma-page">
      <Breadcrumbs
        items={[
          { label: 'Home', onClick: () => setPage('home') },
          { label: 'Hospitals', onClick: onBack || (() => setPage('hospitals')) },
          { label: selectedHospital.country, onClick: () => setPage('destinations') },
          { label: selectedHospital.name },
        ]}
      />
      <div className="profile-title-row hospital-detail-title">
        <div>
          <span>{selectedHospital.city}, {selectedHospital.country}</span>
          <h1>{selectedHospital.name}</h1>
          <div className="cma-hospital-tags">
            <span>{selectedHospital.specialty} Hospital</span>
            <span>{selectedHospital.jciAccredited ? 'JCI Accredited' : selectedHospital.nabhType || 'Accredited Hospital'}</span>
            <span>{selectedHospital.internationalPatientWing ? `International wing: ${selectedHospital.internationalPatientWing}` : 'International patient support'}</span>
          </div>
          <p>{selectedHospital.name} is part of the client/JCI hospital master database with mapped accreditation, contact, location, and specialty details for care coordination.</p>
        </div>
        <div className="rating-card">
          <strong>{selectedHospital.rating}</strong>
          <span>Patient rating</span>
          <small>{selectedHospital.value}% patients recommend this hospital</small>
        </div>
      </div>
      <div className="hospital-profile-hero">
        <div className="gallery-mosaic">
          <button className="gallery-image-button gallery-main" onClick={() => setGalleryOpen(true)} type="button">
            <img alt={`${selectedHospital.name} main`} onError={handleImageFallback} src={gallery[0]} />
          </button>
          {gallery.slice(1).map((image, index) => (
            <button className="gallery-image-button" key={image} onClick={() => setGalleryOpen(true)} type="button">
              <img alt={`${selectedHospital.name} gallery ${index + 1}`} onError={handleImageFallback} src={image} />
            </button>
          ))}
          <button className="gallery-open-button" onClick={() => setGalleryOpen(true)} type="button">All pictures</button>
        </div>
      </div>

      <div className="hospital-detail-info-grid">
        <span><b>Doctors List</b><small>{hospitalDoctorsList}</small></span>
        <span><b>Location</b><small>{selectedHospital.city || 'India'}</small></span>
        <span><b>Established in</b><small>{hospitalFounded}</small></span>
        <span><b>Accreditations</b><small>{hospitalAccreditation}</small></span>
        <span><b>Specialty</b><small>{selectedHospital.specialty}</small></span>
        <span><b>Contact</b><small>{hospitalContact}</small></span>
        <span><b>Number of beds</b><small>{hospitalBeds}</small></span>
        <span><b>Facilities</b><small>{hospitalFacilities.slice(0, 2).join(', ')}</small></span>
      </div>

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <>
          <div className="appointment-modal-backdrop" onClick={() => setShowAppointmentModal(false)} />
          <div className="appointment-modal">
            <button className="modal-close-btn" onClick={() => setShowAppointmentModal(false)} type="button">
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
            <div className="modal-header d-block">
              <i className="fa-solid fa-phone" aria-hidden="true" />
              <h2>Get a Call Back</h2>
              <p>We'll call you back within 30 minutes to discuss your treatment options</p>
            </div>
            <CallBackForm selectedHospital={selectedHospital} />
          </div>
        </>
      )}

      <div className="hospital-action-row">
        <button onClick={scrollToHospitalForm} type="button">Get Call Back from {selectedHospital.name}</button>
      </div>

      <nav className="cma-detail-nav" aria-label="Hospital details sections">
        {['Overview', 'Treatments', 'Facilities', 'Reviews', 'Location', 'FAQs', 'Compare Hospitals'].map((item) => (
          <a href={`#hospital-${item.toLowerCase().replaceAll(' ', '-')}`} key={item}>{item}</a>
        ))}
      </nav>

      <section className="cma-overview-panel" id="hospital-overview">
        <div className="cma-overview-copy">
          <span>Patient Trusted Hospital</span>
          <h2>{selectedHospital.name}</h2>
          <p>{hospitalAddress}</p>
          <div className="cma-rating-row">
            <strong>{selectedHospital.rating}</strong>
            <StarRating rating={selectedHospital.rating} />
            <small>{hospitalAccreditation}</small>
          </div>
        </div>
        <img alt={selectedHospital.name} onError={handleImageFallback} src={getHospitalImage(selectedHospital)} />
      </section>

      <section className="cma-care-grid" aria-label="Care provided by hospital">
        {[
          ['Internationally accredited care', 'Verified doctors, modern departments, and structured patient support.'],
          ['Top hospital network', 'Shortlist care by treatment, city, doctor availability, and estimated budget.'],
          ['World-class infrastructure', 'Advanced diagnostics, modular theatres, ICU beds, and recovery support.'],
          ['Patient-first services', 'Dedicated coordinator for appointments, reports, travel, and follow-up.'],
        ].map(([title, text]) => (
          <article key={title}>
            <span aria-hidden="true"><UiIcon name="shield" /></span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="cma-content-grid">
        <article className="cma-about-card">
          <h2>About</h2>
          <p>
            {selectedHospital.name} is listed in the {selectedHospital.sourceSystem || 'client hospital master database'} for {selectedHospital.specialty.toLowerCase()} care
            {selectedHospital.city ? ` in ${selectedHospital.city}` : ''}. The profile includes client-provided address, accreditation, bed count, international patient wing, and contact details where available.
          </p>

          {/* Contact Details Section */}
          <div className="hospital-contact-details">
            <h3>Contact Information</h3>
            <div className="contact-details-grid">
              {hospitalContact && hospitalContact !== 'Contact update pending' && (
                <a href={`tel:${hospitalContact.replace(/\s/g, '')}`} className="contact-detail-item">
                  <div className="contact-icon">
                    <i className="fa-solid fa-phone" aria-hidden="true" />
                  </div>
                  <div className="contact-content">
                    <span className="contact-label">Phone</span>
                    <strong className="contact-value">{hospitalContact}</strong>
                  </div>
                </a>
              )}

              {selectedHospital.email && selectedHospital.email !== 'Update pending' && (
                <a href={`mailto:${selectedHospital.email}`} className="contact-detail-item">
                  <div className="contact-icon">
                    <i className="fa-solid fa-envelope" aria-hidden="true" />
                  </div>
                  <div className="contact-content">
                    <span className="contact-label">Email</span>
                    <strong className="contact-value">{selectedHospital.email}</strong>
                  </div>
                </a>
              )}

              {hospitalAddress && (
                <div className="contact-detail-item">
                  <div className="contact-icon">
                    <i className="fa-solid fa-location-dot" aria-hidden="true" />
                  </div>
                  <div className="contact-content">
                    <span className="contact-label">Location</span>
                    <strong className="contact-value">{hospitalAddress}</strong>
                  </div>
                </div>
              )}

              {hospitalWebsite && (
                <a href={hospitalWebsite} rel="noreferrer" target="_blank" className="contact-detail-item">
                  <div className="contact-icon">
                    <i className="fa-solid fa-globe" aria-hidden="true" />
                  </div>
                  <div className="contact-content">
                    <span className="contact-label">Website</span>
                    <strong className="contact-value">Visit Hospital Website</strong>
                  </div>
                </a>
              )}
            </div>
          </div>

          <h3>Medical Specialty</h3>
          <ul>
            {selectedHospital.tags.slice(0, 4).map((item) => <li key={item}>{item}</li>)}
          </ul>

          <h3>International Services</h3>
          <ul>
            <li>International patient wing: {selectedHospital.internationalPatientWing || 'Update pending'}.</li>
            {selectedHospital.internationalPatientWing && selectedHospital.internationalPatientWing !== 'no' && selectedHospital.internationalPatientWing !== 'yes' && (
              <li className="international-wing-details">{selectedHospital.internationalPatientWing}</li>
            )}
          </ul>
        </article>

        <aside className="cma-side-stack">
          <section id="hospital-treatments">
            <h3>Treatments {selectedHospital.name} is known for</h3>
            <div className="cma-chip-list">
              {[...selectedHospital.tags, ...selectedHospital.doctorFocus].slice(0, 8).map((item) => (
                <button onClick={() => setPage('treatments')} key={item} type="button">{item}</button>
              ))}
            </div>
          </section>
          <section id="hospital-facilities">
            <h3>Highlights</h3>
            <div className="cma-facility-grid">
              {[
                [`Bed Count: ${hospitalBeds}`],
                [`Established: ${hospitalFounded}`],
                [`Accreditation: ${hospitalAccreditation}`],
                [`Source: ${selectedHospital.sourceSystem || 'Client master data'}`],
                ...hospitalFacilities.slice(0, 4).map((item) => [item]),
              ].map(([item]) => <span key={item}><UiIcon name="shield" />{item}</span>)}
            </div>
          </section>
        </aside>
      </section>

      <section className="cma-content-grid cma-lower-grid">
        <article className="cma-about-card">
          <h2>Why International Patients Choose {selectedHospital.name}</h2>
          <div className="cma-info-pairs">
            <span><b>Hospital Type</b><small>Multispecialty Hospital</small></span>
            <span><b>Hospital Unit</b><small>{selectedHospital.specialty}</small></span>
            <span><b>Languages Spoken</b><small>{selectedHospital.languages.join(', ')}</small></span>
            <span><b>Location</b><small>{selectedHospital.city}, India</small></span>
          </div>
        </article>
        <article className="cma-about-card" id="hospital-reviews">
          <h2>Payment Method</h2>
          <div className="cma-facility-grid">
            {['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Insurance support'].map((item) => (
              <span key={item}><UiIcon name="cost" />{item}</span>
            ))}
          </div>
          <h2>Room Types</h2>
          <div className="cma-facility-grid">
            {['General Ward', 'Semi-Private Room', 'Private Room', 'Deluxe Room'].map((item) => (
              <span key={item}><UiIcon name="home" />{item}</span>
            ))}
          </div>
        </article>
      </section>

      <section className="hospital-doctors-section">
        <div className="cma-section-title">
          <h2>Suggested Doctors at {selectedHospital.name}</h2>
          <p>Filter doctors by treatment, compare experience, then book an appointment.</p>
        </div>
        <div className="doctor-filter-row">
          {doctorTreatmentOptions.map((item) => (
            <button
              className={doctorTreatmentFilter === item ? 'active' : ''}
              key={item}
              onClick={() => setDoctorTreatmentFilter(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="vaidam-doctor-grid">
          {suggestedDoctorHospitals.map((hospital) => (
            <article key={`${hospital.id}-${hospital.doctor}`} className="vaidam-doctor-card">
              <div className="vaidam-doctor-top">
                <img alt={hospital.doctor} src={hospital.doctorImage} />
                <div>
                  <h3>{hospital.doctor}</h3>
                  <p>{hospital.doctorTitle}</p>
                  <strong>{hospital.experience} of experience</strong>
                  <StarRating rating={hospital.rating} />
                </div>
              </div>
              <div className="vaidam-doctor-actions">
                <button
                  onClick={() => {
                    setSelectedHospital(hospital);
                    setPage('doctor-detail');
                  }}
                  type="button"
                >
                  View Profile
                </button>
                <button onClick={scrollToHospitalForm} type="button">Book Appointment</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="profile-tabs">
        {['About', 'Specialisation', 'Doctors', 'Gallery', 'Infrastructure', 'Reviews'].map((item) => (
          <button className={activeTab === item ? 'active' : ''} key={item} onClick={() => setActiveTab(item)} type="button">
            {item}
          </button>
        ))}
      </div>

      <div className="profile-layout">
        <div className="profile-main">
          {activeTab === 'About' && (
            <article className="detail-panel hospital-about">
              <h2>About the hospital</h2>
              <p>
                {selectedHospital.name} is listed from the {selectedHospital.sourceSystem || 'client hospital master database'}.
                Its current master profile includes {selectedHospital.specialty} specialty, {hospitalAccreditation} accreditation status,
                and {hospitalAddress || 'location details pending'}.
              </p>
              <p>
                Secondary enrichment such as detailed facilities, live doctors, photos, and package pricing can be updated from admin
                without replacing the base hospital record.
              </p>
              <div className="hospital-stat-row">
                <span><strong>{hospitalFounded}</strong><small>Established</small></span>
                <span><strong>{hospitalBeds}</strong><small>Beds</small></span>
                <span><strong>{selectedHospital.internationalPatientWing || 'Update pending'}</strong><small>International wing</small></span>
                <span><strong>{selectedHospital.city || 'India'}</strong><small>Location</small></span>
              </div>
            </article>
          )}

          {activeTab === 'Specialisation' && (
            <article className="detail-panel">
              <h2>Team & Specialisation</h2>
              <div className="tag-cloud">
                {[...selectedHospital.tags, ...selectedHospital.doctorFocus, 'International patient care', 'Remote follow-up'].map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </article>
          )}

          {activeTab === 'Doctors' && (
            <article className="detail-panel profile-doctor-strip">
              <img alt={selectedHospital.doctor} src={selectedHospital.doctorImage} />
              <div>
                <span>Featured doctor</span>
                <h2>{selectedHospital.doctor}</h2>
                <p>{selectedHospital.doctorTitle} with {selectedHospital.experience} experience.</p>
                <StarRating rating={selectedHospital.rating} />
                <strong>{money(selectedHospital.doctorFee)} consultation</strong>
                <button onClick={() => setPage('doctor-detail')} type="button">View doctor profile</button>
              </div>
            </article>
          )}

          {activeTab === 'Gallery' && (
            <article className="detail-panel">
              <h2>Gallery</h2>
              <div className="inline-gallery">
                {gallery.map((image, index) => (
                  <img alt={`${selectedHospital.name} interior ${index + 1}`} key={image} src={image} />
                ))}
              </div>
            </article>
          )}

          {activeTab === 'Infrastructure' && (
            <>
              <article className="detail-panel">
                <h2>Infrastructure</h2>
                <div className="feature-list">
                  {selectedHospital.infrastructure.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </article>
              <article className="detail-panel">
                <h2>Accreditations & certificates</h2>
                <div className="certificate-grid">
                  {hospitalAccreditationList.length ? hospitalAccreditationList.map((item) => (
                    <span key={item}><strong>{item.split(' ')[0]}</strong><small>{item}</small></span>
                  )) : <span><strong>Pending</strong><small>Accreditation details can be updated from admin.</small></span>}
                </div>
              </article>
            </>
          )}

          {activeTab === 'Reviews' && (
            <article className="detail-panel">
              <h2>Reviews & patient stories</h2>
              <div className="review-grid">
                {PATIENT_REVIEWS.map(([name, country, review]) => (
                  <blockquote key={name}>
                    <StarRating rating="5.0" />
                    <strong>{name}</strong>
                    <span>{country}</span>
                    <p>{review}</p>
                  </blockquote>
                ))}
              </div>
            </article>
          )}
        </div>

      </div>
      <section className="full-budget-section">
        <div className="budget-section-intro">
          <span>Cost transparency planner</span>
          <h2>Customize the full patient journey budget</h2>
          <p>Separate hospital package, travel, visa, local transport, stay and care coordination. This is the main decision layer before the patient requests an appointment.</p>
          <div className="budget-deep-copy">
            <h3>What this estimate explains</h3>
            <ul>
              <li>Hospital package is only one part of the journey.</li>
              <li>Travel and stay can change destination affordability.</li>
              <li>Care coordination keeps pickup, reports, follow-up, and support visible.</li>
            </ul>
          </div>
        </div>
        <div className="budget-workbench">
          <div className="budget-total-card">
            <span>Total journey estimate</span>
            <strong>{money(customTotal)}</strong>
            <small>Includes treatment, travel, visa, stay, local transport, and care coordination.</small>
          </div>
          <div className="budget-pill-row">
            <span>Editable</span>
            <span>API ready</span>
            <span>Transparent</span>
          </div>
          <div className="budget-customizer">
            {rows.map(([key, label, min, max]) => (
              <label key={key}>
                <span>
                  <small>{label}</small>
                  <strong>{money(Number(budget[key]))}</strong>
                </span>
                <input
                  max={max}
                  min={min}
                  onChange={(event) => setBudget((current) => ({ ...current, [key]: Number(event.target.value) }))}
                  step="10"
                  type="range"
                  value={budget[key]}
                />
              </label>
            ))}
          </div>
          <div className="cost-table budget-breakdown-grid">
            {rows.map(([key, label]) => (
              <span key={key}>
                <small>{label}</small>
                <strong>{money(Number(budget[key]))}</strong>
              </span>
            ))}
            <span className="total-line">
              <small>Total estimate</small>
              <strong>{money(customTotal)}</strong>
            </span>
          </div>
        </div>
      </section>
      {galleryOpen && (
        <div className="gallery-overlay" role="dialog" aria-modal="true" aria-label={`${selectedHospital.name} gallery`}>
          <div className="gallery-dialog">
            <button className="modal-close" onClick={() => setGalleryOpen(false)} type="button">x</button>
            <span>{selectedHospital.name}</span>
            <h2>Hospital gallery</h2>
            <div className="gallery-dialog-grid">
              {gallery.map((image, index) => (
                <img alt={`${selectedHospital.name} full gallery ${index + 1}`} key={image} src={image} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CostComparison({ money, selectedHospital, selectedTreatment }) {
  const currentTotal = totalCost(selectedHospital, selectedTreatment);

  return (
    <section className="comparison-section">
      <div>
        <h2>Global Cost Comparison</h2>
        <p>Affordable care, transparent costs, expert guidance.</p>
        <span>Compare your selected plan against an average market range before you speak to a care expert.</span>
      </div>
      <div className="comparison-card">
        <div>
          <span>Prices with {BRAND_NAME}</span>
          <strong>{money(currentTotal)}</strong>
        </div>
        <div>
          <span>Prices without planning</span>
          <strong>{money(Math.round(currentTotal * 1.35))}</strong>
        </div>
        <button type="button">Get best price</button>
      </div>
    </section>
  );
}

function Planner({ hospitals = INDIA_HOSPITALS, initialProcedure = null, money = (value) => formatCurrency(value, 'INR'), selectedTreatment, selectedHospital, setPage, setSelectedHospital, setSelectedTreatment, treatments = TREATMENTS }) {
  // Determine the correct starting step:
  // - If treatment + procedure both pre-selected → skip to Step 3 (trip-style)
  // - If only treatment pre-selected → skip to Step 2 (procedure)
  // - Otherwise → Step 1 (search)
  const getInitialViewMode = () => {
    if (selectedTreatment && initialProcedure) return 'trip-style';
    if (selectedTreatment) return 'procedure';
    return 'search';
  };

  const [viewMode, setViewMode] = useState(getInitialViewMode);

  // Pre-populate treatment/procedure selections from props
  const [selectedTreatmentsForSearch, setSelectedTreatmentsForSearch] = useState(
    selectedTreatment ? [selectedTreatment] : []
  );
  const [selectedProceduresForSearch, setSelectedProceduresForSearch] = useState(
    initialProcedure ? [initialProcedure] : []
  );
  const [selectedTripStyle, setSelectedTripStyle] = useState(null);
  const [selectedHospitalForJourney, setSelectedHospitalForJourney] = useState(null);
  const [journeyPlanResult, setJourneyPlanResult] = useState(null);
  const [previousViewMode, setPreviousViewMode] = useState('hospitals'); // Track where to return from hospital details
  const [plannerTreatment, setPlannerTreatment] = useState(selectedTreatment || null);
  const [selectedCity, setSelectedCity] = useState('All India');
  const [activeModal, setActiveModal] = useState('treatment');
  const [treatmentSearch, setTreatmentSearch] = useState('');
  const [plannerTreatments, setPlannerTreatments] = useState(treatments);
  const [plannerHospitals, setPlannerHospitals] = useState(hospitals);
  const [appointmentForm, setAppointmentForm] = useState({
    patientName: '',
    countryCode: 'IN (+91)',
    phone: '',
    notes: '',
  });
  const [appointmentStatus, setAppointmentStatus] = useState('');
  const [bookingHospital, setBookingHospital] = useState(selectedHospital || hospitals[0] || INDIA_HOSPITALS[0]);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([
    'Hi! I am your planner assistant. Select a treatment or surgery and city. I will compare matching hospitals, likely doctor review steps, tentative stay, reports needed, and booking next steps.',
  ]);
  const aiThreadRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const normalizeTreatment = (item, index) => {
      const existing = treatments.find((treatment) => treatment.title.toLowerCase() === item.title?.toLowerCase());
      return existing || {
        id: item._id || normalizeSearch(item.title || `treatment-${index}`),
        group: item.subtitle || 'Treatment',
        title: item.title || 'Treatment',
        icon: (item.title || 'TR').slice(0, 2).toUpperCase(),
        packageFrom: 1200,
        value: 88,
        specialty: item.subtitle || item.title || 'Medical care',
        image: item.image,
        description: item.description,
      };
    };
    const normalizeHospital = (item, index) => {
      const existing = hospitals.find((hospital) => hospital.name.toLowerCase() === item.name?.toLowerCase());
      const fallback = hospitals[index % hospitals.length] || INDIA_HOSPITALS[index % INDIA_HOSPITALS.length];
      return {
        ...fallback,
        ...existing,
        id: existing?.id || item._id || `backend-hospital-${index}`,
        name: item.name || existing?.name || fallback.name,
        city: item.city || existing?.city || fallback.city,
        country: existing?.country || 'India',
        summary: item.summary || existing?.summary || fallback.summary,
        image: item.image || existing?.image || fallback.image,
      };
    };
    const fetchPlannerData = async (path) => {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 4500);
      try {
        const response = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
        return response.ok ? response.json() : [];
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    Promise.all([
      fetchPlannerData('/treatments'),
      fetchPlannerData('/hospitals'),
    ])
      .then(([fetchedTreatments, fetchedHospitals]) => {
        if (cancelled) return;
        if (Array.isArray(fetchedTreatments) && fetchedTreatments.length) {
          const normalized = fetchedTreatments.map(normalizeTreatment);
          const merged = [...normalized, ...treatments.filter((local) => !normalized.some((item) => item.title === local.title))];
          setPlannerTreatments(merged);
        }
        if (Array.isArray(fetchedHospitals) && fetchedHospitals.length) {
          setPlannerHospitals(fetchedHospitals.map(normalizeHospital));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPlannerTreatments(treatments);
          setPlannerHospitals(hospitals);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hospitals, treatments]);

  const indianCities = buildAvailableDestinations(plannerHospitals).map((destination) => ({
    name: destination.country,
    image: destination.image,
    hospitals: destination.hospitals,
    doctors: destination.doctors,
  }));
  const plannerCityOptions = useMemo(() => ['All India', ...Array.from(new Set(plannerHospitals.map((hospital) => hospital.city).filter(Boolean))).sort()], [plannerHospitals]);
  const cmaDestinations = indianCities.map((city) => [city.name, city.image]);
  const selectedDestination = selectedCity;
  const setSelectedDestination = setSelectedCity;
  const countryCodes = ['IN (+91)'];
  const plannerStep = activeModal === 'consultation' ? 1 : 0;
  const setPlannerStep = (index) => setActiveModal(index === 0 ? 'treatment' : 'consultation');
  const procedures = useMemo(() => {
    if (!plannerTreatment) return [];
    const matchedHospitals = plannerHospitals.filter((hospital) => hospitalMatchesTreatment(hospital, plannerTreatment));
    const focus = matchedHospitals.flatMap((hospital) => hospital.doctorFocus || []);
    return Array.from(new Set([
      `${plannerTreatment.title} consultation`,
      `${plannerTreatment.title} package estimate`,
      ...focus,
      plannerTreatment.specialty,
      'Other',
    ])).slice(0, 10);
  }, [plannerHospitals, plannerTreatment]);
  const suggestedHospital = useMemo(() => {
    if (!plannerTreatment) return selectedHospital || plannerHospitals[0] || INDIA_HOSPITALS[0];
    const cityNames = selectedCity === 'All India' ? [] : selectedCity === 'Delhi / NCR' ? ['New Delhi', 'Gurgaon', 'Delhi'] : [selectedCity];
    const treatmentMatch = (hospital) => hospitalMatchesTreatment(hospital, plannerTreatment);
    return plannerHospitals.find((hospital) => (!cityNames.length || cityNames.includes(hospital.city)) && treatmentMatch(hospital))
      || plannerHospitals.find(treatmentMatch)
      || selectedHospital
      || plannerHospitals[0]
      || INDIA_HOSPITALS[0];
  }, [plannerHospitals, plannerTreatment, selectedCity, selectedHospital]);
  const filteredHospitals = useMemo(() => {
    const treatment = plannerTreatment;
    if (!treatment) return [];
    const cityNames = selectedCity === 'All India' ? [] : selectedCity === 'Delhi / NCR' ? ['New Delhi', 'Gurgaon', 'Delhi'] : [selectedCity];
    const treatmentMatch = (hospital) => hospitalMatchesTreatment(hospital, treatment);
    const cityMatch = (hospital) => !cityNames.length || cityNames.includes(hospital.city);
    const cityHospitals = plannerHospitals.filter(cityMatch);
    const matched = cityHospitals.filter(treatmentMatch);
    if (matched.length) return matched;
    const treatmentHospitals = plannerHospitals.filter(treatmentMatch);
    return (treatmentHospitals.length ? treatmentHospitals : cityHospitals.length ? cityHospitals : plannerHospitals).slice(0, 12);
  }, [plannerHospitals, plannerTreatment, selectedCity]);
  const activeTreatment = plannerTreatment || selectedTreatment || plannerTreatments[0] || null;
  const heroImage = indianCities.find((city) => city.name === selectedCity)?.image || filteredHospitals[0]?.image || plannerHospitals[0]?.image || INDIA_HOSPITALS[0].image;
  const completedCount = Number(Boolean(plannerTreatment));
  const estimatedPlan = useMemo(() => {
    const hospital = filteredHospitals[0] || suggestedHospital || plannerHospitals[0] || INDIA_HOSPITALS[0];
    const packageCost = Number(activeTreatment?.packageFrom || hospital?.cost?.package || 0);
    const stayCost = Number(hospital?.cost?.stay || 0);
    const localCost = Number(hospital?.cost?.local || 0);
    const serviceCost = Number(hospital?.cost?.service || 0);
    const total = packageCost + stayCost + localCost + serviceCost;
    return {
      hospital,
      packageCost,
      total,
      stay: hospital?.stay || (activeTreatment?.group === 'Wellness' ? '1-2 days' : '4-7 days'),
      reports: ['Recent reports', 'Doctor prescription', 'Current medicines', 'Passport/ID'],
    };
  }, [activeTreatment, filteredHospitals, plannerHospitals, suggestedHospital]);
  useEffect(() => {
    aiThreadRef.current?.scrollTo({ top: aiThreadRef.current.scrollHeight, behavior: 'smooth' });
  }, [aiMessages]);
  const approvedPlannerTreatments = useMemo(() => {
    const approved = plannerTreatments.filter((treatment) => (
      treatment.icdCode
      || treatment.icdUri
      || /WHO ICD-11|ICD-11|backend|admin/i.test([treatment.sourceSystem, treatment.procedureCode, treatment.category].filter(Boolean).join(' '))
    ));
    return approved.length ? approved : plannerTreatments;
  }, [plannerTreatments]);
  const visibleTreatments = useMemo(() => {
    const search = normalizeSearch(treatmentSearch);
    const matched = approvedPlannerTreatments.filter((treatment) => {
      const haystack = normalizeSearch([treatment.title, treatment.group, treatment.specialty, treatment.description, treatment.icdCode, treatment.procedureCode, treatment.sourceSystem].filter(Boolean).join(' '));
      return !search || haystack.includes(search);
    });
    return matched.slice(0, 24);
  }, [approvedPlannerTreatments, treatmentSearch]);
  const plannerSteps = [
    { id: 'treatment', title: 'Select Treatment / Surgery', value: plannerTreatment?.title || 'Choose treatment or surgery', icon: 'fa-stethoscope' },
    { id: 'city', title: 'Indian Destination', value: `${selectedCity}, India`, icon: 'fa-location-dot' },
    { id: 'consultation', title: 'Free Consultation', value: appointmentStatus || 'Book with care team', icon: 'fa-calendar-check' },
  ];

  const selectPlannerTreatment = (treatment) => {
    setPlannerTreatment(treatment);
    setPlannerProcedure('');
    setSelectedTreatment?.(treatment);
    const cityNames = selectedCity === 'All India' ? [] : selectedCity === 'Delhi / NCR' ? ['New Delhi', 'Gurgaon', 'Delhi'] : [selectedCity];
    const matchesTreatment = (hospital) => hospitalMatchesTreatment(hospital, treatment);
    const nextHospital = plannerHospitals.find((hospital) => (!cityNames.length || cityNames.includes(hospital.city)) && matchesTreatment(hospital))
      || plannerHospitals.find(matchesTreatment)
      || selectedHospital
      || plannerHospitals[0]
      || INDIA_HOSPITALS[0];
    setBookingHospital(nextHospital);
    setSelectedHospital?.(nextHospital);
  };

  const openHospitalDetails = (hospital) => {
    setSelectedHospital?.(hospital);
    setPage?.('hospital-detail');
  };

  const openPlannerBooking = (hospital) => {
    setBookingHospital(hospital);
    setSelectedHospital?.(hospital);
    setActiveModal('consultation');
  };

  const goNext = () => {
    if (!plannerTreatment) {
      return setActiveModal('treatment');
    }
    setAppointmentStatus('');
    return setActiveModal('consultation');
  };

  const submitAppointment = async (event) => {
    event.preventDefault();
    if (!appointmentForm.patientName.trim() || !appointmentForm.phone.trim()) {
      setAppointmentStatus('Please add patient name and phone number.');
      return;
    }

    setAppointmentStatus('Saving appointment to admin...');
    try {
      const response = await fetch(`${API_BASE}/admin/public-appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...getPatientAttribution(),
          patientName: appointmentForm.patientName,
          phone: `${appointmentForm.countryCode || 'IN (+91)'} ${appointmentForm.phone}`,
          country: 'India',
          city: selectedCity,
          treatment: plannerTreatment?.title || selectedTreatment?.title || 'Treatment consultation',
          hospital: bookingHospital.name,
          doctor: bookingHospital.doctor,
          mode: 'Planner hospital booking',
          notes: [
            `Procedure: ${plannerProcedure || 'To be confirmed after report review'}`,
            `Preferred city: ${selectedCity}`,
            appointmentForm.notes,
          ].filter(Boolean).join('\n'),
          source: 'india-modal-planner',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Appointment failed');
      setAppointmentStatus(`Consultation booked: ${data.appointment?.publicData?.appointmentId || 'Scheduled'}`);
      setAppointmentForm({ patientName: '', countryCode: 'IN (+91)', phone: '', notes: '' });
      setActiveModal('');
    } catch (error) {
      setAppointmentStatus(error.message || 'Appointment backend offline.');
    }
  };

  const buildPlannerAiReply = (text) => {
    const bestHospital = filteredHospitals[0] || estimatedPlan.hospital;
    const treatmentName = activeTreatment?.title || 'your treatment';
    const hospitalNames = filteredHospitals.slice(0, 3).map((hospital) => hospital.name).join(', ') || bestHospital?.name || 'verified Indian hospitals';
    const total = estimatedPlan.total ? money(estimatedPlan.total) : 'final estimate after report review';
    const lower = text.toLowerCase();

    if (lower.includes('best hospital') || lower.includes('suggest')) {
      return `For ${treatmentName} in ${selectedCity}, start with ${bestHospital?.name || 'the top matched hospital'} because it matches the treatment and city filter. Also compare ${hospitalNames}. Ask for report review, doctor availability, package inclusions, ICU/room category, and expected stay before confirming.`;
    }

    if (lower.includes('summarize')) {
      return `Current plan: ${treatmentName} in ${selectedCity}, preferred hospital ${bestHospital?.name || 'not selected yet'}, likely stay ${estimatedPlan.stay}, rough planning total ${total}. Next: share reports, confirm doctor slot, verify inclusions, then book the appointment.`;
    }

    if (lower.includes('advice') || lower.includes('booking')) {
      return `Booking advice: do not confirm only on rating. Check the treating doctor's experience, report-review opinion, package exclusions, room category, date availability, and emergency contact. Keep reports and passport/ID ready so the admin team can verify every detail.`;
    }

    return `${treatmentName} in ${selectedCity}: I found ${filteredHospitals.length || 1} matching hospital option${filteredHospitals.length === 1 ? '' : 's'}. Shortlist ${bestHospital?.name || 'a verified hospital'}, compare doctor focus areas, ask for a written package estimate, and book after report review.`;
  };

  const submitPlannerAi = (text) => {
    if (!text) return;
    setAiMessages((current) => [
      ...current,
      text,
      buildPlannerAiReply(text),
    ].slice(-10));
    setAiInput('');
  };

  const sendPlannerAi = (event) => {
    event.preventDefault();
    submitPlannerAi(aiInput.trim());
  };

  const handleSearchHospitals = (treatments) => {
    setSelectedTreatmentsForSearch(treatments);
    setSelectedProceduresForSearch([]);
    setPlannerTreatment(treatments[0]); // Set first treatment as primary
    setViewMode('procedure');           // → Step 2: Procedure selection
  };

  const handleBackToSearch = () => {
    setViewMode('search');
  };

  const handleBackToTreatments = () => {
    setViewMode('search');
  };

  const handleProcedureContinue = (procedures) => {
    setSelectedProceduresForSearch(procedures);
    setViewMode('trip-style');          // → Step 3: Trip style
  };

  const handleBackToProcedures = () => {
    setViewMode('procedure');
  };

  const handleContinueToHospitals = (tripStyle) => {
    setSelectedTripStyle(tripStyle);
    setViewMode('hospitals');
  };

  const handleBackToTripStyle = () => {
    setViewMode('trip-style');
  };

  const handleViewHospitalDetails = (hospital) => {
    setSelectedHospital?.(hospital);
    setPreviousViewMode(viewMode); // Remember where we came from
    setViewMode('hospital-details');
  };

  const handleBackFromHospitalDetails = () => {
    setViewMode(previousViewMode); // Return to previous view mode
  };

  const handleSelectHospital = (hospital) => {
    setSelectedHospitalForJourney(hospital);
    setViewMode('journey-planning');
  };

  const handleBackToHospitals = () => {
    setViewMode('hospitals');
  };

  const handleCompleteJourney = async (journeyPlan) => {
    // Save journey plan and show results page
    setJourneyPlanResult(journeyPlan);
    setViewMode('journey-results');
    
    try {
      const response = await fetch(`${API_BASE}/admin/journey-plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: journeyPlan.patientEmail,
          userName: journeyPlan.patientName,
          selectedHospital: selectedHospitalForJourney?.name,
          selectedTreatments: selectedTreatmentsForSearch.map(t => t.title),
          journeyPlan,
          icdCodes: selectedTreatmentsForSearch.map(t => t.icdCode).filter(Boolean),
          createdAt: new Date().toISOString(),
          status: 'calculated'
        })
      });

      if (response.ok) {
        console.log('✅ Journey plan saved to admin dashboard successfully!');
      } else {
        console.log('⚠️ Journey plan saved locally (API not available)');
      }
    } catch (error) {
      console.log('❌ Journey plan save failed, stored locally:', error);
    }
  };

  const handleConfirmJourney = async (journeyPlan) => {
    try {
      const response = await fetch(`${API_BASE}/admin/journey-plans/${journeyPlan.patientEmail}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'confirmed',
          confirmedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log('✅ Journey confirmed and updated in admin!');
        alert('Journey confirmed! Our team will contact you within 24 hours.');
        setPage('home');
      } else {
        console.log('⚠️ Journey confirmed locally');
        alert('Journey confirmed! Our team will contact you within 24 hours.');
        setPage('home');
      }
    } catch (error) {
      console.log('❌ Journey confirmation failed:', error);
      alert('Journey confirmed! Our team will contact you within 24 hours.');
      setPage('home');
    }
  };

  const handleBackToJourneyPlanning = () => {
    setViewMode('journey-planning');
  };

  // New modern search UI
  if (viewMode === 'search') {
    return (
      <PlannerSearchPage
        treatments={plannerTreatments}
        onSearchHospitals={handleSearchHospitals}
        setPage={setPage}
        getTreatmentIconKind={getTreatmentIconKind}
        HEALTH_ICON_SOURCES={HEALTH_ICON_SOURCES}
      />
    );
  }

  // Step 2: Procedure selection (ICD-11 imported procedures filtered by selected treatment group)
  if (viewMode === 'procedure') {
    return (
      <ProcedureSelectPage
        selectedTreatments={selectedTreatmentsForSearch}
        preSelectedProcedures={selectedProceduresForSearch}
        allTreatments={plannerTreatments}
        onContinue={handleProcedureContinue}
        onBack={selectedTreatmentsForSearch.length > 0 && initialProcedure ? () => setPage('treatment-detail') : handleBackToSearch}
      />
    );
  }

  // Trip Style Selection Page
  if (viewMode === 'trip-style') {
    return (
      <TripStylePage
        selectedTreatments={selectedTreatmentsForSearch}
        onContinueToHospitals={handleContinueToHospitals}
        onBackToTreatments={initialProcedure ? () => setPage('treatment-detail') : handleBackToProcedures}
      />
    );
  }

  // Hospitals results page
  if (viewMode === 'hospitals') {
    return (
      <PlannerHospitalsPage
        selectedTreatments={selectedTreatmentsForSearch}
        hospitals={plannerHospitals}
        onBack={handleBackToTripStyle}
        onSelectHospital={handleSelectHospital}
        onViewHospitalDetails={handleViewHospitalDetails}
        formatCurrency={money}
      />
    );
  }

  // Hospital Details Page
  if (viewMode === 'hospital-details') {
    return (
      <HospitalDetail
        money={money}
        selectedHospital={selectedHospital}
        setPage={setPage}
        onBack={handleBackFromHospitalDetails}
      />
    );
  }

  // Journey Planning Page
  if (viewMode === 'journey-planning') {
    return (
      <JourneyPlanningPage
        selectedTreatments={selectedTreatmentsForSearch}
        selectedHospital={selectedHospitalForJourney}
        onBack={handleBackToHospitals}
        onCompleteJourney={handleCompleteJourney}
      />
    );
  }

  // Journey Results Page
  if (viewMode === 'journey-results') {
    return (
      <JourneyResultsPage
        journeyPlan={journeyPlanResult}
        selectedTreatments={selectedTreatmentsForSearch}
        selectedHospital={selectedHospitalForJourney}
        onBack={handleBackToJourneyPlanning}
        onConfirmJourney={handleConfirmJourney}
      />
    );
  }

  // Old design - keeping as fallback (commented out)
  /*
  return (
    <section className="journey-search-page" id="planner">
      <div className="journey-search-head">
        <div>
          <span>Plan My Journey</span>
          <h1>Select treatment, compare approved hospitals, book appointment</h1>
          <p>Choose an ICD/backend-approved treatment from the database. We show hospitals from the client/JCI master data that match the selected treatment, specialty, city, and accreditation signals.</p>
        </div>
        <aside>
          <strong>{approvedPlannerTreatments.length}</strong>
          <span>approved treatment records</span>
          <small>{plannerHospitals.length} hospital profiles available</small>
        </aside>
      </div>

      <div className="journey-search-layout">
        <aside className="journey-treatment-panel">
          <label className="journey-search-input">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <input onChange={(event) => setTreatmentSearch(event.target.value)} placeholder="Search ICD treatment, procedure, specialty..." value={treatmentSearch} />
          </label>
          <div className="journey-treatment-results">
            {visibleTreatments.map((treatment) => (
              <button className={plannerTreatment?.id === treatment.id ? 'active' : ''} key={treatment.id} onClick={() => selectPlannerTreatment(treatment)} type="button">
                <TreatmentIconTile treatment={treatment} />
                <span>
                  <strong>{treatment.title}</strong>
                  <small>{treatment.icdCode ? `ICD-11 ${treatment.icdCode}` : treatment.procedureCode || treatment.category || treatment.specialty}</small>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <main className="journey-hospital-results">
          <div className="journey-result-toolbar">
            <div>
              <span>Selected treatment</span>
              <strong>{plannerTreatment?.title || 'Select a treatment'}</strong>
              <small>{plannerTreatment?.icdCode ? `ICD-11 ${plannerTreatment.icdCode}` : plannerTreatment?.sourceSystem || 'Database treatment mapping'}</small>
            </div>
            <label>
              City
              <select onChange={(event) => setSelectedCity(event.target.value)} value={selectedCity}>
                {plannerCityOptions.map((city) => <option key={city}>{city}</option>)}
              </select>
            </label>
          </div>

          {!plannerTreatment && (
            <article className="journey-empty-panel">
              <strong>Start by selecting a treatment</strong>
              <p>Hospitals will appear after a treatment is selected. Matching uses treatment tags, specialty, ICD/backend mapping, and city filters.</p>
            </article>
          )}

          {plannerTreatment && (
            <>
              <section className="journey-match-summary">
                <article><span>Matched hospitals</span><strong>{filteredHospitals.length}</strong><small>{selectedCity}</small></article>
                <article><span>Best starting option</span><strong>{suggestedHospital?.name || 'Pending'}</strong><small>{suggestedHospital?.city || 'India'}</small></article>
                <article><span>Reports needed</span><strong>{estimatedPlan.reports.length}</strong><small>{estimatedPlan.reports.slice(0, 3).join(', ')}</small></article>
              </section>

              <div className="journey-hospital-list">
                {filteredHospitals.map((hospital) => (
                  <article key={hospital.id} className="journey-result-card">
                    <button className="journey-result-image" onClick={() => openHospitalDetails(hospital)} type="button">
                      <img alt={hospital.name} onError={handleImageFallback} src={getHospitalImage(hospital)} />
                    </button>
                    <div>
                      <span>{hospital.city || 'India'} � {hospital.specialty}</span>
                      <button className="journey-result-title" onClick={() => openHospitalDetails(hospital)} type="button">{hospital.name}</button>
                      <p>{hospital.summary || `${hospital.name} matches ${plannerTreatment.title} through specialty and treatment mapping.`}</p>
                      <div className="journey-result-facts">
                        <small>{accreditationText(hospital.accreditations, hospital.nabhType || 'Accreditation pending')}</small>
                        <small>Beds: {hospital.bedText || hospital.beds || 'Update pending'}</small>
                        <small>{hospital.sourceSystem || 'Client master data'}</small>
                      </div>
                    </div>
                    <div className="journey-result-actions">
                      <button onClick={() => openPlannerBooking(hospital)} type="button">Book appointment</button>
                      <button onClick={() => openHospitalDetails(hospital)} type="button">View details</button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </main>

        <aside className="journey-booking-panel">
          <div>
            <span>Appointment request</span>
            <strong>{bookingHospital?.name || suggestedHospital?.name || 'Select hospital'}</strong>
            <small>{plannerTreatment?.title || 'Treatment pending'}</small>
          </div>
          <form onSubmit={submitAppointment}>
            <input onChange={(event) => setAppointmentForm({ ...appointmentForm, patientName: event.target.value })} placeholder="Patient full name" value={appointmentForm.patientName} />
            <div>
              <input readOnly value="IN (+91)" />
              <input onChange={(event) => setAppointmentForm({ ...appointmentForm, phone: event.target.value })} placeholder="Phone number" value={appointmentForm.phone} />
            </div>
            <textarea onChange={(event) => setAppointmentForm({ ...appointmentForm, notes: event.target.value })} placeholder="Reports, preferred date, notes" rows="4" value={appointmentForm.notes} />
            <button disabled={!plannerTreatment || !bookingHospital} type="submit">Book free consultation</button>
            {appointmentStatus && <small>{appointmentStatus}</small>}
          </form>
        </aside>
      </div>
    </section>
  );
  */

  // Second old design (commented out)
  /*
  return (
    <section className="cma-planner-page india-planner-page" id="planner">
      <div className="cma-planner-breadcrumb">Home <span>&gt;</span> Planner</div>
      <div className="planner-top-row">
        <button className="planner-back-button" onClick={() => setActiveModal('treatment')} type="button"><i className="fa-solid fa-arrow-left" aria-hidden="true" /></button>
        <h1>Plan your medical journey in 1 quick step</h1>
        <button onClick={() => setActiveModal(!plannerTreatment ? 'treatment' : 'consultation')} type="button">{plannerTreatment ? 'Book Appointment' : 'Next'} <i className="fa-solid fa-arrow-right" aria-hidden="true" /></button>
      </div>
      <div className="planner-progress planner-progress-single"><span className={plannerTreatment ? 'active' : ''} /></div>
      <div className="planner-final-grid">
        <main className="planner-results-pane">
          <section className="planner-plan-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(15, 25, 40, 0.62), rgba(15, 25, 40, 0.16)), url(${heroImage})` }}>
            <div><span>Personalized Treatment Plan</span><h2>{activeTreatment.title} in {selectedCity}</h2></div>
            <div className="planner-hero-actions"><button type="button"><i className="fa-solid fa-circle" aria-hidden="true" /> Saved</button><button type="button"><i className="fa-solid fa-share-nodes" aria-hidden="true" /> Share</button></div>
          </section>
          <div className="planner-city-chips">
            {indianCities.map((city) => (
              <button className={selectedCity === city.name ? 'active' : ''} key={city.name} onClick={() => setSelectedCity(city.name)} type="button"><span>IN</span>{city.name}</button>
            ))}
          </div>
          <section className="planner-copy-block">
            <h2>{activeTreatment.title} in {selectedCity}</h2>
            <p>{plannerTreatment ? `Compare hospitals that match ${activeTreatment.title}, then verify doctor availability, report review, package inclusions, expected stay, and appointment timing before booking.` : 'Select a treatment first. Hospital options, estimated stay, reports checklist, and appointment next steps will appear after your treatment is selected.'}</p>
          </section>
          {plannerTreatment && (
            <section className="planner-realistic-summary" aria-label="Planning summary">
              <article><span>Rough package</span><strong>{money(estimatedPlan.packageCost)}</strong><small>Final amount depends on reports and room category.</small></article>
              <article><span>Expected stay</span><strong>{estimatedPlan.stay}</strong><small>Includes consultation, admission or procedure window.</small></article>
              <article><span>Reports needed</span><strong>{estimatedPlan.reports.length} items</strong><small>{estimatedPlan.reports.slice(0, 3).join(', ')}.</small></article>
            </section>
          )}
          <div className="planner-filtered-list">
            {!plannerTreatment && (
              <article className="planner-empty-state">
                <strong>Select treatment to see hospitals</strong>
                <p>Choose a treatment or surgery from the modal so we can show matching Indian hospitals.</p>
                <button onClick={() => setActiveModal('treatment')} type="button">Select Treatment</button>
              </article>
            )}
            {plannerTreatment && filteredHospitals.map((hospital, index) => (
              <article className="hospital-card planner-hospital-card" key={`${hospital.id}-${hospital.name}-${index}`} onClick={() => openHospitalDetails(hospital)} onKeyDown={(event) => {
                if (event.key === 'Enter') openHospitalDetails(hospital);
              }} role="button" tabIndex="0">
                <div className="hospital-card-main">
                  <button className="hospital-thumb-button" onClick={(event) => { event.stopPropagation(); openHospitalDetails(hospital); }} type="button"><img alt={hospital.name} onError={handleImageFallback} src={getHospitalImage(hospital)} /></button>
                  <div className="hospital-body">
                    <button className="hospital-name-link" onClick={(event) => { event.stopPropagation(); openHospitalDetails(hospital); }} type="button">{hospital.name}</button>
                    <div className="rating-row"><StarRating rating={hospital.rating} /><span>{hospital.rating} ({hospital.doctors} Ratings)</span></div>
                    <p>{hospital.summary || `${hospital.name} supports ${hospital.specialty} care with international patient coordination, doctor review, and transparent planning.`}</p>
                    <small>{accreditationText(hospital.accreditations)}</small>
                    <button className="show-more-link" onClick={(event) => { event.stopPropagation(); openPlannerBooking(hospital); }} type="button">Book Appointment</button>
                  </div>
                </div>
                <button className="planner-card-menu" onClick={(event) => { event.stopPropagation(); openHospitalDetails(hospital); }} type="button"><i className="fa-solid fa-ellipsis-vertical" aria-hidden="true" /></button>
              </article>
            ))}
          </div>
        </main>
        <aside className="planner-ai-panel">
          <div className="planner-ai-head"><strong>AI Plan Assistant</strong><span>{aiMessages.length}/10 messages</span></div>
          <div className="planner-ai-thread" ref={aiThreadRef}>
            {aiMessages.map((message, index) => <p className={index % 2 ? 'user' : 'assistant'} key={`${message}-${index}`}>{message}</p>)}
          </div>
          <form className="planner-ai-compose" onSubmit={sendPlannerAi}>
            <input onChange={(event) => setAiInput(event.target.value)} placeholder="Type..." value={aiInput} />
            <button type="submit"><i className="fa-solid fa-paper-plane" aria-hidden="true" /></button>
          </form>
          <div className="planner-ai-actions">
            <button onClick={() => submitPlannerAi('Suggest the best hospital from this list')} type="button">Best hospital</button>
            <button onClick={() => submitPlannerAi('Summarize my current plan')} type="button">Summarize</button>
            <button onClick={() => submitPlannerAi('Give advice for booking')} type="button">Booking advice</button>
          </div>
        </aside>
      </div>
      <div className="cma-planner-shell india-planner-shell">
        <aside className="cma-planner-copy">
          <span>India medical planner</span>
          <h1>Plan your treatment journey in India</h1>
          <p>Select a treatment or surgery, choose an Indian city, and book a free consultation.</p>
          <button onClick={goNext} type="button">Continue Planning</button>
          {appointmentStatus && <small>{appointmentStatus}</small>}
        </aside>

        <main className="cma-planner-card india-planner-card">
          <div className="cma-step-tabs india-step-tabs">
            {plannerSteps.map((step, index) => (
              <button className={activeModal === step.id ? 'active' : ''} key={step.id} onClick={() => setActiveModal(step.id)} type="button">
                <b>{index + 1}</b>{step.title}
              </button>
            ))}
          </div>

          {plannerStep === 0 && (
            <div className="cma-treatment-layout">
              <section>
                <h2>Select Treatment</h2>
                <div className="cma-treatment-list">
                  {TREATMENTS.slice(0, 10).map((treatment) => (
                    <button className={plannerTreatment?.id === treatment.id ? 'active' : ''} key={treatment.id} onClick={() => selectPlannerTreatment(treatment)} type="button">
                      <span>{treatment.icon}</span>
                      <div>
                        <strong>{treatment.title}</strong>
                        <small>{treatment.group === 'Aesthetic' ? 'Enhance appearance' : treatment.group === 'Wellness' ? 'Health planning' : 'Medical care'}</small>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section className="cma-procedure-panel">
                <h2>Select Procedure</h2>
                {!plannerTreatment && <p>Select a treatment first to see procedures.</p>}
                {plannerTreatment && (
                  <div className="cma-procedure-list">
                    {procedures.map((procedure) => (
                      <button className={plannerProcedure === procedure ? 'active' : ''} key={procedure} onClick={() => setPlannerProcedure(procedure)} type="button">
                        {procedure}
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {plannerStep === 1 && (
            <div className="cma-consult-panel">
              <div className="cma-consult-visual">
                <img alt="Medical consultation" src={suggestedHospital.image} />
                <div>
                  <span>{plannerTreatment?.title || selectedTreatment?.title || 'Treatment'}</span>
                  <strong>{activeTreatment.title}</strong>
                  <small>{suggestedHospital.name} · {suggestedHospital.doctor}</small>
                </div>
              </div>
              <form className="cma-consult-form" onSubmit={submitAppointment}>
                <h2>Book Your Free Medical Consultation</h2>
                <p>Get expert advice, destination guidance, hospital options, and cost estimate.</p>
                <select onChange={(event) => setPlannerProcedure(event.target.value)} value={plannerProcedure}>
                  <option value="">Select Procedure</option>
                  {procedures.map((procedure) => <option key={procedure}>{procedure}</option>)}
                </select>
                <input onChange={(event) => setAppointmentForm({ ...appointmentForm, patientName: event.target.value })} placeholder="Full name" value={appointmentForm.patientName} />
                <div>
                  <select onChange={(event) => setAppointmentForm({ ...appointmentForm, countryCode: event.target.value })} value={appointmentForm.countryCode}>
                    {countryCodes.map((code) => <option key={code}>{code}</option>)}
                  </select>
                  <input onChange={(event) => setAppointmentForm({ ...appointmentForm, phone: event.target.value })} placeholder="Phone number" value={appointmentForm.phone} />
                </div>
                <textarea onChange={(event) => setAppointmentForm({ ...appointmentForm, notes: event.target.value })} placeholder="Tell us anything important" rows="3" value={appointmentForm.notes} />
                <button type="submit">Book Free Consultation</button>
                {appointmentStatus && <small>{appointmentStatus}</small>}
              </form>
            </div>
          )}
        </main>
      </div>

      <div className="cma-destination-strip">
        {cmaDestinations.map(([country, image]) => (
          <button className={selectedDestination === country ? 'active' : ''} key={country} onClick={() => setSelectedDestination(country)} type="button">
            <img alt={country} src={image} />
            <span>{country}</span>
          </button>
        ))}
      </div>
      {activeModal && (
        <div className="planner-modal-backdrop" role="presentation">
          <section className="planner-step-modal" aria-modal="true" role="dialog">
            <button className="planner-modal-close" onClick={() => setActiveModal('')} type="button">x</button>
            {activeModal === 'treatment' && (
              <>
                <h2>Select a Treatment to Proceed</h2>
                <p>Please choose your treatment or surgery to continue</p>
                <label className="planner-treatment-search">
                  <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                  <input onChange={(event) => setTreatmentSearch(event.target.value)} placeholder="Search treatment or surgery" value={treatmentSearch} />
                </label>
                <div className="planner-treatment-modal-grid">
                  {visibleTreatments.map((treatment) => (
                    <button className={plannerTreatment?.id === treatment.id ? 'active' : ''} key={treatment.id} onClick={() => selectPlannerTreatment(treatment)} type="button">
                      <TreatmentIconTile treatment={treatment} />
                      <strong>{treatment.title}</strong>
                    </button>
                  ))}
                </div>
                <small className="planner-modal-hint">Showing {visibleTreatments.length} of {plannerTreatments.length}. Use search for more treatments.</small>
                <div className="planner-modal-footer">
                  <button disabled={!plannerTreatment} onClick={() => setActiveModal('')} type="button">
                    Done ({completedCount}/1) <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                  </button>
                </div>
              </>
            )}
            {activeModal === 'city' && (
              <>
                <h2>Select Indian Destination</h2>
                <div className="cma-destination-strip modal-city-list">
                  {indianCities.map((city) => (
                    <button className={selectedCity === city.name ? 'active' : ''} key={city.name} onClick={() => { setSelectedCity(city.name); setActiveModal('consultation'); }} type="button">
                      <img alt={city.name} src={city.image} />
                      <span>{city.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {activeModal === 'consultation' && (
              <form className="cma-consult-form modal-consult-form" onSubmit={submitAppointment}>
                <h2>Book Your Free Medical Consultation</h2>
                <p>{bookingHospital.name} - {bookingHospital.doctor}</p>
                <input onChange={(event) => setAppointmentForm({ ...appointmentForm, patientName: event.target.value })} placeholder="Full name" value={appointmentForm.patientName} />
                <div>
                  <input readOnly value="IN (+91)" />
                  <input onChange={(event) => setAppointmentForm({ ...appointmentForm, phone: event.target.value })} placeholder="Phone number" value={appointmentForm.phone} />
                </div>
                <textarea onChange={(event) => setAppointmentForm({ ...appointmentForm, notes: event.target.value })} placeholder="Tell us anything important" rows="3" value={appointmentForm.notes} />
                <button type="submit">Book Free Consultation</button>
                {appointmentStatus && <small>{appointmentStatus}</small>}
              </form>
            )}
          </section>
        </div>
      )}
    </section>
  );
  */
}

function AiAssistantPage({ setPage, initialMessage = '' }) {
  const WELCOME = 'Welcome to Kairacure AI. Tell me your treatment, diagnosis, preferred Indian city, reports summary, budget in INR, or travel month. I will suggest hospitals, doctors, approximate INR packages, and your next steps. You can write in Hindi, English, or Hinglish — I will reply in the same language.';

  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [loading, setLoading] = useState(false);
  const threadRef = React.useRef(null);

  const quickPrompts = [
    'मुझे heart bypass surgery के लिए India में best hospitals बताओ',
    'Find orthopedic hospitals in Delhi NCR under INR 3 lakhs',
    'I need knee replacement — what is the cost and recovery time?',
    'I am a doctor and want to partner with Kairacure',
    'What reports should I share for a second opinion?',
    'Compare Apollo Delhi vs Fortis for cardiac surgery',
  ];

  // Auto-scroll to bottom on new message
  React.useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Auto-send initialMessage if passed from hero card
  React.useEffect(() => {
    if (initialMessage && initialMessage.trim()) {
      setQuestion(initialMessage.trim());
      // Slight delay so component has mounted
      setTimeout(() => {
        sendMessage(initialMessage.trim());
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = async (text) => {
    const trimmed = (text || question).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setQuestion('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/ai-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: nextMessages.slice(-10), // send last 10 for context
        }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || 'I could not generate a response right now.' }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'The AI backend is not running. Start the Express API server and set OPENROUTER_API_KEY in .env to enable live responses.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const resetChat = () => {
    setMessages([{ role: 'assistant', content: WELCOME }]);
    setQuestion('');
  };

  return (
    <section className="ai-assistant-page">
      {/* ── Sidebar ── */}
      <aside className="ai-chat-sidebar">
        <div className="ai-chat-brand">
          <img
            src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=120&q=80"
            alt="Kaira AI"
            className="ai-brand-avatar"
          />
          <div>
            <strong>Kaira AI</strong>
            <small>Medical Travel Assistant</small>
          </div>
        </div>

        <button className="new-chat-button" onClick={resetChat} type="button">
          <i className="fa-solid fa-plus" aria-hidden="true" /> New chat
        </button>

        <div className="ai-chat-history">
          <p className="ai-history-label">Quick topics</p>
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="ai-history-item"
              onClick={() => { setQuestion(prompt); sendMessage(prompt); }}
            >
              <i className="fa-solid fa-comment-dots" aria-hidden="true" />
              <span>{prompt.length > 38 ? `${prompt.slice(0, 36)}…` : prompt}</span>
            </button>
          ))}
        </div>

        <div className="ai-sidebar-footer">
          <button className="ai-back-link" onClick={() => setPage('home')} type="button">
            <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back to website
          </button>
          <p className="ai-sidebar-brand-note">Powered by Kaira AI · care@kairacure.com</p>
        </div>
      </aside>

      {/* ── Chat Workspace ── */}
      <main className="ai-chat-workspace">
        {/* Top bar */}
        <div className="ai-chat-topbar">
          <div className="ai-topbar-info">
            <img
              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=120&q=80"
              alt="Kairacure AI"
            />
            <div>
              <strong>Kairacure Medical AI</strong>
              <span className="ai-online-badge">
                <span className="ai-online-dot" aria-hidden="true" />
                Online
              </span>
            </div>
          </div>
          <button className="ai-topbar-back" onClick={() => setPage('home')} type="button">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        {/* Thread */}
        <div className="ai-chat-thread" ref={threadRef}>
          {messages.map((msg, i) => (
            <article
              key={`${msg.role}-${i}`}
              className={msg.role === 'user' ? 'ai-bubble-row user' : 'ai-bubble-row assistant'}
            >
              {msg.role === 'assistant' && (
                <img
                  alt="Kairacure AI"
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=120&q=80"
                />
              )}
              <div className="ai-bubble">
                {msg.content.split('\n').filter((l) => l.trim()).map((line, li) => (
                  <p key={li}>{line}</p>
                ))}
                <small>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
              </div>
            </article>
          ))}

          {loading && (
            <article className="ai-bubble-row assistant">
              <img alt="Kairacure AI thinking" src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=120&q=80" />
              <div className="ai-bubble ai-thinking">
                <span /><span /><span />
              </div>
            </article>
          )}
        </div>

        {/* Quick prompt chips — only show when thread is just the welcome message */}
        {messages.length === 1 && (
          <div className="ai-quick-prompts">
            {quickPrompts.slice(0, 4).map((prompt) => (
              <button
                key={prompt}
                onClick={() => { setQuestion(prompt); sendMessage(prompt); }}
                type="button"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Composer */}
        <form className="ai-chat-composer" onSubmit={handleSubmit}>
          <input
            autoFocus
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about treatment, hospitals, cost, travel..."
            value={question}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          />
          <button disabled={loading || !question.trim()} type="submit">
            <i className="fa-solid fa-paper-plane" aria-hidden="true" />
          </button>
        </form>

        <p className="ai-disclaimer">
          <i className="fa-solid fa-circle-info" aria-hidden="true" />
          General medical travel guidance only — not a substitute for professional medical advice.
        </p>
      </main>
    </section>
  );
}

function AdminIcon({ name }) {
  const icons = {
    dashboard: 'fa-gauge-high',
    hospital: 'fa-hospital',
    mapping: 'fa-diagram-project',
    costing: 'fa-file-invoice-dollar',
    upload: 'fa-cloud-arrow-up',
    patient: 'fa-users',
    stage: 'fa-route',
    calendar: 'fa-calendar-check',
    agent: 'fa-headset',
    doctor: 'fa-user-doctor',
    report: 'fa-chart-line',
    audit: 'fa-shield-halved',
    settings: 'fa-gear',
    users: 'fa-user-shield',
    lock: 'fa-lock',
    search: 'fa-magnifying-glass',
    shield: 'fa-shield-heart',
    bell: 'fa-bell',
    help: 'fa-circle-question',
    plus: 'fa-plus',
    dots: 'fa-ellipsis-vertical',
    edit: 'fa-pen-to-square',
    trash: 'fa-trash-can',
    cloud: 'fa-cloud-arrow-up',
    chevron: 'fa-chevron-right',
    file: 'fa-file-excel',
  };
  return <i aria-hidden="true" className={`admin-svg-icon fa-solid ${icons[name] || icons.dashboard}`} />;

  const paths = {
    dashboard: 'M4 11 12 4l8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9Z',
    hospital: 'M5 21V5h14v16M9 21v-5h6v5M9 9h2M14 9h2M9 13h2M14 13h2',
    mapping: 'M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm10 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM7 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm3-4h4M9 7l5 10M15 6l-5 12',
    costing: 'M7 3h10l4 4v14H7V3Zm9 0v6h6M10 12h8M10 16h8M10 20h5',
    upload: 'M12 3v12M8 7l4-4 4 4M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4',
    patient: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    stage: 'M12 2v6M12 16v6M5 9a7 7 0 0 0 14 0M5 15a7 7 0 0 1 14 0',
    calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v15H3V6a2 2 0 0 1 2-2Z',
    agent: 'M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8a8 8 0 0 1 16 0M18 8h2a2 2 0 0 1 2 2v2',
    doctor: 'M12 3v18M5 10h14M7 21V7a5 5 0 0 1 10 0v14',
    report: 'M4 19V5h16v14M8 15v-4M12 15V8M16 15v-6',
    audit: 'M12 2 20 5v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3Zm-3 10 2 2 5-5',
    settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0-13v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12',
    lock: 'M6 10V8a6 6 0 1 1 12 0v2M5 10h14v11H5V10Zm7 5v3',
    search: 'M11 19a8 8 0 1 1 5.66-2.34L22 22',
    shield: 'M12 2 20 5v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3Zm-3 10 2 2 5-5',
    bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4',
    help: 'M12 18h.01M9.1 9a3 3 0 1 1 5.8 1c-.7 1.2-2.1 1.4-2.6 2.7-.2.5-.3.9-.3 1.3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
    plus: 'M12 5v14M5 12h14',
    dots: 'M12 6h.01M12 12h.01M12 18h.01',
    edit: 'M4 20h4L19 9l-4-4L4 16v4Zm12-15 4 4',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3',
    cloud: 'M16 16h2a4 4 0 0 0 0-8 6 6 0 0 0-11.7 1.5A4.5 4.5 0 0 0 6.5 18H12M12 12v9M8 16l4-4 4 4',
    chevron: 'M9 18l6-6-6-6',
    file: 'M7 3h8l4 4v14H7V3Zm8 0v5h5',
  };

  return (
    <svg aria-hidden="true" className="admin-svg-icon" viewBox="0 0 24 24">
      <path d={paths[name] || paths.dashboard} />
    </svg>
  );
}

function AdminPanel({ money }) {
  const initialHospitals = INDIA_HOSPITALS.slice(0, 8).map((hospital, index) => ({
    ...hospital,
    state: hospital.city === 'Gurgaon' ? 'Haryana' : 'Delhi NCR',
    contactPerson: ['Neha Verma', 'Rahul Mehta', 'Amit Singh', 'Pooja Nair'][index % 4],
    email: `partner${index + 1}@Kairacure.com`,
    phone: `+91 98${index}76${index} 43210`,
    status: index < 5 ? 'Active' : 'Review',
    onboardingStep: Math.min(6, index + 1),
    recordId: null,
  }));

  const emptyForm = {
    name: '',
    city: '',
    state: '',
    country: 'India',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    specialty: 'Cardiac Surgery',
    treatments: 'Cardiac Sciences',
    accreditations: 'NABH, International patient desk',
    beds: '',
    icuBeds: '',
    operatingRooms: '',
    packageFrom: '',
    minCost: '',
    maxCost: '',
    image: '',
    galleryImages: '',
    reviewName: '',
    reviewRating: '5',
    reviewNote: '',
    coordinator: '',
    confidentialNote: '',
  };

  const initialAppointments = ADMIN_APPOINTMENTS.map((item, index) => ({
    id: `APT-2025-00${99 - index}`,
    patient: item.patient,
    hospital: item.hospital,
    doctor: item.doctor,
    mode: item.mode,
    dateTime: `14 May 2025, ${item.time}`,
    status: item.status,
    recordId: null,
  }));

  const initialCostingRows = ADMIN_COST_ROWS.map((row, index) => ({
    ...row,
    id: `default-costing-${index}`,
    code: ['CARD-CABG-001', 'ORTH-TKR-001', 'URO-TURP-001', 'OPH-RET-001'][index] || `SURG-${index + 1}`,
    category: row.treatment === 'Cardiac Sciences' ? 'Cardiac Surgery' : row.treatment,
    hospitalCost: row.floor * 80,
    KairacurePrice: row.package * 80,
    currency: 'INR',
    status: 'Active',
  }));

  const emptyAppointmentForm = {
    id: '',
    patient: '',
    phone: '',
    country: 'India',
    city: '',
    treatment: '',
    hospital: '',
    doctor: '',
    mode: 'Video consult',
    dateTime: '',
    notes: '',
    source: 'admin',
    status: 'Scheduled',
  };

  const emptyDoctorForm = {
    id: '',
    name: '',
    title: '',
    hospital: '',
    specialty: 'Cardiac Surgery',
    treatments: 'Cardiac Sciences',
    experience: '',
    rating: '4.8',
    consultationFee: '',
    profileImage: '',
    about: '',
    checklist: '',
    focusAreas: '',
    education: '',
    reviewName: '',
    reviewRating: '5',
    reviewNote: '',
    status: 'Active',
  };

  const emptyAgentForm = {
    agentId: '',
    agentName: '',
    region: 'India',
    contact: '',
    email: '',
    assignedInquiries: '',
    conversions: '',
    status: 'Active',
  };

  const [adminHospitals, setAdminHospitals] = useState(HOSPITALS);
  const [localAppointments, setLocalAppointments] = useState([]);
  const [localCostingRows, setLocalCostingRows] = useState([]);
  const [localDoctors, setLocalDoctors] = useState([]); // Start with empty array - no dummy data
  const [localAgents, setLocalAgents] = useState([]);
  const [adminToken, setAdminToken] = useState(() => window.localStorage.getItem('kairacureAdminToken') || '');
  const [adminUser, setAdminUser] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('kairacureAdminUser') || 'null');
    } catch {
      return null;
    }
  });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [adminRecords, setAdminRecords] = useState([]);
  const [patientRecords, setPatientRecords] = useState([]);
  const [journeyPlans, setJourneyPlans] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [activeAdminPage, setActiveAdminPage] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeOnboardingStep, setActiveOnboardingStep] = useState(0);
  const [treatmentForm, setTreatmentForm] = useState({
    category: 'Cardiac Surgery',
    title: '',
    procedureCode: '',
    description: '',
    packageFrom: '',
    image: '',
  });
  const [surgeryForm, setSurgeryForm] = useState({
    category: 'Cardiac Surgery',
    surgery: '',
    procedureCode: '',
    hospitalCostInr: '',
    KairacurePriceInr: '',
    hospital: '',
  });
  const [editingId, setEditingId] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [dbStatus, setDbStatus] = useState(adminToken ? 'MongoDB Atlas ready' : 'Login required');
  const [showNotifications, setShowNotifications] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminTableFilters, setAdminTableFilters] = useState({
    search: '',
    city: 'All',
    status: 'All',
    specialty: 'All',
    accreditation: 'All',
  });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState(emptyAppointmentForm);
  const [doctorForm, setDoctorForm] = useState(emptyDoctorForm);
  const [agentForm, setAgentForm] = useState(emptyAgentForm);
  const [editingAppointmentId, setEditingAppointmentId] = useState('');
  const [editingDoctorId, setEditingDoctorId] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [hospitalEditOpen, setHospitalEditOpen] = useState(false);
  const [costingEditOpen, setCostingEditOpen] = useState(false);
  const [editingCostingId, setEditingCostingId] = useState('');
  const [costingEditForm, setCostingEditForm] = useState({
    category: '',
    surgery: '',
    code: '',
    hospitalCost: '',
    KairacurePrice: '',
    currency: 'INR',
    status: 'Active',
  });
  const defaultSiteSettings = {
    logoMark: 'M',
    logoText: BRAND_NAME,
    footerDescription: 'Patient-first international care planning with verified hospitals, doctors, and transparent treatment support.',
    contactEmail: 'care@Kairacure.com',
    contactPhone: '+91 98765 43210',
    contactAddress: 'Delhi NCR, India',
    socialFacebook: '',
    socialInstagram: '',
    socialLinkedin: '',
    socialX: '',
    faqs: DEFAULT_HOME_FAQS,
    pages: [
      { id: 'page-home', title: 'Home', slug: '/', visible: true },
      { id: 'page-hospitals', title: 'Hospitals', slug: '/hospitals', visible: true },
      { id: 'page-treatments', title: 'Treatments', slug: '/treatments', visible: true },
      { id: 'page-doctors', title: 'Doctors', slug: '/doctors', visible: true },
      { id: 'page-contact', title: 'Contact', slug: '/contact', visible: true },
    ],
  };
  const [siteSettings, setSiteSettings] = useState(() => {
    try {
      return { ...defaultSiteSettings, ...JSON.parse(window.localStorage.getItem('kairacureSiteSettings') || '{}') };
    } catch {
      return defaultSiteSettings;
    }
  });
  const [pageDraft, setPageDraft] = useState({ title: '', slug: '', visible: true });
  const [faqDraft, setFaqDraft] = useState({ question: '', answer: '', icon: 'fa-circle-question', visible: true });
  const [icdSearch, setIcdSearch] = useState('knee replacement');
  const [icdResults, setIcdResults] = useState([]);
  const [icdLoading, setIcdLoading] = useState(false);
  const [icdStatus, setIcdStatus] = useState('Search WHO ICD-11 MMS and import selected entries as treatment records.');
  const [adminPasswordForm, setAdminPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [adminPasswordStatus, setAdminPasswordStatus] = useState('');
  const adminMenuOptions = useMemo(() => ['Dashboard', 'Hospitals', 'Doctors', 'Treatment Mapping', 'ICD-11 Mapping', 'Journey Plans', 'Upload CSV / Excel', 'Patient inquiries', 'Consultation stages', 'Appointments', 'Agents', 'Reports', 'Audit Logs', 'Settings', 'Users & Roles'], []);
  const [roleDraft, setRoleDraft] = useState({ name: 'Hospital Operations', menus: ['Dashboard', 'Hospitals', 'Doctors', 'Appointments', 'Reports'] });
  const [adminRoles, setAdminRoles] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('kairacureAdminRoles') || '[]');
    } catch {
      return [];
    }
  });
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUserDraft, setAdminUserDraft] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Hospital Operations',
    department: '',
    designation: '',
    phone: '',
    hospitalScope: '',
    menus: ['Dashboard', 'Hospitals', 'Doctors', 'Appointments', 'Reports'],
  });
  const [userManagementStatus, setUserManagementStatus] = useState('');
  const searchInputRef = useRef(null);
  const settingsLoadedRef = useRef(false);

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${adminToken}`,
  }), [adminToken]);

  useEffect(() => {
    if (!adminToken) return undefined;
    let ignore = false;
    fetch(`${API_BASE}/admin/records`, { headers: authHeaders })
      .then((response) => {
        if (!response.ok) throw new Error('MongoDB records unavailable');
        return response.json();
      })
      .then((records) => {
        if (ignore || !Array.isArray(records) || records.length === 0) return;
        setAdminRecords(records);
        const imported = records.filter((record) => record.recordType === 'hospital').map((record) => ({
          ...(record.publicData || {}),
          id: record._id,
          recordId: record._id,
          name: record.publicData?.name || record.title,
          city: record.publicData?.city || '',
          state: record.publicData?.state || '',
          country: record.publicData?.country || 'India',
          contactPerson: record.publicData?.contactPerson || '',
          email: record.publicData?.email || '',
          phone: record.publicData?.phone || '',
          specialty: record.publicData?.specialty || '',
          treatments: record.publicData?.treatments || '',
          accreditations: record.publicData?.accreditations || '',
          image: record.publicData?.image || '',
          galleryImages: record.publicData?.galleryImages || [],
          patientReviews: record.publicData?.patientReviews || [],
          beds: record.publicData?.beds || '',
          icuBeds: record.publicData?.icuBeds || '',
          operatingRooms: record.publicData?.operatingRooms || '',
          status: record.status || 'Active',
          onboardingStep: record.publicData?.onboardingStep || 2,
          cost: { package: Number(record.publicData?.packageFrom) || 0 },
        }));
        if (imported.length) {
          const masterImported = imported.filter((hospital) => /client|jci/i.test(hospital.sourceSystem || ''));
          setAdminHospitals(masterImported.length ? masterImported : HOSPITALS);
        }
        const importedAppointments = records.filter((record) => record.recordType === 'appointment').map((record, index) => ({
          id: record.publicData?.appointmentId || `APT-DB-${index + 1}`,
          patientId: record.publicData?.patientId || record.publicData?.userId || '',
          userName: record.publicData?.userName || '',
          userEmail: record.publicData?.userEmail || '',
          patient: record.publicData?.patientName || record.title,
          phone: record.publicData?.phone || record.confidential?.phone || '',
          country: record.publicData?.country || '',
          city: record.publicData?.city || '',
          treatment: record.publicData?.treatment || '',
          hospital: record.publicData?.hospital || '',
          doctor: record.publicData?.doctor || '',
          mode: record.publicData?.mode || 'Coordinator call',
          dateTime: record.publicData?.dateTime || '',
          notes: record.publicData?.notes || record.confidential?.notes || '',
          source: record.publicData?.source || record.confidential?.submittedFrom || '',
          status: record.status || 'Scheduled',
          recordId: record._id,
        }));
        if (importedAppointments.length) {
          setLocalAppointments(importedAppointments);
        }
        const importedDoctors = records.filter((record) => record.recordType === 'doctor').map((record, index) => ({
          id: record.publicData?.doctorId || record._id || `DOC-DB-${index + 1}`,
          recordId: record._id,
          name: record.publicData?.doctorName || record.publicData?.name || record.title,
          title: record.publicData?.title || record.publicData?.designation || '',
          hospital: record.publicData?.hospital || '',
          specialty: record.publicData?.specialty || '',
          treatments: Array.isArray(record.publicData?.treatments) ? record.publicData.treatments : String(record.publicData?.treatments || '').split(',').map((item) => item.trim()).filter(Boolean),
          experience: record.publicData?.experience || '',
          rating: record.publicData?.rating || '4.8',
          consultationFee: record.publicData?.consultationFee || '',
          profileImage: record.publicData?.profileImage || record.publicData?.image || '',
          about: record.publicData?.about || '',
          checklist: Array.isArray(record.publicData?.checklist) ? record.publicData.checklist : [],
          focusAreas: Array.isArray(record.publicData?.focusAreas) ? record.publicData.focusAreas : [],
          education: Array.isArray(record.publicData?.education) ? record.publicData.education : [],
          reviews: Array.isArray(record.publicData?.reviews) ? record.publicData.reviews : [],
          status: record.status || 'Active',
        }));
        if (importedDoctors.length) {
          setLocalDoctors(importedDoctors);
        }
        const importedAgents = records.filter((record) => record.recordType === 'agent').map((record, index) => ({
          id: record.publicData?.agentId || record._id || `AGT-DB-${index + 1}`,
          recordId: record._id,
          name: record.publicData?.agentName || record.publicData?.name || record.title,
          region: record.publicData?.region || '',
          contact: record.publicData?.contact || '',
          email: record.publicData?.email || '',
          activeCases: record.publicData?.assignedInquiries || 0,
          conversion: record.publicData?.conversions || 0,
          status: record.status || 'Active',
        }));
        if (importedAgents.length) {
          setLocalAgents(importedAgents);
        }
        setDbStatus('MongoDB synced');
      })
      .catch(() => setDbStatus('Backend unavailable'));

    fetch(`${API_BASE}/doctors`)
      .then((response) => (response.ok ? response.json() : []))
      .then((doctors) => {
        if (ignore || !Array.isArray(doctors) || doctors.length === 0) return;
        setLocalDoctors(doctors.map((doctor, index) => ({
          id: doctor._id || doctor.id || `DOC-BACKEND-${index + 1}`,
          recordId: doctor._id || null,
          name: doctor.name,
          title: doctor.title || doctor.specialty,
          hospital: doctor.hospital || '',
          specialty: doctor.specialty || '',
          treatments: Array.isArray(doctor.treatments) ? doctor.treatments : [],
          experience: doctor.experience || '',
          rating: doctor.rating || '4.8',
          consultationFee: doctor.consultationFee || '',
          profileImage: doctor.profileImage || doctor.image || '',
          about: doctor.about || '',
          checklist: Array.isArray(doctor.checklist) ? doctor.checklist : [],
          focusAreas: Array.isArray(doctor.focusAreas) ? doctor.focusAreas : [],
          education: Array.isArray(doctor.education) ? doctor.education : [],
          reviews: Array.isArray(doctor.reviews) ? doctor.reviews : [],
          status: doctor.status || 'Active',
        })));
      })
      .catch(() => undefined);

    return () => {
      ignore = true;
    };
  }, [adminToken, authHeaders]);

  useEffect(() => {
    window.localStorage.setItem('kairacureSiteSettings', JSON.stringify(siteSettings));
    window.dispatchEvent(new Event('kairacure:settings-updated'));
  }, [siteSettings]);

  useEffect(() => {
    if (!adminToken) return undefined;
    let ignore = false;
    fetch(`${API_BASE}/admin/settings`, { headers: authHeaders })
      .then((response) => {
        if (!response.ok) throw new Error('Settings unavailable');
        return response.json();
      })
      .then((settings) => {
        if (ignore) return;
        setSiteSettings((current) => ({
          ...current,
          ...settings,
          pages: Array.isArray(settings.pages) ? settings.pages : current.pages,
          faqs: Array.isArray(settings.faqs) ? settings.faqs : current.faqs,
        }));
        settingsLoadedRef.current = true;
      })
      .catch(() => {
        settingsLoadedRef.current = true;
      });
    return () => {
      ignore = true;
    };
  }, [adminToken, authHeaders]);

  useEffect(() => {
    if (!adminToken || !settingsLoadedRef.current) return undefined;
    const timer = window.setTimeout(() => {
      fetch(`${API_BASE}/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(siteSettings),
      })
        .then((response) => {
          if (!response.ok) throw new Error('Settings save failed');
          return response.json();
        })
        .then(() => setDbStatus('Site settings saved to backend'))
        .catch(() => setDbStatus('Site settings saved locally - API offline'));
    }, 650);
    return () => window.clearTimeout(timer);
  }, [adminToken, authHeaders, siteSettings]);

  const recordsByType = useMemo(() => adminRecords.reduce((grouped, record) => {
    grouped[record.recordType] = grouped[record.recordType] || [];
    grouped[record.recordType].push(record);
    return grouped;
  }, {}), [adminRecords]);

  // Derive journey plans from adminRecords (populated from backend after user submits planner)
  const journeyPlanRows = useMemo(() => (recordsByType.journeyPlan || []).map((record) => {
    const d = record.publicData || {};
    return {
      recordId: record._id,
      id: d.planId || record._id,
      userId: d.userId || '',
      userName: d.userName || record.title || 'Unknown',
      selectedHospital: d.selectedHospital || '',
      selectedTreatments: Array.isArray(d.selectedTreatments) ? d.selectedTreatments : [],
      icdCodes: Array.isArray(d.icdCodes) ? d.icdCodes : [],
      userLocation: d.userLocation || '',
      hospitalLocation: d.hospitalLocation || '',
      distance: d.distance || 0,
      travelMode: d.travelMode || 'flight',
      hotelCategory: d.hotelCategory || '3star',
      stayDuration: d.stayDuration || 0,
      companionCount: d.companionCount || 0,
      costs: d.costs || {},
      totalCost: d.costs?.total || 0,
      route: d.route || {},
      status: record.status || d.status || 'calculated',
      submittedAt: d.submittedAt || record.createdAt || '',
      createdAt: record.createdAt || '',
    };
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)), [recordsByType.journeyPlan]);

  // Sync to journeyPlans state so legacy references still work
  React.useEffect(() => {
    if (journeyPlanRows.length > 0) setJourneyPlans(journeyPlanRows);
  }, [journeyPlanRows]);

  const handleAdminLogin = async (event) => {
    event.preventDefault();
    setLoginError('');
    setDbStatus('Checking admin login...');

    try {
      const response = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json();
      if (!response.ok || !data.token) {
        throw new Error(data.message || 'Invalid admin login');
      }

      window.localStorage.setItem('kairacureAdminToken', data.token);
      window.localStorage.setItem('kairacureAdminUser', JSON.stringify(data.admin));
      setAdminToken(data.token);
      setAdminUser(data.admin);
      setDbStatus('MongoDB Atlas ready');
    } catch (error) {
      if (error.message === 'Failed to fetch') {
        setLoginError('');
        setDbStatus('Admin API unavailable');
        return;
      }
      setLoginError(error.message || 'Backend login failed');
      setDbStatus('Login failed');
    }
  };

  const logoutAdmin = () => {
    window.localStorage.removeItem('kairacureAdminToken');
    window.localStorage.removeItem('kairacureAdminUser');
    setAdminToken('');
    setAdminUser(null);
    setAdminRecords([]);
    setPatientRecords([]);
    setDbStatus('Login required');
  };

  const allowedAdminMenus = useMemo(() => {
    const assigned = Array.isArray(adminUser?.menus) ? adminUser.menus : [];
    if (!assigned.length || adminUser?.role === 'Super Admin') return adminMenuOptions;
    return assigned;
  }, [adminMenuOptions, adminUser]);

  const adminNav = useMemo(() => [
    ['dashboard', 'Dashboard'],
    ['hospital', 'Hospitals'],
    ['mapping', 'Treatment Mapping'],
    ['mapping', 'ICD-11 Mapping'],
    ['route', 'Journey Plans'],
    ['upload', 'Upload CSV / Excel'],
    ['patient', 'Patient inquiries'],
    ['stage', 'Consultation stages'],
    ['calendar', 'Appointments'],
    ['agent', 'Agents'],
    ['doctor', 'Doctors'],
    ['report', 'Reports'],
    ['audit', 'Audit Logs'],
    ['settings', 'Settings'],
    ['users', 'Users & Roles'],
  ].filter(([, label]) => allowedAdminMenus.includes(label)), [allowedAdminMenus]);

  useEffect(() => {
    if (!adminNav.some(([, label]) => label === activeAdminPage)) {
      setActiveAdminPage(adminNav[0]?.[1] || 'Dashboard');
    }
  }, [activeAdminPage, adminNav]);

  const adminNavGroups = useMemo(() => {
    const indexOf = (label) => adminNav.findIndex(([, l]) => l === label);
    const pick = (labels) => labels
      .map((label) => { const i = indexOf(label); return i === -1 ? null : [adminNav[i][0], label, i]; })
      .filter(Boolean);
    return [
      { title: 'Overview', items: pick(['Dashboard']) },
      { title: 'Catalog', items: pick(['Hospitals', 'Doctors', 'Treatment Mapping', 'ICD-11 Mapping']) },
      { title: 'Patients', items: pick(['Patient inquiries', 'Journey Plans', 'Consultation stages', 'Appointments']) },
      { title: 'Operations', items: pick(['Agents', 'Upload CSV / Excel']) },
      { title: 'Insights', items: pick(['Reports', 'Audit Logs']) },
      { title: 'System', items: pick(['Settings', 'Users & Roles']) },
    ].filter((g) => g.items.length);
  }, [adminNav]);

  useEffect(() => {
    const handleShortcut = (event) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchResults(true);
      }
      if (event.altKey && /^[1-9]$/.test(event.key)) {
        const navItem = adminNav[Number(event.key) - 1];
        if (navItem) {
          event.preventDefault();
          setActiveAdminPage(navItem[1]);
        }
      }
      if (event.key === 'Escape') {
        setShowSearchResults(false);
        setConfirmDialog(null);
        setHospitalEditOpen(false);
        setCostingEditOpen(false);
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [adminNav]);

  // Auto-enhance admin tables: label cells for mobile cards + inject friendly empty states.
  useEffect(() => {
    const root = document.querySelector('.reference-admin');
    if (!root) return undefined;
    let busy = false;
    const enhance = () => {
      if (busy) return;
      busy = true;
      observer.disconnect();
      root.querySelectorAll('.ref-table').forEach((table) => {
        const heads = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent.trim());
        if (!heads.length) return;
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        const dataRows = Array.from(tbody.children).filter((tr) => !tr.classList.contains('admin-empty-row'));
        // Label cells for mobile card layout
        dataRows.forEach((tr) => {
          Array.from(tr.children).forEach((td, i) => {
            if (heads[i]) td.setAttribute('data-label', heads[i]);
          });
        });
        // Empty state management
        const existingEmpty = tbody.querySelector('.admin-empty-row');
        if (dataRows.length === 0 && !existingEmpty) {
          const tr = document.createElement('tr');
          tr.className = 'admin-empty-row';
          const td = document.createElement('td');
          td.colSpan = heads.length;
          td.innerHTML = '<div class="admin-empty"><span class="admin-empty-icon"><i class="fa-solid fa-inbox"></i></span><h3>Nothing here yet</h3><p>Records you add will appear in this list. Use the form or import tool to get started.</p></div>';
          tr.appendChild(td);
          tbody.appendChild(tr);
        } else if (dataRows.length > 0 && existingEmpty) {
          existingEmpty.remove();
        }
      });
      observer.observe(root, { childList: true, subtree: true });
      busy = false;
    };
    const observer = new MutationObserver(enhance);
    enhance();
    return () => observer.disconnect();
  }, [activeAdminPage]);

  const onboardingLabels = ['Registration', 'Profile', 'Documents', 'Verification', 'Contract', 'Go Live'];
  const onboarding = onboardingLabels.map((label, index) => [
    label,
    adminHospitals.filter((hospital) => Number(hospital.onboardingStep || 1) === index + 1).length,
  ]);
  const filteredOnboardingHospitals = activeOnboardingStep
    ? adminHospitals.filter((hospital) => Number(hospital.onboardingStep || 1) === activeOnboardingStep)
    : adminHospitals;

  const costingRows = (recordsByType.surgery?.length ? recordsByType.surgery.map((record) => ({
    id: record._id,
    category: record.publicData?.category || record.publicData?.treatment,
    surgery: record.publicData?.surgery || record.title,
    code: record.publicData?.procedureCode || record.publicData?.code,
    hospitalCost: Number(record.publicData?.hospitalCostInr) || 0,
    KairacurePrice: Number(record.publicData?.KairacurePriceInr) || 0,
    currency: record.publicData?.currency || 'INR',
    status: record.status || 'Active',
  })) : localCostingRows);

  const treatmentRows = recordsByType.treatment?.length ? recordsByType.treatment.map((record) => ({
    id: record._id,
    recordId: record._id,
    category: record.publicData?.category || 'General',
    title: record.publicData?.title || record.title,
    procedureCode: record.publicData?.procedureCode || '-',
    icdCode: record.publicData?.icdCode || '',
    icdUri: record.publicData?.icdUri || '',
    icdBrowserUrl: record.publicData?.icdBrowserUrl || '',
    sourceSystem: record.publicData?.sourceSystem || '',
    description: record.publicData?.description || '',
    packageFrom: record.publicData?.packageFrom || record.publicData?.kairacurePrice || 0,
    hospitalCost: record.publicData?.hospitalCost || 0,
    kairacurePrice: record.publicData?.kairacurePrice || record.publicData?.packageFrom || 0,
    image: record.publicData?.image || '',
    status: record.status || 'Active',
  })) : [
    { id: 'default-treatment-cardiac', category: 'Cardiac Surgery', title: 'Cardiac Sciences', procedureCode: 'CARD-GEN', description: 'Heart bypass, valve repair, angioplasty coordination', packageFrom: 500, hospitalCost: 400, kairacurePrice: 500, status: 'Active' },
    { id: 'default-treatment-ortho', category: 'Orthopedics', title: 'Joint Replacement', procedureCode: 'ORTH-GEN', description: 'Knee, hip and spine surgery planning', packageFrom: 2200, hospitalCost: 1800, kairacurePrice: 2200, status: 'Active' },
  ];

  const recentUploads = recordsByType.import?.length ? recordsByType.import.map((record) => ({
    recordId: record._id,
    fileName: record.publicData?.fileName || record.title,
    date: record.publicData?.uploadedOn || record.createdAt?.slice(0, 10) || 'Recently',
    type: record.publicData?.sourceType === 'spreadsheet' ? 'xls' : 'csv',
  })) : [
    { fileName: 'surgery_costing_may_2025.xlsx', date: '12 May 2025, 10:32 AM', type: 'xls', recordId: null },
    { fileName: 'hospital_treatments_apr_2025.xlsx', date: '28 Apr 2025, 04:15 PM', type: 'xls', recordId: null },
    { fileName: 'treatment_mapping_mar_2025.csv', date: '15 Apr 2025, 11:07 AM', type: 'csv', recordId: null },
  ];

  const csvExampleRows = [
    ['S-No', 'Location', 'Hospital Name', 'Address 1', 'Founded Year', 'Speciality (Super speciality)', 'NABH Type', 'JCI (Yes/No)', 'No of Beds', 'International Patient Wing', 'Phone No', 'Contact Person', 'Mobile No', 'Email Address', 'Website', 'LinkedIn'],
    ['1', 'Hyderabad', 'AIG Hospitals', 'Somajiguda, Hyderabad, Telangana', '1994', 'multispeciality', 'NABH certified', 'yes', '1400+ beds', 'yes', '91-40 4244 4222', '', '', 'info@aighospitals.com', 'https://www.aighospitals.com/', ''],
  ];
  const sampleCsvText = csvExampleRows.map((row) => row.join(',')).join('\n');
  const sampleCsvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(sampleCsvText)}`;
  const splitLines = (value) => String(value || '').split('\n').map((item) => item.trim()).filter(Boolean);
  const splitComma = (value) => String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
  const parseCsvText = (text) => {
    const rows = [];
    let current = '';
    let row = [];
    let quoted = false;

    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      const next = text[index + 1];
      if (char === '"' && quoted && next === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === ',' && !quoted) {
        row.push(current.trim());
        current = '';
      } else if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && next === '\n') index += 1;
        row.push(current.trim());
        if (row.some((cell) => cell)) rows.push(row);
        row = [];
        current = '';
      } else {
        current += char;
      }
    }

    row.push(current.trim());
    if (row.some((cell) => cell)) rows.push(row);
    const headers = rows.shift()?.map((header, index) => header || `Column ${index + 1}`) || [];
    return rows.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] || ''])));
  };

  const detectImportKindFromRows = (rows = []) => {
    const keys = new Set(rows.flatMap((row) => Object.keys(row).map((key) => normalizeSearch(key).replace(/\s+/g, '_'))));
    if (keys.has('description') && keys.has('eligibility')) return 'accreditationType';
    if (keys.has('hospital') || keys.has('hospital_name') || keys.has('name')) return 'hospital';
    return 'generic';
  };

  // Patient inquiries come from appointments (public consultation forms)
  const inquiryRows = recordsByType.appointment?.length ? recordsByType.appointment.map((record) => ({
    id: record.publicData?.appointmentId || record._id,
    patient: record.publicData?.patientName || record.title,
    country: record.publicData?.country || '',
    treatment: record.publicData?.treatment || '',
    stage: record.status || 'New',
    recordId: record._id,
  })) : ADMIN_INQUIRIES;

  const accreditationRows = recordsByType.accreditationType?.length ? recordsByType.accreditationType.map((record) => ({
    id: record._id,
    serialNumber: record.publicData?.serialNumber || '',
    type: record.publicData?.type || 'Accreditation',
    title: record.publicData?.title || record.publicData?.description || record.title,
    eligibility: record.publicData?.eligibility || '',
    annualFee: record.publicData?.annualFee || '',
    status: record.status || 'Active',
  })) : [];

  const patientRecordRows = patientRecords.map((record) => ({
    record,
    id: record.publicData?.patientId || record._id,
    patient: record.publicData?.name || record.title,
    email: record.publicData?.email || '',
    phone: record.publicData?.phone || '',
    country: record.publicData?.country || '',
    treatment: record.publicData?.treatmentInterest || '',
    supportNeed: record.publicData?.supportNeed || '',
    stage: record.publicData?.dashboard?.stage || 'Profile created',
    nextStep: record.publicData?.dashboard?.nextStep || '',
    lastActivity: record.publicData?.dashboard?.activities?.[0],
    status: record.status || record.publicData?.status || 'Active',
    updatedAt: record.updatedAt || record.publicData?.updatedAt || '',
  }));

  const appointmentRows = localAppointments;
  const patientStatusOptions = ['Active', 'Review', 'Reports received', 'Hospital options shared', 'Doctor opinion', 'Cost estimate shared', 'Appointment confirmed', 'Completed', 'On hold'];

  const savedAgentRows = recordsByType.agent?.length ? recordsByType.agent.map((record) => ({
    id: record.publicData?.agentId || record._id,
    recordId: record._id,
    name: record.publicData?.agentName || record.title,
    region: record.publicData?.region || '',
    contact: record.publicData?.contact || '',
    email: record.publicData?.email || '',
    activeCases: record.publicData?.assignedInquiries || 0,
    conversion: record.publicData?.conversions || 0,
    status: record.status || 'Active',
  })) : [];
  const defaultAgentRows = ADMIN_AGENTS.map((agent, index) => ({
    ...agent,
    contact: `+91 98${index}65 43210`,
    email: `${agent.name.toLowerCase().replace(' ', '.')}@Kairacure.com`,
    status: 'Active',
  }));
  const agentRows = [...savedAgentRows, ...localAgents.filter((agent) => !savedAgentRows.some((saved) => saved.id === agent.id || saved.recordId === agent.recordId))];
  const visibleAgentRows = agentRows.length ? agentRows : defaultAgentRows;

  const doctorRows = localDoctors;
  const activeDoctors = doctorRows.filter((doctor) => doctor.status === 'Active');
  const doctorReviewCount = doctorRows.reduce((sum, doctor) => sum + (doctor.reviews?.length || 0), 0);
  const averageDoctorRating = doctorRows.length
    ? (doctorRows.reduce((sum, doctor) => sum + Number(doctor.rating || 0), 0) / doctorRows.length).toFixed(1)
    : '4.8';
  const hospitalDoctorCounts = adminHospitals.slice(0, 6).map((hospital) => ({
    label: hospital.name,
    value: doctorRows.filter((doctor) => doctor.hospital === hospital.name).length,
  }));
  const treatmentDoctorCounts = Array.from(new Set(doctorRows.flatMap((doctor) => doctor.treatments || [])))
    .slice(0, 6)
    .map((treatment) => ({
      label: treatment,
      value: doctorRows.filter((doctor) => (doctor.treatments || []).includes(treatment)).length,
    }));

  const tableSearch = normalizeSearch(adminTableFilters.search);
  const rowMatchesAdminFilters = (row, fields = []) => {
    const values = fields.map((field) => row[field]).filter(Boolean);
    const matchesSearch = !tableSearch || normalizeSearch(values.join(' ')).includes(tableSearch);
    const matchesCity = adminTableFilters.city === 'All' || (!row.city && !row.country) || row.city === adminTableFilters.city || row.country === adminTableFilters.city;
    const matchesStatus = adminTableFilters.status === 'All' || (!row.status && !row.stage) || row.status === adminTableFilters.status || row.stage === adminTableFilters.status;
    const hasSpecialtyField = row.specialty || row.category || row.treatment || (row.treatments || []).length;
    const matchesSpecialty = adminTableFilters.specialty === 'All' || !hasSpecialtyField || row.specialty === adminTableFilters.specialty || row.category === adminTableFilters.specialty || (row.treatments || []).includes(adminTableFilters.specialty) || row.treatment === adminTableFilters.specialty;
    const accreditationTextValue = normalizeSearch([row.accreditations, row.nabhType, row.jciStatus, row.sourceSystem].filter(Boolean).join(' '));
    const matchesAccreditation = adminTableFilters.accreditation === 'All' || accreditationTextValue.includes(normalizeSearch(adminTableFilters.accreditation));
    return matchesSearch && matchesCity && matchesStatus && matchesSpecialty && matchesAccreditation;
  };
  const adminCityOptions = Array.from(new Set([
    ...adminHospitals.map((hospital) => hospital.city),
    ...inquiryRows.map((inquiry) => inquiry.country),
    ...patientRecordRows.map((patient) => patient.country),
  ].filter(Boolean))).sort();
  const adminStatusOptions = Array.from(new Set([
    ...adminHospitals.map((hospital) => hospital.status || 'Active'),
    ...appointmentRows.map((appointment) => appointment.status),
    ...inquiryRows.map((inquiry) => inquiry.stage),
    ...patientRecordRows.map((patient) => patient.status),
    ...patientRecordRows.map((patient) => patient.stage),
    ...doctorRows.map((doctor) => doctor.status || 'Active'),
    ...treatmentRows.map((treatment) => treatment.status || 'Active'),
  ].filter(Boolean))).sort();
  const adminSpecialtyOptions = Array.from(new Set([
    ...adminHospitals.map((hospital) => hospital.specialty),
    ...doctorRows.map((doctor) => doctor.specialty),
    ...doctorRows.flatMap((doctor) => doctor.treatments || []),
    ...treatmentRows.map((treatment) => treatment.category),
    ...inquiryRows.map((inquiry) => inquiry.treatment),
  ].filter(Boolean))).sort();
  const adminAccreditationOptions = Array.from(new Set([
    ...adminHospitals.flatMap((hospital) => String(hospital.accreditations || hospital.nabhType || '').split(',').map((item) => item.trim())),
    ...adminHospitals.map((hospital) => (hospital.jciAccredited ? 'JCI Accredited' : hospital.jciStatus)).filter(Boolean),
    ...adminHospitals.map((hospital) => hospital.sourceSystem).filter(Boolean),
    ...treatmentRows.map((treatment) => treatment.sourceSystem).filter(Boolean),
  ].filter(Boolean))).sort();
  const filteredAdminHospitals = adminHospitals.filter((hospital) => rowMatchesAdminFilters(hospital, ['name', 'city', 'specialty', 'contactPerson', 'email', 'phone', 'accreditations']));
  const filteredTreatmentRows = treatmentRows.filter((treatment) => rowMatchesAdminFilters(treatment, ['category', 'title', 'procedureCode', 'description']));
  const icdTreatmentRows = filteredTreatmentRows.filter((item) => item.icdCode || item.icdUri);
  const filteredCostingRows = costingRows.filter((row) => rowMatchesAdminFilters(row, ['category', 'surgery', 'code', 'status']));
  const filteredDoctorRows = doctorRows.filter((doctor) => rowMatchesAdminFilters(doctor, ['name', 'title', 'hospital', 'specialty', 'status']));
  const filteredAppointmentRows = appointmentRows.filter((appointment) => rowMatchesAdminFilters(appointment, ['id', 'patient', 'phone', 'country', 'city', 'treatment', 'hospital', 'doctor', 'mode', 'notes', 'source', 'status']));
  const filteredInquiryRows = inquiryRows.filter((inquiry) => rowMatchesAdminFilters(inquiry, ['id', 'patient', 'country', 'treatment', 'stage']));
  const filteredPatientRecordRows = [];
  const filteredAdminRecords = adminRecords.filter((record) => rowMatchesAdminFilters({
    status: record.status,
    specialty: record.recordType,
    title: record.title,
    createdBy: record.createdBy,
  }, ['title', 'status', 'specialty', 'createdBy']));
  const ADMIN_FILTER_CONFIG = {
    'Hospitals': { search: 'Name, city, status, treatment...', city: 'City / Country', status: 'Status', specialty: 'Specialty', accreditation: 'Accreditation / Source' },
    'Doctors': { search: 'Name, hospital, specialty...', city: 'City / Country', status: 'Status', specialty: 'Specialty' },
    'Treatment Mapping': { search: 'Category, procedure, code...', status: 'Status', specialty: 'Category' },
    'ICD-11 Mapping': { search: 'Code, title, category...', specialty: 'Category' },
    'Patient inquiries': { search: 'Name, ID, treatment...', city: 'Country', status: 'Stage', specialty: 'Treatment' },
    'Appointments': { search: 'Patient, doctor, hospital...', city: 'Country / City', status: 'Status', specialty: 'Treatment' },
    'Audit Logs': { search: 'Title, action, user...', status: 'Status' },
  };
  const activeFilterConfig = ADMIN_FILTER_CONFIG[activeAdminPage] || null;
  const showAdminFilters = Boolean(activeFilterConfig);
  const adminFilterCount = activeAdminPage === 'Hospitals' ? filteredAdminHospitals.length : (activeAdminPage === 'Treatment Mapping' || activeAdminPage === 'ICD-11 Mapping') ? filteredTreatmentRows.length : activeAdminPage === 'Doctors' ? filteredDoctorRows.length : activeAdminPage === 'Patient inquiries' ? filteredInquiryRows.length : activeAdminPage === 'Appointments' ? filteredAppointmentRows.length : filteredAdminRecords.length;

  const analytics = useMemo(() => {
    const totalHospitalCost = costingRows.reduce((sum, row) => sum + Number(row.hospitalCost || 0), 0);
    const totalKairacurePrice = costingRows.reduce((sum, row) => sum + Number(row.KairacurePrice || 0), 0);
    const margin = totalKairacurePrice ? Math.round(((totalKairacurePrice - totalHospitalCost) / totalKairacurePrice) * 100) : 0;
    const activeHospitals = adminHospitals.filter((hospital) => hospital.status === 'Active').length;
    const reviews = adminHospitals.flatMap((hospital) => hospital.patientReviews || []);
    const averageRating = reviews.length ? (reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length).toFixed(1) : '4.8';

    return [
      ['Hospitals live', activeHospitals, `${adminHospitals.length} total partners`],
      ['Treatment mappings', costingRows.length, `${margin}% avg margin`],
      ['Doctors live', activeDoctors.length, `${doctorRows.length} total profiles`],
      ['Hospital-only records', adminHospitals.length, 'Patient files hidden from admins'],
    ];
  }, [activeDoctors.length, adminHospitals, costingRows, doctorRows.length]);

  const notificationItems = useMemo(() => {
    const latestRecords = adminRecords.slice(0, 8).map((record) => ({
      id: record._id,
      title: record.title,
      meta: `${record.recordType} · ${record.status}`,
      page: record.recordType === 'appointment' ? 'Appointments' : record.recordType === 'inquiry' ? 'Patient inquiries' : record.recordType === 'import' ? 'Upload CSV / Excel' : record.recordType === 'hospital' ? 'Hospitals' : 'Audit Logs',
      icon: record.recordType === 'appointment' ? 'calendar' : record.recordType === 'inquiry' ? 'patient' : record.recordType === 'import' ? 'upload' : record.recordType === 'hospital' ? 'hospital' : record.recordType === 'doctor' ? 'doctor' : 'audit',
    }));
    if (latestRecords.length) return latestRecords;
    return [
      ...appointmentRows.slice(0, 3).map((item) => ({ id: item.id, title: item.patient, meta: `Appointment · ${item.status}`, page: 'Appointments', icon: 'calendar' })),
      ...inquiryRows.slice(0, 3).map((item) => ({ id: item.id, title: item.patient, meta: `Inquiry · ${item.stage}`, page: 'Patient inquiries', icon: 'patient' })),
    ];
  }, [adminRecords, appointmentRows, inquiryRows]);

  const publicPayloadFromForm = () => ({
    name: form.name,
    city: form.city,
    state: form.state,
    country: form.country,
    contactPerson: form.contactPerson,
    email: form.email,
    phone: form.phone,
    address: form.address,
    specialty: form.specialty,
    treatments: form.treatments,
    accreditations: form.accreditations,
    beds: Number(form.beds) || 0,
    icuBeds: Number(form.icuBeds) || 0,
    operatingRooms: Number(form.operatingRooms) || 0,
    packageFrom: Number(form.packageFrom) || 0,
    minCost: Number(form.minCost) || 0,
    maxCost: Number(form.maxCost) || 0,
    image: form.image,
    galleryImages: form.galleryImages.split('\n').map((item) => item.trim()).filter(Boolean),
    patientReviews: form.reviewNote ? [{
      name: form.reviewName || 'Verified patient',
      rating: Number(form.reviewRating) || 5,
      note: form.reviewNote,
    }] : [],
    onboardingStep: 1,
  });

  const createAdminRecord = async (recordType, payload) => {
    const response = await fetch(`${API_BASE}/admin/records/${recordType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(payload),
    });
    const saved = await response.json();
    if (!response.ok) throw new Error(saved.message || 'Admin record save failed');
    setAdminRecords((current) => [saved, ...current]);
    setDbStatus(saved._id?.startsWith?.('local-') ? 'Backend memory saved' : 'MongoDB synced');
    return saved;
  };

  const searchIcdEntries = async (event) => {
    event?.preventDefault();
    const query = icdSearch.trim();
    if (query.length < 2 || icdLoading) return;
    setIcdLoading(true);
    setIcdStatus('Searching WHO ICD-11 MMS...');
    try {
      const response = await fetch(`${API_BASE}/admin/icd11/search?q=${encodeURIComponent(query)}&flexible=true`, {
        headers: authHeaders,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'ICD-11 search failed');
      setIcdResults(Array.isArray(data.results) ? data.results : []);
      setIcdStatus(`${Array.isArray(data.results) ? data.results.length : 0} ICD-11 matches found`);
    } catch (error) {
      setIcdStatus(error.message === 'Failed to fetch' ? 'ICD-11 API unavailable. Check backend and credentials.' : error.message);
    } finally {
      setIcdLoading(false);
    }
  };

  const importIcdTreatment = async (entity) => {
    setIcdStatus(`Importing ${entity.title || entity.code}...`);
    try {
      const response = await fetch(`${API_BASE}/admin/icd11/import-treatment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          entity,
          category: treatmentForm.category || entity.chapter || 'ICD-11 MMS',
          packageFrom: treatmentForm.packageFrom || 0,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'ICD-11 import failed');

      // Update admin records
      setAdminRecords((current) => [data.record, ...current.filter((record) => record._id !== data.record?._id)]);

      // Reload backend content to get fresh treatments
      await loadBackendContent();

      setIcdStatus(`Imported ${data.record?.publicData?.icdCode || data.record?.title} - now visible on frontend`);
    } catch (error) {
      setIcdStatus(error.message || 'ICD-11 import failed');
    }
  };

  const saveTreatmentCategory = async (event) => {
    event.preventDefault();
    if (!treatmentForm.title.trim()) return;
    await createAdminRecord('treatment', {
      title: treatmentForm.title,
      status: 'Active',
      publicData: treatmentForm,
      confidential: { internalNote: 'Created from admin treatment mapping page' },
      createdBy: adminUser?.email || 'admin',
    });
    setTreatmentForm({ category: treatmentForm.category, title: '', procedureCode: '', description: '', packageFrom: '', image: '' });
  };

  const saveSurgeryCosting = async (event) => {
    event.preventDefault();
    if (!surgeryForm.surgery.trim()) return;
    await createAdminRecord('surgery', {
      title: surgeryForm.surgery,
      status: 'Active',
      publicData: {
        ...surgeryForm,
        treatment: surgeryForm.category,
        hospitalCostInr: Number(surgeryForm.hospitalCostInr) || 0,
        KairacurePriceInr: Number(surgeryForm.KairacurePriceInr) || 0,
        currency: 'INR',
      },
      confidential: { approvalOwner: 'Admin costing team' },
      createdBy: adminUser?.email || 'admin',
    });
    setSurgeryForm({ category: surgeryForm.category, surgery: '', procedureCode: '', hospitalCostInr: '', KairacurePriceInr: '', hospital: '' });
  };

  const resetAgentForm = () => {
    setAgentForm(emptyAgentForm);
  };

  const openAgentForm = () => {
    resetAgentForm();
    setActiveAdminPage('Agents');
  };

  const saveAgent = async (event) => {
    event.preventDefault();
    const agentName = agentForm.agentName.trim();
    if (!agentName) return;

    const nextAgent = {
      id: agentForm.agentId.trim() || `AGT-${Date.now().toString().slice(-5)}`,
      name: agentName,
      region: agentForm.region,
      contact: agentForm.contact,
      email: agentForm.email,
      activeCases: Number(agentForm.assignedInquiries) || 0,
      conversion: Number(agentForm.conversions) || 0,
      status: agentForm.status,
      recordId: null,
    };

    setLocalAgents((current) => [nextAgent, ...current]);

    try {
      const saved = await createAdminRecord('agent', {
        title: nextAgent.name,
        status: nextAgent.status,
        publicData: {
          agentId: nextAgent.id,
          agentName: nextAgent.name,
          region: nextAgent.region,
          contact: nextAgent.contact,
          email: nextAgent.email,
          assignedInquiries: nextAgent.activeCases,
          conversions: nextAgent.conversion,
        },
        confidential: { internalNote: 'Agent created from admin management page' },
        createdBy: adminUser?.email || 'admin',
      });
      setLocalAgents((current) => current.map((agent) => (
        agent.id === nextAgent.id ? { ...agent, recordId: saved._id } : agent
      )));
    } catch {
      setDbStatus('Agent saved locally - API offline');
    }

    resetAgentForm();
  };

  const setImageFromFile = (event, field) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const previewUrls = files.map((file) => URL.createObjectURL(file));
    setForm((current) => ({
      ...current,
      [field]: field === 'galleryImages' ? `${current.galleryImages ? `${current.galleryImages}\n` : ''}${previewUrls.join('\n')}` : previewUrls[0],
    }));
    event.target.value = '';
  };

  const saveHospital = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return;

    const localHospital = {
      id: editingId || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
      ...publicPayloadFromForm(),
      tags: form.treatments.split(',').map((item) => item.trim()).filter(Boolean),
      rating: '4.8',
      doctors: 0,
      value: 92,
      status: 'Active',
      recordId: adminHospitals.find((item) => item.id === editingId)?.recordId || null,
      cost: { package: Number(form.packageFrom) || 0 },
    };

    setAdminHospitals((current) => (
      editingId ? current.map((item) => (item.id === editingId ? { ...item, ...localHospital } : item)) : [localHospital, ...current]
    ));

    try {
      const existing = adminHospitals.find((item) => item.id === editingId);
      const endpoint = existing?.recordId ? `${API_BASE}/admin/records/${existing.recordId}` : `${API_BASE}/admin/records/hospital`;
      const response = await fetch(endpoint, {
        method: existing?.recordId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          title: name,
          status: 'Active',
          publicData: publicPayloadFromForm(),
          confidential: {
            coordinator: form.coordinator,
            confidentialNote: form.confidentialNote,
            contactPerson: form.contactPerson,
            phone: form.phone,
            email: form.email,
          },
          createdBy: 'Admin User',
        }),
      });
      const saved = await response.json();
      if (saved?._id) {
        setAdminHospitals((current) => current.map((item) => (
          item.id === localHospital.id ? { ...item, recordId: saved._id, id: saved._id } : item
        )));
      }
      setDbStatus('MongoDB synced');
    } catch {
      setDbStatus('Saved locally - API offline');
    }

    setForm(emptyForm);
    setEditingId('');
    setHospitalEditOpen(false);
  };

  const editHospital = (hospital) => {
    setEditingId(hospital.id);
    setHospitalEditOpen(true);
    setForm({
      ...emptyForm,
      name: hospital.name || '',
      city: hospital.city || '',
      state: hospital.state || '',
      country: hospital.country || 'India',
      contactPerson: hospital.contactPerson || '',
      email: hospital.email || '',
      phone: hospital.phone || '',
      address: hospital.address || '',
      image: hospital.image || '',
      specialty: hospital.specialty || 'Cardiac Surgery',
      treatments: Array.isArray(hospital.tags) ? hospital.tags.join(', ') : hospital.treatments || '',
      accreditations: Array.isArray(hospital.accreditations) ? hospital.accreditations.join(', ') : hospital.accreditations || '',
      galleryImages: Array.isArray(hospital.galleryImages) ? hospital.galleryImages.join('\n') : '',
      reviewName: hospital.patientReviews?.[0]?.name || '',
      reviewRating: hospital.patientReviews?.[0]?.rating || '5',
      reviewNote: hospital.patientReviews?.[0]?.note || '',
      beds: hospital.beds || '',
      icuBeds: hospital.icuBeds || '',
      operatingRooms: hospital.operatingRooms || '',
      packageFrom: hospital.cost?.package || hospital.packageFrom || '',
      minCost: hospital.minCost || '',
      maxCost: hospital.maxCost || '',
      coordinator: hospital.contactPerson || '',
      confidentialNote: '',
    });
  };

  const deleteHospital = async (hospital) => {
    setAdminHospitals((current) => current.filter((item) => item.id !== hospital.id));
    setAdminRecords((current) => current.filter((record) => record._id !== (hospital.recordId || hospital.id)));
    window.dispatchEvent(new Event('kairacure:catalog-refresh'));
    if (!hospital.recordId) return;
    try {
      await fetch(`${API_BASE}/admin/records/${hospital.recordId}`, { method: 'DELETE', headers: authHeaders });
      window.dispatchEvent(new Event('kairacure:catalog-refresh'));
      setDbStatus('MongoDB synced');
    } catch {
      setDbStatus('Deleted locally - API offline');
    }
  };

  const deleteTreatment = async (treatment) => {
    const recordId = String(treatment.recordId || treatment._id || treatment.id || '');

    console.log('[deleteTreatment] firing — id:', recordId, 'title:', treatment.title);

    if (!recordId) {
      console.warn('[deleteTreatment] no recordId found on treatment', treatment);
      return;
    }

    // 1. Optimistic removal — stringify both sides to handle ObjectId vs string mismatch
    setAdminRecords((current) => {
      const next = current.filter((record) => String(record._id || '') !== recordId);
      console.log('[deleteTreatment] adminRecords before:', current.length, '→ after:', next.length);
      return next;
    });
    setBackendTreatments((current) =>
      current.filter((item) => String(item._id || item.id || '') !== recordId)
    );
    setIcdStatus(`Deleting: ${treatment.title}…`);

    // 2. API call
    try {
      const response = await fetch(`${API_BASE}/admin/records/${recordId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const data = await response.json().catch(() => ({}));
      console.log('[deleteTreatment] API', response.status, data);

      if (!response.ok && response.status !== 404) {
        // 404 is fine — record was already gone (e.g. memory reset)
        throw new Error(data.message || `Delete failed (${response.status})`);
      }
      setIcdStatus(`Deleted: ${treatment.title}`);
      setDbStatus('Treatment deleted — synced');
    } catch (err) {
      console.error('[deleteTreatment] API error:', err.message);
      // Even if API fails, the optimistic removal already happened — keep it removed
      setIcdStatus(`Removed: ${treatment.title} (offline)`);
      setDbStatus('Deleted locally — API offline');
    }
  };

  const updateTreatmentCost = async (treatment, costData) => {
    const recordId = treatment.recordId || treatment._id || treatment.id;
    if (!recordId) return;

    try {
      const response = await fetch(`${API_BASE}/admin/records/${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          publicData: {
            ...treatment,
            hospitalCost: costData.hospitalCost !== undefined ? costData.hospitalCost : treatment.hospitalCost,
            kairacurePrice: costData.kairacurePrice !== undefined ? costData.kairacurePrice : treatment.kairacurePrice,
            packageFrom: costData.kairacurePrice !== undefined ? costData.kairacurePrice : treatment.packageFrom,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Cost update failed');

      // Update local state
      setBackendTreatments((current) => current.map((item) =>
        item.id === treatment.id ? { ...item, ...costData } : item
      ));

      setAdminRecords((current) => current.map((record) =>
        record._id === recordId ? data : record
      ));

      setIcdStatus(`Updated costing for ${treatment.title}`);
      await loadBackendContent();
    } catch (error) {
      setIcdStatus(error.message || 'Cost update failed');
    }
  };

  const deleteImportRecord = async (importRecord) => {
    setAdminRecords((current) => current.filter((record) => record._id !== importRecord.recordId));
    window.dispatchEvent(new Event('kairacure:catalog-refresh'));

    if (!importRecord.recordId) return;
    try {
      await fetch(`${API_BASE}/admin/records/${importRecord.recordId}`, { method: 'DELETE', headers: authHeaders });
      window.dispatchEvent(new Event('kairacure:catalog-refresh'));
      setDbStatus('Import record deleted - MongoDB synced');
    } catch {
      setDbStatus('Deleted locally - API offline');
    }
  };

  const confirmDeleteImportRecord = (importRecord) => {
    requestConfirm({
      title: 'Delete import record?',
      message: `Are you sure you want to delete ${importRecord.fileName}? This import record will be removed from the admin workspace.`,
      actionLabel: 'Delete Record',
      onConfirm: () => deleteImportRecord(importRecord),
    });
  };

  const requestConfirm = (dialog) => {
    setConfirmDialog(dialog);
  };

  const confirmDeleteHospital = (hospital) => {
    requestConfirm({
      title: 'Delete hospital record?',
      message: `Are you sure you want to delete ${hospital.name}? This record will be removed from the admin workspace.`,
      actionLabel: 'Delete Hospital',
      onConfirm: () => deleteHospital(hospital),
    });
  };

  const editCostingRow = (row) => {
    setEditingCostingId(row.id || row.code);
    setCostingEditForm({
      category: row.category || '',
      surgery: row.surgery || '',
      code: row.code || '',
      hospitalCost: row.hospitalCost || '',
      KairacurePrice: row.KairacurePrice || '',
      currency: row.currency || 'INR',
      status: row.status || 'Active',
    });
    setCostingEditOpen(true);
  };

  const addCostingRow = () => {
    setEditingCostingId('');
    setCostingEditForm({
      category: 'Cardiac Surgery',
      surgery: '',
      code: '',
      hospitalCost: '',
      KairacurePrice: '',
      currency: 'INR',
      status: 'Active',
    });
    setCostingEditOpen(true);
  };

  const saveCostingRow = (event) => {
    event.preventDefault();
    if (!costingEditForm.surgery.trim()) return;
    const nextRow = {
      id: editingCostingId || costingEditForm.code || `costing-${Date.now()}`,
      category: costingEditForm.category,
      surgery: costingEditForm.surgery,
      code: costingEditForm.code,
      hospitalCost: Number(costingEditForm.hospitalCost) || 0,
      KairacurePrice: Number(costingEditForm.KairacurePrice) || 0,
      currency: costingEditForm.currency || 'INR',
      status: costingEditForm.status || 'Active',
    };

    setLocalCostingRows((current) => current.map((row) => (
      (row.id || row.code) === editingCostingId ? { ...row, ...nextRow } : row
    )).concat(editingCostingId ? [] : [nextRow]));
    setAdminRecords((current) => current.map((record) => (
      record._id === editingCostingId ? {
        ...record,
        title: nextRow.surgery,
        status: nextRow.status,
        publicData: {
          ...record.publicData,
          category: nextRow.category,
          surgery: nextRow.surgery,
          procedureCode: nextRow.code,
          hospitalCostInr: nextRow.hospitalCost,
          KairacurePriceInr: nextRow.KairacurePrice,
          currency: nextRow.currency,
        },
      } : record
    )).concat(!editingCostingId && recordsByType.surgery?.length ? [{
      _id: nextRow.id,
      recordType: 'surgery',
      title: nextRow.surgery,
      status: nextRow.status,
      publicData: {
        category: nextRow.category,
        surgery: nextRow.surgery,
        procedureCode: nextRow.code,
        hospitalCostInr: nextRow.hospitalCost,
        KairacurePriceInr: nextRow.KairacurePrice,
        currency: nextRow.currency,
      },
    }] : []));
    setCostingEditOpen(false);
    setEditingCostingId('');
    setDbStatus(editingCostingId ? 'Costing updated locally' : 'Treatment / surgery added locally');
  };

  const deleteCostingRow = (row) => {
    const rowId = row.id || row.code;
    setLocalCostingRows((current) => current.filter((item) => (item.id || item.code) !== rowId));
    setAdminRecords((current) => current.filter((record) => record._id !== rowId));
    setDbStatus('Costing deleted locally');
  };

  const confirmDeleteCostingRow = (row) => {
    requestConfirm({
      title: 'Delete costing row?',
      message: `Are you sure you want to delete ${row.surgery}? This costing row will be removed from the table.`,
      actionLabel: 'Delete Costing',
      onConfirm: () => deleteCostingRow(row),
    });
  };

  const moveHospitalStage = async (hospital, nextStep) => {
    const onboardingStep = Math.max(1, Math.min(6, nextStep));
    setAdminHospitals((current) => current.map((item) => (
      item.id === hospital.id ? { ...item, onboardingStep } : item
    )));

    const recordId = hospital.recordId || (String(hospital.id).startsWith('default-') || String(hospital.id).startsWith('local-') ? hospital.id : '');
    if (!recordId) {
      setDbStatus('Stage updated locally');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/records/${recordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          title: hospital.name,
          status: hospital.status || 'Active',
          publicData: {
            ...hospital,
            onboardingStep,
          },
          confidential: {
            internalNote: `Moved to ${onboardingLabels[onboardingStep - 1]} from admin onboarding tracker`,
          },
          createdBy: adminUser?.email || 'admin',
        }),
      });
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.message || 'Stage update failed');
      setAdminRecords((current) => current.map((record) => (
        record._id === recordId ? saved : record
      )));
      setDbStatus(saved._id?.startsWith?.('local-') ? 'Backend memory saved' : 'MongoDB synced');
    } catch {
      setDbStatus('Stage updated locally - API offline');
    }
  };

  const appointmentPayload = (appointment) => ({
    appointmentId: appointment.id,
    patientName: appointment.patient,
    phone: appointment.phone,
    country: appointment.country,
    city: appointment.city,
    treatment: appointment.treatment,
    hospital: appointment.hospital,
    doctor: appointment.doctor,
    mode: appointment.mode,
    dateTime: appointment.dateTime,
    notes: appointment.notes,
    source: appointment.source,
  });

  const editAppointment = (appointment) => {
    setActiveAdminPage('Appointments');
    setEditingAppointmentId(appointment.id);
    setAppointmentForm({
      id: appointment.id || '',
      patient: appointment.patient || '',
      phone: appointment.phone || '',
      country: appointment.country || 'India',
      city: appointment.city || '',
      treatment: appointment.treatment || '',
      hospital: appointment.hospital || '',
      doctor: appointment.doctor || '',
      mode: appointment.mode || 'Video consult',
      dateTime: appointment.dateTime || '',
      notes: appointment.notes || '',
      source: appointment.source || 'admin',
      status: appointment.status || 'Scheduled',
    });
  };

  const resetAppointmentForm = () => {
    setAppointmentForm(emptyAppointmentForm);
    setEditingAppointmentId('');
  };

  const saveAppointment = async (event) => {
    event.preventDefault();
    const patient = appointmentForm.patient.trim();
    if (!patient) return;

    const existing = localAppointments.find((item) => item.id === editingAppointmentId);
    const nextAppointment = {
      ...appointmentForm,
      id: appointmentForm.id.trim() || editingAppointmentId || `APT-${Date.now()}`,
      patient,
      recordId: existing?.recordId || null,
    };

    setLocalAppointments((current) => (
      existing
        ? current.map((item) => (item.id === existing.id ? { ...item, ...nextAppointment } : item))
        : [nextAppointment, ...current]
    ));

    try {
      if (existing?.recordId) {
        const response = await fetch(`${API_BASE}/admin/records/${existing.recordId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({
            title: nextAppointment.patient,
            status: nextAppointment.status,
            publicData: appointmentPayload(nextAppointment),
            confidential: {
              phone: nextAppointment.phone,
              notes: nextAppointment.notes,
              submittedFrom: nextAppointment.source,
              internalNote: 'Updated from admin appointment editor',
            },
            createdBy: adminUser?.email || 'admin',
          }),
        });
        const saved = await response.json();
        if (!response.ok) throw new Error(saved.message || 'Appointment update failed');
        setAdminRecords((current) => current.map((record) => (record._id === existing.recordId ? saved : record)));
        setDbStatus('MongoDB synced');
      } else {
        const saved = await createAdminRecord('appointment', {
          title: nextAppointment.patient,
          status: nextAppointment.status,
          publicData: appointmentPayload(nextAppointment),
          confidential: {
            phone: nextAppointment.phone,
            notes: nextAppointment.notes,
            submittedFrom: nextAppointment.source,
            internalNote: 'Created from admin appointment editor',
          },
          createdBy: adminUser?.email || 'admin',
        });
        setLocalAppointments((current) => current.map((item) => (
          item.id === nextAppointment.id ? { ...item, recordId: saved._id } : item
        )));
      }
    } catch {
      setDbStatus('Appointment saved locally - API offline');
    }

    resetAppointmentForm();
  };

  const updateAppointmentStatus = async (appointment, status) => {
    const nextAppointment = { ...appointment, status };
    setLocalAppointments((current) => current.map((item) => (
      item.id === appointment.id ? nextAppointment : item
    )));

    if (!appointment.recordId) {
      setDbStatus('Appointment status updated locally');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/records/${appointment.recordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          title: nextAppointment.patient,
          status,
          publicData: appointmentPayload(nextAppointment),
          confidential: {
            phone: nextAppointment.phone,
            notes: nextAppointment.notes,
            submittedFrom: nextAppointment.source,
            internalNote: `Status changed to ${status}`,
          },
          createdBy: adminUser?.email || 'admin',
        }),
      });
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.message || 'Appointment status update failed');
      setAdminRecords((current) => current.map((record) => (record._id === appointment.recordId ? saved : record)));
      setDbStatus('MongoDB synced');
    } catch {
      setDbStatus('Appointment status updated locally - API offline');
    }
  };

  const updatePatientRecordDashboard = () => {
    setDbStatus('Patient records are hospital-only. Admin users cannot view, update, or delete them.');
  };

  const updateJourneyPlanStatus = async (plan, newStatus) => {
    const recordId = String(plan.recordId || plan.id || '');
    // Optimistic
    setAdminRecords((current) => current.map((record) =>
      String(record._id) === recordId
        ? { ...record, status: newStatus, publicData: { ...record.publicData, status: newStatus } }
        : record
    ));
    setJourneyPlans((current) => current.map((p) =>
      p.id === plan.id ? { ...p, status: newStatus } : p
    ));
    if (!recordId) return;
    try {
      await fetch(`${API_BASE}/admin/records/${recordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ status: newStatus, publicData: { ...plan, status: newStatus } }),
      });
      setDbStatus('Journey plan updated');
    } catch {
      setDbStatus('Updated locally — API offline');
    }
  };

  const deleteAppointment = async (appointment) => {
    setLocalAppointments((current) => current.filter((item) => item.id !== appointment.id));
    if (editingAppointmentId === appointment.id) resetAppointmentForm();
    if (!appointment.recordId) {
      setDbStatus('Appointment deleted locally');
      return;
    }

    try {
      await fetch(`${API_BASE}/admin/records/${appointment.recordId}`, { method: 'DELETE', headers: authHeaders });
      setAdminRecords((current) => current.filter((record) => record._id !== appointment.recordId));
      setDbStatus('MongoDB synced');
    } catch {
      setDbStatus('Appointment deleted locally - API offline');
    }
  };

  const confirmDeleteAppointment = (appointment) => {
    requestConfirm({
      title: 'Delete appointment?',
      message: `Are you sure you want to delete ${appointment.patient}'s appointment? It will be removed from the admin schedule.`,
      actionLabel: 'Delete Appointment',
      onConfirm: () => deleteAppointment(appointment),
    });
  };

  const doctorPayload = (doctor) => ({
    doctorId: doctor.id,
    doctorName: doctor.name,
    title: doctor.title,
    hospital: doctor.hospital,
    specialty: doctor.specialty,
    treatments: doctor.treatments,
    experience: doctor.experience,
    rating: Number(doctor.rating) || 4.8,
    consultationFee: Number(doctor.consultationFee) || 0,
    profileImage: doctor.profileImage,
    about: doctor.about,
    checklist: doctor.checklist,
    focusAreas: doctor.focusAreas,
    education: doctor.education,
    reviews: doctor.reviews,
  });

  const resetDoctorForm = () => {
    setDoctorForm(emptyDoctorForm);
    setEditingDoctorId('');
  };

  const editDoctor = (doctor) => {
    setActiveAdminPage('Doctors');
    setEditingDoctorId(doctor.id);
    setDoctorForm({
      ...emptyDoctorForm,
      id: doctor.id || '',
      name: doctor.name || '',
      title: doctor.title || '',
      hospital: doctor.hospital || '',
      specialty: doctor.specialty || 'Cardiac Surgery',
      treatments: Array.isArray(doctor.treatments) ? doctor.treatments.join(', ') : doctor.treatments || '',
      experience: doctor.experience || '',
      rating: doctor.rating || '4.8',
      consultationFee: doctor.consultationFee || '',
      profileImage: doctor.profileImage || '',
      about: doctor.about || '',
      checklist: Array.isArray(doctor.checklist) ? doctor.checklist.join('\n') : doctor.checklist || '',
      focusAreas: Array.isArray(doctor.focusAreas) ? doctor.focusAreas.join('\n') : doctor.focusAreas || '',
      education: Array.isArray(doctor.education) ? doctor.education.join('\n') : doctor.education || '',
      reviewName: doctor.reviews?.[0]?.name || '',
      reviewRating: doctor.reviews?.[0]?.rating || '5',
      reviewNote: doctor.reviews?.[0]?.note || '',
      status: doctor.status || 'Active',
    });
  };

  const saveDoctor = async (event) => {
    event.preventDefault();
    const name = doctorForm.name.trim();
    if (!name) return;

    const existing = localDoctors.find((doctor) => doctor.id === editingDoctorId);
    const nextDoctor = {
      id: doctorForm.id.trim() || editingDoctorId || `DOC-${Date.now()}`,
      name,
      title: doctorForm.title,
      hospital: doctorForm.hospital,
      specialty: doctorForm.specialty,
      treatments: splitComma(doctorForm.treatments),
      experience: doctorForm.experience,
      rating: Number(doctorForm.rating) || 4.8,
      consultationFee: Number(doctorForm.consultationFee) || 0,
      profileImage: doctorForm.profileImage,
      about: doctorForm.about,
      checklist: splitLines(doctorForm.checklist),
      focusAreas: splitLines(doctorForm.focusAreas),
      education: splitLines(doctorForm.education),
      reviews: doctorForm.reviewNote ? [{
        name: doctorForm.reviewName || 'Verified patient',
        rating: Number(doctorForm.reviewRating) || 5,
        note: doctorForm.reviewNote,
      }] : existing?.reviews || [],
      status: doctorForm.status,
      recordId: existing?.recordId || null,
    };

    setLocalDoctors((current) => (
      existing
        ? current.map((doctor) => (doctor.id === existing.id ? { ...doctor, ...nextDoctor } : doctor))
        : [nextDoctor, ...current]
    ));

    try {
      if (existing?.recordId) {
        const response = await fetch(`${API_BASE}/admin/records/${existing.recordId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({
            title: nextDoctor.name,
            status: nextDoctor.status,
            publicData: doctorPayload(nextDoctor),
            confidential: { internalNote: 'Doctor profile updated from admin doctor module' },
            createdBy: adminUser?.email || 'admin',
          }),
        });
        const saved = await response.json();
        if (!response.ok) throw new Error(saved.message || 'Doctor update failed');
        setAdminRecords((current) => current.map((record) => (record._id === existing.recordId ? saved : record)));
        setDbStatus('MongoDB synced');
      } else {
        const saved = await createAdminRecord('doctor', {
          title: nextDoctor.name,
          status: nextDoctor.status,
          publicData: doctorPayload(nextDoctor),
          confidential: {
            privateFee: nextDoctor.consultationFee,
            internalNote: 'Doctor created from admin doctor module',
          },
          createdBy: adminUser?.email || 'admin',
        });
        setLocalDoctors((current) => current.map((doctor) => (
          doctor.id === nextDoctor.id ? { ...doctor, id: saved._id, recordId: saved._id } : doctor
        )));
      }
    } catch {
      setDbStatus('Doctor saved locally - API offline');
    }

    resetDoctorForm();
  };

  const deleteDoctor = async (doctor) => {
    setLocalDoctors((current) => current.filter((item) => item.id !== doctor.id));
    if (editingDoctorId === doctor.id) resetDoctorForm();
    if (!doctor.recordId) {
      setDbStatus('Doctor deleted locally');
      return;
    }

    try {
      await fetch(`${API_BASE}/admin/records/${doctor.recordId}`, { method: 'DELETE', headers: authHeaders });
      setAdminRecords((current) => current.filter((record) => record._id !== doctor.recordId));
      setDbStatus('MongoDB synced');
    } catch {
      setDbStatus('Doctor deleted locally - API offline');
    }
  };

  const confirmDeleteDoctor = (doctor) => {
    requestConfirm({
      title: 'Delete doctor profile?',
      message: `Are you sure you want to delete ${doctor.name}? This removes the doctor from hospital and treatment mapping.`,
      actionLabel: 'Delete Doctor',
      onConfirm: () => deleteDoctor(doctor),
    });
  };

  const adminSearchOptions = useMemo(() => {
    const search = adminSearch.trim().toLowerCase();
    if (!search) {
      return adminNav.slice(0, 6).map(([icon, label], index) => ({
        id: `nav-${label}`,
        label,
        meta: `Alt+${index + 1}`,
        page: label,
        type: 'Page',
        icon,
      }));
    }

    const options = [
      ...adminNav.map(([icon, label], index) => ({
        id: `nav-${label}`,
        label,
        meta: `Open page - Alt+${index + 1}`,
        page: label,
        type: 'Page',
        icon,
        haystack: label,
      })),
      ...adminHospitals.map((hospital) => ({
        id: `hospital-${hospital.id}`,
        label: hospital.name,
        meta: `${hospital.city || 'Partner'} - ${hospital.specialty || 'Hospital'}`,
        page: 'Hospitals',
        type: 'Hospital',
        icon: 'hospital',
        action: () => editHospital(hospital),
        haystack: `${hospital.name} ${hospital.city} ${hospital.specialty} ${hospital.contactPerson}`,
      })),
      ...appointmentRows.map((appointment) => ({
        id: `appointment-${appointment.id}`,
        label: `${appointment.id} - ${appointment.patient}`,
        meta: `${appointment.hospital} - ${appointment.status}`,
        page: 'Appointments',
        type: 'Appointment',
        icon: 'calendar',
        action: () => editAppointment(appointment),
        haystack: `${appointment.id} ${appointment.patient} ${appointment.hospital} ${appointment.doctor} ${appointment.status}`,
      })),
      ...doctorRows.map((doctor) => ({
        id: `doctor-${doctor.id}`,
        label: doctor.name,
        meta: `${doctor.specialty} - ${doctor.hospital}`,
        page: 'Doctors',
        type: 'Doctor',
        icon: 'doctor',
        action: () => editDoctor(doctor),
        haystack: `${doctor.name} ${doctor.title} ${doctor.specialty} ${doctor.hospital} ${(doctor.treatments || []).join(' ')}`,
      })),
      ...inquiryRows.map((inquiry) => ({
        id: `inquiry-${inquiry.id}`,
        label: `${inquiry.id} - ${inquiry.patient}`,
        meta: `${inquiry.treatment} - ${inquiry.stage}`,
        page: 'Patient inquiries',
        type: 'Inquiry',
        icon: 'patient',
        haystack: `${inquiry.id} ${inquiry.patient} ${inquiry.country} ${inquiry.treatment} ${inquiry.stage}`,
      })),
      ...treatmentRows.map((treatment) => ({
        id: `treatment-${treatment.id}`,
        label: treatment.title,
        meta: treatment.icdCode ? `ICD-11 ${treatment.icdCode} - ${treatment.category}` : `${treatment.category} - ${treatment.procedureCode}`,
        page: treatment.icdCode || treatment.icdUri ? 'ICD-11 Mapping' : 'Treatment Mapping',
        type: 'Treatment',
        icon: 'mapping',
        haystack: `${treatment.title} ${treatment.category} ${treatment.procedureCode} ${treatment.icdCode} ${treatment.icdUri} ${treatment.sourceSystem}`,
      })),
    ];

    return options.filter((option) => option.haystack?.toLowerCase().includes(search)).slice(0, 8);
  }, [adminHospitals, adminNav, adminSearch, appointmentRows, doctorRows, inquiryRows, treatmentRows]);

  const openAdminSearchOption = (option) => {
    setActiveAdminPage(option.page);
    setAdminSearch('');
    setShowSearchResults(false);
    option.action?.();
  };

  const galleryPreviewUrls = form.galleryImages.split('\n').map((item) => item.trim()).filter(Boolean);
  const hospitalImageCount = [form.image, ...galleryPreviewUrls].filter(Boolean).length;

  const updateSiteSetting = (key, value) => {
    setSiteSettings((current) => ({ ...current, [key]: value }));
  };

  const changeAdminPassword = async (event) => {
    event.preventDefault();
    setAdminPasswordStatus('');
    if (adminPasswordForm.newPassword !== adminPasswordForm.confirmPassword) {
      setAdminPasswordStatus('New passwords do not match');
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/admin/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          currentPassword: adminPasswordForm.currentPassword,
          newPassword: adminPasswordForm.newPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Password change failed');
      setAdminPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setAdminPasswordStatus('Admin password changed');
      setDbStatus('Admin password updated in database');
    } catch (error) {
      setAdminPasswordStatus(error.message || 'Password change failed');
    }
  };

  useEffect(() => {
    window.localStorage.setItem('kairacureAdminRoles', JSON.stringify(adminRoles));
  }, [adminRoles]);

  useEffect(() => {
    if (!adminToken) return undefined;
    let ignore = false;
    fetch(`${API_BASE}/admin/users`, { headers: authHeaders })
      .then((response) => (response.ok ? response.json() : []))
      .then((users) => {
        if (!ignore && Array.isArray(users)) setAdminUsers(users);
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, [adminToken, authHeaders]);

  const toggleRoleMenu = (menu) => {
    setRoleDraft((current) => ({
      ...current,
      menus: current.menus.includes(menu)
        ? current.menus.filter((item) => item !== menu)
        : [...current.menus, menu],
    }));
  };

  const toggleUserMenu = (menu) => {
    setAdminUserDraft((current) => ({
      ...current,
      menus: current.menus.includes(menu)
        ? current.menus.filter((item) => item !== menu)
        : [...current.menus, menu],
    }));
  };

  const saveAdminRole = (event) => {
    event.preventDefault();
    if (!roleDraft.name.trim()) return;
    const role = {
      id: `role-${Date.now()}`,
      name: roleDraft.name.trim(),
      menus: roleDraft.menus,
    };
    setAdminRoles((current) => [role, ...current.filter((item) => item.name !== role.name)]);
    setAdminUserDraft((current) => ({ ...current, role: role.name, menus: role.menus }));
    setRoleDraft({ name: '', menus: ['Dashboard'] });
    setUserManagementStatus('Role saved with selected menu access');
  };

  const selectAdminRole = (roleName) => {
    const role = adminRoles.find((item) => item.name === roleName);
    setAdminUserDraft((current) => ({
      ...current,
      role: roleName,
      menus: role?.menus || current.menus,
    }));
  };

  const createAdminUser = async (event) => {
    event.preventDefault();
    setUserManagementStatus('Creating admin user...');
    try {
      const response = await fetch(`${API_BASE}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          name: adminUserDraft.name,
          email: adminUserDraft.email,
          password: adminUserDraft.password,
          role: adminUserDraft.role,
          menus: adminUserDraft.menus,
          profile: {
            department: adminUserDraft.department,
            designation: adminUserDraft.designation,
            phone: adminUserDraft.phone,
            hospitalScope: adminUserDraft.hospitalScope,
          },
        }),
      });
      const user = await response.json();
      if (!response.ok) throw new Error(user.message || 'User creation failed');
      setAdminUsers((current) => [user, ...current.filter((item) => item.email !== user.email)]);
      setAdminUserDraft({
        name: '',
        email: '',
        password: '',
        role: adminUserDraft.role,
        department: '',
        designation: '',
        phone: '',
        hospitalScope: '',
        menus: adminUserDraft.menus,
      });
      setUserManagementStatus('Admin user profile created');
    } catch (error) {
      setUserManagementStatus(error.message || 'User creation failed');
    }
  };

  const addSitePage = (event) => {
    event.preventDefault();
    if (!pageDraft.title.trim()) return;
    const slug = pageDraft.slug.trim() || `/${normalizeSearch(pageDraft.title).replace(/\s+/g, '-')}`;
    setSiteSettings((current) => ({
      ...current,
      pages: [
        ...current.pages,
        {
          id: `page-${Date.now()}`,
          title: pageDraft.title.trim(),
          slug,
          visible: pageDraft.visible,
        },
      ],
    }));
    setPageDraft({ title: '', slug: '', visible: true });
    setDbStatus(adminToken ? 'Site page queued for backend save' : 'Site page saved locally');
  };

  const toggleSitePage = (pageId) => {
    setSiteSettings((current) => ({
      ...current,
      pages: current.pages.map((page) => (page.id === pageId ? { ...page, visible: !page.visible } : page)),
    }));
  };

  const removeSitePage = (pageId) => {
    setSiteSettings((current) => ({
      ...current,
      pages: current.pages.filter((page) => page.id !== pageId),
    }));
    setDbStatus(adminToken ? 'Site page queued for backend save' : 'Site page removed locally');
  };

  const addSiteFaq = (event) => {
    event.preventDefault();
    if (!faqDraft.question.trim() || !faqDraft.answer.trim()) return;
    setSiteSettings((current) => ({
      ...current,
      faqs: [
        ...(Array.isArray(current.faqs) ? current.faqs : DEFAULT_HOME_FAQS),
        {
          id: `faq-${Date.now()}`,
          question: faqDraft.question.trim(),
          answer: faqDraft.answer.trim(),
          icon: faqDraft.icon.trim() || 'fa-circle-question',
          visible: faqDraft.visible,
        },
      ],
    }));
    setFaqDraft({ question: '', answer: '', icon: 'fa-circle-question', visible: true });
    setDbStatus(adminToken ? 'FAQ queued for backend save' : 'FAQ saved locally');
  };

  const toggleSiteFaq = (faqId) => {
    setSiteSettings((current) => ({
      ...current,
      faqs: (Array.isArray(current.faqs) ? current.faqs : DEFAULT_HOME_FAQS).map((faq) => (faq.id === faqId ? { ...faq, visible: !faq.visible } : faq)),
    }));
  };

  const removeSiteFaq = (faqId) => {
    setSiteSettings((current) => ({
      ...current,
      faqs: (Array.isArray(current.faqs) ? current.faqs : DEFAULT_HOME_FAQS).filter((faq) => faq.id !== faqId),
    }));
    setDbStatus(adminToken ? 'FAQ queued for backend save' : 'FAQ removed locally');
  };

  const processMasterDataFile = async (file) => {
    if (!file) return;
    setUploadName(file.name);
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setDbStatus('Please upload CSV for master data import. XLS/XLSX can be converted to CSV first.');
      return;
    }

    try {
      const text = await file.text();
      const rows = parseCsvText(text);
      const importKind = detectImportKindFromRows(rows);
      if (!rows.length || importKind === 'generic') {
        setDbStatus('Could not detect hospital or accreditation master columns in this CSV');
        return;
      }

      const response = await fetch(`${API_BASE}/admin/imports/master-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          fileName: file.name,
          sourceType: 'csv',
          importKind,
          rows,
          uploadedByEmail: adminUser?.email,
          privateNotes: 'Master data uploaded from admin dashboard UI',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Master data import failed');
      setAdminRecords((current) => [
        data.importRecord,
        ...(Array.isArray(data.records) ? data.records : []),
        ...current.filter((record) => record._id !== data.importRecord?._id),
      ].filter(Boolean));
      if (data.importKind === 'hospital' && Array.isArray(data.records)) {
        setAdminHospitals((current) => [
          ...data.records.map((record) => ({
            id: record._id,
            recordId: record._id,
            ...(record.publicData || {}),
            status: record.status || record.publicData?.certificationStatus || 'Active',
            onboardingStep: record.publicData?.onboardingStep || 2,
            cost: { package: Number(record.publicData?.packageFrom) || 0 },
          })),
          ...current,
        ]);
      }
      setDbStatus(`${data.message}. ${data.importKind === 'hospital' ? 'Frontend hospital data is now updated.' : 'Accreditation master data is now in admin.'}`);
    } catch (error) {
      setDbStatus(error.message === 'Failed to fetch' ? 'Import failed - backend API unavailable' : error.message);
    }
  };

  const handleUploadFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadStatus(`Uploading ${file.name}…`);
    try {
      await processMasterDataFile(file);
      setUploadStatus(`✓ ${file.name} processed successfully`);
    } catch (error) {
      setUploadStatus(`✗ Upload failed: ${error?.message || 'Please check the file format'}`);
    }
    event.target.value = '';
  };

  const handleUploadDrop = async (event) => {
    event.preventDefault();
    await processMasterDataFile(event.dataTransfer.files?.[0]);
  };

  const downloadBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      databaseStatus: dbStatus,
      hospitals: adminHospitals,
      doctors: doctorRows,
      treatments: treatmentRows,
      surgeries: costingRows,
      inquiries: inquiryRows,
      patientRecordPolicy: 'Patient records are hospital-only and are not included in admin backups.',
      appointments: appointmentRows,
      agents: visibleAgentRows,
      adminRecords,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Kairacure-admin-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setDbStatus('Backup downloaded');
  };

  const restoreBackup = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = JSON.parse(String(reader.result || '{}'));
        if (Array.isArray(backup.hospitals)) setAdminHospitals(backup.hospitals);
        if (Array.isArray(backup.doctors)) setLocalDoctors(backup.doctors);
        if (Array.isArray(backup.agents)) setLocalAgents(backup.agents);
        if (Array.isArray(backup.appointments)) setLocalAppointments(backup.appointments);
        if (Array.isArray(backup.surgeries)) setLocalCostingRows(backup.surgeries);
        if (Array.isArray(backup.adminRecords)) setAdminRecords(backup.adminRecords);
        setDbStatus(`Backup restored from ${file.name}`);
      } catch {
        setDbStatus('Backup restore failed');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  if (!adminToken) {
    return (
      <section className="admin-login-page">
        <div className="admin-login-shell">
          <aside className="admin-login-visual">
            <div className="admin-login-mark"><AdminIcon name="shield" /></div>
            <strong>Kairacure Admin</strong>
            <h1>Manage hospital partners, doctors, costing, and patient operations.</h1>
            <div>
              <span><AdminIcon name="hospital" /> Hospital catalog</span>
              <span><AdminIcon name="doctor" /> Doctor profiles with images</span>
              <span><AdminIcon name="lock" /> Encrypted admin records</span>
            </div>
          </aside>
          <form className="admin-login-card" onSubmit={handleAdminLogin}>
            <span className="admin-login-eyebrow">Secure workspace</span>
            <h1>Sign in</h1>
            <p>Use your admin credentials to open the backend-powered dashboard.</p>
            <label>Email<input autoComplete="email" onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} placeholder="Enter admin email" type="email" value={loginForm.email} /></label>
            <label>Password<input autoComplete="current-password" onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} placeholder="Enter admin password" type="password" value={loginForm.password} /></label>
            {loginError && <span className="admin-login-error">{loginError}</span>}
            <button type="submit">Login</button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page reference-admin" aria-label="Kairacure admin panel">
      <aside className={`admin-sidebar ref-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-brand ref-brand">
          <span><AdminIcon name="shield" /></span>
          <strong>Kairacure Admin</strong>
        </div>
        <nav>
          {adminNavGroups.map((group) => (
            <div className="ref-nav-group" key={group.title}>
              <p className="ref-nav-group-label">{group.title}</p>
              {group.items.map(([icon, label, flatIndex]) => (
                <button className={activeAdminPage === label ? 'active' : ''} key={label} onClick={() => { setActiveAdminPage(label); setSidebarOpen(false); }} type="button">
                  <AdminIcon name={icon} />
                  <span>{label}</span>
                  {flatIndex < 9 && <kbd>Alt+{flatIndex + 1}</kbd>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="admin-secure-mini ref-secure">
          <AdminIcon name="lock" />
          <strong>Encrypted records</strong>
          <span>All confidential hospital and doctor data is encrypted and protected.</span>
        </div>
      </aside>

      <div className="admin-sidebar-scrim" onClick={() => setSidebarOpen(false)} />
      <div className="admin-workspace ref-workspace">
        <header className="ref-topbar">
          <button className="admin-mobile-menu-btn" onClick={() => setSidebarOpen(true)} type="button" aria-label="Open menu">
            <i className="fa-solid fa-bars"></i>
          </button>
          <label className="ref-search">
            <AdminIcon name="search" />
            <input
              autoComplete="off"
              onBlur={() => window.setTimeout(() => setShowSearchResults(false), 120)}
              onChange={(event) => {
                setAdminSearch(event.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && adminSearchOptions[0]) {
                  event.preventDefault();
                  openAdminSearchOption(adminSearchOptions[0]);
                }
              }}
              placeholder="Search hospitals, doctors, appointments, patients, treatments..."
              ref={searchInputRef}
              value={adminSearch}
            />
            <kbd>Ctrl K</kbd>
            {showSearchResults && (
              <div className="admin-search-results">
                {adminSearchOptions.length ? adminSearchOptions.map((option) => (
                  <button key={option.id} onMouseDown={() => openAdminSearchOption(option)} type="button">
                    <span className="admin-search-result-icon"><AdminIcon name={option.icon || 'search'} /></span>
                    <strong>{option.label}</strong>
                    <small>{option.meta}</small>
                  </button>
                )) : <p>No admin results found</p>}
              </div>
            )}
          </label>
          <div className="ref-top-actions">
            <span className="ref-encrypted"><AdminIcon name="shield" />Hospital-only patient records <b /></span>
            <div className="notification-shell">
              <button className="ref-icon-button" onClick={() => setShowNotifications((current) => !current)} type="button"><AdminIcon name="bell" /><i>{notificationItems.length}</i></button>
              {showNotifications && (
                <div className="notification-panel">
                  <div>
                    <strong>Notifications</strong>
                    <button onClick={() => setShowNotifications(false)} type="button">Close</button>
                  </div>
                  {notificationItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveAdminPage(item.page);
                        setShowNotifications(false);
                      }}
                      type="button"
                    >
                      <span><AdminIcon name={item.icon || 'bell'} />{item.title}</span>
                      <small>{item.meta}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="ref-icon-button" type="button"><AdminIcon name="help" /></button>
            <div className="ref-user">
              <span>A</span>
              <div><strong>{adminUser?.name || 'Admin User'}</strong><small>{adminUser?.role || 'Super Admin'}</small></div>
              <button className="admin-logout-button" onClick={logoutAdmin} type="button">Logout</button>
            </div>
          </div>
        </header>

        {activeAdminPage === 'Dashboard' && (
          <div className="ref-dashboard-grid">
            <section className="ref-analytics-panel">
              {analytics.map(([label, value, note]) => (
                <article key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <small>{note}</small>
                </article>
              ))}
            </section>

            <section className="ref-panel admin-quick-actions">
              <div className="ref-panel-head">
                <h2>Quick Actions</h2>
                <small>{dbStatus}</small>
              </div>
              <div className="admin-quick-grid">
                <button onClick={() => { setForm(emptyForm); setEditingId(''); setActiveAdminPage('Hospitals'); }} type="button">
                  <AdminIcon name="hospital" />
                  <strong>Add Hospital</strong>
                  <span>Create partner profile, costs, rating and image gallery.</span>
                </button>
                <button onClick={addCostingRow} type="button">
                  <AdminIcon name="mapping" />
                  <strong>Add Treatment</strong>
                  <span>Map specialties, procedure codes and package ranges.</span>
                </button>
                <button onClick={() => setActiveAdminPage('ICD-11 Mapping')} type="button">
                  <AdminIcon name="mapping" />
                  <strong>WHO ICD-11</strong>
                  <span>Search ICD-11 MMS, import treatments with costing.</span>
                </button>
                <button onClick={() => setActiveAdminPage('Upload CSV / Excel')} type="button">
                  <AdminIcon name="upload" />
                  <strong>Upload CSV</strong>
                  <span>Import hospital and doctor data using CSV format.</span>
                </button>
                <button onClick={() => setActiveAdminPage('Appointments')} type="button">
                  <AdminIcon name="calendar" />
                  <strong>Appointments</strong>
                  <span>Review booking requests and coordinate schedules.</span>
                </button>
                <button onClick={() => { resetDoctorForm(); setActiveAdminPage('Doctors'); }} type="button">
                  <AdminIcon name="doctor" />
                  <strong>Add Doctor</strong>
                  <span>Map doctor profile to hospital, treatments, ratings and reviews.</span>
                </button>
                <button onClick={() => setActiveAdminPage('Reports')} type="button">
                  <AdminIcon name="report" />
                  <strong>Reports</strong>
                  <span>Check partner performance and inquiry movement.</span>
                </button>
              </div>
              <div className="admin-quick-footer">
                <span><AdminIcon name="shield" /> Dashboard shortcuts for active admin tasks</span>
                <a className="sample-csv-link" download="Kairacure_costing_sample.csv" href={sampleCsvHref}>Download CSV sample</a>
              </div>
            </section>

            <section className="ref-panel ref-table-panel wide-panel dashboard-costing-panel">
              <div className="ref-panel-head">
                <h2>Treatment / Surgery Mapping & Tentative Costing</h2>
                <div>
                  <button onClick={addCostingRow} type="button"><AdminIcon name="plus" /> Add Treatment / Surgery</button>
                  <button className="ghost-icon" type="button"><AdminIcon name="dots" /></button>
                </div>
              </div>
              <div className="ref-table-wrap">
                <table className="ref-table costing-table">
                  <thead><tr><th>Category</th><th>Treatment / Surgery</th><th>Procedure Code</th><th>Hospital Cost (INR)</th><th>Kairacure Price (INR)</th><th>Currency</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {costingRows.map((row) => (
                      <tr key={row.id || row.code}>
                        <td>{row.category}</td><td>{row.surgery}</td><td>{row.code}</td><td>{row.hospitalCost.toLocaleString('en-IN')}</td><td>{row.KairacurePrice.toLocaleString('en-IN')}</td><td>{row.currency}</td><td><span className="status-pill active">{row.status}</span></td>
                        <td className="admin-actions-cell"><button className="table-icon" onClick={() => editCostingRow(row)} title="Edit costing" type="button"><AdminIcon name="edit" /></button><button className="table-icon danger" onClick={() => confirmDeleteCostingRow(row)} title="Delete costing" type="button"><AdminIcon name="trash" /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="ref-pagination"><span>Showing 1 to 5 of 25 entries</span><button type="button">&lt;</button><button className="active" type="button">1</button><button type="button">2</button><button type="button">3</button><button type="button">&gt;</button></div>
            </section>

            <section className="ref-panel ref-upload-card dashboard-upload-panel">
              <div className="ref-panel-head"><h2>Upload CSV / Excel</h2><a className="sample-csv-link" download="Kairacure_costing_sample.csv" href={sampleCsvHref}>Download sample</a></div>
              <label className="ref-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={handleUploadDrop}>
                <input accept=".csv,.xls,.xlsx" onChange={handleUploadFile} type="file" />
                <AdminIcon name="cloud" />
                <strong>{uploadName || 'Drag & drop file here'}</strong>
                <span>Choose File</span>
                <small>Supports hospital master CSV and accreditation type master CSV</small>
              </label>
              <div className="recent-uploads">
                <strong>Recent Uploads <button onClick={() => setActiveAdminPage('Upload CSV / Excel')} type="button">View all</button></strong>
                {recentUploads.map((upload) => (
                  <article key={upload.fileName}>
                    <span>{upload.type}</span>
                    <div><b>{upload.fileName}</b><small>{upload.date}</small></div>
                    <em>Processed</em>
                    {upload.recordId && (
                      <button
                        className="table-icon danger"
                        onClick={() => confirmDeleteImportRecord(upload)}
                        title="Delete import record"
                        type="button"
                      >
                        <AdminIcon name="trash" />
                      </button>
                    )}
                  </article>
                ))}
              </div>
              <div className="sample-csv-preview">
                <strong>Sample CSV format</strong>
                <div>
                  {csvExampleRows.map((row, index) => (
                    <code key={row.join('-')}>{row.join(index === 0 ? ' | ' : ' , ')}</code>
                  ))}
                </div>
              </div>
            </section>

            <section className="ref-panel ref-table-panel dashboard-hospitals-panel">
              <div className="ref-panel-head">
                <h2>Hospitals</h2>
                <small>{activeOnboardingStep ? `${onboardingLabels[activeOnboardingStep - 1]} stage` : 'All stages'} · {filteredOnboardingHospitals.length} entries</small>
              </div>
              <div className="ref-table-wrap">
                <table className="ref-table compact-table">
                  <thead><tr><th>Hospital</th><th>City</th><th>Specialty</th><th>Onboarding</th><th>Contact</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>{filteredOnboardingHospitals.slice(0, 6).map((hospital) => (
                    <tr key={hospital.id}>
                      <td><span className="hospital-admin-cell">{hospital.image && <img alt="" src={hospital.image} />}{hospital.name}<small>{hospital.accreditations?.slice?.(0, 42) || 'Encrypted partner profile'}</small></span></td><td>{hospital.city}</td><td>{hospital.specialty}</td>
                      <td><span className="stage-pill">{onboardingLabels[(Number(hospital.onboardingStep || 1) - 1)] || 'Registration'}</span></td>
                      <td>{hospital.contactPerson || 'Admin desk'}</td><td><span className="status-pill active">{hospital.status || 'Active'}</span></td>
                      <td className="admin-actions-cell"><button className="table-icon" onClick={() => editHospital(hospital)} title="Edit hospital" type="button"><AdminIcon name="edit" /></button><button className="table-icon text-action" onClick={() => moveHospitalStage(hospital, Number(hospital.onboardingStep || 1) + 1)} title="Move to next onboarding stage" type="button">Next</button><button className="table-icon danger" onClick={() => confirmDeleteHospital(hospital)} title="Delete hospital" type="button"><AdminIcon name="trash" /></button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </section>

            <section className="ref-panel ref-table-panel dashboard-inquiries-panel">
              <div className="ref-panel-head"><h2>Patient inquiries</h2><button onClick={() => setActiveAdminPage('Patient inquiries')} type="button">View all</button></div>
              <div className="ref-table-wrap"><table className="ref-table compact-table"><thead><tr><th>Inquiry ID</th><th>Patient Name</th><th>Country</th><th>Treatment Interest</th><th>Status</th></tr></thead><tbody>{inquiryRows.map((item) => <tr key={item.id}><td>{item.id}</td><td>{item.patient}</td><td>{item.country}</td><td>{item.treatment}</td><td><span className="status-pill blue">{item.stage}</span></td></tr>)}</tbody></table></div>
            </section>

            <section className="ref-panel consultation-flow dashboard-stages-panel">
              <div className="ref-panel-head"><h2>Consultation stages</h2><button onClick={() => setActiveAdminPage('Consultation stages')} type="button">View all</button></div>
              {ADMIN_STAGES.map((stage, index) => <article key={stage}><span>{index + 1}</span><div><strong>{stage}</strong><small>{index === 0 ? 'Inquiry received and basic details captured' : index === 2 ? 'Plan shared with tentative cost' : 'Patient movement tracked'}</small></div><b>{[128, 86, 52, 31, 18, 76][index]}</b></article>)}
            </section>

            <section className="ref-panel ref-table-panel dashboard-appointments-panel">
              <div className="ref-panel-head"><h2>Appointments</h2><button onClick={() => setActiveAdminPage('Appointments')} type="button">View all</button></div>
              <div className="ref-table-wrap"><table className="ref-table compact-table appointments-table"><thead><tr><th>Appointment ID</th><th>Patient Name</th><th>Treatment</th><th>Hospital</th><th>Date & Time</th><th>Status</th><th>Actions</th></tr></thead><tbody>{appointmentRows.map((item) => <tr key={item.id}><td>{item.id}</td><td>{item.patient}<small>{item.phone || item.doctor || item.mode}</small></td><td>{item.treatment || 'Consultation'}<small>{item.doctor || item.mode}</small></td><td>{item.hospital}</td><td>{item.dateTime}</td><td><select className="status-select" onChange={(event) => updateAppointmentStatus(item, event.target.value)} value={item.status}>{['Scheduled', 'Confirmed', 'Pending reports', 'Tentative', 'Rescheduled', 'Completed', 'Cancelled'].map((status) => <option key={status}>{status}</option>)}</select></td><td className="admin-actions-cell"><button className="table-icon" onClick={() => editAppointment(item)} title="Edit appointment" type="button"><AdminIcon name="edit" /></button><button className="table-icon danger" onClick={() => confirmDeleteAppointment(item)} title="Delete appointment" type="button"><AdminIcon name="trash" /></button></td></tr>)}</tbody></table></div>
            </section>

            <section className="ref-panel ref-table-panel wide-panel dashboard-agent-panel">
              <div className="ref-panel-head"><h2>Agent Management</h2><div><select><option>All Status</option></select><button onClick={openAgentForm} type="button"><AdminIcon name="plus" /> Add Agent</button><button className="ghost-icon" type="button"><AdminIcon name="dots" /></button></div></div>
              <div className="ref-table-wrap"><table className="ref-table compact-table"><thead><tr><th>Agent ID</th><th>Agent Name</th><th>Region</th><th>Contact</th><th>Email</th><th>Assigned Inquiries</th><th>Conversions</th><th>Status</th></tr></thead><tbody>{visibleAgentRows.map((agent) => <tr key={agent.id}><td>{agent.id}</td><td>{agent.name}</td><td>{agent.region}</td><td>{agent.contact}</td><td>{agent.email}</td><td>{agent.activeCases}</td><td>{agent.conversion}</td><td><span className="status-pill active">{agent.status}</span></td></tr>)}</tbody></table></div>
            </section>

            <section className="ref-panel ref-table-panel doctors-later-panel dashboard-doctors-panel">
              <div className="ref-panel-head"><h2>Doctors</h2><button onClick={() => setActiveAdminPage('Doctors')} type="button">View all</button></div>
              <div className="ref-table-wrap"><table className="ref-table compact-table"><thead><tr><th>Doctor</th><th>Specialty</th><th>Hospital</th><th>Rating</th><th>Status</th></tr></thead><tbody>{doctorRows.slice(0, 6).map((doctor, index) => <tr key={`${doctor.id}-${doctor.name}-${index}`}><td><span className="hospital-admin-cell">{doctor.profileImage ? <img alt="" src={doctor.profileImage} /> : <span className="doctor-placeholder-icon" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#dbeafe', color: '#0d2f5d', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>Dr</span>}{doctor.name}<small>{doctor.title}</small></span></td><td>{doctor.specialty}</td><td>{doctor.hospital}</td><td>{doctor.rating}</td><td><span className="status-pill active">{doctor.status}</span></td></tr>)}</tbody></table></div>
              <p><AdminIcon name="doctor" /> Doctor profiles are mapped to hospital and treatment data.</p>
            </section>
          </div>
        )}
        {activeAdminPage !== 'Dashboard' && (
          <div className="admin-page-content">
            <section className="admin-page-title">
              <div>
                <h1>{activeAdminPage}</h1>
                <p>{activeAdminPage === 'Hospitals' ? 'Formal hospital onboarding, media, reviews, accreditation and confidential partner details.' : activeAdminPage === 'Treatment Mapping' ? 'Create treatment categories and map procedures to hospital costing.' : activeAdminPage === 'ICD-11 Mapping' ? 'Search WHO ICD-11 MMS, import coded entities, and align treatments with frontend discovery.' : activeAdminPage === 'Journey Plans' ? 'Complete patient travel plans with treatments, hospitals, costs, and ICD-11 mapping for admin tracking.' : activeAdminPage === 'Doctors' ? 'Add specialist doctors with hospital mapping, treatment focus, profile images, checklists, ratings and review details.' : activeAdminPage === 'Audit Logs' ? 'Audit all admin activity, including platform configuration changes and operational record updates.' : activeAdminPage === 'Users & Roles' ? 'Create admin profiles and assign menu-based roles without granting patient-record access.' : 'Operational workspace connected to backend admin records.'}</p>
              </div>
              <span>{dbStatus}</span>
            </section>
            {showAdminFilters && (
              <section className="admin-filter-strip">
                <label>
                  Search
                  <input
                    onChange={(event) => setAdminTableFilters((current) => ({ ...current, search: event.target.value }))}
                    placeholder={activeFilterConfig.search}
                    value={adminTableFilters.search}
                  />
                </label>
                {activeFilterConfig.city && (
                <label>
                  {activeFilterConfig.city}
                  <select onChange={(event) => setAdminTableFilters((current) => ({ ...current, city: event.target.value }))} value={adminTableFilters.city}>
                    <option>All</option>
                    {adminCityOptions.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                )}
                {activeFilterConfig.status && (
                <label>
                  {activeFilterConfig.status}
                  <select onChange={(event) => setAdminTableFilters((current) => ({ ...current, status: event.target.value }))} value={adminTableFilters.status}>
                    <option>All</option>
                    {adminStatusOptions.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                )}
                {activeFilterConfig.specialty && (
                <label>
                  {activeFilterConfig.specialty}
                  <select onChange={(event) => setAdminTableFilters((current) => ({ ...current, specialty: event.target.value }))} value={adminTableFilters.specialty}>
                    <option>All</option>
                    {adminSpecialtyOptions.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                )}
                {activeFilterConfig.accreditation && (
                <label>
                  {activeFilterConfig.accreditation}
                  <select onChange={(event) => setAdminTableFilters((current) => ({ ...current, accreditation: event.target.value }))} value={adminTableFilters.accreditation}>
                    <option>All</option>
                    {adminAccreditationOptions.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                )}
                <span className="admin-filter-count">
                  {adminFilterCount} {adminFilterCount === 1 ? 'match' : 'matches'}
                </span>
                <button onClick={() => setAdminTableFilters({ search: '', city: 'All', status: 'All', specialty: 'All', accreditation: 'All' })} type="button">Reset</button>
              </section>
            )}

            {activeAdminPage === 'Hospitals' && (
              <div className="admin-section-grid">
                <form className="ref-panel admin-page-form" onSubmit={saveHospital}>
                  <div className="ref-panel-head"><h2>{editingId ? 'Edit Hospital' : 'Add Hospital'}</h2><small>Formal partner profile</small></div>
                  <div className="ref-form-grid expanded">
                    <div className="form-section-head wide"><span>Basic Information</span></div>
                    <label>Hospital Legal Name<input onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Apollo Hospitals, Delhi" value={form.name} /></label>
                    <label>Primary City<input onChange={(event) => setForm({ ...form, city: event.target.value })} placeholder="New Delhi" value={form.city} /></label>
                    <label>State<input onChange={(event) => setForm({ ...form, state: event.target.value })} placeholder="Delhi / Haryana" value={form.state} /></label>
                    <label>Country<input onChange={(event) => setForm({ ...form, country: event.target.value })} placeholder="India" value={form.country} /></label>
                    <label>Contact Person<input onChange={(event) => setForm({ ...form, contactPerson: event.target.value })} placeholder="Partner coordinator" value={form.contactPerson} /></label>
                    <label>Email<input onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="partner@hospital.com" type="email" value={form.email} /></label>
                    <label>Phone<input onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+91..." value={form.phone} /></label>
                    <label>Primary Specialty<select onChange={(event) => setForm({ ...form, specialty: event.target.value })} value={form.specialty}>{Array.from(new Set([...HOSPITALS.map((hospital) => hospital.specialty), ...treatmentRows.map((item) => item.category)])).map((item) => <option key={item}>{item}</option>)}</select></label>
                    <label className="wide">Full Address<input onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Complete hospital address" value={form.address} /></label>
                    <label className="wide">Treatments Offered<input onChange={(event) => setForm({ ...form, treatments: event.target.value })} placeholder="Cardiac Sciences, Oncology, Urology" value={form.treatments} /></label>
                    <div className="form-section-head wide"><span>Capacity & Facilities</span></div>
                    <label>Beds<input onChange={(event) => setForm({ ...form, beds: event.target.value })} type="number" value={form.beds} /></label>
                    <label>ICU Beds<input onChange={(event) => setForm({ ...form, icuBeds: event.target.value })} type="number" value={form.icuBeds} /></label>
                    <label>Operation Theatres<input onChange={(event) => setForm({ ...form, operatingRooms: event.target.value })} type="number" value={form.operatingRooms} /></label>
                    <div className="form-section-head wide"><span>Pricing (estimates)</span></div>
                    <label>Starting Package USD<input onChange={(event) => setForm({ ...form, packageFrom: event.target.value })} type="number" value={form.packageFrom} /></label>
                    <label>Min Cost INR<input onChange={(event) => setForm({ ...form, minCost: event.target.value })} type="number" value={form.minCost} /></label>
                    <label>Max Cost INR<input onChange={(event) => setForm({ ...form, maxCost: event.target.value })} type="number" value={form.maxCost} /></label>
                    <div className="form-section-head wide"><span>Accreditation & Media</span></div>
                    <label className="wide">Accreditations<input onChange={(event) => setForm({ ...form, accreditations: event.target.value })} placeholder="NABH, JCI, International patient desk" value={form.accreditations} /></label>
                    <label className="wide">Main Image URL<input onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="https://..." value={form.image} /></label>
                    <label className="admin-file-field">Upload Main Image<input accept="image/*" onChange={(event) => setImageFromFile(event, 'image')} type="file" /><span><AdminIcon name="cloud" /> Choose main image</span></label>
                    <label className="wide">Gallery Image URLs<textarea onChange={(event) => setForm({ ...form, galleryImages: event.target.value })} placeholder="One image URL per line" value={form.galleryImages} /></label>
                    <label className="admin-file-field">Upload Gallery Images<input accept="image/*" multiple onChange={(event) => setImageFromFile(event, 'galleryImages')} type="file" /><span><AdminIcon name="plus" /> Add multiple images</span></label>
                    <div className="admin-image-preview wide">
                      <strong>{hospitalImageCount ? `${hospitalImageCount} image${hospitalImageCount > 1 ? 's' : ''} selected` : 'No images selected'}</strong>
                      <div>
                        {form.image && <img alt="Hospital main preview" src={form.image} />}
                        {galleryPreviewUrls.slice(0, 8).map((image) => <img alt="Hospital gallery preview" key={image} src={image} />)}
                      </div>
                    </div>
                    <div className="form-section-head wide"><span>Patient Review</span></div>
                    <label>Review Patient<input onChange={(event) => setForm({ ...form, reviewName: event.target.value })} value={form.reviewName} /></label>
                    <label>Review Rating<input max="5" min="1" onChange={(event) => setForm({ ...form, reviewRating: event.target.value })} step="0.1" type="number" value={form.reviewRating} /></label>
                    <label className="wide">Review Note<textarea onChange={(event) => setForm({ ...form, reviewNote: event.target.value })} value={form.reviewNote} /></label>
                    <div className="form-section-head wide"><span>Confidential (internal only)</span></div>
                    <label className="wide">Confidential Partner Notes<textarea onChange={(event) => setForm({ ...form, confidentialNote: event.target.value })} placeholder="Private contract notes, tariff approvals, internal contact" value={form.confidentialNote} /></label>
                  </div>
                  <div className="ref-form-actions">
                    <button onClick={() => { setForm(emptyForm); setEditingId(''); }} type="button">Cancel</button>
                    <button type="submit">{editingId ? 'Update Hospital' : 'Save Hospital'}</button>
                  </div>
                </form>
                <section className="ref-panel ref-table-panel hosp-records-panel">
                  <div className="ref-panel-head">
                    <h2>Hospital Records</h2>
                    <small>{filteredAdminHospitals.length} of {adminHospitals.length} records</small>
                  </div>
                  <div className="ref-table-wrap">
                    <table className="ref-table hosp-table">
                      <thead>
                        <tr>
                          <th style={{minWidth: 260}}>Hospital</th>
                          <th style={{minWidth: 120}}>City / State</th>
                          <th style={{minWidth: 160}}>Specialty</th>
                          <th style={{minWidth: 120}}>Accreditation</th>
                          <th style={{minWidth: 90}}>Beds</th>
                          <th style={{minWidth: 130}}>Package (INR)</th>
                          <th style={{minWidth: 130}}>Contact</th>
                          <th style={{minWidth: 80}}>Images</th>
                          <th style={{minWidth: 80}}>Reviews</th>
                          <th style={{minWidth: 90}}>Status</th>
                          <th style={{minWidth: 110}}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAdminHospitals.length === 0 && (
                          <tr>
                            <td colSpan={11} className="hosp-empty-row">
                              <i className="fa-solid fa-hospital" aria-hidden="true" />
                              No hospitals match the current filters.
                            </td>
                          </tr>
                        )}
                        {filteredAdminHospitals.map((hospital) => {
                          const imageCount = [hospital.image, ...(hospital.galleryImages || [])].filter(Boolean).length;
                          const reviewCount = hospital.patientReviews?.length || 0;
                          const avgRating = reviewCount
                            ? (hospital.patientReviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviewCount).toFixed(1)
                            : null;
                          const minCostK = hospital.minCost ? `₹${(hospital.minCost / 1000).toFixed(0)}K` : null;
                          const maxCostK = hospital.maxCost ? `₹${(hospital.maxCost / 1000).toFixed(0)}K` : null;
                          const costRange = minCostK && maxCostK ? `${minCostK} – ${maxCostK}` : minCostK || maxCostK || '—';
                          const accreds = String(hospital.accreditations || '').split(',').map((a) => a.trim()).filter(Boolean);
                          const statusVal = (hospital.status || 'Active').toLowerCase();

                          return (
                            <tr key={hospital.id || hospital.name}>
                              {/* Hospital name + thumbnail */}
                              <td>
                                <div className="hosp-name-cell">
                                  {hospital.image
                                    ? <img src={hospital.image} alt="" className="hosp-thumb" />
                                    : <span className="hosp-thumb-placeholder"><i className="fa-solid fa-hospital" aria-hidden="true" /></span>
                                  }
                                  <div>
                                    <strong className="hosp-name">{hospital.name}</strong>
                                    {hospital.address && <small className="hosp-address">{hospital.address.split('\n')[0]}</small>}
                                  </div>
                                </div>
                              </td>

                              {/* City */}
                              <td>
                                <span className="hosp-city">{hospital.city || '—'}</span>
                                {hospital.state && <small className="hosp-state">{hospital.state}</small>}
                              </td>

                              {/* Specialty */}
                              <td>
                                <span className="hosp-specialty-badge">{hospital.specialty || '—'}</span>
                                {hospital.treatments && (
                                  <small className="hosp-treatments">{String(hospital.treatments).split(',').slice(0, 2).join(', ')}{String(hospital.treatments).split(',').length > 2 ? '…' : ''}</small>
                                )}
                              </td>

                              {/* Accreditations */}
                              <td>
                                <div className="hosp-accred-list">
                                  {accreds.length
                                    ? accreds.slice(0, 3).map((a) => (
                                        <span
                                          key={a}
                                          className={`hosp-accred-tag${/jci/i.test(a) ? ' jci' : /nabh/i.test(a) ? ' nabh' : ''}`}
                                        >{a}</span>
                                      ))
                                    : <span className="hosp-accred-tag">—</span>
                                  }
                                </div>
                              </td>

                              {/* Beds */}
                              <td>
                                <span className="hosp-beds">{hospital.beds ? hospital.beds.toLocaleString('en-IN') : '—'}</span>
                                {hospital.icuBeds > 0 && <small className="hosp-icu">{hospital.icuBeds} ICU</small>}
                              </td>

                              {/* Cost */}
                              <td>
                                <span className="hosp-cost">{costRange}</span>
                                {hospital.packageFrom > 0 && (
                                  <small className="hosp-pkg">From ${hospital.packageFrom.toLocaleString()}</small>
                                )}
                              </td>

                              {/* Contact */}
                              <td>
                                <span className="hosp-contact-name">{hospital.contactPerson || '—'}</span>
                                {hospital.phone && (
                                  <a href={`tel:${hospital.phone}`} className="hosp-contact-phone" onClick={(e) => e.stopPropagation()}>
                                    {hospital.phone}
                                  </a>
                                )}
                              </td>

                              {/* Images */}
                              <td className="hosp-center-cell">
                                {imageCount > 0
                                  ? <span className="hosp-img-count"><i className="fa-solid fa-image" aria-hidden="true" /> {imageCount}</span>
                                  : <span className="hosp-none">—</span>
                                }
                              </td>

                              {/* Reviews */}
                              <td className="hosp-center-cell">
                                {reviewCount > 0
                                  ? (
                                    <span className="hosp-review-count">
                                      <i className="fa-solid fa-star" aria-hidden="true" style={{color:'#f59e0b'}} />
                                      {avgRating} <small>({reviewCount})</small>
                                    </span>
                                  )
                                  : <span className="hosp-none">—</span>
                                }
                              </td>

                              {/* Status */}
                              <td>
                                <span className={`hosp-status-badge ${statusVal}`}>
                                  <span className="hosp-status-dot" aria-hidden="true" />
                                  {hospital.status || 'Active'}
                                </span>
                              </td>

                              {/* Actions */}
                              <td>
                                <div className="hosp-actions">
                                  <button
                                    className="hosp-action-btn edit"
                                    onClick={() => editHospital(hospital)}
                                    title="Edit hospital"
                                    type="button"
                                  >
                                    <AdminIcon name="edit" /> Edit
                                  </button>
                                  <button
                                    className="hosp-action-btn danger"
                                    onClick={() => confirmDeleteHospital(hospital)}
                                    title="Delete hospital"
                                    type="button"
                                  >
                                    <AdminIcon name="trash" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {filteredAdminHospitals.length > 0 && (
                    <div className="hosp-table-footer">
                      <span>Showing {filteredAdminHospitals.length} of {adminHospitals.length} hospitals</span>
                      {adminHospitals.filter((h) => (h.status || 'Active') === 'Active').length > 0 && (
                        <span className="hosp-footer-active">
                          <span className="hosp-status-dot active" aria-hidden="true" />
                          {adminHospitals.filter((h) => (h.status || 'Active') === 'Active').length} active
                        </span>
                      )}
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeAdminPage === 'Treatment Mapping' && (
              <div className="tm-page">

                {/* ── KPI strip ── */}
                <div className="tm-kpi-strip">
                  <div className="tm-kpi">
                    <i className="fa-solid fa-stethoscope tm-kpi-icon" aria-hidden="true" />
                    <div>
                      <strong>{treatmentRows.length}</strong>
                      <span>Total treatments</span>
                    </div>
                  </div>
                  <div className="tm-kpi">
                    <i className="fa-solid fa-layer-group tm-kpi-icon" aria-hidden="true" />
                    <div>
                      <strong>{[...new Set(treatmentRows.map((t) => t.category))].length}</strong>
                      <span>Categories</span>
                    </div>
                  </div>
                  <div className="tm-kpi">
                    <i className="fa-solid fa-tag tm-kpi-icon icd" aria-hidden="true" />
                    <div>
                      <strong>{treatmentRows.filter((t) => t.icdCode).length}</strong>
                      <span>ICD-11 coded</span>
                    </div>
                  </div>
                  <div className="tm-kpi">
                    <i className="fa-solid fa-circle-check tm-kpi-icon active" aria-hidden="true" />
                    <div>
                      <strong>{treatmentRows.filter((t) => t.status === 'Active').length}</strong>
                      <span>Active</span>
                    </div>
                  </div>
                </div>

                {/* ── Main layout: form left, table right ── */}
                <div className="tm-layout">

                  {/* ── Add / Edit form ── */}
                  <aside className="tm-form-panel ref-panel">
                    <div className="ref-panel-head tm-form-head">
                      <div>
                        <h2><i className="fa-solid fa-plus-circle" aria-hidden="true" /> Add Treatment</h2>
                        <small>Map a new procedure to a clinical category</small>
                      </div>
                    </div>

                    <form className="tm-form" onSubmit={saveTreatmentCategory}>

                      {/* Category */}
                      <div className="tm-field">
                        <label htmlFor="tm-category">
                          <i className="fa-solid fa-folder-open" aria-hidden="true" /> Category
                        </label>
                        <select
                          id="tm-category"
                          value={treatmentForm.category}
                          onChange={(e) => setTreatmentForm({ ...treatmentForm, category: e.target.value })}
                        >
                          {[
                            'Cardiac Sciences', 'Orthopedics', 'Neurosurgery', 'Oncology',
                            'Gastroenterology', 'Urology', 'Ophthalmology', 'Pulmonology',
                            'Endocrinology', 'Aesthetic', 'Dental', 'ENT',
                            'Obstetrics & Gynecology', 'Pediatrics', 'Wellness', 'IVF Treatment',
                          ].map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>

                      {/* Treatment Name */}
                      <div className="tm-field">
                        <label htmlFor="tm-title">
                          <i className="fa-solid fa-file-medical" aria-hidden="true" /> Treatment Name
                          <span className="tm-required">*</span>
                        </label>
                        <input
                          id="tm-title"
                          placeholder="e.g. Total Knee Replacement"
                          value={treatmentForm.title}
                          onChange={(e) => setTreatmentForm({ ...treatmentForm, title: e.target.value })}
                          required
                        />
                      </div>

                      {/* Procedure Code */}
                      <div className="tm-field">
                        <label htmlFor="tm-code">
                          <i className="fa-solid fa-barcode" aria-hidden="true" /> Procedure Code
                        </label>
                        <input
                          id="tm-code"
                          placeholder="e.g. ORTH-TKR-001"
                          value={treatmentForm.procedureCode}
                          onChange={(e) => setTreatmentForm({ ...treatmentForm, procedureCode: e.target.value })}
                        />
                      </div>

                      {/* Package INR */}
                      <div className="tm-field">
                        <label htmlFor="tm-pkg">
                          <i className="fa-solid fa-indian-rupee-sign" aria-hidden="true" /> Package From (INR)
                        </label>
                        <div className="tm-input-prefix">
                          <span>₹</span>
                          <input
                            id="tm-pkg"
                            type="number"
                            min="0"
                            placeholder="e.g. 250000"
                            value={treatmentForm.packageFrom}
                            onChange={(e) => setTreatmentForm({ ...treatmentForm, packageFrom: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div className="tm-field">
                        <label htmlFor="tm-desc">
                          <i className="fa-solid fa-align-left" aria-hidden="true" /> Description
                        </label>
                        <textarea
                          id="tm-desc"
                          rows={3}
                          placeholder="Patient-facing treatment description..."
                          value={treatmentForm.description}
                          onChange={(e) => setTreatmentForm({ ...treatmentForm, description: e.target.value })}
                        />
                      </div>

                      {/* Image URL */}
                      <div className="tm-field">
                        <label htmlFor="tm-img">
                          <i className="fa-solid fa-image" aria-hidden="true" /> Image URL
                        </label>
                        <input
                          id="tm-img"
                          placeholder="https://..."
                          value={treatmentForm.image}
                          onChange={(e) => setTreatmentForm({ ...treatmentForm, image: e.target.value })}
                        />
                        {treatmentForm.image && (
                          <img src={treatmentForm.image} alt="Preview" className="tm-img-preview" />
                        )}
                      </div>

                      <div className="tm-form-actions">
                        <button
                          type="button"
                          className="tm-btn-cancel"
                          onClick={() => setTreatmentForm({ category: 'Cardiac Sciences', title: '', procedureCode: '', description: '', packageFrom: '', image: '' })}
                        >
                          Clear
                        </button>
                        <button type="submit" className="tm-btn-save" disabled={!treatmentForm.title.trim()}>
                          <i className="fa-solid fa-floppy-disk" aria-hidden="true" /> Save Treatment
                        </button>
                      </div>
                    </form>
                  </aside>

                  {/* ── Treatments table ── */}
                  <section className="tm-table-panel ref-panel">
                    <div className="ref-panel-head tm-table-head">
                      <div>
                        <h2>Treatment Catalog</h2>
                        <small>{filteredTreatmentRows.length} of {treatmentRows.length} records</small>
                      </div>
                      <div className="tm-table-head-actions">
                        <div className="tm-search-box">
                          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                          <input
                            placeholder="Search treatments..."
                            value={adminTableFilters.search}
                            onChange={(e) => setAdminTableFilters({ ...adminTableFilters, search: e.target.value })}
                          />
                        </div>
                        <select
                          className="tm-cat-filter"
                          value={adminTableFilters.specialty || 'All'}
                          onChange={(e) => setAdminTableFilters({ ...adminTableFilters, specialty: e.target.value })}
                        >
                          <option value="All">All categories</option>
                          {[...new Set(treatmentRows.map((t) => t.category))].sort().map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="tm-table-wrap">
                      <table className="tm-table">
                        <thead>
                          <tr>
                            <th style={{width: 36}}></th>
                            <th style={{minWidth: 200}}>Treatment</th>
                            <th style={{minWidth: 160}}>Category</th>
                            <th style={{minWidth: 130}}>Code</th>
                            <th style={{minWidth: 130}}>Package (INR)</th>
                            <th style={{minWidth: 80}}>Source</th>
                            <th style={{minWidth: 80}}>Status</th>
                            <th style={{minWidth: 90}}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTreatmentRows.length === 0 && (
                            <tr>
                              <td colSpan={8} className="tm-empty-row">
                                <i className="fa-solid fa-stethoscope" aria-hidden="true" />
                                <span>No treatments found. Add one using the form on the left.</span>
                              </td>
                            </tr>
                          )}
                          {filteredTreatmentRows.map((item) => {
                            const isIcd = !!(item.icdCode || item.icdUri);
                            const pkgK = item.packageFrom
                              ? item.packageFrom >= 100000
                                ? `₹${(item.packageFrom / 100000).toFixed(1)}L`
                                : `₹${(item.packageFrom / 1000).toFixed(0)}K`
                              : null;

                            return (
                              <tr key={item.id}>
                                {/* Thumbnail */}
                                <td className="tm-thumb-cell">
                                  {item.image
                                    ? <img src={item.image} alt="" className="tm-row-thumb" />
                                    : <span className="tm-row-thumb-ph"><i className="fa-solid fa-stethoscope" aria-hidden="true" /></span>
                                  }
                                </td>

                                {/* Name + description */}
                                <td>
                                  <span className="tm-row-name">{item.title}</span>
                                  {item.description && (
                                    <small className="tm-row-desc">
                                      {item.description.length > 60 ? `${item.description.slice(0, 58)}…` : item.description}
                                    </small>
                                  )}
                                </td>

                                {/* Category */}
                                <td>
                                  <span className="tm-category-pill">{item.category}</span>
                                </td>

                                {/* Code */}
                                <td>
                                  {item.icdCode
                                    ? (
                                      <span className="tm-icd-code">
                                        <i className="fa-solid fa-tag" aria-hidden="true" />
                                        {item.icdCode}
                                      </span>
                                    )
                                    : item.procedureCode && item.procedureCode !== '-'
                                      ? <span className="tm-proc-code">{item.procedureCode}</span>
                                      : <span className="tm-no-code">—</span>
                                  }
                                  {item.icdBrowserUrl && (
                                    <a
                                      href={item.icdBrowserUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="tm-who-link"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      WHO ↗
                                    </a>
                                  )}
                                </td>

                                {/* Package */}
                                <td>
                                  {pkgK
                                    ? <span className="tm-pkg">{pkgK}</span>
                                    : <span className="tm-no-code">—</span>
                                  }
                                </td>

                                {/* Source */}
                                <td>
                                  {isIcd
                                    ? <span className="tm-source-tag icd">ICD-11</span>
                                    : <span className="tm-source-tag manual">Manual</span>
                                  }
                                </td>

                                {/* Status */}
                                <td>
                                  <span className={`tm-status-badge ${(item.status || 'active').toLowerCase()}`}>
                                    <span className="tm-status-dot" aria-hidden="true" />
                                    {item.status || 'Active'}
                                  </span>
                                </td>

                                {/* Actions */}
                                <td>
                                  <div className="tm-actions">
                                    <button
                                      className="tm-action-btn danger"
                                      title="Delete treatment"
                                      type="button"
                                      onClick={() => {
                                        if (window.confirm(`Delete "${item.title}"?`)) deleteTreatment(item);
                                      }}
                                    >
                                      <AdminIcon name="trash" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer count */}
                    {filteredTreatmentRows.length > 0 && (
                      <div className="tm-table-footer">
                        <span>Showing {filteredTreatmentRows.length} of {treatmentRows.length} treatments</span>
                        <div className="tm-footer-pills">
                          <span className="tm-footer-stat">
                            <span className="tm-status-dot active" /> {treatmentRows.filter((t) => t.status === 'Active').length} active
                          </span>
                          <span className="tm-footer-stat icd-stat">
                            <i className="fa-solid fa-tag" aria-hidden="true" /> {treatmentRows.filter((t) => t.icdCode).length} ICD-11
                          </span>
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            )}

            {activeAdminPage === 'ICD-11 Mapping' && (
              <div className="icd-page">

                {/* ── Top status bar ── */}
                <div className="icd-status-bar">
                  <div className="icd-status-kpis">
                    <div className="icd-kpi">
                      <div className="icd-kpi-icon who">
                        <i className="fa-solid fa-earth-americas" aria-hidden="true" />
                      </div>
                      <div>
                        <strong>ICD-11 MMS</strong>
                        <span>WHO 2026 Release</span>
                      </div>
                    </div>
                    <div className="icd-kpi">
                      <div className="icd-kpi-icon results">
                        <i className="fa-solid fa-list-ul" aria-hidden="true" />
                      </div>
                      <div>
                        <strong>{icdLoading ? '…' : icdResults.length}</strong>
                        <span>Search results</span>
                      </div>
                    </div>
                    <div className="icd-kpi">
                      <div className="icd-kpi-icon imported">
                        <i className="fa-solid fa-database" aria-hidden="true" />
                      </div>
                      <div>
                        <strong>{icdTreatmentRows.length}</strong>
                        <span>Imported codes</span>
                      </div>
                    </div>
                    <div className="icd-kpi">
                      <div className={`icd-kpi-icon status${icdLoading ? ' loading' : ''}`}>
                        <i className={`fa-solid ${icdLoading ? 'fa-spinner fa-spin' : 'fa-circle-check'}`} aria-hidden="true" />
                      </div>
                      <div>
                        <strong>{icdLoading ? 'Searching' : 'Ready'}</strong>
                        <span className="icd-status-text">{icdStatus.length > 42 ? icdStatus.slice(0, 40) + '…' : icdStatus}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick-search chips */}
                  <div className="icd-quick-chips">
                    <span>Quick search:</span>
                    {['CABG', 'Knee replacement', 'Cataract', 'Brain tumor', 'Diabetes', 'IVF'].map((q) => (
                      <button
                        key={q}
                        className="icd-chip"
                        type="button"
                        onClick={() => { setIcdSearch(q); setTimeout(() => searchIcdEntries(), 50); }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Main workbench: search left, results center, table below ── */}
                <div className="icd-workbench-grid">

                  {/* ── Search panel ── */}
                  <aside className="icd-search-aside ref-panel">
                    <div className="ref-panel-head icd-search-head">
                      <div>
                        <h2>
                          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                          Search ICD-11
                        </h2>
                        <small>WHO International Classification of Diseases, 11th Revision</small>
                      </div>
                    </div>

                    <form className="icd-search-form-new" onSubmit={searchIcdEntries}>
                      {/* Query input */}
                      <div className="icd-form-field">
                        <label htmlFor="icd-query">
                          <i className="fa-solid fa-stethoscope" aria-hidden="true" /> Diagnosis / Procedure
                        </label>
                        <div className="icd-query-wrap">
                          <input
                            id="icd-query"
                            value={icdSearch}
                            onChange={(e) => setIcdSearch(e.target.value)}
                            placeholder="e.g. coronary bypass, cataract, knee replacement"
                            onKeyDown={(e) => e.key === 'Enter' && searchIcdEntries(e)}
                          />
                          {icdSearch && (
                            <button
                              className="icd-clear-btn"
                              type="button"
                              onClick={() => { setIcdSearch(''); setIcdResults([]); }}
                            >
                              <i className="fa-solid fa-xmark" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Category override */}
                      <div className="icd-form-field">
                        <label htmlFor="icd-cat">
                          <i className="fa-solid fa-folder-open" aria-hidden="true" /> Override Category
                          <span className="icd-optional">(auto-detected if blank)</span>
                        </label>
                        <select
                          id="icd-cat"
                          value={treatmentForm.category}
                          onChange={(e) => setTreatmentForm({ ...treatmentForm, category: e.target.value })}
                        >
                          {[
                            'Auto-detect',
                            'Cardiac Sciences', 'Orthopedics', 'Neurosurgery', 'Oncology',
                            'Gastroenterology', 'Urology', 'Ophthalmology', 'Pulmonology',
                            'Endocrinology', 'Aesthetic', 'Dental', 'ENT',
                            'Obstetrics & Gynecology', 'Pediatrics', 'Wellness', 'IVF Treatment',
                          ].map((c) => <option key={c} value={c === 'Auto-detect' ? '' : c}>{c}</option>)}
                        </select>
                      </div>

                      <button
                        className="icd-search-btn"
                        disabled={icdLoading || icdSearch.trim().length < 2}
                        type="submit"
                      >
                        {icdLoading
                          ? <><i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Searching WHO…</>
                          : <><i className="fa-solid fa-magnifying-glass" aria-hidden="true" /> Search ICD-11</>
                        }
                      </button>
                    </form>

                    {/* How it works */}
                    <div className="icd-how-it-works">
                      <p className="icd-hint-title"><i className="fa-solid fa-circle-info" aria-hidden="true" /> How it works</p>
                      <ol className="icd-steps-list">
                        <li>Enter a diagnosis or procedure name</li>
                        <li>Review WHO-coded matches on the right</li>
                        <li>Click <strong>Import</strong> to add to treatment catalog</li>
                        <li>Imported codes appear in the table below</li>
                        <li>Set hospital cost &amp; Kairacure price inline</li>
                      </ol>
                    </div>
                  </aside>

                  {/* ── Search results panel ── */}
                  <div className="icd-results-panel ref-panel">
                    <div className="ref-panel-head">
                      <h2>
                        <i className="fa-solid fa-list-ul" aria-hidden="true" />
                        WHO Results
                        {icdResults.length > 0 && <span className="icd-result-count">{icdResults.length}</span>}
                      </h2>
                      {icdResults.length > 0 && (
                        <small>Click <strong>Import</strong> to add any entry to the Kairacure treatment catalog</small>
                      )}
                    </div>

                    <div className="icd-result-list-new">
                      {icdLoading && (
                        <div className="icd-searching-state">
                          <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
                          <strong>Querying WHO ICD-11…</strong>
                          <span>Searching MMS release 2026-01</span>
                        </div>
                      )}

                      {!icdLoading && icdResults.length === 0 && (
                        <div className="icd-empty-state-new">
                          <i className="fa-solid fa-earth-americas" aria-hidden="true" />
                          <strong>No results yet</strong>
                          <span>Enter a medical term and click Search to query the WHO ICD-11 database.</span>
                        </div>
                      )}

                      {!icdLoading && icdResults.map((entity, idx) => {
                        const alreadyImported = icdTreatmentRows.some(
                          (r) => r.icdCode === entity.code || r.icdUri === entity.uri
                        );
                        return (
                          <div
                            key={`${entity.uri}-${entity.code}-${idx}`}
                            className={`icd-result-row${alreadyImported ? ' imported' : ''}`}
                          >
                            {/* Code badge */}
                            <div className="icd-result-code">
                              {entity.code
                                ? <span className="icd-code-tag">{entity.code}</span>
                                : <span className="icd-code-tag no-code">—</span>
                              }
                            </div>

                            {/* Title + meta */}
                            <div className="icd-result-body">
                              <strong className="icd-result-title">{entity.title || entity.matchedText}</strong>
                              {entity.matchedText && entity.matchedText !== entity.title && (
                                <span className="icd-result-matched">Match: {entity.matchedText}</span>
                              )}
                              <div className="icd-result-meta">
                                {entity.category && (
                                  <span className="icd-result-cat">{entity.category}</span>
                                )}
                                {entity.browserUrl && (
                                  <a
                                    href={entity.browserUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="icd-who-ref"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    WHO ↗
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Import / imported indicator */}
                            <div className="icd-result-action">
                              {alreadyImported
                                ? <span className="icd-imported-badge">
                                    <i className="fa-solid fa-circle-check" aria-hidden="true" /> Imported
                                  </span>
                                : <button
                                    className="icd-import-btn"
                                    onClick={() => importIcdTreatment(entity)}
                                    type="button"
                                  >
                                    <i className="fa-solid fa-file-import" aria-hidden="true" /> Import
                                  </button>
                              }
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Imported treatments table (full width below) ── */}
                <section className="icd-catalog-section ref-panel">
                  <div className="ref-panel-head icd-catalog-head">
                    <div>
                      <h2>
                        <i className="fa-solid fa-database" aria-hidden="true" /> Imported ICD-11 Catalog
                      </h2>
                      <small>{icdTreatmentRows.length} coded treatment{icdTreatmentRows.length !== 1 ? 's' : ''} — edit costs inline</small>
                    </div>
                    <div className="icd-catalog-head-actions">
                      <div className="icd-table-search">
                        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                        <input
                          placeholder="Filter imported treatments…"
                          value={adminTableFilters.search}
                          onChange={(e) => setAdminTableFilters({ ...adminTableFilters, search: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="icd-catalog-table-wrap">
                    <table className="icd-catalog-table">
                      <thead>
                        <tr>
                          <th style={{minWidth: 110}}>ICD Code</th>
                          <th style={{minWidth: 220}}>Treatment / Procedure</th>
                          <th style={{minWidth: 160}}>Category</th>
                          <th style={{minWidth: 160}}>Hospital Cost (INR)</th>
                          <th style={{minWidth: 160}}>Kairacure Price (INR)</th>
                          <th style={{minWidth: 80}}>Margin</th>
                          <th style={{minWidth: 80}}>Status</th>
                          <th style={{minWidth: 90}}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {icdTreatmentRows.length === 0 && (
                          <tr>
                            <td colSpan={8} className="icd-catalog-empty">
                              <i className="fa-solid fa-database" aria-hidden="true" />
                              <strong>No ICD-11 treatments imported yet</strong>
                              <span>Use the Search panel above to find and import WHO-coded procedures.</span>
                            </td>
                          </tr>
                        )}
                        {icdTreatmentRows.map((item) => {
                          const hospCost = Number(item.hospitalCost) || 0;
                          const kairPrice = Number(item.kairacurePrice) || 0;
                          const margin = hospCost && kairPrice
                            ? Math.round(((kairPrice - hospCost) / kairPrice) * 100)
                            : null;
                          const marginColor = margin === null ? '' : margin >= 20 ? 'margin-good' : margin >= 10 ? 'margin-ok' : 'margin-low';

                          return (
                            <tr key={item.id}>
                              {/* ICD Code */}
                              <td>
                                <div className="icd-cat-code-cell">
                                  <span className="icd-cat-code">{item.icdCode || item.procedureCode || '—'}</span>
                                  {item.icdBrowserUrl && (
                                    <a href={item.icdBrowserUrl} target="_blank" rel="noopener noreferrer" className="icd-cat-who-link">
                                      <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
                                    </a>
                                  )}
                                </div>
                              </td>

                              {/* Title + description */}
                              <td>
                                <span className="icd-cat-title">{item.title}</span>
                                {item.description && (
                                  <small className="icd-cat-desc">
                                    {item.description.length > 55 ? `${item.description.slice(0, 53)}…` : item.description}
                                  </small>
                                )}
                              </td>

                              {/* Category */}
                              <td>
                                <span className="icd-cat-badge">{item.category}</span>
                              </td>

                              {/* Hospital Cost — inline editable */}
                              <td>
                                <div className="icd-cost-cell">
                                  <span className="icd-cost-prefix">₹</span>
                                  <input
                                    type="number"
                                    className="icd-cost-input"
                                    placeholder="0"
                                    defaultValue={hospCost || ''}
                                    min="0"
                                    onBlur={(e) => updateTreatmentCost(item, { hospitalCost: Number(e.target.value) || 0 })}
                                  />
                                </div>
                              </td>

                              {/* Kairacure Price — inline editable */}
                              <td>
                                <div className="icd-cost-cell">
                                  <span className="icd-cost-prefix">₹</span>
                                  <input
                                    type="number"
                                    className="icd-cost-input kairacure"
                                    placeholder="0"
                                    defaultValue={kairPrice || ''}
                                    min="0"
                                    onBlur={(e) => updateTreatmentCost(item, { kairacurePrice: Number(e.target.value) || 0 })}
                                  />
                                </div>
                              </td>

                              {/* Margin */}
                              <td>
                                {margin !== null
                                  ? <span className={`icd-margin-badge ${marginColor}`}>{margin}%</span>
                                  : <span className="icd-margin-empty">—</span>
                                }
                              </td>

                              {/* Status */}
                              <td>
                                <span className={`tm-status-badge ${(item.status || 'active').toLowerCase()}`}>
                                  <span className="tm-status-dot" />
                                  {item.status || 'Active'}
                                </span>
                              </td>

                              {/* Actions */}
                              <td>
                                <button
                                  className="tm-action-btn danger"
                                  title={`Delete ${item.title}`}
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Delete "${item.title}"?`)) deleteTreatment(item);
                                  }}
                                >
                                  <AdminIcon name="trash" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {icdTreatmentRows.length > 0 && (
                    <div className="icd-catalog-footer">
                      <span>{icdTreatmentRows.length} ICD-11 coded treatment{icdTreatmentRows.length !== 1 ? 's' : ''} imported</span>
                      <span className="icd-footer-note">
                        <i className="fa-solid fa-circle-info" aria-hidden="true" />
                        Click cost fields to edit inline — changes save on blur
                      </span>
                    </div>
                  )}
                </section>
              </div>
            )}
            
            {activeAdminPage === 'Journey Plans' && (
              <div className="jp-page">

                {/* ── KPI Strip ── */}
                <div className="jp-kpi-strip">
                  {[
                    { label: 'Total Plans',   value: journeyPlanRows.length,                                                   icon: 'fa-route',          cls: 'blue'   },
                    { label: 'Calculated',    value: journeyPlanRows.filter(p => p.status === 'calculated').length,            icon: 'fa-calculator',     cls: 'purple' },
                    { label: 'Confirmed',     value: journeyPlanRows.filter(p => p.status === 'confirmed').length,             icon: 'fa-circle-check',   cls: 'green'  },
                    { label: 'In Progress',   value: journeyPlanRows.filter(p => p.status === 'in-progress').length,           icon: 'fa-spinner',        cls: 'teal'   },
                    { label: 'Total Est. (₹)',value: `₹${(journeyPlanRows.reduce((s, p) => s + (p.totalCost || 0), 0) / 100000).toFixed(1)}L`, icon: 'fa-indian-rupee-sign', cls: 'gold' },
                  ].map(k => (
                    <div key={k.label} className={`jp-kpi jp-kpi-${k.cls}`}>
                      <i className={`fa-solid ${k.icon}`} aria-hidden="true" />
                      <div><strong>{k.value}</strong><span>{k.label}</span></div>
                    </div>
                  ))}
                </div>

                {/* ── Table ── */}
                <section className="jp-table-panel ref-panel">
                  <div className="ref-panel-head jp-head">
                    <div>
                      <h2><i className="fa-solid fa-route" aria-hidden="true" /> Patient Journey Plans</h2>
                      <small>{journeyPlanRows.length} plan{journeyPlanRows.length !== 1 ? 's' : ''} submitted from planner</small>
                    </div>
                    <div className="jp-head-actions">
                      <div className="jp-search-box">
                        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                        <input
                          placeholder="Search by patient, hospital, treatment…"
                          value={adminTableFilters.search}
                          onChange={e => setAdminTableFilters({ ...adminTableFilters, search: e.target.value })}
                        />
                      </div>
                      <select
                        className="jp-status-filter"
                        value={adminTableFilters.status || 'All'}
                        onChange={e => setAdminTableFilters({ ...adminTableFilters, status: e.target.value })}
                      >
                        <option value="All">All statuses</option>
                        {['calculated','confirmed','in-progress','completed','cancelled'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="jp-table-wrap">
                    <table className="jp-table">
                      <thead>
                        <tr>
                          <th style={{minWidth:120}}>Plan ID</th>
                          <th style={{minWidth:170}}>Patient</th>
                          <th style={{minWidth:180}}>Hospital</th>
                          <th style={{minWidth:180}}>Treatments</th>
                          <th style={{minWidth:230}}>Route</th>
                          <th style={{minWidth:160}}>Cost Breakdown</th>
                          <th style={{minWidth:100}}>ICD Codes</th>
                          <th style={{minWidth:140}}>Status</th>
                          <th style={{minWidth:100}}>Submitted</th>
                          <th style={{minWidth:80}}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {journeyPlanRows.length === 0 && (
                          <tr>
                            <td colSpan={10} className="jp-empty-row">
                              <i className="fa-solid fa-route" aria-hidden="true" />
                              <strong>No journey plans yet</strong>
                              <span>Plans submitted by users through the planner will appear here automatically.</span>
                            </td>
                          </tr>
                        )}
                        {journeyPlanRows
                          .filter(plan => {
                            const q = (adminTableFilters.search || '').toLowerCase();
                            const matchSearch = !q || `${plan.userName} ${plan.userId} ${plan.selectedHospital} ${plan.selectedTreatments.join(' ')} ${plan.userLocation}`.toLowerCase().includes(q);
                            const matchStatus = !adminTableFilters.status || adminTableFilters.status === 'All' || plan.status === adminTableFilters.status;
                            return matchSearch && matchStatus;
                          })
                          .map((plan) => {
                            const travelIcon = plan.travelMode === 'flight' ? 'fa-plane' : plan.travelMode === 'train' ? 'fa-train' : 'fa-bus';
                            const statusCls = (plan.status || 'calculated').toLowerCase().replace(/\s+/g, '-');
                            const costs = plan.costs || {};
                            const submittedDate = plan.submittedAt || plan.createdAt
                              ? new Date(plan.submittedAt || plan.createdAt).toLocaleDateString('en-IN', { dateStyle: 'short' })
                              : '—';

                            return (
                              <tr key={plan.id} className="jp-row">
                                {/* Plan ID */}
                                <td>
                                  <span className="jp-plan-id">{plan.id}</span>
                                </td>

                                {/* Patient */}
                                <td>
                                  <div className="jp-patient-cell">
                                    <div className="jp-avatar">{(plan.userName || 'P')[0].toUpperCase()}</div>
                                    <div>
                                      <span className="jp-patient-name">{plan.userName || '—'}</span>
                                      {plan.userId && <a href={`mailto:${plan.userId}`} className="jp-patient-email">{plan.userId}</a>}
                                    </div>
                                  </div>
                                </td>

                                {/* Hospital */}
                                <td>
                                  <span className="jp-hospital-name">{plan.selectedHospital || '—'}</span>
                                  {plan.hospitalLocation && <small className="jp-hospital-loc"><i className="fa-solid fa-location-dot" aria-hidden="true" /> {plan.hospitalLocation}</small>}
                                </td>

                                {/* Treatments */}
                                <td>
                                  <div className="jp-treatments">
                                    {plan.selectedTreatments.slice(0, 2).map((t, i) => (
                                      <span key={i} className="jp-treatment-tag">{t}</span>
                                    ))}
                                    {plan.selectedTreatments.length > 2 && (
                                      <span className="jp-treatment-more">+{plan.selectedTreatments.length - 2}</span>
                                    )}
                                    {plan.selectedTreatments.length === 0 && <span className="jp-na">—</span>}
                                  </div>
                                </td>

                                {/* Route */}
                                <td>
                                  <div className="jp-route-cell">
                                    <div className="jp-route-line">
                                      <i className="fa-solid fa-home" aria-hidden="true" />
                                      <span className="jp-route-place">{plan.userLocation || '—'}</span>
                                      <i className={`fa-solid ${travelIcon} jp-route-arrow`} aria-hidden="true" />
                                      <i className="fa-solid fa-hospital" aria-hidden="true" />
                                      <span className="jp-route-place">{plan.hospitalLocation || '—'}</span>
                                    </div>
                                    <div className="jp-route-meta">
                                      {plan.distance > 0 && <span>{plan.distance} km</span>}
                                      {plan.stayDuration > 0 && <span>{plan.stayDuration}d stay</span>}
                                      {plan.companionCount > 0 && <span>{plan.companionCount + 1} travelers</span>}
                                      <span className="jp-hotel-cat">{plan.hotelCategory}</span>
                                    </div>
                                  </div>
                                </td>

                                {/* Cost Breakdown */}
                                <td>
                                  <div className="jp-cost-total">₹{(plan.totalCost || 0).toLocaleString('en-IN')}</div>
                                  {costs.treatment > 0 && (
                                    <div className="jp-cost-breakdown">
                                      <span><i className="fa-solid fa-stethoscope" aria-hidden="true" /> ₹{(costs.treatment / 1000).toFixed(0)}K</span>
                                      {costs.travel > 0 && <span><i className={`fa-solid ${travelIcon}`} aria-hidden="true" /> ₹{(costs.travel / 1000).toFixed(0)}K</span>}
                                      {costs.hotel > 0 && <span><i className="fa-solid fa-bed" aria-hidden="true" /> ₹{(costs.hotel / 1000).toFixed(0)}K</span>}
                                    </div>
                                  )}
                                </td>

                                {/* ICD Codes */}
                                <td>
                                  <div className="jp-icd-list">
                                    {plan.icdCodes.length > 0
                                      ? plan.icdCodes.map((code, i) => (
                                        <span key={i} className="jp-icd-badge">{code}</span>
                                      ))
                                      : <span className="jp-na">—</span>
                                    }
                                  </div>
                                </td>

                                {/* Status — editable */}
                                <td>
                                  <select
                                    className={`jp-status-select jp-status-${statusCls}`}
                                    value={plan.status}
                                    onChange={e => updateJourneyPlanStatus(plan, e.target.value)}
                                  >
                                    {['calculated','confirmed','in-progress','completed','cancelled'].map(s => (
                                      <option key={s}>{s}</option>
                                    ))}
                                  </select>
                                </td>

                                {/* Submitted */}
                                <td>
                                  <span className="jp-date">{submittedDate}</span>
                                </td>

                                {/* Action */}
                                <td>
                                  {plan.userId && (
                                    <a
                                      href={`mailto:${plan.userId}?subject=Kairacure%20Journey%20Plan%20Update`}
                                      className="jp-action-btn"
                                      title="Email patient"
                                    >
                                      <i className="fa-solid fa-envelope" aria-hidden="true" />
                                    </a>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>

                  {journeyPlanRows.length > 0 && (
                    <div className="jp-table-footer">
                      <span>
                        {journeyPlanRows.filter(p => p.status !== 'cancelled').length} active plans ·
                        Total estimated value: ₹{(journeyPlanRows.filter(p => p.status !== 'cancelled').reduce((s, p) => s + (p.totalCost || 0), 0) / 100000).toFixed(1)}L
                      </span>
                      <span className="jp-footer-note">
                        <i className="fa-solid fa-circle-info" aria-hidden="true" />
                        Plans submitted live from the patient planner
                      </span>
                    </div>
                  )}
                </section>
              </div>
            )}
            
            {activeAdminPage === 'Surgery Costing' && (
              <div className="admin-section-grid">
                <form className="ref-panel admin-page-form" onSubmit={saveSurgeryCosting}>
                  <div className="ref-panel-head"><h2>Add Surgery Costing</h2><small>Tentative hospital and Kairacure pricing</small></div>
                  <div className="ref-form-grid expanded">
                    <label>Category<select onChange={(event) => setSurgeryForm({ ...surgeryForm, category: event.target.value })} value={surgeryForm.category}>{['Cardiac Surgery', 'Orthopedics', 'Neurosurgery', 'Gastroenterology', 'Urology', 'Oncology'].map((item) => <option key={item}>{item}</option>)}</select></label>
                    <label>Surgery Name<input onChange={(event) => setSurgeryForm({ ...surgeryForm, surgery: event.target.value })} placeholder="CABG surgery" value={surgeryForm.surgery} /></label>
                    <label>Procedure Code<input onChange={(event) => setSurgeryForm({ ...surgeryForm, procedureCode: event.target.value })} placeholder="CARD-CABG-001" value={surgeryForm.procedureCode} /></label>
                    <label>Hospital<select onChange={(event) => setSurgeryForm({ ...surgeryForm, hospital: event.target.value })} value={surgeryForm.hospital}><option value="">Select hospital</option>{adminHospitals.map((item) => <option key={item.id}>{item.name}</option>)}</select></label>
                    <label>Hospital Cost INR<input onChange={(event) => setSurgeryForm({ ...surgeryForm, hospitalCostInr: event.target.value })} type="number" value={surgeryForm.hospitalCostInr} /></label>
                    <label>Kairacure Price INR<input onChange={(event) => setSurgeryForm({ ...surgeryForm, KairacurePriceInr: event.target.value })} type="number" value={surgeryForm.KairacurePriceInr} /></label>
                  </div>
                  <div className="ref-form-actions"><button type="submit">Save Costing</button></div>
                </form>
                <section className="ref-panel ref-table-panel"><div className="ref-panel-head"><h2>Surgery Costing Records</h2><small>{filteredCostingRows.length} of {costingRows.length}</small></div><div className="ref-table-wrap"><table className="ref-table"><thead><tr><th>Category</th><th>Surgery</th><th>Code</th><th>Hospital Cost</th><th>Kairacure Price</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filteredCostingRows.map((row) => <tr key={row.id || row.code}><td>{row.category}</td><td>{row.surgery}</td><td>{row.code}</td><td>{row.hospitalCost.toLocaleString('en-IN')}</td><td>{row.KairacurePrice.toLocaleString('en-IN')}</td><td><span className="status-pill active">{row.status}</span></td><td className="admin-actions-cell"><button className="table-icon" onClick={() => editCostingRow(row)} type="button"><AdminIcon name="edit" /></button><button className="table-icon danger" onClick={() => confirmDeleteCostingRow(row)} type="button"><AdminIcon name="trash" /></button></td></tr>)}</tbody></table></div></section>
              </div>
            )}

            {activeAdminPage === 'Doctors' && (
              <div className="admin-section-grid doctor-admin-grid">
                {/* CSV/Excel Upload Section for Doctors */}
                <section className="ref-panel ref-upload-card doctor-upload-section">
                  <div className="ref-panel-head">
                    <h2>Upload Doctor Database</h2>
                    <small>Upload CSV or Excel file with doctor profiles mapped to hospitals</small>
                  </div>
                  <label className="ref-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
                    event.preventDefault();
                    const file = event.dataTransfer.files[0];
                    if (file) handleUploadFile({ target: { files: [file] } });
                  }}>
                    <input accept=".csv,.xlsx,.xls" onChange={handleUploadFile} type="file" />
                    <AdminIcon name="cloud" />
                    <strong>{uploadName || 'Drag & drop CSV/Excel file here'}</strong>
                    <span>Choose File</span>
                    <small>Supports doctor profiles with hospital mapping</small>
                  </label>
                  <div className="sample-csv-preview">
                    <strong>Sample CSV format for Doctors</strong>
                    <div>
                      <code>Doctor Name | Designation | Hospital | Specialty | Experience | Rating | Consultation Fee | Profile Image URL | About | Treatments | Status</code>
                      <code>Example: Dr. Rohan Malhotra | Senior Cardiologist | Max Hospital | Cardiology | 18 years | 4.8 | 50 | https://... | Profile text | CABG, Valve | Active</code>
                    </div>
                  </div>
                  {uploadStatus && <small className="upload-status-message">{uploadStatus}</small>}
                </section>

                <form className="ref-panel admin-page-form doctor-admin-form" onSubmit={saveDoctor}>
                  <div className="ref-panel-head"><h2>{editingDoctorId ? 'Edit Doctor' : 'Add Doctor'}</h2><small>Hospital + treatment based profile</small></div>
                  <div className="doctor-form-spotlight">
                    {doctorForm.profileImage ? <img alt="" src={doctorForm.profileImage} /> : <span style={{ background: '#dbeafe', color: '#0d2f5d', fontSize: '2rem' }}><AdminIcon name="doctor" /></span>}
                    <div>
                      <strong>{doctorForm.name || 'New doctor profile'}</strong>
                      <small>{doctorForm.title || 'Designation'} · {doctorForm.hospital || 'Select hospital'}</small>
                    </div>
                    <em>{doctorForm.rating || '4.8'} rating</em>
                  </div>
                  <div className="ref-form-grid expanded">
                    <div className="doctor-form-section wide"><strong>Basic Profile</strong><span>Identity, role, experience and review status.</span></div>
                    <label>Doctor ID<input onChange={(event) => setDoctorForm({ ...doctorForm, id: event.target.value })} placeholder="DOC-00078" value={doctorForm.id} /></label>
                    <label>Doctor Name<input onChange={(event) => setDoctorForm({ ...doctorForm, name: event.target.value })} placeholder="Dr. Rohan Malhotra" value={doctorForm.name} /></label>
                    <label>Designation<input onChange={(event) => setDoctorForm({ ...doctorForm, title: event.target.value })} placeholder="Cardiothoracic Surgeon" value={doctorForm.title} /></label>
                    <label>Experience<input onChange={(event) => setDoctorForm({ ...doctorForm, experience: event.target.value })} placeholder="18 years" value={doctorForm.experience} /></label>
                    <label>Rating<input max="5" min="1" onChange={(event) => setDoctorForm({ ...doctorForm, rating: event.target.value })} step="0.1" type="number" value={doctorForm.rating} /></label>
                    <label>Consultation Fee<input onChange={(event) => setDoctorForm({ ...doctorForm, consultationFee: event.target.value })} placeholder="45" type="number" value={doctorForm.consultationFee} /></label>
                    <label>Status<select onChange={(event) => setDoctorForm({ ...doctorForm, status: event.target.value })} value={doctorForm.status}>{['Active', 'Review', 'Hidden', 'Locked'].map((status) => <option key={status}>{status}</option>)}</select></label>
                    <div className="doctor-form-section wide"><strong>Hospital & Treatment Mapping</strong><span>Select the hospital first to auto-fill specialty and treatment coverage.</span></div>
                    <label>Hospital<select onChange={(event) => {
                      const selected = adminHospitals.find((hospital) => hospital.name === event.target.value);
                      setDoctorForm({
                        ...doctorForm,
                        hospital: event.target.value,
                        specialty: selected?.specialty || doctorForm.specialty,
                        treatments: selected?.tags?.join(', ') || selected?.treatments || doctorForm.treatments,
                      });
                    }} value={doctorForm.hospital}><option value="">Select hospital</option>{adminHospitals.map((hospital) => <option key={hospital.id}>{hospital.name}</option>)}</select></label>
                    <label>Specialty<select onChange={(event) => setDoctorForm({ ...doctorForm, specialty: event.target.value })} value={doctorForm.specialty}>{Array.from(new Set([...HOSPITALS.map((hospital) => hospital.specialty), ...treatmentRows.map((item) => item.category)])).map((item) => <option key={item}>{item}</option>)}</select></label>
                    <label className="wide">Treatments<input onChange={(event) => setDoctorForm({ ...doctorForm, treatments: event.target.value })} placeholder="Cardiac Sciences, CABG, Valve repair" value={doctorForm.treatments} /></label>
                    <div className="doctor-form-section wide"><strong>Profile Image</strong><span>Add the image used in doctor listing and profile previews.</span></div>
                    <label className="wide">Profile Image URL<input onChange={(event) => setDoctorForm({ ...doctorForm, profileImage: event.target.value })} placeholder="https://doctor-image.jpg" value={doctorForm.profileImage} /></label>
                    <label className="admin-file-field">Upload Profile Image<input accept="image/*" onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) setDoctorForm({ ...doctorForm, profileImage: URL.createObjectURL(file) });
                      event.target.value = '';
                    }} type="file" /><span><AdminIcon name="cloud" /> Choose profile image</span></label>
                    <div className="admin-image-preview doctor-preview wide">
                      {doctorForm.profileImage ? <img alt="Doctor profile preview" src={doctorForm.profileImage} /> : <strong>No profile image selected</strong>}
                      <span>{doctorForm.name || 'Doctor profile'}<small>{doctorForm.title || 'Designation'}</small></span>
                    </div>
                    <div className="doctor-form-section wide"><strong>Doctor Detail Content</strong><span>Information shown on doctor detail pages and admin tables.</span></div>
                    <label className="wide">About Doctor<textarea onChange={(event) => setDoctorForm({ ...doctorForm, about: event.target.value })} placeholder="Short profile shown on doctor detail page" rows="4" value={doctorForm.about} /></label>
                    <label className="wide">Checklist<textarea onChange={(event) => setDoctorForm({ ...doctorForm, checklist: event.target.value })} placeholder="One checklist point per line" rows="4" value={doctorForm.checklist} /></label>
                    <label className="wide">Medical Problems / Focus Areas<textarea onChange={(event) => setDoctorForm({ ...doctorForm, focusAreas: event.target.value })} placeholder="CABG&#10;Valve repair&#10;Angioplasty" rows="4" value={doctorForm.focusAreas} /></label>
                    <label className="wide">Education & Training<textarea onChange={(event) => setDoctorForm({ ...doctorForm, education: event.target.value })} placeholder="MBBS&#10;MS Surgery&#10;Fellowship" rows="4" value={doctorForm.education} /></label>
                    <div className="doctor-form-section wide"><strong>User Rating</strong><span>Capture a patient-facing review and rating for this doctor.</span></div>
                    <label>Review Patient<input onChange={(event) => setDoctorForm({ ...doctorForm, reviewName: event.target.value })} placeholder="Verified patient" value={doctorForm.reviewName} /></label>
                    <label>Review Rating<input max="5" min="1" onChange={(event) => setDoctorForm({ ...doctorForm, reviewRating: event.target.value })} step="0.1" type="number" value={doctorForm.reviewRating} /></label>
                    <label className="wide">User Review<textarea onChange={(event) => setDoctorForm({ ...doctorForm, reviewNote: event.target.value })} placeholder="Patient/user rating note" value={doctorForm.reviewNote} /></label>
                  </div>
                  <div className="ref-form-actions">
                    <button onClick={resetDoctorForm} type="button">Cancel</button>
                    <button type="submit">{editingDoctorId ? 'Update Doctor' : 'Save Doctor'}</button>
                  </div>
                </form>
                <section className="ref-panel doctor-records-panel">
                  <div className="ref-panel-head">
                    <h2><i className="fa-solid fa-user-doctor" aria-hidden="true" /> Doctor Records</h2>
                    <small>{filteredDoctorRows.length} of {doctorRows.length} profiles</small>
                  </div>
                  <div className="doctor-admin-summary">
                    <article><span>Active</span><strong>{activeDoctors.length}</strong></article>
                    <article><span>Avg rating</span><strong>{averageDoctorRating}</strong></article>
                    <article><span>User reviews</span><strong>{doctorReviewCount}</strong></article>
                    <article><span>Hospitals mapped</span><strong>{[...new Set(doctorRows.map(d => d.hospital).filter(Boolean))].length}</strong></article>
                  </div>
                  <div className="doctor-table-wrap">
                    <table className="doctor-table">
                      <thead>
                        <tr>
                          <th style={{minWidth:220}}>Doctor</th>
                          <th style={{minWidth:160}}>Hospital</th>
                          <th style={{minWidth:120}}>Specialty</th>
                          <th style={{minWidth:180}}>Treatments</th>
                          <th style={{minWidth:90}}>Experience</th>
                          <th style={{minWidth:80}}>Rating</th>
                          <th style={{minWidth:80}}>Fee</th>
                          <th style={{minWidth:90}}>Status</th>
                          <th style={{minWidth:110}}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDoctorRows.length === 0 && (
                          <tr>
                            <td colSpan={9} style={{textAlign:'center', padding:'48px 24px', color:'#94a3b8'}}>
                              <i className="fa-solid fa-user-doctor" aria-hidden="true" style={{display:'block', fontSize:'2rem', marginBottom:'10px', color:'#cbd5e1'}} />
                              No doctor profiles yet. Add a doctor using the form or upload a CSV.
                            </td>
                          </tr>
                        )}
                        {filteredDoctorRows.map((doctor, index) => {
                          const statusCls = (doctor.status || 'active').toLowerCase();
                          const treatments = Array.isArray(doctor.treatments)
                            ? doctor.treatments
                            : String(doctor.treatments || '').split(',').map(t => t.trim()).filter(Boolean);
                          const initials = (doctor.name || 'Dr').split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();

                          return (
                            <tr key={`${doctor.id}-${index}`}>
                              {/* Doctor identity */}
                              <td>
                                <div className="doctor-id-cell">
                                  {doctor.profileImage
                                    ? <img src={doctor.profileImage} alt="" className="doctor-thumb" />
                                    : <span className="doctor-thumb-ph">{initials}</span>
                                  }
                                  <div>
                                    <span className="doctor-name-text">{doctor.name}</span>
                                    <span className="doctor-title-text">{doctor.title || doctor.specialty}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Hospital */}
                              <td>
                                {doctor.hospital
                                  ? <span className="doctor-hospital-badge">{doctor.hospital}</span>
                                  : <span style={{color:'#cbd5e1'}}>—</span>
                                }
                              </td>

                              {/* Specialty */}
                              <td>
                                <span className="doctor-specialty-text">{doctor.specialty || '—'}</span>
                              </td>

                              {/* Treatments */}
                              <td>
                                <div className="doctor-treatment-tags">
                                  {treatments.slice(0,2).map((t,i) => (
                                    <span key={i} className="doctor-treatment-tag">{t}</span>
                                  ))}
                                  {treatments.length > 2 && (
                                    <span className="doctor-treatment-more">+{treatments.length - 2}</span>
                                  )}
                                  {treatments.length === 0 && <span style={{color:'#cbd5e1', fontSize:'0.8rem'}}>—</span>}
                                </div>
                              </td>

                              {/* Experience */}
                              <td>
                                <span style={{fontSize:'0.82rem', color:'#475569', fontWeight:600}}>{doctor.experience || '—'}</span>
                              </td>

                              {/* Rating */}
                              <td>
                                {doctor.rating
                                  ? <div className="doctor-rating-cell">
                                      <i className="fa-solid fa-star" aria-hidden="true" />
                                      <span className="doctor-rating-val">{doctor.rating}</span>
                                    </div>
                                  : <span style={{color:'#cbd5e1'}}>—</span>
                                }
                              </td>

                              {/* Fee */}
                              <td>
                                {doctor.consultationFee
                                  ? <span style={{fontWeight:700, color:'#0f172a', fontSize:'0.82rem'}}>₹{Number(doctor.consultationFee).toLocaleString('en-IN')}</span>
                                  : <span style={{color:'#cbd5e1'}}>—</span>
                                }
                              </td>

                              {/* Status */}
                              <td>
                                <span className={`doctor-status-badge ${statusCls}`}>
                                  <span className="doctor-status-dot" />
                                  {doctor.status || 'Active'}
                                </span>
                              </td>

                              {/* Actions */}
                              <td>
                                <div className="doctor-actions">
                                  <button
                                    className="doctor-action-btn"
                                    onClick={() => editDoctor(doctor)}
                                    type="button"
                                    title="Edit doctor"
                                  >
                                    <AdminIcon name="edit" /> Edit
                                  </button>
                                  <button
                                    className="doctor-action-btn danger"
                                    onClick={() => confirmDeleteDoctor(doctor)}
                                    type="button"
                                    title="Delete doctor"
                                  >
                                    <AdminIcon name="trash" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {filteredDoctorRows.length > 0 && (
                    <div className="doctor-table-footer">
                      <span>Showing {filteredDoctorRows.length} of {doctorRows.length} doctors</span>
                      <span>{[...new Set(doctorRows.map(d => d.hospital).filter(Boolean))].length} hospitals mapped · {activeDoctors.length} active</span>
                    </div>
                  )}
                </section>
              </div>
            )}

            {['Upload CSV / Excel', 'Patient inquiries', 'Consultation stages', 'Appointments', 'Agents', 'Reports', 'Audit Logs', 'Settings', 'Users & Roles'].includes(activeAdminPage) && (
              <div className="admin-section-grid single">
                {activeAdminPage === 'Upload CSV / Excel' && (
                  <>
                    <section className="ref-panel ref-upload-card page-card">
                      <div className="ref-panel-head">
                        <h2>Upload Master Data</h2>
                        <small>Hospital master CSV or accreditation type CSV</small>
                      </div>
                      <label className="ref-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={handleUploadDrop}>
                        <input accept=".csv" onChange={handleUploadFile} type="file" />
                        <AdminIcon name="cloud" />
                        <strong>{uploadName || 'Drag & drop CSV file here'}</strong>
                        <span>Choose CSV</span>
                        <small>Detected rows are saved into admin records and public hospital data where applicable.</small>
                      </label>
                      <div className="sample-csv-preview full">
                        <strong>Supported CSV formats</strong>
                        <div>
                          <code>Hospital DB: S-No | Location | Hospital Name | Address 1 | Founded Year | Speciality | NABH Type | JCI | No of Beds | International Patient Wing | Phone No | Contact Person | Mobile No | Email Address | Website | LinkedIn</code>
                          <code>Optional enrichment: Doctors List | Hospital Images | Facilities | Address 2 | Address 3</code>
                          <code>S-No | Type | Description | Eligibility | Logo Reference | Annual Fee</code>
                        </div>
                      </div>
                      <div className="recent-uploads">
                        {recentUploads.map((upload) => (
                          <article key={upload.fileName}>
                            <span>{upload.type}</span>
                            <div><b>{upload.fileName}</b><small>{upload.date}</small></div>
                            <em>Processed</em>
                            {upload.recordId && (
                              <button
                                className="table-icon danger"
                                onClick={() => confirmDeleteImportRecord(upload)}
                                title="Delete import record"
                                type="button"
                              >
                                <AdminIcon name="trash" />
                              </button>
                            )}
                          </article>
                        ))}
                      </div>
                    </section>
                    <section className="ref-panel ref-table-panel">
                      <div className="ref-panel-head"><h2>Accreditation Master</h2><small>{accreditationRows.length} records</small></div>
                      <div className="ref-table-wrap">
                        <table className="ref-table compact-table">
                          <thead><tr><th>S-No</th><th>Type</th><th>Description</th><th>Eligibility</th><th>Annual Fee</th><th>Status</th></tr></thead>
                          <tbody>{accreditationRows.map((item) => (
                            <tr key={item.id}>
                              <td>{item.serialNumber}</td>
                              <td>{item.type}</td>
                              <td>{item.title}</td>
                              <td>{item.eligibility}</td>
                              <td>{item.annualFee}</td>
                              <td><span className="status-pill active">{item.status}</span></td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    </section>
                  </>
                )}
                {activeAdminPage === 'Patient inquiries' && <section className="ref-panel ref-table-panel"><div className="ref-panel-head"><h2>Patient Inquiry Flow</h2><small>{filteredInquiryRows.length} of {inquiryRows.length} cases</small></div><div className="ref-table-wrap"><table className="ref-table compact-table"><thead><tr><th>ID</th><th>Patient</th><th>Country</th><th>Treatment</th><th>Stage</th></tr></thead><tbody>{filteredInquiryRows.map((item) => <tr key={item.id}><td>{item.id}</td><td>{item.patient}</td><td>{item.country}</td><td>{item.treatment}</td><td><span className="status-pill blue">{item.stage}</span></td></tr>)}</tbody></table></div></section>}
                {false && activeAdminPage === 'Patient Records' && (
                  <div className="pr-page">
                    {/* KPI strip */}
                    <div className="pr-kpi-strip">
                      {[
                        { label: 'Total Leads',    value: patientRecordRows.length,                                                                icon: 'fa-users',          color: 'blue'   },
                        { label: 'Active',          value: patientRecordRows.filter(p => p.status === 'Active').length,                             icon: 'fa-circle-check',   color: 'green'  },
                        { label: 'Reports Received',value: patientRecordRows.filter(p => p.stage === 'Reports received').length,                    icon: 'fa-file-medical',   color: 'purple' },
                        { label: 'Appointments',    value: patientRecordRows.filter(p => p.stage === 'Appointment confirmed').length,               icon: 'fa-calendar-check', color: 'teal'   },
                        { label: 'Completed',       value: patientRecordRows.filter(p => p.stage === 'Completed').length,                          icon: 'fa-trophy',         color: 'gold'   },
                      ].map(kpi => (
                        <div key={kpi.label} className={`pr-kpi pr-kpi-${kpi.color}`}>
                          <i className={`fa-solid ${kpi.icon}`} aria-hidden="true" />
                          <div><strong>{kpi.value}</strong><span>{kpi.label}</span></div>
                        </div>
                      ))}
                    </div>

                    {/* Table panel */}
                    <section className="pr-table-panel ref-panel">
                      <div className="ref-panel-head pr-table-head">
                        <div>
                          <h2><i className="fa-solid fa-database" aria-hidden="true" /> Patient Lead Database</h2>
                          <small>{filteredPatientRecordRows.length} of {patientRecordRows.length} records</small>
                        </div>
                        <div className="pr-head-actions">
                          <div className="pr-search-box">
                            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
                            <input
                              placeholder="Search by name, email, treatment…"
                              value={adminTableFilters.search}
                              onChange={e => setAdminTableFilters({ ...adminTableFilters, search: e.target.value })}
                            />
                          </div>
                          <select
                            className="pr-status-filter"
                            value={adminTableFilters.status || 'All'}
                            onChange={e => setAdminTableFilters({ ...adminTableFilters, status: e.target.value })}
                          >
                            <option value="All">All stages</option>
                            {patientStatusOptions.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="pr-table-wrap">
                        <table className="pr-table">
                          <thead>
                            <tr>
                              <th style={{minWidth:180}}>Patient</th>
                              <th style={{minWidth:190}}>Contact</th>
                              <th style={{minWidth:170}}>Treatment</th>
                              <th style={{minWidth:180}}>Care Stage</th>
                              <th style={{minWidth:200}}>Next Step</th>
                              <th style={{minWidth:140}}>Last Activity</th>
                              <th style={{minWidth:130}}>Status</th>
                              <th style={{minWidth:60}}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPatientRecordRows.length === 0 && (
                              <tr>
                                <td colSpan={8} className="pr-empty-row">
                                  <i className="fa-solid fa-users" aria-hidden="true" />
                                  <span>No patient records yet. Patients appear here after registering or booking an appointment.</span>
                                </td>
                              </tr>
                            )}
                            {filteredPatientRecordRows.map((item) => {
                              const stageIndex = patientStatusOptions.indexOf(item.stage);
                              const progressPct = stageIndex < 0 ? 5 : Math.round(((stageIndex + 1) / patientStatusOptions.length) * 100);
                              const activityTime = item.lastActivity?.at
                                ? new Date(item.lastActivity.at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
                                : item.updatedAt
                                  ? new Date(item.updatedAt).toLocaleDateString('en-IN', { dateStyle: 'short' })
                                  : '—';
                              const statusCls = (item.status || 'active').toLowerCase().replace(/[\s/]+/g, '-');

                              return (
                                <tr key={item.id} className="pr-row">
                                  {/* Patient */}
                                  <td>
                                    <div className="pr-patient-cell">
                                      <div className="pr-avatar">{(item.patient || 'P').slice(0,1).toUpperCase()}</div>
                                      <div>
                                        <span className="pr-patient-name">{item.patient || '—'}</span>
                                        <span className="pr-patient-id">{item.id}</span>
                                        {item.country && <span className="pr-patient-country"><i className="fa-solid fa-globe" aria-hidden="true" /> {item.country}</span>}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Contact */}
                                  <td>
                                    {item.email
                                      ? <a href={`mailto:${item.email}`} className="pr-email">{item.email}</a>
                                      : <span className="pr-na">—</span>
                                    }
                                    {item.phone
                                      ? <a href={`tel:${item.phone}`} className="pr-phone"><i className="fa-solid fa-phone" aria-hidden="true" /> {item.phone}</a>
                                      : <span className="pr-na-small">No phone</span>
                                    }
                                  </td>

                                  {/* Treatment */}
                                  <td>
                                    {item.treatment
                                      ? <span className="pr-treatment-badge">{item.treatment}</span>
                                      : <span className="pr-na">—</span>
                                    }
                                    {item.supportNeed && <small className="pr-support-need">{item.supportNeed}</small>}
                                  </td>

                                  {/* Care Stage */}
                                  <td>
                                    <select
                                      className="pr-stage-select"
                                      value={item.stage}
                                      onChange={e => updatePatientRecordDashboard(item, { dashboard: { stage: e.target.value } })}
                                    >
                                      {patientStatusOptions.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                    <div className="pr-stage-bar">
                                      <div className="pr-stage-fill" style={{width: `${progressPct}%`}} />
                                    </div>
                                    <small className="pr-stage-pct">{progressPct}% complete</small>
                                  </td>

                                  {/* Next Step — inline editable */}
                                  <td>
                                    <input
                                      className="pr-next-step-input"
                                      defaultValue={item.nextStep || ''}
                                      placeholder="Add next action…"
                                      onBlur={e => updatePatientRecordDashboard(item, { dashboard: { nextStep: e.target.value } })}
                                      onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                                    />
                                  </td>

                                  {/* Last Activity */}
                                  <td>
                                    <span className="pr-activity-event">{item.lastActivity?.event || 'No activity'}</span>
                                    <small className="pr-activity-time">{activityTime}</small>
                                  </td>

                                  {/* Status */}
                                  <td>
                                    <select
                                      className={`pr-status-select pr-status-${statusCls}`}
                                      value={item.status}
                                      onChange={e => updatePatientRecordDashboard(item, { status: e.target.value })}
                                    >
                                      {['Active','Review','On hold','Completed','Reports received','Hospital options shared','Doctor opinion','Cost estimate shared','Appointment confirmed'].map(s => <option key={s}>{s}</option>)}
                                    </select>
                                  </td>

                                  {/* Action */}
                                  <td>
                                    <a
                                      href={`mailto:${item.email}?subject=Kairacure%20Care%20Update%20—%20${encodeURIComponent(item.patient || '')}`}
                                      className="pr-action-btn"
                                      title="Email patient"
                                    >
                                      <i className="fa-solid fa-envelope" aria-hidden="true" />
                                    </a>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {filteredPatientRecordRows.length > 0 && (
                        <div className="pr-table-footer">
                          <span>Showing {filteredPatientRecordRows.length} of {patientRecordRows.length} patients</span>
                          <div className="pr-footer-stats">
                            <span className="pr-footer-dot green" /><span>{patientRecordRows.filter(p => p.status === 'Active').length} active</span>
                            <span className="pr-footer-sep" />
                            <span className="pr-footer-dot gold" /><span>{patientRecordRows.filter(p => p.stage === 'Appointment confirmed' || p.stage === 'Completed').length} converted</span>
                          </div>
                        </div>
                      )}
                    </section>
                  </div>
                )}
                {activeAdminPage === 'Consultation stages' && <section className="ref-panel consultation-flow page-card"><div className="ref-panel-head"><h2>Consultation Stages</h2><small>Patient journey tracker</small></div>{ADMIN_STAGES.map((stage, index) => <article key={stage}><span>{index + 1}</span><div><strong>{stage}</strong><small>{['Initial patient intake', 'Reports and history collected', 'Treatment plan and costing shared', 'Hospital preference locked', 'Appointment or admission confirmed', 'Treatment completed'][index]}</small></div><b>{[128, 86, 52, 31, 18, 76][index]}</b></article>)}</section>}
                {activeAdminPage === 'Appointments' && (
                  <div className="appointment-admin-grid">
                    <form className="ref-panel admin-page-form appointment-editor" onSubmit={saveAppointment}>
                      <div className="ref-panel-head"><h2>{editingAppointmentId ? 'Edit Appointment' : 'Add Appointment'}</h2><small>{dbStatus}</small></div>
                      <div className="ref-form-grid expanded">
                        <label>Appointment ID<input onChange={(event) => setAppointmentForm({ ...appointmentForm, id: event.target.value })} placeholder="APT-2025-0100" value={appointmentForm.id} /></label>
                        <label>Patient Name<input onChange={(event) => setAppointmentForm({ ...appointmentForm, patient: event.target.value })} placeholder="Patient name" value={appointmentForm.patient} /></label>
                        <label>Phone<input onChange={(event) => setAppointmentForm({ ...appointmentForm, phone: event.target.value })} placeholder="+91 98765 43210" value={appointmentForm.phone} /></label>
                        <label>Country<input onChange={(event) => setAppointmentForm({ ...appointmentForm, country: event.target.value })} placeholder="India" value={appointmentForm.country} /></label>
                        <label>City<input onChange={(event) => setAppointmentForm({ ...appointmentForm, city: event.target.value })} placeholder="Delhi / NCR" value={appointmentForm.city} /></label>
                        <label>Treatment<input onChange={(event) => setAppointmentForm({ ...appointmentForm, treatment: event.target.value })} placeholder="Treatment or surgery" value={appointmentForm.treatment} /></label>
                        <label>Hospital<select onChange={(event) => setAppointmentForm({ ...appointmentForm, hospital: event.target.value })} value={appointmentForm.hospital}><option value="">Select hospital</option>{adminHospitals.map((hospital) => <option key={hospital.id}>{hospital.name}</option>)}</select></label>
                        <label>Doctor<input onChange={(event) => setAppointmentForm({ ...appointmentForm, doctor: event.target.value })} placeholder="Doctor or coordinator" value={appointmentForm.doctor} /></label>
                        <label>Mode<select onChange={(event) => setAppointmentForm({ ...appointmentForm, mode: event.target.value })} value={appointmentForm.mode}>{['Video consult', 'Coordinator call', 'Hospital slot', 'Second opinion', 'Admission desk'].map((mode) => <option key={mode}>{mode}</option>)}</select></label>
                        <label>Date & Time<input onChange={(event) => setAppointmentForm({ ...appointmentForm, dateTime: event.target.value })} placeholder="14 May 2025, 10:30" value={appointmentForm.dateTime} /></label>
                        <label>Source<input onChange={(event) => setAppointmentForm({ ...appointmentForm, source: event.target.value })} placeholder="website / planner" value={appointmentForm.source} /></label>
                        <label>Status<select onChange={(event) => setAppointmentForm({ ...appointmentForm, status: event.target.value })} value={appointmentForm.status}>{['Scheduled', 'Confirmed', 'Pending reports', 'Tentative', 'Rescheduled', 'Completed', 'Cancelled'].map((status) => <option key={status}>{status}</option>)}</select></label>
                        <label className="wide">Patient Notes<textarea onChange={(event) => setAppointmentForm({ ...appointmentForm, notes: event.target.value })} placeholder="Symptoms, reports, patient request, admin note" rows="4" value={appointmentForm.notes} /></label>
                      </div>
                      <div className="ref-form-actions">
                        <button onClick={resetAppointmentForm} type="button">Cancel</button>
                        <button type="submit">{editingAppointmentId ? 'Update Appointment' : 'Save Appointment'}</button>
                      </div>
                    </form>
                    <section className="ref-panel ref-table-panel">
                      <div className="ref-panel-head"><h2>Appointments</h2><small>{filteredAppointmentRows.length} of {appointmentRows.length} scheduled</small></div>
                      <div className="ref-table-wrap"><table className="ref-table compact-table appointments-table"><thead><tr><th>ID</th><th>Patient</th><th>Treatment</th><th>Hospital</th><th>Doctor / Mode</th><th>Date & Time</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filteredAppointmentRows.map((item) => <React.Fragment key={item.id}><tr><td>{item.id}</td><td>{item.patient}<small>{item.phone || 'Phone not added'}</small></td><td>{item.treatment || 'Consultation'}<small>{[item.city, item.country].filter(Boolean).join(', ') || 'Location pending'}</small></td><td>{item.hospital || 'Hospital pending'}</td><td>{item.doctor}<small>{item.mode}</small></td><td>{item.dateTime}</td><td><select className="status-select" onChange={(event) => updateAppointmentStatus(item, event.target.value)} value={item.status}>{['Scheduled', 'Confirmed', 'Pending reports', 'Tentative', 'Rescheduled', 'Completed', 'Cancelled'].map((status) => <option key={status}>{status}</option>)}</select></td><td className="admin-actions-cell"><button className="table-icon" onClick={() => editAppointment(item)} type="button"><AdminIcon name="edit" /></button><button className="table-icon danger" onClick={() => confirmDeleteAppointment(item)} type="button"><AdminIcon name="trash" /></button></td></tr><tr className="appointment-detail-row"><td colSpan="8"><div><span><b>Source:</b> {item.source || 'website'}</span><span><b>Notes:</b> {item.notes || 'No notes submitted'}</span></div></td></tr></React.Fragment>)}</tbody></table></div>
                    </section>
                  </div>
                )}
                {activeAdminPage === 'Agents' && (
                  <div className="agent-admin-grid">
                    <form className="ref-panel admin-page-form agent-editor" onSubmit={saveAgent}>
                      <div className="ref-panel-head"><h2>Add Agent</h2><small>{dbStatus}</small></div>
                      <div className="ref-form-grid expanded">
                        <label>Agent ID<input onChange={(event) => setAgentForm({ ...agentForm, agentId: event.target.value })} placeholder="AGT-00046" value={agentForm.agentId} /></label>
                        <label>Agent Name<input onChange={(event) => setAgentForm({ ...agentForm, agentName: event.target.value })} placeholder="Agent name" value={agentForm.agentName} /></label>
                        <label>Region<input onChange={(event) => setAgentForm({ ...agentForm, region: event.target.value })} placeholder="India / GCC / Africa" value={agentForm.region} /></label>
                        <label>Contact<input onChange={(event) => setAgentForm({ ...agentForm, contact: event.target.value })} placeholder="+91 ..." value={agentForm.contact} /></label>
                        <label>Email<input onChange={(event) => setAgentForm({ ...agentForm, email: event.target.value })} placeholder="agent@Kairacure.com" type="email" value={agentForm.email} /></label>
                        <label>Assigned Inquiries<input onChange={(event) => setAgentForm({ ...agentForm, assignedInquiries: event.target.value })} type="number" value={agentForm.assignedInquiries} /></label>
                        <label>Conversions<input onChange={(event) => setAgentForm({ ...agentForm, conversions: event.target.value })} type="number" value={agentForm.conversions} /></label>
                        <label>Status<select onChange={(event) => setAgentForm({ ...agentForm, status: event.target.value })} value={agentForm.status}>{['Active', 'Review', 'Inactive'].map((status) => <option key={status}>{status}</option>)}</select></label>
                      </div>
                      <div className="ref-form-actions">
                        <button onClick={resetAgentForm} type="button">Clear</button>
                        <button type="submit"><AdminIcon name="plus" /> Save Agent</button>
                      </div>
                    </form>
                    <section className="ref-panel ref-table-panel">
                      <div className="ref-panel-head"><h2>Agent Management</h2><small>{visibleAgentRows.length} agents</small></div>
                      <div className="ref-table-wrap"><table className="ref-table compact-table"><thead><tr><th>ID</th><th>Name</th><th>Region</th><th>Contact</th><th>Email</th><th>Assigned</th><th>Conversions</th><th>Status</th></tr></thead><tbody>{visibleAgentRows.map((agent) => <tr key={`${agent.id}-${agent.email}`}><td>{agent.id}</td><td>{agent.name}</td><td>{agent.region}</td><td>{agent.contact}</td><td>{agent.email}</td><td>{agent.activeCases}</td><td>{agent.conversion}</td><td><span className="status-pill active">{agent.status}</span></td></tr>)}</tbody></table></div>
                    </section>
                  </div>
                )}
                {activeAdminPage === 'Reports' && (
                  <div className="reports-admin-grid">
                    <section className="ref-panel page-card reports-overview-panel">
                      <div className="ref-panel-head"><h2>Analytics & Reports</h2><small>Live admin metrics</small></div>
                      <div className="ref-analytics-panel embedded">{analytics.map(([label, value, note]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</div>
                    </section>
                    <section className="ref-panel report-chart-panel">
                      <div className="ref-panel-head"><h2>Doctors By Hospital</h2><small>Hospital based mapping</small></div>
                      <div className="admin-bar-chart">
                        {hospitalDoctorCounts.map((item) => {
                          const max = Math.max(1, ...hospitalDoctorCounts.map((row) => row.value));
                          return <article key={item.label}><span>{item.label}</span><div><b style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }} /></div><strong>{item.value}</strong></article>;
                        })}
                      </div>
                    </section>
                    <section className="ref-panel report-chart-panel">
                      <div className="ref-panel-head"><h2>Doctors By Treatment</h2><small>Treatment based coverage</small></div>
                      <div className="admin-bar-chart treatment-chart">
                        {treatmentDoctorCounts.map((item) => {
                          const max = Math.max(1, ...treatmentDoctorCounts.map((row) => row.value));
                          return <article key={item.label}><span>{item.label}</span><div><b style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }} /></div><strong>{item.value}</strong></article>;
                        })}
                      </div>
                    </section>
                    <section className="ref-panel backup-panel">
                      <div className="ref-panel-head"><h2>Backup</h2><small>Admin data export / restore</small></div>
                      <div className="backup-actions">
                        <button onClick={downloadBackup} type="button"><AdminIcon name="file" /> Download JSON Backup</button>
                        <label>Restore Backup<input accept="application/json,.json" onChange={restoreBackup} type="file" /></label>
                      </div>
                      <p>Backup includes hospitals, doctors, treatments, surgeries, inquiries, appointments, agents, and admin records.</p>
                    </section>
                  </div>
                )}
                {activeAdminPage === 'Audit Logs' && <section className="ref-panel ref-table-panel"><div className="ref-panel-head"><h2>Audit Logs</h2><small>All admin activities, including platform configurations</small></div><div className="audit-scope-note"><AdminIcon name="audit" /><span>Audit logs cover admin actions across hospitals, doctors, treatments, imports, appointments, role changes, and platform settings. They are not limited to patient-record events.</span></div><div className="ref-table-wrap"><table className="ref-table compact-table"><thead><tr><th>Record</th><th>Type</th><th>Status</th><th>Created By</th><th>Updated</th></tr></thead><tbody>{filteredAdminRecords.map((record) => <tr key={record._id}><td>{record.title}</td><td>{record.recordType}</td><td>{record.status}</td><td>{record.createdBy || 'admin'}</td><td>{String(record.updatedAt || '').slice(0, 16)}</td></tr>)}</tbody></table></div></section>}
                {activeAdminPage === 'Users & Roles' && (
                  <div className="users-roles-grid">
                    <section className="ref-panel role-builder-card">
                      <div className="ref-panel-head"><h2>Role Builder</h2><small>Menu-based admin access</small></div>
                      <form className="role-builder-form" onSubmit={saveAdminRole}>
                        <label>Role Name<input onChange={(event) => setRoleDraft({ ...roleDraft, name: event.target.value })} placeholder="Hospital Operations" value={roleDraft.name} /></label>
                        <div className="menu-access-grid">
                          {adminMenuOptions.map((menu) => (
                            <label key={menu}>
                              <input checked={roleDraft.menus.includes(menu)} onChange={() => toggleRoleMenu(menu)} type="checkbox" />
                              <span>{menu}</span>
                            </label>
                          ))}
                        </div>
                        <button type="submit"><AdminIcon name="plus" /> Save Role</button>
                      </form>
                      <div className="role-chip-list">
                        {adminRoles.map((role) => <button key={role.id} onClick={() => setRoleDraft({ name: role.name, menus: role.menus })} type="button">{role.name}<small>{role.menus.length} menus</small></button>)}
                      </div>
                    </section>
                    <section className="ref-panel user-profile-card">
                      <div className="ref-panel-head"><h2>Create Admin User</h2><small>{userManagementStatus || 'Profile, role, and menu access'}</small></div>
                      <form className="user-profile-form" onSubmit={createAdminUser}>
                        <label>Name<input onChange={(event) => setAdminUserDraft({ ...adminUserDraft, name: event.target.value })} placeholder="Full name" value={adminUserDraft.name} /></label>
                        <label>Email<input onChange={(event) => setAdminUserDraft({ ...adminUserDraft, email: event.target.value })} placeholder="user@kairacure.com" type="email" value={adminUserDraft.email} /></label>
                        <label>Temporary Password<input onChange={(event) => setAdminUserDraft({ ...adminUserDraft, password: event.target.value })} type="password" value={adminUserDraft.password} /></label>
                        <label>Role<select onChange={(event) => selectAdminRole(event.target.value)} value={adminUserDraft.role}><option>Hospital Operations</option><option>Content Admin</option><option>Reporting Admin</option>{adminRoles.map((role) => <option key={role.id}>{role.name}</option>)}</select></label>
                        <label>Department<input onChange={(event) => setAdminUserDraft({ ...adminUserDraft, department: event.target.value })} placeholder="Operations" value={adminUserDraft.department} /></label>
                        <label>Designation<input onChange={(event) => setAdminUserDraft({ ...adminUserDraft, designation: event.target.value })} placeholder="Coordinator" value={adminUserDraft.designation} /></label>
                        <label>Phone<input onChange={(event) => setAdminUserDraft({ ...adminUserDraft, phone: event.target.value })} placeholder="+91 ..." value={adminUserDraft.phone} /></label>
                        <label>Hospital Scope<input onChange={(event) => setAdminUserDraft({ ...adminUserDraft, hospitalScope: event.target.value })} placeholder="All partners / selected hospitals" value={adminUserDraft.hospitalScope} /></label>
                        <div className="menu-access-grid wide">
                          {adminMenuOptions.map((menu) => (
                            <label key={menu}>
                              <input checked={adminUserDraft.menus.includes(menu)} onChange={() => toggleUserMenu(menu)} type="checkbox" />
                              <span>{menu}</span>
                            </label>
                          ))}
                        </div>
                        <button type="submit"><AdminIcon name="users" /> Create User Profile</button>
                      </form>
                    </section>
                    <section className="ref-panel ref-table-panel users-table-card">
                      <div className="ref-panel-head"><h2>Admin Users</h2><small>{adminUsers.length} profiles</small></div>
                      <div className="ref-table-wrap"><table className="ref-table compact-table"><thead><tr><th>User</th><th>Role</th><th>Menus</th><th>Profile</th><th>Status</th></tr></thead><tbody>{adminUsers.map((user) => <tr key={user.id || user.email}><td>{user.name}<small>{user.email}</small></td><td>{user.role}</td><td>{(user.menus || []).slice(0, 4).join(', ')}{(user.menus || []).length > 4 ? '...' : ''}</td><td>{user.profile?.designation || 'Admin'}<small>{user.profile?.department || user.profile?.hospitalScope || 'General access'}</small></td><td><span className={user.active === false ? 'status-pill' : 'status-pill active'}>{user.active === false ? 'Inactive' : 'Active'}</span></td></tr>)}</tbody></table></div>
                    </section>
                    <section className="ref-panel patient-access-policy">
                      <AdminIcon name="lock" />
                      <div><strong>Patient records are not an admin privilege</strong><span>Authorized hospitals can view assigned records and add additional reports. Portal users cannot update or delete patient records from the admin panel.</span></div>
                    </section>
                  </div>
                )}
                {activeAdminPage === 'Settings' && (
                  <div className="settings-admin-grid">
                    <section className="ref-panel settings-card">
                      <div className="ref-panel-head"><h2>Brand & Logo</h2><small>Header identity</small></div>
                      <div className="ref-form-grid expanded">
                        <label>Logo Mark<input maxLength="3" onChange={(event) => updateSiteSetting('logoMark', event.target.value)} value={siteSettings.logoMark} /></label>
                        <label>Brand Name<input onChange={(event) => updateSiteSetting('logoText', event.target.value)} value={siteSettings.logoText} /></label>
                        <label className="wide">Footer Description<textarea onChange={(event) => updateSiteSetting('footerDescription', event.target.value)} rows="4" value={siteSettings.footerDescription} /></label>
                      </div>
                      <div className="site-brand-preview"><span>{siteSettings.logoMark || 'M'}</span><strong>{siteSettings.logoText || BRAND_NAME}</strong></div>
                    </section>
                    <section className="ref-panel settings-card">
                      <div className="ref-panel-head"><h2>Contacts</h2><small>Public contact details</small></div>
                      <div className="ref-form-grid expanded">
                        <label>Email<input onChange={(event) => updateSiteSetting('contactEmail', event.target.value)} type="email" value={siteSettings.contactEmail} /></label>
                        <label>Phone<input onChange={(event) => updateSiteSetting('contactPhone', event.target.value)} value={siteSettings.contactPhone} /></label>
                        <label className="wide">Address<textarea onChange={(event) => updateSiteSetting('contactAddress', event.target.value)} rows="3" value={siteSettings.contactAddress} /></label>
                      </div>
                    </section>
                    <section className="ref-panel settings-card">
                      <div className="ref-panel-head"><h2>Social Media</h2><small>Footer links</small></div>
                      <div className="ref-form-grid expanded">
                        <label>Facebook<input onChange={(event) => updateSiteSetting('socialFacebook', event.target.value)} placeholder="https://facebook.com/..." value={siteSettings.socialFacebook} /></label>
                        <label>Instagram<input onChange={(event) => updateSiteSetting('socialInstagram', event.target.value)} placeholder="https://instagram.com/..." value={siteSettings.socialInstagram} /></label>
                        <label>LinkedIn<input onChange={(event) => updateSiteSetting('socialLinkedin', event.target.value)} placeholder="https://linkedin.com/company/..." value={siteSettings.socialLinkedin} /></label>
                        <label>X / Twitter<input onChange={(event) => updateSiteSetting('socialX', event.target.value)} placeholder="https://x.com/..." value={siteSettings.socialX} /></label>
                      </div>
                    </section>
                    <section className="ref-panel settings-card page-manager-card">
                      <div className="ref-panel-head"><h2>Pages</h2><small>Add, hide, or remove footer pages</small></div>
                      <form className="settings-page-form" onSubmit={addSitePage}>
                        <input onChange={(event) => setPageDraft({ ...pageDraft, title: event.target.value })} placeholder="Page title" value={pageDraft.title} />
                        <input onChange={(event) => setPageDraft({ ...pageDraft, slug: event.target.value })} placeholder="/page-slug" value={pageDraft.slug} />
                        <label><input checked={pageDraft.visible} onChange={(event) => setPageDraft({ ...pageDraft, visible: event.target.checked })} type="checkbox" /> Visible</label>
                        <button type="submit"><AdminIcon name="plus" /> Add Page</button>
                      </form>
                      <div className="page-manager-list">
                        {siteSettings.pages.map((page) => (
                          <article key={page.id}>
                            <div><strong>{page.title}</strong><small>{page.slug}</small></div>
                            <button className={page.visible ? 'status-pill active' : 'status-pill'} onClick={() => toggleSitePage(page.id)} type="button">{page.visible ? 'Visible' : 'Hidden'}</button>
                            <button className="table-icon danger" onClick={() => removeSitePage(page.id)} type="button"><AdminIcon name="trash" /></button>
                          </article>
                        ))}
                      </div>
                    </section>
                    <section className="ref-panel settings-card faq-manager-card">
                      <div className="ref-panel-head"><h2>FAQs</h2><small>Add, hide, or remove home FAQs</small></div>
                      <form className="settings-faq-form" onSubmit={addSiteFaq}>
                        <input onChange={(event) => setFaqDraft({ ...faqDraft, question: event.target.value })} placeholder="FAQ question" value={faqDraft.question} />
                        <input onChange={(event) => setFaqDraft({ ...faqDraft, icon: event.target.value })} placeholder="FontAwesome icon e.g. fa-indian-rupee-sign" value={faqDraft.icon} />
                        <textarea onChange={(event) => setFaqDraft({ ...faqDraft, answer: event.target.value })} placeholder="FAQ answer" rows="3" value={faqDraft.answer} />
                        <label><input checked={faqDraft.visible} onChange={(event) => setFaqDraft({ ...faqDraft, visible: event.target.checked })} type="checkbox" /> Visible</label>
                        <button type="submit"><AdminIcon name="plus" /> Add FAQ</button>
                      </form>
                      <div className="faq-manager-list">
                        {(Array.isArray(siteSettings.faqs) ? siteSettings.faqs : DEFAULT_HOME_FAQS).map((faq) => (
                          <article key={faq.id || faq.question}>
                            <i className={`fa-solid ${faq.icon || 'fa-circle-question'}`} aria-hidden="true" />
                            <div><strong>{faq.question}</strong><small>{faq.answer}</small></div>
                            <button className={faq.visible !== false ? 'status-pill active' : 'status-pill'} onClick={() => toggleSiteFaq(faq.id)} type="button">{faq.visible !== false ? 'Visible' : 'Hidden'}</button>
                            <button className="table-icon danger" onClick={() => removeSiteFaq(faq.id)} type="button"><AdminIcon name="trash" /></button>
                          </article>
                        ))}
                      </div>
                    </section>
                    <section className="ref-panel settings-card">
                      <div className="ref-panel-head"><h2>Admin Password</h2><small>Stored securely in database</small></div>
                      <form className="ref-form-grid expanded" onSubmit={changeAdminPassword}>
                        <label>Current Password<input autoComplete="current-password" onChange={(event) => setAdminPasswordForm({ ...adminPasswordForm, currentPassword: event.target.value })} type="password" value={adminPasswordForm.currentPassword} /></label>
                        <label>New Password<input autoComplete="new-password" onChange={(event) => setAdminPasswordForm({ ...adminPasswordForm, newPassword: event.target.value })} type="password" value={adminPasswordForm.newPassword} /></label>
                        <label>Confirm New Password<input autoComplete="new-password" onChange={(event) => setAdminPasswordForm({ ...adminPasswordForm, confirmPassword: event.target.value })} type="password" value={adminPasswordForm.confirmPassword} /></label>
                        <div className="ref-form-actions wide"><button type="submit">Change Password</button></div>
                      </form>
                      {adminPasswordStatus && <p className="settings-status-text">{adminPasswordStatus}</p>}
                    </section>
                    <section className="ref-panel page-card settings-status-card">
                      <div className="ref-panel-head"><h2>System</h2><small>Security and data handling</small></div>
                      <div className="settings-grid"><span><b>Admin login</b>Database password required</span><span><b>Patient login</b>Email OTP enabled</span><span><b>Encryption</b>AES-256-GCM confidential data</span><span><b>Database</b>{dbStatus}</span><span><b>Uploads</b>CSV, XLS, XLSX, image URLs and image file preview</span></div>
                    </section>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {hospitalEditOpen && (
          <div className="admin-confirm-backdrop" role="presentation">
            <form className="admin-confirm-modal admin-edit-modal" onSubmit={saveHospital} aria-modal="true" role="dialog">
              <div>
                <strong>Edit hospital</strong>
                <p>Update partner details without leaving the dashboard.</p>
              </div>
              <div className="admin-modal-form-grid">
                <label>Hospital Name<input onChange={(event) => setForm({ ...form, name: event.target.value })} value={form.name} /></label>
                <label>City<input onChange={(event) => setForm({ ...form, city: event.target.value })} value={form.city} /></label>
                <label>State<input onChange={(event) => setForm({ ...form, state: event.target.value })} value={form.state} /></label>
                <label>Contact Person<input onChange={(event) => setForm({ ...form, contactPerson: event.target.value })} value={form.contactPerson} /></label>
                <label>Email<input onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" value={form.email} /></label>
                <label>Phone<input onChange={(event) => setForm({ ...form, phone: event.target.value })} value={form.phone} /></label>
                <label>Specialty<select onChange={(event) => setForm({ ...form, specialty: event.target.value })} value={form.specialty}>{Array.from(new Set(HOSPITALS.map((hospital) => hospital.specialty))).map((item) => <option key={item}>{item}</option>)}</select></label>
                <label>Treatments<input onChange={(event) => setForm({ ...form, treatments: event.target.value })} value={form.treatments} /></label>
                <label>Beds<input onChange={(event) => setForm({ ...form, beds: event.target.value })} type="number" value={form.beds} /></label>
                <label>Package From<input onChange={(event) => setForm({ ...form, packageFrom: event.target.value })} type="number" value={form.packageFrom} /></label>
                <label className="wide">Main Image URL<input onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="https://hospital-image-url.jpg" value={form.image} /></label>
                <label className="admin-file-field">Upload Main Image<input accept="image/*" onChange={(event) => setImageFromFile(event, 'image')} type="file" /><span><AdminIcon name="cloud" /> Choose main image</span></label>
                <label className="admin-file-field">Upload Gallery Images<input accept="image/*" multiple onChange={(event) => setImageFromFile(event, 'galleryImages')} type="file" /><span><AdminIcon name="plus" /> Add multiple images</span></label>
                <label className="wide">Gallery Image URLs<textarea onChange={(event) => setForm({ ...form, galleryImages: event.target.value })} rows="3" value={form.galleryImages} /></label>
                <div className="admin-image-preview wide">
                  <strong>{hospitalImageCount ? `${hospitalImageCount} image${hospitalImageCount > 1 ? 's' : ''} selected` : 'No images selected'}</strong>
                  <div>
                    {form.image && <img alt="Hospital main preview" src={form.image} />}
                    {galleryPreviewUrls.slice(0, 8).map((image) => <img alt="Hospital gallery preview" key={image} src={image} />)}
                  </div>
                </div>
                <label className="wide">Accreditations<input onChange={(event) => setForm({ ...form, accreditations: event.target.value })} value={form.accreditations} /></label>
                <label className="wide">Confidential Notes<textarea onChange={(event) => setForm({ ...form, confidentialNote: event.target.value })} rows="3" value={form.confidentialNote} /></label>
              </div>
              <div className="admin-confirm-actions">
                <button onClick={() => { setHospitalEditOpen(false); setForm(emptyForm); setEditingId(''); }} type="button">Cancel</button>
                <button type="submit">Update Hospital</button>
              </div>
            </form>
          </div>
        )}
        {costingEditOpen && (
          <div className="admin-confirm-backdrop" role="presentation">
            <form className="admin-confirm-modal admin-edit-modal" onSubmit={saveCostingRow} aria-modal="true" role="dialog">
              <div>
                <strong>{editingCostingId ? 'Edit costing row' : 'Add treatment / surgery'}</strong>
                <p>{editingCostingId ? 'Update the surgery mapping and pricing shown in the admin costing table.' : 'Create a new treatment or surgery mapping with tentative hospital and Kairacure pricing.'}</p>
              </div>
              <div className="admin-modal-form-grid">
                <label>Category<input onChange={(event) => setCostingEditForm({ ...costingEditForm, category: event.target.value })} value={costingEditForm.category} /></label>
                <label>Treatment / Surgery<input onChange={(event) => setCostingEditForm({ ...costingEditForm, surgery: event.target.value })} value={costingEditForm.surgery} /></label>
                <label>Procedure Code<input onChange={(event) => setCostingEditForm({ ...costingEditForm, code: event.target.value })} value={costingEditForm.code} /></label>
                <label>Hospital Cost INR<input onChange={(event) => setCostingEditForm({ ...costingEditForm, hospitalCost: event.target.value })} type="number" value={costingEditForm.hospitalCost} /></label>
                <label>Kairacure Price INR<input onChange={(event) => setCostingEditForm({ ...costingEditForm, KairacurePrice: event.target.value })} type="number" value={costingEditForm.KairacurePrice} /></label>
                <label>Currency<select onChange={(event) => setCostingEditForm({ ...costingEditForm, currency: event.target.value })} value={costingEditForm.currency}>{['INR', 'USD', 'AED', 'EUR'].map((currency) => <option key={currency}>{currency}</option>)}</select></label>
                <label>Status<select onChange={(event) => setCostingEditForm({ ...costingEditForm, status: event.target.value })} value={costingEditForm.status}>{['Active', 'Review', 'Inactive'].map((status) => <option key={status}>{status}</option>)}</select></label>
              </div>
              <div className="admin-confirm-actions">
                <button onClick={() => { setCostingEditOpen(false); setEditingCostingId(''); }} type="button">Cancel</button>
                <button type="submit">{editingCostingId ? 'Update Costing' : 'Add Treatment / Surgery'}</button>
              </div>
            </form>
          </div>
        )}
        {confirmDialog && (
          <div className="admin-confirm-backdrop" role="presentation">
            <section className="admin-confirm-modal" aria-modal="true" role="dialog">
              <div>
                <strong>{confirmDialog.title}</strong>
                <p>{confirmDialog.message}</p>
              </div>
              <div className="admin-confirm-actions">
                <button onClick={() => setConfirmDialog(null)} type="button">Cancel</button>
                <button
                  onClick={() => {
                    confirmDialog.onConfirm?.();
                    setConfirmDialog(null);
                  }}
                  type="button"
                >
                  {confirmDialog.actionLabel || 'Confirm'}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </section>
  );
}

function AiExplorationSection({ setPage }) {
  const [phone, setPhone] = useState('');

  return (
    <section className="ai-exploration-section">
      <div className="ai-exploration-doctor">
        <img
          alt="Kairacure doctor assistant"
          src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=90"
        />
      </div>
      <div className="ai-exploration-content">
        <span>Care support</span>
        <h2>Plan Your Medical Journey</h2>
        <div className="ai-exploration-list">
          <article>
            <div className="explore-icon">
              <TreatmentVectorIcon treatment={TREATMENTS[0]} />
            </div>
            <p>Compare treatment options, hospital fit, doctor availability, and appointment planning.</p>
          </article>
          <article>
            <div className="explore-icon">
              <TreatmentVectorIcon treatment={TREATMENTS[2]} />
            </div>
            <div>
              <p>Share reports and get second-opinion next steps from the right hospital team.</p>
              <button onClick={() => setPage('ai-assistant')} type="button">Talk to Care Expert</button>
            </div>
          </article>
          <article>
            <div className="explore-icon">
              <TreatmentVectorIcon treatment={TREATMENTS[9]} />
            </div>
            <div>
              <p>Plan travel, budget, stay, and follow-up with one coordinated medical travel desk.</p>
              <form onSubmit={(event) => event.preventDefault()}>
                <select aria-label="Country code" defaultValue="+91">
                  <option>+91</option>
                </select>
                <input
                  aria-label="Mobile number"
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Enter Mobile*"
                  value={phone}
                />
                <button type="submit">Notify me</button>
              </form>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function HomeFaqSection() {
  const [faqs, setFaqs] = useState(() => {
    try {
      const settings = JSON.parse(window.localStorage.getItem('kairacureSiteSettings') || '{}');
      return Array.isArray(settings.faqs) && settings.faqs.length ? settings.faqs : DEFAULT_HOME_FAQS;
    } catch {
      return DEFAULT_HOME_FAQS;
    }
  });

  useEffect(() => {
    const refreshFaqs = () => {
      try {
        const settings = JSON.parse(window.localStorage.getItem('kairacureSiteSettings') || '{}');
        if (Array.isArray(settings.faqs) && settings.faqs.length) setFaqs(settings.faqs);
      } catch {
        setFaqs(DEFAULT_HOME_FAQS);
      }
    };
    window.addEventListener('storage', refreshFaqs);
    window.addEventListener('Kairacure:settings-updated', refreshFaqs);
    return () => {
      window.removeEventListener('storage', refreshFaqs);
      window.removeEventListener('Kairacure:settings-updated', refreshFaqs);
    };
  }, []);

  const visibleFaqs = faqs.filter((faq) => faq.visible !== false);

  return (
    <section className="home-faq-section" aria-label="Kairacure platform frequently asked questions">
      <div className="section-heading">
        <div>
          <h2>Kairacure FAQs</h2>
          <p>Quick answers about hospitals, doctors, treatment cost, appointments, and medical travel support.</p>
        </div>
      </div>
      <div className="home-faq-grid">
        {visibleFaqs.map((faq) => (
          <details key={faq.id || faq.question}>
            <summary><i className={`fa-solid ${faq.icon || 'fa-circle-question'}`} aria-hidden="true" /> {faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function HomeReviews() {
  return (
    <section className="page-section home-reviews">
      <MedicalVideoBackdrop />
      <div className="section-heading">
        <div>
          <h2>Patients trust the journey</h2>
          <p>Ratings and reviews focused on doctor clarity, hospital response, and complete budget transparency.</p>
        </div>
        <StarRating rating="4.9" />
      </div>
      <div className="review-grid">
        {PATIENT_REVIEWS.map(([name, country, review]) => (
          <blockquote key={name}>
            <StarRating rating="5.0" />
            <strong>{name}</strong>
            <span>{country}</span>
            <p>{review}</p>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

function TrustStrip() {
  return (
    <section className="trust-strip" aria-label="Trust and accreditation highlights">
      <MedicalVideoBackdrop />
      {TRUST_METRICS.map(([metric, label]) => (
        <article key={metric}>
          <strong>{metric}</strong>
          <span>{label}</span>
        </article>
      ))}
      <div className="trust-badges">
        {['ISO process', 'NABH/JCI network', 'IATA travel desk', 'Google review ready'].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </section>
  );
}

function JourneyRoadmap() {
  return (
    <section className="page-section roadmap-section">
      <MedicalVideoBackdrop />
      <div className="section-heading">
        <div>
          <h2>How the medical journey works</h2>
          <p>From reports to recovery, patients see every step before they commit to a hospital.</p>
        </div>
      </div>
      <div className="roadmap-grid">
        {JOURNEY_FLOW.map(([number, title, body]) => (
          <article key={number}>
            <span>{number}</span>
            <strong>{title}</strong>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FreeSupportSection() {
  return (
    <section className="support-section">
      <MedicalVideoBackdrop />
      <div className="support-intro">
        <span>No service charge</span>
        <h2>Support patients expect before travelling for care in India</h2>
        <p>
          Make the full promise visible before the first call: estimate, visa, travel, language,
          local logistics, and follow-up are part of the plan.
        </p>
      </div>
      <div className="support-panel">
        {FREE_SUPPORT.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <div className="country-support-grid">
        {COUNTRY_SUPPORT.map(([region, detail]) => (
          <article key={region}>
            <strong>{region}</strong>
            <p>{detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AuthPage({ onPatientLogin, onPatientLogout, onPatientUpdate, onGoHome }) {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('Patient');
  const [patientAuthMethod, setPatientAuthMethod] = useState('otp');
  const [otpSent, setOtpSent] = useState(false);
  const [patientToken, setPatientToken] = useState(() => window.localStorage.getItem('KairacurePatientToken') || '');
  const [patient, setPatient] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('KairacurePatient') || 'null');
    } catch {
      return null;
    }
  });
  const [form, setForm] = useState({
    name: '',
    email: 'patient@Kairacure.com',
    phone: '',
    password: '',
    newPassword: '',
    otp: '',
    treatmentInterest: 'Orthopedics',
    supportNeed: 'Budget planning',
    country: 'India',
    symptoms: '',
  });
  const [status, setStatus] = useState('');
  const [authSnackbar, setAuthSnackbar] = useState({ message: '', type: 'info' });
  const [patientDashboardTab, setPatientDashboardTab] = useState('overview');
  const [patientEntryOverrides, setPatientEntryOverrides] = useState({});
  const [hiddenPatientEntries, setHiddenPatientEntries] = useState([]);
  const [editingPatientEntry, setEditingPatientEntry] = useState(null);
  const [patientEntryDraft, setPatientEntryDraft] = useState('');
  const [patientDashboardNotice, setPatientDashboardNotice] = useState('');

  useEffect(() => {
    if (!patientToken) return undefined;
    let ignore = false;
    fetch(`${API_BASE}/patients/me`, { headers: { Authorization: `Bearer ${patientToken}` } })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (ignore || !data?.patient) return;
        setPatient(data.patient);
        window.localStorage.setItem('KairacurePatient', JSON.stringify(data.patient));
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, [patientToken]);

  const showAuthSnackbar = useCallback((message, type = 'info') => {
    setAuthSnackbar({ message, type });
  }, []);

  useEffect(() => {
    if (!authSnackbar.message) return undefined;
    const timer = window.setTimeout(() => setAuthSnackbar({ message: '', type: 'info' }), 3600);
    return () => window.clearTimeout(timer);
  }, [authSnackbar.message]);

  const savePatientSession = (data) => {
    window.localStorage.setItem('KairacurePatientToken', data.token);
    window.localStorage.setItem('KairacurePatient', JSON.stringify(data.patient));
    setPatientToken(data.token);
    setPatient(data.patient);
    onPatientLogin?.(data);
    setStatus('');
    showAuthSnackbar('Login successful. Taking you home.', 'success');
    window.setTimeout(() => onGoHome?.(), 250);
  };

  const patientPurpose = mode === 'signup' ? 'register' : mode === 'forgot' ? 'forgot-password' : 'login';

  const switchPatientMode = (nextMode) => {
    setMode(nextMode);
    setOtpSent(false);
    setStatus('');
    setForm((current) => ({ ...current, otp: '', password: '', newPassword: '' }));
  };

  const generatePatientPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    const required = ['M', 'e', '7', '#'];
    const bytes = new Uint32Array(14);
    const shuffleBytes = new Uint32Array(required.length + bytes.length);
    window.crypto.getRandomValues(bytes);
    window.crypto.getRandomValues(shuffleBytes);
    const generatedChars = [...required, ...Array.from(bytes, (byte) => chars[byte % chars.length])];
    for (let index = generatedChars.length - 1; index > 0; index -= 1) {
      const swapIndex = shuffleBytes[index] % (index + 1);
      [generatedChars[index], generatedChars[swapIndex]] = [generatedChars[swapIndex], generatedChars[index]];
    }
    const generated = generatedChars.join('');
    setForm((current) => ({ ...current, password: generated }));
    setStatus('Strong password generated. Keep it safe before continuing.');
  };

  const handlePatientPasswordAuth = async (event) => {
    event.preventDefault();
    setStatus(mode === 'signup' ? 'Creating patient account...' : 'Checking password...');
    try {
      const endpoint = mode === 'signup' ? 'register' : 'login';
      const response = await fetch(`${API_BASE}/patients/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Password authentication failed');
      if (!data.token) throw new Error('Patient session was not returned');
      savePatientSession(data);
    } catch (error) {
      setStatus(error.message === 'Failed to fetch' ? 'Patient API unavailable. Start the backend server and try again.' : error.message);
    }
  };

  const requestPatientOtp = async (event) => {
    event.preventDefault();
    const email = String(form.email || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('');
      showAuthSnackbar('Please enter a valid patient email.', 'error');
      return;
    }
    setStatus('Sending verification code...');
    showAuthSnackbar('Sending verification code...', 'info');
    try {
      const response = await fetch(`${API_BASE}/patients/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role, purpose: patientPurpose }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'OTP request failed');
      setOtpSent(true);
      setStatus('OTP sent. Check your email inbox.');
      showAuthSnackbar('OTP sent to your email.', 'success');
    } catch (error) {
      const message = error.message === 'Failed to fetch' ? 'Patient API unavailable. Start the backend server and try again.' : error.message;
      setStatus(message);
      showAuthSnackbar(message, 'error');
    }
  };

  const verifyPatientOtp = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(String(form.otp || '').trim())) {
      setStatus('');
      showAuthSnackbar('Please enter the 6 digit OTP.', 'error');
      return;
    }
    setStatus(mode === 'forgot' ? 'Resetting password...' : 'Verifying OTP...');
    showAuthSnackbar(mode === 'forgot' ? 'Resetting password...' : 'Verifying OTP...', 'info');
    try {
      const response = await fetch(`${API_BASE}/patients/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role, purpose: patientPurpose }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'OTP verification failed');
      if (mode === 'forgot') {
        setStatus('Password reset successfully. You can login with OTP anytime.');
        showAuthSnackbar('Password reset. Login with email OTP.', 'success');
        setOtpSent(false);
        setMode('login');
        setForm((current) => ({ ...current, otp: '', newPassword: '' }));
        return;
      }
      if (!data.token) throw new Error('Patient session was not returned');
      savePatientSession(data);
    } catch (error) {
      const message = error.message === 'Failed to fetch' ? 'Patient API unavailable. Start the backend server and try again.' : error.message;
      setStatus(message);
      showAuthSnackbar(message, 'error');
    }
  };

  const logoutPatient = () => {
    window.localStorage.removeItem('KairacurePatientToken');
    window.localStorage.removeItem('KairacurePatient');
    setPatientToken('');
    setPatient(null);
    setPatientDashboardTab('overview');
    setPatientEntryOverrides({});
    setHiddenPatientEntries([]);
    setEditingPatientEntry(null);
    setPatientEntryDraft('');
    setPatientDashboardNotice('');
    onPatientLogout?.();
    setStatus('');
  };

  if (patient) {
    const dashboard = patient.dashboard || {};
    const tasks = Array.isArray(dashboard.tasks) ? dashboard.tasks : [];
    const estimates = Array.isArray(dashboard.estimates) ? dashboard.estimates : [];
    const messages = Array.isArray(dashboard.messages) ? dashboard.messages : [];
    const completedTasks = tasks.filter((task) => /complete|done|shared|scheduled|confirmed/i.test(task.status || '')).length;
    const pendingTasks = Math.max(tasks.length - completedTasks, 0);
    const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
    const estimateTotal = estimates.reduce((sum, estimate) => sum + (Number(estimate.amount) || 0), 0);
    const baseRegisteredEntries = [
      { key: 'patientId', icon: 'fa-id-card-clip', label: 'Patient ID', value: patient.patientId, locked: true },
      { key: 'email', icon: 'fa-envelope', label: 'Registered email', value: patient.email },
      { key: 'phone', icon: 'fa-phone', label: 'Phone', value: patient.phone || 'Not added' },
      { key: 'role', icon: 'fa-user-group', label: 'Role', value: patient.role || 'Patient' },
      { key: 'treatmentInterest', icon: 'fa-stethoscope', label: 'Treatment interest', value: patient.treatmentInterest || 'Not selected' },
      { key: 'supportNeed', icon: 'fa-hand-holding-medical', label: 'Support need', value: patient.supportNeed || 'Not selected' },
      { key: 'country', icon: 'fa-location-dot', label: 'Country', value: patient.country || 'Not added' },
      { key: 'createdAt', icon: 'fa-calendar-check', label: 'Registered on', value: patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('en-IN') : 'Not available', locked: true },
    ];
    const registeredEntries = baseRegisteredEntries
      .map((entry) => ({ ...entry, value: patientEntryOverrides[entry.key] ?? entry.value }))
      .filter((entry) => !hiddenPatientEntries.includes(entry.key));
    const visibleEntryCount = registeredEntries.filter((entry) => entry.value && !String(entry.value).startsWith('Not')).length;
    const paymentHistory = (Array.isArray(dashboard.payments) && dashboard.payments.length ? dashboard.payments : estimates.map((estimate, index) => ({
      id: `estimate-${index}`,
      label: estimate.label || `Estimate ${index + 1}`,
      amount: estimate.amount,
      currency: estimate.currency || 'INR',
      status: index === 0 ? 'Awaiting approval' : 'Estimate shared',
      date: patient.updatedAt || patient.createdAt,
    })));
    const careHistory = [
      { icon: 'fa-user-plus', label: 'Profile created', meta: patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('en-IN') : 'Recently', detail: patient.supportNeed || 'Patient entry received' },
      { icon: 'fa-clipboard-list', label: dashboard.stage || 'Coordinator review', meta: patient.updatedAt ? new Date(patient.updatedAt).toLocaleDateString('en-IN') : 'In progress', detail: dashboard.nextStep || 'Care team is reviewing details' },
      ...tasks.slice(0, 4).map((task) => ({ icon: 'fa-list-check', label: task.label, meta: task.status || 'Pending', detail: 'Care task' })),
    ];
    const patientMenus = [
      ['overview', 'Overview', 'fa-house-medical'],
      ['entries', 'Entries', 'fa-pen-to-square'],
      ['payments', 'Payments', 'fa-credit-card'],
      ['history', 'History', 'fa-clock-rotate-left'],
      ['messages', 'Messages', 'fa-message'],
    ];
    const beginEditPatientEntry = (entry) => {
      setEditingPatientEntry(entry);
      setPatientEntryDraft(String(entry.value || ''));
      setPatientDashboardNotice('');
    };
    const savePatientEntry = () => {
      if (!editingPatientEntry) return;
      const nextValue = patientEntryDraft.trim() || 'Not added';
      const updatedKey = editingPatientEntry.key;
      setPatientEntryOverrides((current) => {
        const next = { ...current, [updatedKey]: nextValue };
        window.localStorage.setItem('KairacurePatientEntryOverrides', JSON.stringify(next));
        return next;
      });
      setPatient((current) => {
        if (!current) return current;
        const next = { ...current, [updatedKey]: nextValue };
        window.localStorage.setItem('KairacurePatient', JSON.stringify(next));
        onPatientUpdate?.(next);
        return next;
      });
      setEditingPatientEntry(null);
      setPatientEntryDraft('');
      setPatientDashboardNotice('Saving entry to admin...');
      fetch(`${API_BASE}/patients/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patientToken}` },
        body: JSON.stringify({
          fields: { [updatedKey]: nextValue },
          page: 'patient-dashboard',
          path: window.location.pathname,
        }),
      })
        .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Profile sync failed'))))
        .then((data) => {
          if (!data?.patient) return;
          setPatient(data.patient);
          window.localStorage.setItem('KairacurePatient', JSON.stringify(data.patient));
          onPatientUpdate?.(data.patient);
          setPatientDashboardNotice('Entry updated and saved in admin.');
        })
        .catch(() => setPatientDashboardNotice('Entry updated locally. Backend sync pending.'));
    };
    const deletePatientEntry = (entry) => {
      if (entry.locked) return;
      setHiddenPatientEntries((current) => {
        const next = current.includes(entry.key) ? current : [...current, entry.key];
        window.localStorage.setItem('KairacureHiddenPatientEntries', JSON.stringify(next));
        return next;
      });
      setPatientDashboardNotice(`${entry.label} hidden from your entries.`);
    };

    return (
      <section className="patient-dashboard-page">
        <header className="patient-dashboard-hero">
          <div>
            <span><i className="fa-solid fa-user-shield" aria-hidden="true" /> Patient dashboard</span>
            <h1>Hi, {patient.name}</h1>
            <p>{dashboard.nextStep || 'Your care request is being reviewed by the Kairacure team.'}</p>
            <div className="patient-status-strip">
              <b>{patient.status || 'Active'}</b>
              <small>{dashboard.stage || 'Profile created'}</small>
            </div>
          </div>
          <button className="patient-logout-button" onClick={logoutPatient} type="button"><i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" /> Logout</button>
        </header>

        <nav className="patient-mobile-menu" aria-label="Patient dashboard menu">
          {patientMenus.map(([key, label, icon]) => (
            <button className={patientDashboardTab === key ? 'active' : ''} key={key} onClick={() => setPatientDashboardTab(key)} type="button">
              <i className={`fa-solid ${icon}`} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {patientDashboardNotice && <div className="patient-dashboard-notice"><i className="fa-solid fa-circle-check" aria-hidden="true" /> {patientDashboardNotice}</div>}

        {patientDashboardTab === 'overview' && (
          <>
            <div className="patient-dashboard-grid patient-analytics-grid">
              <article>
                <i className="fa-solid fa-chart-simple" aria-hidden="true" />
                <span>Task progress</span>
                <strong>{completionRate}%</strong>
                <small>{completedTasks} completed, {pendingTasks} pending</small>
              </article>
              <article>
                <i className="fa-solid fa-folder-open" aria-hidden="true" />
                <span>Care entries</span>
                <strong>{visibleEntryCount}</strong>
                <small>Visible profile fields</small>
              </article>
              <article>
                <i className="fa-solid fa-wallet" aria-hidden="true" />
                <span>Estimate total</span>
                <strong>{estimates[0]?.currency || 'INR'} {estimateTotal || 0}</strong>
                <small>{estimates.length ? `${estimates.length} estimate entries` : 'No estimate shared yet'}</small>
              </article>
            </div>
            <div className="patient-dashboard-actions">
              <button onClick={() => setPatientDashboardTab('entries')} type="button"><i className="fa-solid fa-pen-to-square" aria-hidden="true" /> Manage entries</button>
              <button onClick={() => setPatientDashboardTab('payments')} type="button"><i className="fa-solid fa-credit-card" aria-hidden="true" /> Track payments</button>
              <button onClick={() => setPatientDashboardTab('history')} type="button"><i className="fa-solid fa-clock-rotate-left" aria-hidden="true" /> View history</button>
            </div>
          </>
        )}

        {patientDashboardTab === 'entries' && (
          <section className="patient-entry-panel patient-dashboard-section">
            <div>
              <span><i className="fa-solid fa-pen-to-square" aria-hidden="true" /> Registered entries</span>
              <h2>Your submitted patient details</h2>
            </div>
            <div className="patient-entry-grid">
              {registeredEntries.map((entry) => (
                <article key={entry.key}>
                  <i className={`fa-solid ${entry.icon}`} aria-hidden="true" />
                  <span>{entry.label}</span>
                  <strong>{entry.value}</strong>
                  <div className="patient-entry-actions">
                    <button disabled={entry.locked} onClick={() => beginEditPatientEntry(entry)} type="button"><i className="fa-solid fa-pen" aria-hidden="true" /> Edit</button>
                    <button disabled={entry.locked} onClick={() => deletePatientEntry(entry)} type="button"><i className="fa-solid fa-trash" aria-hidden="true" /> Delete</button>
                  </div>
                </article>
              ))}
            </div>
            {editingPatientEntry && (
              <div className="patient-entry-editor">
                <label>{editingPatientEntry.label}<input autoFocus onChange={(event) => setPatientEntryDraft(event.target.value)} value={patientEntryDraft} /></label>
                <div>
                  <button onClick={savePatientEntry} type="button">Save</button>
                  <button onClick={() => setEditingPatientEntry(null)} type="button">Cancel</button>
                </div>
              </div>
            )}
          </section>
        )}

        {patientDashboardTab === 'payments' && (
          <section className="patient-dashboard-section patient-payment-panel">
            <div className="patient-section-head">
              <span><i className="fa-solid fa-credit-card" aria-hidden="true" /> Payment tracker</span>
              <h2>Estimates and payment history</h2>
            </div>
            <div className="patient-payment-summary">
              <article><span>Total estimate</span><strong>{estimates[0]?.currency || 'INR'} {estimateTotal || 0}</strong></article>
              <article><span>Entries</span><strong>{paymentHistory.length}</strong></article>
              <article><span>Status</span><strong>{paymentHistory[0]?.status || 'No payment due'}</strong></article>
            </div>
            <div className="patient-timeline-list">
              {paymentHistory.length ? paymentHistory.map((payment) => (
                <article key={payment.id || payment.label}>
                  <i className="fa-solid fa-receipt" aria-hidden="true" />
                  <div><strong>{payment.label}</strong><span>{payment.status || 'Shared'}{payment.date ? ` - ${new Date(payment.date).toLocaleDateString('en-IN')}` : ''}</span></div>
                  <b>{payment.currency || 'INR'} {payment.amount || 0}</b>
                </article>
              )) : <p>No payments or estimates have been added yet.</p>}
            </div>
          </section>
        )}

        {patientDashboardTab === 'history' && (
          <section className="patient-dashboard-section">
            <div className="patient-section-head">
              <span><i className="fa-solid fa-clock-rotate-left" aria-hidden="true" /> Care history</span>
              <h2>Your activity timeline</h2>
            </div>
            <div className="patient-timeline-list">
              {careHistory.map((item) => (
                <article key={`${item.label}-${item.meta}`}>
                  <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
                  <div><strong>{item.label}</strong><span>{item.detail}</span></div>
                  <b>{item.meta}</b>
                </article>
              ))}
            </div>
          </section>
        )}

        {patientDashboardTab === 'messages' && (
          <div className="patient-dashboard-columns patient-dashboard-section">
            <section>
              <h2>Care Tasks</h2>
              {tasks.length ? tasks.map((task) => <div key={task.label}><span>{task.label}</span><strong>{task.status}</strong></div>) : <p>No tasks yet.</p>}
            </section>
            <section>
              <h2>Estimates</h2>
              {estimates.length ? estimates.map((estimate) => <div key={estimate.label}><span>{estimate.label}</span><strong>{estimate.currency} {estimate.amount}</strong></div>) : <p>Estimates will appear after report review.</p>}
            </section>
            <section>
              <h2>Messages</h2>
              {messages.length ? messages.map((message) => <div key={`${message.from}-${message.text}`}><span>{message.from}</span><strong>{message.text}</strong></div>) : <p>No messages yet.</p>}
            </section>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="admin-login-page patient-login-page">
      <div className="admin-login-shell patient-login-shell">
        <aside className="admin-login-visual patient-login-visual">
          <div className="patient-login-photo" aria-hidden="true">
            <img alt="" src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1400&q=86" />
          </div>
        </aside>
        <form className="admin-login-card patient-login-card" onSubmit={mode !== 'forgot' && patientAuthMethod === 'password' ? handlePatientPasswordAuth : otpSent ? verifyPatientOtp : requestPatientOtp}>
          <h1>{mode === 'signup' ? 'Create patient account' : mode === 'forgot' ? 'Reset with email OTP' : 'Login with email OTP'}</h1>
          <div className="auth-toggle patient-auth-toggle">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => switchPatientMode('login')} type="button">Login</button>
            <button className={mode === 'signup' ? 'active' : ''} onClick={() => switchPatientMode('signup')} type="button">Sign up</button>
            <button className={mode === 'forgot' ? 'active' : ''} onClick={() => switchPatientMode('forgot')} type="button">Forgot</button>
          </div>
          {mode !== 'forgot' && (
            <div className="patient-auth-method-toggle" aria-label="Patient authentication method">
              <button className={patientAuthMethod === 'otp' ? 'active' : ''} onClick={() => { setPatientAuthMethod('otp'); setOtpSent(false); setStatus(''); }} type="button">
                <i className="fa-solid fa-envelope-circle-check" aria-hidden="true" /> Email OTP
              </button>
              <button className={patientAuthMethod === 'password' ? 'active' : ''} onClick={() => { setPatientAuthMethod('password'); setOtpSent(false); setStatus(''); }} type="button">
                <i className="fa-solid fa-key" aria-hidden="true" /> Password
              </button>
            </div>
          )}
          {mode === 'signup' && (
            <div className="patient-type-grid">
              {['Patient', 'Family member', 'Medical coordinator'].map((item) => (
                <button className={role === item ? 'active' : ''} key={item} onClick={() => setRole(item)} type="button">
                  <strong>{item}</strong>
                </button>
              ))}
            </div>
          )}
          {mode === 'signup' && <label>Full name<input onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Patient full name" value={form.name} /></label>}
          <label>Email<input onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="patient@email.com" type="email" value={form.email} /></label>
          {mode !== 'forgot' && patientAuthMethod === 'password' && (
            <label className="patient-password-field">Password<div className="patient-password-control"><input autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={mode === 'signup' ? 'Minimum 8 characters' : 'Enter password'} type="text" value={form.password} />{mode === 'signup' && <button onClick={generatePatientPassword} type="button"><i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" /> Generate</button>}</div></label>
          )}
          {mode === 'signup' && <label>Phone<input onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+91..." value={form.phone} /></label>}
          {mode === 'signup' && (
            <>
              <label>Treatment<select onChange={(event) => setForm({ ...form, treatmentInterest: event.target.value })} value={form.treatmentInterest}>
                {TREATMENTS.map((item) => (
                  <option key={item.id}>{item.title}</option>
                ))}
              </select></label>
              <label>Support need<select onChange={(event) => setForm({ ...form, supportNeed: event.target.value })} value={form.supportNeed}>
                <option>Budget planning</option>
                <option>Doctor second opinion</option>
                <option>Hospital shortlisting</option>
                <option>Travel and stay support</option>
              </select></label>
              <label>Country<input onChange={(event) => setForm({ ...form, country: event.target.value })} placeholder="Country" value={form.country} /></label>
              <label>Care notes<textarea onChange={(event) => setForm({ ...form, symptoms: event.target.value })} placeholder="Brief symptoms or care notes" rows="3" value={form.symptoms} /></label>
            </>
          )}
          {(patientAuthMethod === 'otp' || mode === 'forgot') && otpSent && <label>OTP<input inputMode="numeric" maxLength="6" onChange={(event) => setForm({ ...form, otp: event.target.value.replace(/\D/g, '') })} placeholder="6 digit OTP" value={form.otp} /></label>}
          {mode === 'forgot' && otpSent && <label>New password<input onChange={(event) => setForm({ ...form, newPassword: event.target.value })} placeholder="Minimum 8 characters" type="password" value={form.newPassword} /></label>}
          <button type="submit">{mode !== 'forgot' && patientAuthMethod === 'password' ? (mode === 'signup' ? 'Create Account' : 'Login with Password') : otpSent ? (mode === 'forgot' ? 'Reset Password' : 'Verify & Continue') : 'Send Email OTP'}</button>
          {(patientAuthMethod === 'otp' || mode === 'forgot') && otpSent && <button className="patient-link-button" onClick={requestPatientOtp} type="button">Resend OTP</button>}
        </form>
      </div>
      {authSnackbar.message && (
        <div className={`patient-auth-snackbar ${authSnackbar.type}`} role="status" aria-live="polite">
          <i className={`fa-solid ${authSnackbar.type === 'success' ? 'fa-circle-check' : authSnackbar.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info'}`} aria-hidden="true" />
          <span>{authSnackbar.message}</span>
        </div>
      )}
    </section>
  );
}

function JourneyModal({ onClose, setPage, treatments = [] }) {
  // Use first 6 backend treatments
  const displayTreatments = treatments.slice(0, 6);

  if (displayTreatments.length === 0) {
    return null; // Don't show modal if no treatments available
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Quick medical journey planner">
      <div className="journey-modal">
        <button className="modal-close" onClick={onClose} type="button">x</button>
        <span>Plan smarter</span>
        <h2>Build a quick medical travel estimate</h2>
        <p>Select a treatment, compare hospitals and doctors, then see a demo budget for package, flights, visa, stay, pickup and care support.</p>
        <div className="modal-steps">
          <span>Choose treatment</span>
          <span>Compare hospitals</span>
          <span>Estimate total cost</span>
        </div>
        <div className="modal-treatment-grid">
          {displayTreatments.map((item) => (
            <button key={item.id} type="button">
              <TreatmentIconTile treatment={item} />
              <strong>{item.title}</strong>
            </button>
          ))}
        </div>
        <button
          className="modal-primary"
          onClick={() => {
            onClose();
            setPage('planner');
          }}
          type="button"
        >
          Quick plan my medical journey
        </button>
      </div>
    </div>
  );
}

function Footer({ setPage }) {
  const treatmentLinks = [
    ['Cardiac Surgery', 'Improve heart health with bypass, valve repair, and stent procedures.'],
    ['Hair Transplant', 'Restore natural hairline with FUE and DHI techniques.'],
    ['Dental Treatment', 'Full-mouth restoration, implants, veneers, and cosmetic care.'],
    ['Fertility Treatment', 'IVF, IUI, and reproductive care with specialist support.'],
    ['Orthopaedics', 'Knee, hip, and spine procedures with expert surgeons.'],
    ['ENT', 'Ear, nose, and throat surgeries with full recovery support.'],
    ['Cancer Treatment', 'Oncology care with precision surgery, chemo, and immunotherapy.'],
    ['IVF Treatment', "Advanced fertility treatment from India's top clinics."],
    ['Gynaecology', "Women's health, laparoscopy, and minimally invasive surgery."],
  ];

  return (
    <footer className="kc-footer">
      {/* Top — treatment links grid */}
      <div className="kc-footer-top">
        <div className="kc-footer-tabs">
          {['Treatments', 'Hospitals', 'Doctors', 'Destination'].map((tab, i) => (
            <button
              key={tab}
              className={`kc-footer-tab${i === 0 ? ' active' : ''}`}
              type="button"
              onClick={() => setPage && setPage(tab.toLowerCase())}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="kc-footer-treatments">
          {treatmentLinks.map(([name, desc]) => (
            <div key={name} className="kc-footer-treatment-item">
              <strong>{name}</strong>
              <span>{desc}</span>
            </div>
          ))}
        </div>
        <button className="kc-footer-view-more" type="button" onClick={() => setPage && setPage('treatments')}>
          View more <i className="fa-solid fa-chevron-right" aria-hidden="true" />
        </button>
      </div>

      {/* Divider */}
      <div className="kc-footer-divider" />

      {/* Bottom — 4 column links */}
      <div className="kc-footer-bottom-grid">
        <div className="kc-footer-col">
          <h4>About {BRAND_NAME}</h4>
          <a href="#">About Us</a>
          <a href="#">Our Vision &amp; Mission</a>
          <a href="#">Become a Partner</a>
          <a href="#">Blogs</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setPage && setPage('ai-assistant'); }}>{BRAND_NAME} AI</a>
        </div>
        <div className="kc-footer-col">
          <h4>Support</h4>
          <a href="#">Help Centre</a>
          <a href="mailto:care@kairacure.com">Contact Us</a>
          <a href="#" onClick={(e) => { e.preventDefault(); setPage && setPage('home'); }}>FAQs</a>
        </div>
        <div className="kc-footer-col">
          <h4>Legal &amp; Policies</h4>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms &amp; Conditions</a>
          <a href="#">Refund Policy</a>
        </div>
        <div className="kc-footer-col">
          <h4>Reviews &amp; Community</h4>
          <span className="kc-footer-community-text">Community and forum</span>
          <a href="#" className="kc-footer-review-btn google">
            <i className="fa-brands fa-google" aria-hidden="true" />
            Review us
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </a>
          <a href="#" className="kc-footer-review-btn trustpilot">
            <i className="fa-solid fa-star" aria-hidden="true" />
            Review us
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="kc-footer-copyright">
        <span>© 2026 {BRAND_NAME} · Patient-first medical travel · care@kairacure.com</span>
        <span>NABH · JCI · ISO · 24/7 Support</span>
      </div>
    </footer>
  );
}


function App() {
  const money = (amount) => {
    if (typeof amount !== 'number') return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="kairacure-admin-app-root">
      <AdminPanel money={money} />
    </div>
  );
}

export default App;
