/**
 * Módulo 1 - Admin Dashboard
 * Dashboard com menu responsivo para desktop e mobile
 * Exibe o nome do condomínio selecionado
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../../services/firebase'
import { Button } from '../../components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '../../components/ui/sheet'
import { Menu, LogOut, Upload, FileText, List, Settings, ClipboardList, Users, Home } from 'lucide-react'
import UploadVoters from './UploadVoters'
import UploadProxy from './UploadProxy'
import ResidentsList from './ResidentsList'
import ProxiesList from './ProxiesList'
import AssemblyManager from './AssemblyManager'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { condId } = useParams()
  const [activeTab, setActiveTab] = useState('upload-voters')
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [condominiumName, setCondominiumName] = useState('')

  // Carrega o nome do condomínio do localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('selectedCondName')
    if (savedName) {
      setCondominiumName(savedName)
    }
  }, [])

  // Detecta se é mobile pelo tamanho da tela
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleLogout = async () => {
    try {
      // Limpa dados do condomínio selecionado
      localStorage.removeItem('selectedCondId')
      localStorage.removeItem('selectedCondName')
      await signOut(auth)
      navigate('/Admin')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const handleBackToCondominiums = () => {
    navigate('/admin/condominios')
  }

  const menuItems = [
    { id: 'upload-voters', label: 'Upload Votantes', icon: Upload, description: 'Importar votantes via Excel' },
    { id: 'upload-proxy', label: 'Upload Procuração', icon: FileText, description: 'Cadastrar procurações' },
    { id: 'list-residents', label: 'Listar Residentes', icon: Users, description: 'Ver todos os moradores' },
    { id: 'list-proxies', label: 'Listar Procurações', icon: ClipboardList, description: 'Ver todas as procurações' },
    { id: 'voting-items', label: 'Votações', icon: Settings, description: 'Gerenciar votações e seus itens' },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'upload-voters':
        return <UploadVoters onSuccess={() => setActiveTab('list-residents')} />
      case 'upload-proxy':
        return <UploadProxy onSuccess={() => setActiveTab('list-proxies')} />
      case 'list-residents':
        return <ResidentsList />
      case 'list-proxies':
        return <ProxiesList />
      case 'voting-items':
        return <AssemblyManager />
      default:
        return <UploadVoters onSuccess={() => setActiveTab('list-residents')} />
    }
  }

  // Versão Desktop - Tabs normais
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Desktop */}
        <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            {/* Breadcrumb */}
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <button 
                    onClick={handleBackToCondominiums}
                    className="hover:text-blue-600 flex items-center gap-1"
                  >
                    <Home className="w-4 h-4" />
                    Condomínios
                  </button>
                  <span>/</span>
                  <span className="text-gray-700 font-medium">{condominiumName || condId || 'Carregando...'}</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Painel Administrativo</h1>
                <p className="text-sm text-gray-500">
                  Gerencie votantes, procurações e votações do condomínio
                </p>
              </div>
              <Button onClick={handleLogout} variant="outline" className="hover:bg-red-50 hover:text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>
        
        {/* Desktop Tabs */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="border-b mb-6 overflow-x-auto">
            <nav className="flex space-x-4 min-w-max">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                    activeTab === item.id
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="mt-6">
            {renderContent()}
          </div>
        </main>
      </div>
    )
  }

  // Versão Mobile - Menu lateral (Drawer)
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-3">
          {/* Breadcrumb Mobile */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <button 
                onClick={handleBackToCondominiums}
                className="hover:text-blue-600 flex items-center gap-1"
              >
                <Home className="w-3 h-3" />
                Condomínios
              </button>
              <span>/</span>
              <span className="text-gray-700 font-medium truncate max-w-[150px]">
                {condominiumName || condId || 'Carregando...'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleLogout} variant="ghost" size="sm" className="text-red-500">
                <LogOut className="w-4 h-4" />
              </Button>
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
                  <SheetDescription className="sr-only">
                    Menu com opções administrativas do sistema
                  </SheetDescription>
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b bg-gray-50">
                      <h2 className="font-bold text-lg">Menu</h2>
                      <p className="text-xs text-gray-500 mt-1">
                        Condomínio: {condominiumName || condId}
                      </p>
                    </div>
                    
                    <nav className="flex-1 py-4">
                      {menuItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id)
                            setMobileMenuOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                            activeTab === item.id
                              ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-500'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                          <div className="text-left">
                            <div className="font-medium text-sm">{item.label}</div>
                            <div className="text-xs text-gray-400">{item.description}</div>
                          </div>
                        </button>
                      ))}
                    </nav>
                    
                    <div className="p-4 border-t bg-gray-50">
                      <p className="text-xs text-gray-400 text-center">
                        Versão 1.0
                      </p>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          
          {/* Título da página atual */}
          <div>
            <h1 className="text-lg font-bold text-gray-800">
              {menuItems.find(item => item.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-gray-500">
              {menuItems.find(item => item.id === activeTab)?.description}
            </p>
          </div>
        </div>
      </header>
      
      {/* Mobile Content */}
      <main className="px-4 py-4">
        {renderContent()}
      </main>
    </div>
  )
}