import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/modules/auth/LoginPage'
import { RegisterPage } from '@/modules/auth/RegisterPage'
import { ForgotPasswordPage } from '@/modules/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/modules/auth/ResetPasswordPage'
import { DashboardPage } from '@/modules/dashboard/DashboardPage'
import { TransactionsPage } from '@/modules/transactions/TransactionsPage'
import { FixedBillsPage } from '@/modules/fixed/FixedBillsPage'
import { CardsPage } from '@/modules/cards/CardsPage'
import { ProjectsPage } from '@/modules/projects/ProjectsPage'
import { BankAccountsPage } from '@/modules/bank-accounts/BankAccountsPage'
import { SettingsPage } from '@/modules/settings/SettingsPage'

export default function App() {
  const initialize = useAuthStore((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/fixed" element={<FixedBillsPage />} />
            <Route path="/cards" element={<CardsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/accounts" element={<BankAccountsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
