import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import SHGLayout from './layouts/SHGLayout';

// Auth Pages
import Login from './pages/Login';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import SupportData from './pages/admin/SupportData';
import SHGGroupManagement from './pages/admin/SHGGroupManagement';
import Reports from './pages/admin/Reports';

// SHG Team Member Pages
import SHGDashboard from './pages/shg/Dashboard';
import ApprovedLoansPage from './pages/shg/LoanApproval';
import LoanRepaymentSchedulerPage from './pages/shg/LoanReschedulepage';
import LoanRequestPage from './pages/shg/LoanRequest';
import SavingsManagement from './pages/shg/SavingsManagement';
import CollectionPayment from './pages/shg/LoanCollection';
import MeetingSummary from './pages/shg/MeetingSummary';
import EasyEntry from './pages/shg/EasyEntry';
import AssignCollector from './pages/shg/AssignCollector';
import LoanIssue from './pages/shg/LoanIssue';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { currentUser } = useApp();

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

// Route Configuration
const AppRoutes = () => {
    const { currentUser } = useApp();

    return (
        <Routes>
            <Route path="/login" element={
                currentUser ? <Navigate to="/" replace /> : <Login />
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminLayout />
                </ProtectedRoute>
            }>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="support-data" element={<SupportData />} />
                <Route path="shg-groups" element={<SHGGroupManagement />} />
                <Route path="reports" element={<Reports />} />
            </Route>

            {/* SHG Team Member Routes */}
            <Route path="/shg" element={
                <ProtectedRoute allowedRoles={['shg_member']}>
                    <SHGLayout />
                </ProtectedRoute>
            }>
                <Route index element={<SHGDashboard />} />

                {/* Collection Dropdown Routes */}
                <Route path="savings" element={<SavingsManagement />} />
                <Route path="collection-loan" element={<CollectionPayment />} />
                <Route path="collection-memberwise" element={<EasyEntry />} />
                <Route path="assign-collector" element={<AssignCollector />} />

                {/* Loan Dropdown Routes */}
                {/* <Route path="repayment-schedule" element={<LoanManagement />} /> */}
                <Route path="loanapproval" element={<ApprovedLoansPage />} />
                <Route path="loan-request" element={<LoanRequestPage />} />
                <Route path="loan-issue" element={<LoanIssue />} />
                <Route path='loan-reschedule' element ={<LoanRepaymentSchedulerPage/>}/>
                {/* Report Dropdown Routes */}
                <Route path="memberwise-report" element={<Reports />} />
                <Route path="daywise-report" element={<Reports />} />
                <Route path="monthly-report" element={<Reports />} />
                <Route path="annual-report" element={<Reports />} />

                {/* Other Routes */}
                <Route path="collections" element={<CollectionPayment />} />
                <Route path="easy-entry" element={<EasyEntry />} />
            </Route>

            {/* Default redirect based on role */}
            <Route path="/" element={
                currentUser ? (
                    currentUser.role === 'admin' ? (
                        <Navigate to="/admin" replace />
                    ) : (
                        <Navigate to="/shg" replace />
                    )
                ) : (
                    <Navigate to="/login" replace />
                )
            } />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

function App() {
    return (
        <AppProvider>
            <Router>
                <AppRoutes />
            </Router>
        </AppProvider>
    );
}

export default App;
