import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import ErrorBoundary from "@/components/ErrorBoundary"
import { ProtectedRoute } from "@/components/ProtectedRoute"

// Layouts
import { AppLayout } from "@/components/layout/AppLayout"
import { PublicLayout } from "@/components/layout/PublicLayout"

// Auth Pages
import { LoginPage } from "@/pages/auth/LoginPage"
import { SignupPage } from "@/pages/auth/SignupPage"

// Protected Dashboard Pages
import { DashboardPage } from "@/pages/dashboard/DashboardPage"
import { AssetListPage } from "@/pages/assets/AssetListPage"
import { AssetFormPage } from "@/pages/assets/AssetFormPage"
import { AssetDetailPage } from "@/pages/assets/AssetDetailPage"
import { IssueListPage } from "@/pages/issues/IssueListPage"
import { IssueDetailPage } from "@/pages/issues/IssueDetailPage"
import { TechnicianDashboard } from "@/pages/technician/TechnicianDashboard"
import { EmployeeDashboard } from "@/pages/employee/EmployeeDashboard"

// Public-Facing Pages
import { PublicAssetPage } from "@/pages/public/PublicAssetPage"
import { PublicReportPage } from "@/pages/public/PublicReportPage"
import { IssueTrackingPage } from "@/pages/public/IssueTrackingPage"

// Fallbacks
import { NotFoundPage } from "@/pages/NotFoundPage"

export function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Redirect Root to Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Public QR Scanner / Guest Pages */}
        <Route element={<PublicLayout />}>
          <Route path="/asset/:code" element={<PublicAssetPage />} />
          <Route path="/asset/:code/report" element={<PublicReportPage />} />
          <Route path="/track/:issueNumber" element={<IssueTrackingPage />} />
        </Route>

        {/* Authenticated Application Workspace (Admin, Technician & Employee) */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Main Dashboard redirection */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Admin Asset Management */}
          <Route
            path="/assets"
            element={
              <ProtectedRoute requiredRole="Admin">
                <AssetListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assets/new"
            element={
              <ProtectedRoute requiredRole="Admin">
                <AssetFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assets/:id"
            element={
              <ProtectedRoute requiredRole="Admin">
                <AssetDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assets/:id/edit"
            element={
              <ProtectedRoute requiredRole="Admin">
                <AssetFormPage />
              </ProtectedRoute>
            }
          />

          {/* Admin / Tech Issue Management */}
          <Route
            path="/issues"
            element={
              <ProtectedRoute requiredRole="Admin">
                <IssueListPage />
              </ProtectedRoute>
            }
          />
          <Route path="/issues/:id" element={<IssueDetailPage />} />

          {/* Technician Dashboard workspace */}
          <Route
            path="/technician"
            element={
              <ProtectedRoute requiredRole="Technician">
                <TechnicianDashboard />
              </ProtectedRoute>
            }
          />
          {/* Tech issues redirect to standard detail page (fully role-aware) */}
          <Route
            path="/technician/issues/:id"
            element={
              <ProtectedRoute requiredRole="Technician">
                <IssueDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Employee Dashboard workspace */}
          <Route
            path="/employee"
            element={
              <ProtectedRoute requiredRole="Employee">
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  )
}
export default App
