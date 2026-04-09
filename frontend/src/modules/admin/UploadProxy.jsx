/**
 * Módulo 1 - Upload de Procuração
 * Formulário completo com campos para:
 * - Apartamento
 * - Email do outorgante
 * - CPF do outorgante
 * - CPF do outorgado
 * - Upload do PDF da procuração
 */

import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { uploadProxyPdf } from '../../services/adminApi'

export default function UploadProxy({ onSuccess }) {
  const [file, setFile] = useState(null)
  const [apartment, setApartment] = useState('')
  const [grantorEmail, setGrantorEmail] = useState('')
  const [grantorCpf, setGrantorCpf] = useState('')
  const [granteeCpf, setGranteeCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Função para formatar CPF automaticamente
  const formatCpf = (value) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
  }

  const handleCpfChange = (setter) => (e) => {
    const formatted = formatCpf(e.target.value)
    setter(formatted)
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.name.endsWith('.pdf')) {
      setFile(selectedFile)
      setError('')
    } else {
      setFile(null)
      setError('Por favor, selecione um arquivo PDF válido')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validações
    if (!file) {
      setError('Selecione o arquivo PDF da procuração')
      return
    }
    
    if (!apartment.trim()) {
      setError('Digite o número do apartamento')
      return
    }
    
    if (!grantorEmail.trim()) {
      setError('Digite o email do outorgante')
      return
    }
    
    // Valida email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(grantorEmail)) {
      setError('Email do outorgante inválido')
      return
    }
    
    // Valida CPF outorgante
    const cpfDigits = grantorCpf.replace(/\D/g, '')
    if (cpfDigits.length !== 11) {
      setError('CPF do outorgante deve ter 11 dígitos')
      return
    }
    
    // Valida CPF outorgado
    const cpfGranteeDigits = granteeCpf.replace(/\D/g, '')
    if (cpfGranteeDigits.length !== 11) {
      setError('CPF do outorgado deve ter 11 dígitos')
      return
    }
    
    setLoading(true)
    setError('')
    setSuccess('')
    
    const result = await uploadProxyPdf(file, {
      apartment: apartment,
      grantor_email: grantorEmail,
      grantor_cpf: cpfDigits,  // envia apenas dígitos
      grantee_cpf: cpfGranteeDigits
    })
    
    if (result.success) {
      setSuccess(`Procuração cadastrada com sucesso! Apartamento ${apartment}`)
      // Limpa o formulário
      setFile(null)
      setApartment('')
      setGrantorEmail('')
      setGrantorCpf('')
      setGranteeCpf('')
      // Limpa o input file
      document.getElementById('pdf-file').value = ''
      if (onSuccess) onSuccess()
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastro de Procuração</CardTitle>
        <CardDescription>
          Preencha todos os campos abaixo e faça o upload do arquivo PDF da procuração.
          O PDF será armazenado no Firebase Storage.
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
          
          {/* Campo: Apartamento */}
          <div className="space-y-2">
            <Label htmlFor="apartment">Número do Apartamento *</Label>
            <Input
              id="apartment"
              type="text"
              value={apartment}
              onChange={(e) => setApartment(e.target.value)}
              placeholder="Ex: 101, 202, 305"
              required
            />
            <p className="text-sm text-gray-500">Número do apartamento do outorgante</p>
          </div>
          
          {/* Campo: Email do Outorgante */}
          <div className="space-y-2">
            <Label htmlFor="grantor_email">Email do Outorgante *</Label>
            <Input
              id="grantor_email"
              type="email"
              value={grantorEmail}
              onChange={(e) => setGrantorEmail(e.target.value)}
              placeholder="email@exemplo.com"
              required
            />
            <p className="text-sm text-gray-500">Email da pessoa que está dando a procuração</p>
          </div>
          
          {/* Campo: CPF do Outorgante */}
          <div className="space-y-2">
            <Label htmlFor="grantor_cpf">CPF do Outorgante *</Label>
            <Input
              id="grantor_cpf"
              type="text"
              value={grantorCpf}
              onChange={handleCpfChange(setGrantorCpf)}
              placeholder="123.456.789-00"
              maxLength={14}
              required
            />
            <p className="text-sm text-gray-500">CPF da pessoa que está dando a procuração</p>
          </div>
          
          {/* Campo: CPF do Outorgado */}
          <div className="space-y-2">
            <Label htmlFor="grantee_cpf">CPF do Outorgado *</Label>
            <Input
              id="grantee_cpf"
              type="text"
              value={granteeCpf}
              onChange={handleCpfChange(setGranteeCpf)}
              placeholder="123.456.789-00"
              maxLength={14}
              required
            />
            <p className="text-sm text-gray-500">CPF da pessoa que está recebendo a procuração</p>
          </div>
          
          {/* Campo: Upload do PDF */}
          <div className="space-y-2">
            <Label htmlFor="pdf-file">Arquivo PDF da Procuração *</Label>
            <Input
              id="pdf-file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              required
            />
            <p className="text-sm text-gray-500">Envie o PDF da procuração (uma página)</p>
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar Procuração'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}