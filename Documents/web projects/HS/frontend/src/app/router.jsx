import { createBrowserRouter } from 'react-router-dom';
import { Suspense } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { RoleGuard } from '../components/layout/RoleGuard';
import { RouteErrorPage } from '../pages/RouteErrorPage';
import {
  AdminDashboardPageLazy,
  AdminEarningsPageLazy,
  DoctorDashboardPageLazy,
  PatientDashboardPageLazy,
  BookAppointmentPageLazy,
  PrescriptionsPageLazy,
  InvoicesPageLazy,
  ReportsPageLazy,
  NotFoundPageLazy,
  UnauthorizedPageLazy,
  LoginPageLazy,
  RegisterPageLazy,
  DoctorsPageLazy,
  PatientsPageLazy,
  DoctorMyAppointmentsPageLazy,
  DoctorProfilePageLazy,
  ProfilePageLazy,
  HomePageLazy,
  PublicDoctorProfilePageLazy,
  CareFeedbackPageLazy,
} from './lazyPages';

const withSuspense = (node) => <Suspense fallback={<div className="p-4 text-sm text-(--text-soft)">Loading...</div>}>{node}</Suspense>;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        element: withSuspense(<HomePageLazy />),
      },
      {
        path: 'admin',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            {withSuspense(<AdminDashboardPageLazy />)}
          </RoleGuard>
        ),
      },
      {
        path: 'admin/earnings',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            {withSuspense(<AdminEarningsPageLazy />)}
          </RoleGuard>
        ),
      },
      {
        path: 'doctor',
        element: (
          <RoleGuard allowedRoles={['doctor']}>
            {withSuspense(<DoctorDashboardPageLazy />)}
          </RoleGuard>
        ),
      },
      {
        path: 'doctor/appointments',
        element: (
          <RoleGuard allowedRoles={['doctor']}>
            {withSuspense(<DoctorMyAppointmentsPageLazy />)}
          </RoleGuard>
        ),
      },
      {
        path: 'doctor/profile',
        element: (
          <RoleGuard allowedRoles={['doctor']}>
            {withSuspense(<DoctorProfilePageLazy />)}
          </RoleGuard>
        ),
      },
      {
        path: 'profile',
        element: (
          <RoleGuard allowedRoles={['admin', 'doctor', 'patient']}>
            {withSuspense(<ProfilePageLazy />)}
          </RoleGuard>
        ),
      },
      {
        path: 'patient',
        element: (
          <RoleGuard allowedRoles={['patient']}>
            {withSuspense(<PatientDashboardPageLazy />)}
          </RoleGuard>
        ),
      },
      {
        path: 'doctors',
        element: (
          <RoleGuard allowedRoles={['admin']}>
            {withSuspense(<DoctorsPageLazy />)}
          </RoleGuard>
        ),
      },
      {
        path: 'doctor/:doctorId',
        element: withSuspense(<PublicDoctorProfilePageLazy />),
      },
      {
        path: 'patients',
        element: (
          <RoleGuard allowedRoles={['admin', 'doctor']}>
            {withSuspense(<PatientsPageLazy />)}
          </RoleGuard>
        ),
      },
      {
        path: 'appointments',
        element: (
          <RoleGuard allowedRoles={['admin', 'patient']}>
            {withSuspense(<BookAppointmentPageLazy />)}
          </RoleGuard>
        ),
      },
      {
        path: 'patient/feedback',
        element: (
          <RoleGuard allowedRoles={['patient']}>
            {withSuspense(<CareFeedbackPageLazy />)}
          </RoleGuard>
        ),
      },
      {
        path: 'prescriptions',
        element: (
          <RoleGuard allowedRoles={['admin', 'doctor', 'patient']}>
            {withSuspense(<PrescriptionsPageLazy />)}
          </RoleGuard>
        ),
      },
      {
        path: 'billing',
        element: (
          <RoleGuard allowedRoles={['admin', 'patient']}>
            {withSuspense(<InvoicesPageLazy />)}
          </RoleGuard>
        ),
      },
      {
        path: 'reports',
        element: (
          <RoleGuard allowedRoles={['admin', 'patient']}>
            {withSuspense(<ReportsPageLazy />)}
          </RoleGuard>
        ),
      },
      {
        path: 'login',
        element: withSuspense(<LoginPageLazy />),
      },
      {
        path: 'register',
        element: withSuspense(<RegisterPageLazy />),
      },
      {
        path: 'unauthorized',
        element: withSuspense(<UnauthorizedPageLazy />),
      },
      {
        path: '*',
        element: withSuspense(<NotFoundPageLazy />),
      },
    ],
  },
]);


