/**
 * Módulo 1 - Admin Dashboard
 * Dashboard com menu responsivo para desktop e mobile
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { Menu, LogOut, Upload, FileText, List, Settings, ClipboardList } from 'lucide-react'
import UploadVoters from './UploadVoters'
import UploadProxy from './UploadProxy'
import ElectionsList from './ElectionsList'
import ProxiesList from './ProxiesList'
import VotingItemsManager from './VotingItemsManager'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('upload-voters')
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      await signOut(auth)
      navigate('/Admin')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const menuItems = [
    { id: 'upload-voters', label: 'Upload Votantes', icon: Upload, description: 'Importar votantes via Excel' },
    { id: 'upload-proxy', label: 'Upload Procuração', icon: FileText, description: 'Cadastrar procurações' },
    { id: 'list-elections', label: 'Listar Votações', icon: List, description: 'Ver todas as votações' },
    { id: 'list-proxies', label: 'Listar Procurações', icon: ClipboardList, description: 'Ver todas as procurações' },
    { id: 'voting-items', label: 'Itens de Votação', icon: Settings, description: 'Gerenciar itens para votação' },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'upload-voters':
        return <UploadVoters onSuccess={() => setActiveTab('list-elections')} />
      case 'upload-proxy':
        return <UploadProxy onSuccess={() => setActiveTab('list-proxies')} />
      case 'list-elections':
        return <ElectionsList />
      case 'list-proxies':
        return <ProxiesList />
      case 'voting-items':
        return <VotingItemsManager />
      default:
        return <UploadVoters onSuccess={() => setActiveTab('list-elections')} />
    }
  }

  const handleMenuClick = (itemId) => {
    setActiveTab(itemId)
    setMobileMenuOpen(false) // Fecha o menu após clicar
  }

  // Versão Desktop - Tabs normais
  if (!isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Painel Administrativo</h1>
              <p className="text-sm text-gray-500">Sistema de Gerenciamento de Votações</p>
            </div>
            <Button onClick={handleLogout} variant="outline" className="hover:bg-red-50 hover:text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
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
        <div className="px-4 py-3 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Painel Admin</h1>
            <p className="text-xs text-gray-500">Sistema de Votações</p>
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
                    <p className="text-xs text-gray-500 mt-1">Selecione uma opção</p>
                  </div>
                  
                  <nav className="flex-1 py-4">
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleMenuClick(item.id)}
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
      </header>
      
      {/* Mobile Content - Título da página atual */}
      <main className="px-4 py-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {menuItems.find(item => item.id === activeTab)?.label}
          </h2>
          <p className="text-sm text-gray-500">
            {menuItems.find(item => item.id === activeTab)?.description}
          </p>
        </div>
        
        {renderContent()}
      </main>
    </div>
  )
}