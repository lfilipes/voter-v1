/**
 * Modal para exibir a lista de votantes de uma votação
 */

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/table'
import { getVotersByElection } from '../../services/adminApi'

export default function ElectionVotersModal({ isOpen, onClose, election }) {
  const [voters, setVoters] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && election && election.election_number) {
      loadVoters()
    } else {
      setVoters([])
      setLoading(false)
      setError('')
    }
  }, [isOpen, election])

  const loadVoters = async () => {
    setLoading(true)
    setError('')
    
    const result = await getVotersByElection(election.election_number)
    
    if (result.success) {
      setVoters(result.voters)
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  // Formata CPF para exibição
  const formatCpf = (cpf) => {
    if (!cpf) return '-'
    const cpfClean = cpf.replace(/\D/g, '')
    if (cpfClean.length !== 11) return cpf
    return cpfClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  if (!election) {
    return null
  }

  const electionName = election.name || 'Votação'
  const electionNumber = election.election_number || '-'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Votantes - {electionName}</DialogTitle>
          <DialogDescription>
            Número da votação: {electionNumber} | Total de votantes: {voters.length}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          {loading && (
            <div className="text-center py-8 text-gray-500">
              Carregando votantes...
            </div>
          )}
          
          {error && (
            <div className="text-center py-8 text-red-500">
              Erro: {error}
            </div>
          )}
          
          {!loading && !error && voters.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum votante cadastrado para esta votação.
            </div>
          )}
          
          {!loading && !error && voters.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Apartamento</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voters.map((voter) => (
                    <TableRow key={voter.id}>
                      <TableCell className="font-medium">{voter.apartment || '-'}</TableCell>
                      <TableCell>{voter.name}</TableCell>
                      <TableCell className="font-mono">{formatCpf(voter.cpf)}</TableCell>
                      <TableCell>{voter.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          voter.has_voted 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {voter.has_voted ? 'Votou' : 'Aguardando'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}