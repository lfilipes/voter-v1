/**
 * Módulo 1 - Lista de Votações
 * Exibe todas as votações cadastradas com botão para ver votantes
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table'
import { Button } from '../../components/ui/button'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { listElections } from '../../services/adminApi'
import ElectionVotersModal from './ElectionVotersModal'

export default function ElectionsList() {
  const [elections, setElections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedElection, setSelectedElection] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const loadElections = async () => {
    setLoading(true)
    const result = await listElections()
    
    if (result.success) {
      setElections(result.elections)
      setError('')
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    loadElections()
  }, [])

  const handleViewVoters = (election) => {
    setSelectedElection(election)
    setModalOpen(true)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">Carregando votações...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Votações Cadastradas</CardTitle>
          <CardDescription>
            Lista de todas as votações registradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {elections.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Nenhuma votação cadastrada ainda.
              Use o formulário de upload para cadastrar uma votação.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Votantes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cadastrado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {elections.map((election) => (
                    <TableRow key={election.id}>
                      <TableCell className="font-medium">{election.election_number}</TableCell>
                      <TableCell>{election.name}</TableCell>
                      <TableCell>{election.date || '-'}</TableCell>
                      <TableCell>{election.voters_count}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          election.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {election.status === 'active' ? 'Ativa' : 'Finalizada'}
                        </span>
                      </TableCell>
                      <TableCell>{election.created_at ? new Date(election.created_at).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewVoters(election)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          👥 Ver Votantes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modal de votantes */}
      <ElectionVotersModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        election={selectedElection}
      />
    </>
  )
}