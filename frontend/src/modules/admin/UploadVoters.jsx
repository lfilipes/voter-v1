/**
 * Módulo 1 - Upload de Votantes
 * Formulário para upload de Excel com cadastro de votantes
 * 
 * O Excel deve conter as colunas:
 * - nome (obrigatório)
 * - email (obrigatório)
 * - apartamento (obrigatório)
 * - cpf (obrigatório - CPF do dono do apartamento)
 */

import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { uploadVotersExcel } from '../../services/adminApi'

export default function UploadVoters({ onSuccess }) {
  const [file, setFile] = useState(null)
  const [electionName, setElectionName] = useState('')
  const [electionNumber, setElectionNumber] = useState('')
  const [electionDate, setElectionDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [validationErrors, setValidationErrors] = useState([])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls'))) {
      setFile(selectedFile)
      setError('')
      setValidationErrors([])
    } else {
      setFile(null)
      setError('Por favor, selecione um arquivo Excel válido (.xlsx ou .xls)')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!file) {
      setError('Selecione um arquivo Excel')
      return
    }
    
    if (!electionName.trim()) {
      setError('Digite o nome da votação')
      return
    }
    
    if (!electionNumber.trim()) {
      setError('Digite o número da votação')
      return
    }
    
    setLoading(true)
    setError('')
    setSuccess('')
    setValidationErrors([])
    
    const result = await uploadVotersExcel(file, {
      name: electionName,
      number: electionNumber,
      date: electionDate
    })
    
    if (result.success) {
      setSuccess(`Votação "${electionName}" cadastrada com sucesso! ${result.data.voters_saved} votantes importados.`)
      
      if (result.data.errors && result.data.errors.length > 0) {
        setValidationErrors(result.data.errors)
      }
      
      setFile(null)
      setElectionName('')
      setElectionNumber('')
      setElectionDate('')
      document.getElementById('excel-file').value = ''
      if (onSuccess) onSuccess()
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload de Votantes</CardTitle>
        <CardDescription>
          Faça upload de uma planilha Excel com os dados dos votantes.
          O arquivo deve conter as colunas: <strong>nome</strong>, <strong>email</strong>, <strong>apartamento</strong> e <strong>cpf</strong> (CPF do dono do apartamento).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          
          {validationErrors.length > 0 && (
            <Alert className="bg-yellow-50 border-yellow-500">
              <AlertDescription className="text-yellow-700">
                <p className="font-bold">Avisos de validação:</p>
                <ul className="list-disc list-inside text-sm mt-1">
                  {validationErrors.slice(0, 5).map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                  {validationErrors.length > 5 && (
                    <li>... e mais {validationErrors.length - 5} erro(s)</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="election_name">Nome da Votação</Label>
            <Input
              id="election_name"
              value={electionName}
              onChange={(e) => setElectionName(e.target.value)}
              placeholder="Ex: Eleição do Condomínio 2024"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="election_number">Número da Votação</Label>
            <Input
              id="election_number"
              value={electionNumber}
              onChange={(e) => setElectionNumber(e.target.value)}
              placeholder="Ex: 001/2024"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="election_date">Data da Votação (opcional)</Label>
            <Input
              id="election_date"
              type="date"
              value={electionDate}
              onChange={(e) => setElectionDate(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="excel-file">Arquivo Excel</Label>
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              required
            />
            <p className="text-sm text-gray-500">
              O Excel deve ter as colunas: nome, email, apartamento, cpf
            </p>
            <p className="text-sm text-gray-400">
              O CPF deve ter 11 dígitos (pode ser com ou sem formatação)
            </p>
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Enviando...' : 'Upload - Cadastro de Votantes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}