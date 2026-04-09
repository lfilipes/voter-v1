/**
 * Aplicação Principal
 * Gerencia as rotas principais e integra os módulos
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AdminModule from './modules/admin/AdminModule'

// Importação de outros módulos futuros:
// import UserModule from './modules/user/UserModule'
// import VotingModule from './modules/voting/VotingModule'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Módulo Admin - Acesso via URL /Admin */}
        {/* A palavra "Admin" adjacente à URL base é a forma "escondida" */}
        <Route path="/Admin/*" element={<AdminModule />} />
        
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