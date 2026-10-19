import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { VendorListPage } from './pages/VendorListPage';
import { VendorFormPage } from './pages/VendorFormPage';
import { VendorDetailPage } from './pages/VendorDetailPage';
import { TaskManagementPage } from './pages/TaskManagementPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            fontSize: '12px',
            fontWeight: 500,
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="vendors" element={<VendorListPage />} />
          <Route path="vendors/new" element={<VendorFormPage />} />
          <Route path="vendors/:id" element={<VendorDetailPage />} />
          <Route path="vendors/:id/edit" element={<VendorFormPage />} />
          <Route path="tasks" element={<TaskManagementPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
