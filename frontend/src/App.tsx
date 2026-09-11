import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { GlossaryProvider } from './components/common/TermTooltip';
import ProtectedRoute from './components/common/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Reconciliation from './pages/Reconciliation';
import Exceptions from './pages/Exceptions';
import ExceptionDetails from './pages/ExceptionDetails';
import Governance from './pages/Governance';
import Anomalies from './pages/Anomalies';
import About from './pages/About';
import Calculator from './pages/Calculator';
import Login from './pages/Login';
import Signup from './pages/Signup';
import LandingPage from './pages/LandingPage';
import AuditLogs from './pages/AuditLogs';
import RecoveryCommandCenter from './pages/RecoveryCommandCenter';
import BatchRecovery from './pages/BatchRecovery';
import RecoveryCases from './pages/RecoveryCases';
import RecoveryCaseDetail from './pages/RecoveryCaseDetail';
import RecoveryPriorityQueue from './pages/RecoveryPriorityQueue';
import OperatorQueue from './pages/OperatorQueue';
import RevenueLeakage from './pages/RevenueLeakage';
import RecoveryIntelligence from './pages/RecoveryIntelligence';
import LiveRecovery from './pages/LiveRecovery';
import ProjectChatbot from './components/common/ProjectChatbot';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GlossaryProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes — no auth required */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected routes — require authentication */}
              <Route path="/operator-queue" element={<ProtectedRoute><OperatorQueue /></ProtectedRoute>} />
              <Route path="/recovery" element={<ProtectedRoute><RecoveryCommandCenter /></ProtectedRoute>} />
              <Route path="/live-recovery" element={<ProtectedRoute><LiveRecovery /></ProtectedRoute>} />
              <Route path="/recovery/batch" element={<ProtectedRoute><BatchRecovery /></ProtectedRoute>} />
              <Route path="/recovery/cases" element={<ProtectedRoute><RecoveryCases /></ProtectedRoute>} />
              <Route path="/recovery/cases/:id" element={<ProtectedRoute><RecoveryCaseDetail /></ProtectedRoute>} />

              <Route path="/leakage" element={<ProtectedRoute><RevenueLeakage /></ProtectedRoute>} />
              <Route path="/intelligence" element={<ProtectedRoute><RecoveryIntelligence /></ProtectedRoute>} />
              <Route path="/simulator" element={<ProtectedRoute><Calculator /></ProtectedRoute>} />

              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/reconciliation" element={<ProtectedRoute><Reconciliation /></ProtectedRoute>} />
              <Route path="/exceptions" element={<ProtectedRoute><Exceptions /></ProtectedRoute>} />
              <Route path="/exceptions/:id" element={<ProtectedRoute><ExceptionDetails /></ProtectedRoute>} />
              <Route path="/anomalies" element={<ProtectedRoute><Anomalies /></ProtectedRoute>} />
              <Route path="/governance" element={<ProtectedRoute><Governance /></ProtectedRoute>} />
              <Route path="/audit" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
              <Route path="/calculator" element={<ProtectedRoute><Calculator /></ProtectedRoute>} />
              <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
            </Routes>
            {/* Global Omniscient AI Project Chatbot */}
            <ProjectChatbot />
          </BrowserRouter>
        </GlossaryProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
