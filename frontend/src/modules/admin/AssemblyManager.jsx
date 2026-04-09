/**
 * Gerenciador de Assembleias / Votações
 * Permite criar, listar e gerenciar itens de votações existentes
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { 
  createAssembly, 
  addAssemblyItem, 
  updateItemRelease, 
  getAssemblies,
  getAssemblyItems 
} from '../../services/adminApi'

export default function AssemblyManager() {
  const { condId } = useParams()
  
  // Estado para lista de votações
  const [assemblies, setAssemblies] = useState([])
  const [loadingAssemblies, setLoadingAssemblies] = useState(true)
  
  // Estado para criação da assembleia
  const [assemblyNumber, setAssemblyNumber] = useState('')
  const [assemblyName, setAssemblyName] = useState('')
  const [assemblyDate, setAssemblyDate] = useState('')
  const [informativeText, setInformativeText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Estado para itens
  const [currentAssembly, setCurrentAssembly] = useState(null)
  const [items, setItems] = useState([])
  const [newItemDescription, setNewItemDescription] = useState('')
  const [itemLoading, setItemLoading] = useState(false)
  const [itemError, setItemError] = useState('')
  const [itemSuccess, setItemSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('list')

  // Carregar lista de votações
  const loadAssemblies = async () => {
    if (!condId) return
    setLoadingAssemblies(true)
    const result = await getAssemblies(condId)
    if (result.success) {
      setAssemblies(result.assemblies || [])
    }
    setLoadingAssemblies(false)
  }

  // Carregar itens de uma votação específica
  const loadAssemblyItems = async (assemblyNumber) => {
    const result = await getAssemblyItems(condId, assemblyNumber)
    if (result.success) {
      setItems(result.items || [])
    }
    return result
  }

  useEffect(() => {
    loadAssemblies()
  }, [condId])

  const handleCreateAssembly = async (e) => {
    e.preventDefault()
    
    if (!assemblyNumber.trim()) {
      setError('Número da votação é obrigatório')
      return
    }
    
    if (!assemblyName.trim()) {
      setError('Nome da votação é obrigatório')
      return
    }
    
    setLoading(true)
    setError('')
    setSuccess('')
    
    const result = await createAssembly(condId, {
      number: assemblyNumber,
      name: assemblyName,
      date: assemblyDate,
      informative_text: informativeText,
      description: informativeText.substring(0, 200)
    })
    
    if (result.success) {
      setSuccess(`Votação "${assemblyName}" criada com sucesso!`)
      await loadAssemblies()  // Recarrega a lista
      setAssemblyNumber('')
      setAssemblyName('')
      setAssemblyDate('')
      setInformativeText('')
      
      setTimeout(() => setSuccess(''), 3000)
      setActiveTab('list')  // Volta para a lista
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const handleSelectAssembly = async (assembly) => {
    setCurrentAssembly(assembly)
    const result = await loadAssemblyItems(assembly.number)
    if (result.success) {
      setItems(result.items || [])
      setActiveTab('items')
    } else {
      setItemError(result.error)
    }
  }

  const handleAddItem = async () => {
    if (!newItemDescription.trim()) {
      setItemError('Digite a descrição do item')
      setTimeout(() => setItemError(''), 3000)
      return
    }
    
    if (!currentAssembly) {
      setItemError('Nenhuma assembleia selecionada')
      setTimeout(() => setItemError(''), 3000)
      return
    }
    
    if (items.length >= 10) {
      setItemError('Máximo de 10 itens por votação')
      setTimeout(() => setItemError(''), 3000)
      return
    }
    
    setItemLoading(true)
    setItemError('')
    setItemSuccess('')
    
    const result = await addAssemblyItem(condId, currentAssembly.number, {
      order: items.length + 1,
      title: `Item ${items.length + 1}`,
      description: newItemDescription,
      type: 'approve_reject',
      is_released: false,
      is_locked: false
    })
    
    if (result.success) {
      const newItem = {
        id: result.item_id,
        order: items.length + 1,
        description: newItemDescription,
        is_released: false,
        is_locked: false
      }
      setItems([...items, newItem])
      setNewItemDescription('')
      setItemSuccess(`Item ${items.length + 1} adicionado com sucesso!`)
      setTimeout(() => setItemSuccess(''), 2000)
    } else {
      setItemError(result.error)
      setTimeout(() => setItemError(''), 3000)
    }
    
    setItemLoading(false)
  }

  const handleRemoveItem = async (index) => {
    const newItems = items.filter((_, i) => i !== index)
    const reorderedItems = newItems.map((item, idx) => ({
      ...item,
      order: idx + 1,
      title: `Item ${idx + 1}`
    }))
    setItems(reorderedItems)
    setItemSuccess(`Item removido`)
    setTimeout(() => setItemSuccess(''), 2000)
  }

  const handleToggleRelease = async (itemId, currentStatus) => {
    const result = await updateItemRelease(condId, currentAssembly.number, itemId, !currentStatus)
    if (result.success) {
      setItems(items.map(item => 
        item.id === itemId ? { ...item, is_released: !currentStatus } : item
      ))
      setItemSuccess(`Item ${!currentStatus ? 'liberado' : 'bloqueado'} para votação`)
      setTimeout(() => setItemSuccess(''), 2000)
    }
  }

  const handleBackToList = () => {
    setCurrentAssembly(null)
    setItems([])
    setActiveTab('list')
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">📋 Listar Votações</TabsTrigger>
          <TabsTrigger value="create">➕ Criar Nova</TabsTrigger>
          <TabsTrigger value="items" disabled={!currentAssembly}>
            📝 Gerenciar Itens {currentAssembly && `(${items.length}/10)`}
          </TabsTrigger>
        </TabsList>
        
        {/* Aba: Listar Votações */}
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Votações Cadastradas</CardTitle>
              <CardDescription>
                Selecione uma votação para gerenciar seus itens
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAssemblies ? (
                <div className="text-center py-8 text-gray-500">Carregando votações...</div>
              ) : assemblies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma votação cadastrada. Clique em "Criar Nova" para começar.
                </div>
              ) : (
                <div className="space-y-3">
                  {assemblies.map((assembly) => (
                    <div key={assembly.number} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {assembly.number}
                          </span>
                          <span className="font-medium">{assembly.name}</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {assembly.date && <span>Data: {new Date(assembly.date).toLocaleDateString()} | </span>}
                          <span>Itens: {assembly.items_count || 0}</span>
                          <span className="ml-2">
                            Status: {assembly.status === 'active' ? '✅ Ativa' : '🔒 Finalizada'}
                          </span>
                        </div>
                      </div>
                      <Button onClick={() => handleSelectAssembly(assembly)}>
                        Gerenciar Itens
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Aba: Criar Nova Votação */}
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Criar Nova Votação</CardTitle>
              <CardDescription>
                Cadastre uma nova assembleia/votação para este condomínio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAssembly} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {success && (
                  <Alert className="bg-green-50 border-green-500">
                    <AlertDescription className="text-green-700">{success}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assembly_number">Número da Votação *</Label>
                    <Input
                      id="assembly_number"
                      value={assemblyNumber}
                      onChange={(e) => setAssemblyNumber(e.target.value)}
                      placeholder="Ex: 001/2024"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="assembly_name">Nome da Votação *</Label>
                    <Input
                      id="assembly_name"
                      value={assemblyName}
                      onChange={(e) => setAssemblyName(e.target.value)}
                      placeholder="Ex: Assembleia Geral 2024"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="assembly_date">Data da Votação</Label>
                  <Input
                    id="assembly_date"
                    type="datetime-local"
                    value={assemblyDate}
                    onChange={(e) => setAssemblyDate(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="informative_text">Informativo da Assembleia</Label>
                  <textarea
                    id="informative_text"
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                    value={informativeText}
                    onChange={(e) => setInformativeText(e.target.value)}
                    placeholder="Descreva o objetivo da assembleia, instruções para votação, etc."
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Votação'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Aba: Gerenciar Itens */}
        <TabsContent value="items">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Gerenciar Itens da Votação</CardTitle>
                  <CardDescription>
                    <div className="space-y-1 mt-2">
                      <p><strong>Votação:</strong> {currentAssembly?.name}</p>
                      <p><strong>Número:</strong> {currentAssembly?.number}</p>
                      {currentAssembly?.date && (
                        <p><strong>Data:</strong> {new Date(currentAssembly.date).toLocaleString()}</p>
                      )}
                    </div>
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={handleBackToList}>
                  ← Voltar para lista
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentAssembly?.informative_text && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700 font-semibold">Informativo:</p>
                  <p className="text-sm text-gray-600">{currentAssembly.informative_text}</p>
                </div>
              )}
              
              {itemError && (
                <Alert variant="destructive">
                  <AlertDescription>{itemError}</AlertDescription>
                </Alert>
              )}
              
              {itemSuccess && (
                <Alert className="bg-green-50 border-green-500">
                  <AlertDescription className="text-green-700">{itemSuccess}</AlertDescription>
                </Alert>
              )}
              
              {items.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">Itens cadastrados ({items.length}/10)</Label>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                        <div className="flex-1">
                          <span className="font-medium text-blue-600">Item {item.order}:</span>
                          <span className="ml-2 text-gray-700">{item.description}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.is_released 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {item.is_released ? '✓ Liberado' : '⏳ Não liberado'}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleRelease(item.id, item.is_released)}
                            className={item.is_released ? 'text-yellow-600' : 'text-green-600'}
                          >
                            {item.is_released ? 'Bloquear' : 'Liberar'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕ Remover
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-3 border-t pt-4">
                <Label className="text-lg font-semibold">Adicionar novo item</Label>
                <div className="flex gap-2">
                  <Input
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    placeholder="Ex: Aprovação do orçamento 2025"
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                  />
                  <Button onClick={handleAddItem} disabled={itemLoading}>
                    {itemLoading ? 'Adicionando...' : '+ Adicionar Item'}
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Máximo de 10 itens. Após adicionar, você pode liberar cada item individualmente para votação.
                  {items.length === 10 && <span className="text-red-500 block">Limite de 10 itens atingido.</span>}
                </p>
              </div>
              
              {items.length === 0 && (
                <Alert>
                  <AlertDescription>
                    Nenhum item cadastrado. Adicione os itens que serão votados nesta assembleia.
                  </AlertDescription>
                </Alert>
              )}
              
              {items.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-700">
                      <strong>Resumo:</strong> {items.length} item(ns) cadastrado(s). 
                      {items.filter(i => i.is_released).length} liberado(s) para votação.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}