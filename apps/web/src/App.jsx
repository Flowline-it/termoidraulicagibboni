import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientiPage from './pages/ClientiPage';
import ClienteDetailPage from './pages/ClienteDetailPage';
import ImpiantiPage from './pages/ImpiantiPage';
import ScadenzarioPage from './pages/ScadenzarioPage';
import ChiamatePage from './pages/ChiamatePage';
import AgendaPage from './pages/AgendaPage';
import CommessePage from './pages/CommessePage';
import CommessaDetailPage from './pages/CommessaDetailPage';
import RapportiniPage from './pages/RapportiniPage';
import DocumentiPage from './pages/DocumentiPage';

function App() {
    return (
        <AuthProvider>
            <Router basename={import.meta.env.BASE_URL}>
                <ScrollToTop />
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/clienti" element={<ClientiPage />} />
                        <Route path="/clienti/:id" element={<ClienteDetailPage />} />
                        <Route path="/impianti" element={<ImpiantiPage />} />
                        <Route path="/scadenzario" element={<ScadenzarioPage />} />
                        <Route path="/chiamate" element={<ChiamatePage />} />
                        <Route path="/agenda" element={<AgendaPage />} />
                        <Route path="/commesse" element={<CommessePage />} />
                        <Route path="/commesse/:id" element={<CommessaDetailPage />} />
                        <Route path="/rapportini" element={<RapportiniPage />} />
                        <Route path="/documenti" element={<DocumentiPage />} />
                    </Route>
                </Routes>
                <Toaster position="top-right" richColors />
            </Router>
        </AuthProvider>
    );
}

export default App;
