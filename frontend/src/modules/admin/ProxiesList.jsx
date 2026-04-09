/**
 * Módulo 1 - Lista de Procurações
 * Exibe todas as procurações cadastradas com link para o PDF
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { listProxies } from '../../services/adminApi'

export default function ProxiesList() {
  const [proxies, setProxies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProxies = async () => {
    setLoading(true)
    const result = await listProxies()
    
    if (result.success) {
      setProxies(result.proxies)
      setError('')
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    loadProxies()
  }, [])

  const formatCpf = (cpf) => {
    if (!cpf) return '-'
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const openPdf = (pdfUrl) => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">Carregando procurações...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Procurações Cadastradas</CardTitle>
        <CardDescription>
          Lista de todas as procurações registradas no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {proxies.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Nenhuma procuração cadastrada ainda.
            Use o formulário de upload para cadastrar uma procuração.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Apartamento</TableHead>
                  <TableHead>Email Outorgante</TableHead>
                  <TableHead>CPF Outorgante</TableHead>
                  <TableHead>CPF Outorgado</TableHead>
                  <TableHead>PDF</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Upload em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proxies.map((proxy) => (
                  <TableRow key={proxy.id}>
                    <TableCell className="font-medium">{proxy.apartment || '-'}</TableCell>
                    <TableCell>{proxy.grantor_email || '-'}</TableCell>
                    <TableCell>{formatCpf(proxy.grantor_cpf)}</TableCell>
                    <TableCell>{formatCpf(proxy.grantee_cpf)}</TableCell>
                    <TableCell>
                      {proxy.pdf_url ? (
                        <Button
                          variant="link"
                          className="p-0 h-auto text-blue-600"
                          onClick={() => openPdf(proxy.pdf_url)}
                        >
                          Visualizar PDF
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-sm">Não disponível</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        proxy.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {proxy.status === 'active' ? 'Ativa' : 'Inativa'}
                      </span>
                    </TableCell>
                    <TableCell>{proxy.uploaded_at ? new Date(proxy.uploaded_at).toLocaleDateString() : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}