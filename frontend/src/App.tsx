import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { GlossaryProvider } from './components/common/TermTooltip';
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
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/operator-queue" element={<OperatorQueue />} />
              <Route path="/recovery" element={<RecoveryCommandCenter />} />
              <Route path="/recovery/priority" element={<RecoveryPriorityQueue />} />
              <Route path="/recovery-priority" element={<RecoveryPriorityQueue />} />
              <Route path="/live-recovery" element={<LiveRecovery />} />
              <Route path="/recovery/batch" element={<BatchRecovery />} />
              <Route path="/recovery/cases" element={<RecoveryCases />} />
              <Route path="/recovery/cases/:id" element={<RecoveryCaseDetail />} />

              <Route path="/leakage" element={<RevenueLeakage />} />
              <Route path="/intelligence" element={<RecoveryIntelligence />} />
              <Route path="/simulator" element={<Calculator />} />

              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reconciliation" element={<Reconciliation />} />
              <Route path="/exceptions" element={<Exceptions />} />
              <Route path="/exceptions/:id" element={<ExceptionDetails />} />
              <Route path="/anomalies" element={<Anomalies />} />
              <Route path="/governance" element={<Governance />} />
              <Route path="/audit" element={<AuditLogs />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/about" element={<About />} />
            </Routes>
            {/* Global Omniscient AI Project Chatbot */}
            <ProjectChatbot />
          </BrowserRouter>
        </GlossaryProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

