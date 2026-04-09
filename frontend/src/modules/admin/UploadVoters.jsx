/**
 * Módulo 1 - Upload de Votantes
 * Formulário para upload de Excel com cadastro de votantes
 * 
 * O Excel deve conter as colunas:
 * - nome (obrigatório)
 * - email (obrigatório)
 * - apartamento (obrigatório)
 * - cpf (obrigatório)
 */

import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { uploadResidentsExcel } from '../../services/adminApi'

export default function UploadVoters({ onSuccess }) {
  const { condId } = useParams()  // Get condominium ID from URL
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [importSummary, setImportSummary] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls'))) {
      setFile(selectedFile)
      setError('')
      setImportSummary(null)
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
    
    setLoading(true)
    setError('')
    setSuccess('')
    setImportSummary(null)
    
    const result = await uploadResidentsExcel(condId, file)
    
    if (result.success) {
      setSuccess(`${result.created} votantes importados com sucesso!`)
      setImportSummary({
        created: result.created,
        total: result.total,
        errors: result.errors,
        warnings: result.warnings
      })
      setFile(null)
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
          O arquivo deve conter as colunas: <strong>nome</strong>, <strong>email</strong>, <strong>apartamento</strong> e <strong>cpf</strong>.
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
          
          {importSummary && importSummary.warnings && importSummary.warnings.length > 0 && (
            <Alert className="bg-yellow-50 border-yellow-500">
              <AlertDescription className="text-yellow-700">
                <p className="font-bold">Avisos:</p>
                <ul className="list-disc list-inside text-sm mt-1">
                  {importSummary.warnings.slice(0, 5).map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
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
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Enviando...' : 'Upload e Cadastrar Votantes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}