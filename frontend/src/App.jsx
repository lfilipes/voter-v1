/**
 * Aplicação Principal
 * Gerencia as rotas principais e integra os módulos
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AdminModule from './modules/admin/AdminModule'
import AdminLogin from './modules/admin/AdminLogin'
import AdminDashboard from './modules/admin/AdminDashboard'
import UploadVoters from './modules/admin/UploadVoters'
import UploadProxy from './modules/admin/UploadProxy'
import ResidentsList from './modules/admin/ResidentsList'
import ProxiesList from './modules/admin/ProxiesList'
import AssemblyManager from './modules/admin/AssemblyManager'
import CondominiumManager from './modules/admin/CondominiumManager'
// Importação de outros módulos futuros:
// import UserModule from './modules/user/UserModule'
// import VotingModule from './modules/voting/VotingModule'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin routes */}
        <Route path="/Admin" element={<AdminLogin />} />
        <Route path="/admin/condominios" element={<CondominiumManager />} />
        <Route path="/admin/condominios/:condId/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/condominios/:condId/votantes" element={<UploadVoters />} />
        <Route path="/admin/condominios/:condId/procuracao" element={<UploadProxy />} />
        <Route path="/admin/condominios/:condId/residentes" element={<ResidentsList />} />
        <Route path="/admin/condominios/:condId/procuracaoes" element={<ProxiesList />} />
        <Route path="/admin/condominios/:condId/votacoes" element={<AssemblyManager />} />
        {/* Módulo Admin - Acesso via URL /Admin */}
        {/* A palavra "Admin" adjacente à URL base é a forma "escondida" */}
        {/* Rotas padrão (serão implementadas nos próximos módulos) */}
        <Route path="/*" element={<div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Sistema de Votação</h1>
            <p className="text-gray-600">Acesse a área administrativa em <code className="bg-gray-100 px-2 py-1 rounded">/Admin</code></p>
          </div>
        </div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App