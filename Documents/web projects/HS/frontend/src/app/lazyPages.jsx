import { lazy } from 'react';
import { AdminDashboardPage } from '../features/dashboard/pages/AdminDashboardPage';
import { DoctorDashboardPage } from '../features/dashboard/pages/DoctorDashboardPage';
import { PatientDashboardPage } from '../features/dashboard/pages/PatientDashboardPage';
import { HomePage } from '../pages/HomePage';

export const AdminDashboardPageLazy = AdminDashboardPage;

export const AdminEarningsPageLazy = lazy(() =>
  import('../features/analytics/pages/AdminEarningsPage').then((m) => ({ default: m.AdminEarningsPage }))
);

export const DoctorDashboardPageLazy = DoctorDashboardPage;

export const PatientDashboardPageLazy = PatientDashboardPage;

export const BookAppointmentPageLazy = lazy(() =>
  import('../features/appointments/pages/BookAppointmentPage').then((m) => ({ default: m.BookAppointmentPage }))
);

export const PrescriptionsPageLazy = lazy(() =>
  import('../features/prescriptions/pages/PrescriptionsPage').then((m) => ({ default: m.PrescriptionsPage }))
);

export const InvoicesPageLazy = lazy(() =>
  import('../features/billing/pages/InvoicesPage').then((m) => ({ default: m.InvoicesPage }))
);

export const ReportsPageLazy = lazy(() =>
  import('../features/reports/pages/ReportsPage').then((m) => ({ default: m.ReportsPage }))
);

export const NotFoundPageLazy = lazy(() =>
  import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

export const UnauthorizedPageLazy = lazy(() =>
  import('../pages/UnauthorizedPage').then((m) => ({ default: m.UnauthorizedPage }))
);

export const LoginPageLazy = lazy(() =>
  import('../features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);

export const RegisterPageLazy = lazy(() =>
  import('../features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);

export const DoctorsPageLazy = lazy(() =>
  import('../features/people/pages/DoctorsPage').then((m) => ({ default: m.DoctorsPage }))
);

export const PatientsPageLazy = lazy(() =>
  import('../features/people/pages/PatientsPage').then((m) => ({ default: m.PatientsPage }))
);

export const DoctorMyAppointmentsPageLazy = lazy(() =>
  import('../features/doctors/pages/DoctorMyAppointmentsPage').then((m) => ({ default: m.DoctorMyAppointmentsPage }))
);

export const DoctorProfilePageLazy = lazy(() =>
  import('../features/doctors/pages/EnhancedDoctorProfilePage').then((m) => ({ default: m.EnhancedDoctorProfilePage }))
);

export const PublicDoctorProfilePageLazy = lazy(() =>
  import('../features/doctors/pages/PublicDoctorProfilePage').then((m) => ({ default: m.PublicDoctorProfilePage }))
);

export const CareFeedbackPageLazy = lazy(() =>
  import('../features/ratings/pages/CareFeedbackPage').then((m) => ({ default: m.CareFeedbackPage }))
);

export const ProfilePageLazy = lazy(() =>
  import('../features/profile/pages/EnhancedPatientProfilePage').then((m) => ({ default: m.EnhancedPatientProfilePage }))
);

export const HomePageLazy = HomePage;
