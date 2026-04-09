/**
 * Serviço de API para o módulo Admin
 * Todas as chamadas para o backend Flask ficam aqui
 */

import { auth } from './firebase'

const API_URL = process.env.REACT_APP_FLASK_API_URL || 'http://localhost:5000/api'

/**
 * Obtém o token de autenticação do Firebase
 */
async function getIdToken() {
  const user = auth.currentUser
  if (!user) throw new Error('Usuário não autenticado')
  
  // Força renovação do token
  const token = await user.getIdToken(true)
  return token
}

/**
 * Upload de Excel com votantes
 */
export async function uploadVotersExcel(file, electionData) {
  try {
    const token = await getIdToken()
    const formData = new FormData()
    
    formData.append('file', file)
    formData.append('election_name', electionData.name)
    formData.append('election_number', electionData.number)
    formData.append('election_date', electionData.date || '')
    
    const response = await fetch(`${API_URL}/admin/upload-voters`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao fazer upload')
    }
    
    return { success: true, data }
  } catch (error) {
    console.error('Upload de Excel falhou:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Upload de PDF de procuração com dados do formulário
 */
export async function uploadProxyPdf(file, formData) {
  try {
    const token = await getIdToken()
    const data = new FormData()
    
    data.append('file', file)
    data.append('apartment', formData.apartment)
    data.append('grantor_email', formData.grantor_email)
    data.append('grantor_cpf', formData.grantor_cpf)
    data.append('grantee_cpf', formData.grantee_cpf)
    
    console.log('Enviando dados para o backend:')
    console.log('  - Apartamento:', formData.apartment)
    console.log('  - Email outorgante:', formData.grantor_email)
    console.log('  - CPF outorgante:', formData.grantor_cpf)
    console.log('  - CPF outorgado:', formData.grantee_cpf)
    console.log('  - Arquivo:', file.name)
    
    const response = await fetch(`${API_URL}/admin/upload-proxy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: data
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'Erro ao fazer upload')
    }
    
    console.log('Resposta do backend:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('Upload de PDF falhou:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Lista todas as votações
 */
export async function listElections() {
  try {
    const token = await getIdToken()
    
    const response = await fetch(`${API_URL}/admin/elections`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao buscar votações')
    }
    
    return { success: true, elections: data.elections, count: data.count }
  } catch (error) {
    console.error('Erro ao listar votações:', error)
    return { success: false, error: error.message, elections: [] }
  }
}

/**
 * Busca todos os votantes de uma votação específica
 */
export async function getVotersByElection(electionNumber) {
  try {
    const token = await getIdToken()
    
    const response = await fetch(`${API_URL}/admin/voters/${encodeURIComponent(electionNumber)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao buscar votantes')
    }
    
    return { success: true, voters: data.voters, count: data.count }
  } catch (error) {
    console.error('Erro ao buscar votantes:', error)
    return { success: false, error: error.message, voters: [] }
  }
}

/**
 * Lista todas as procurações
 */
export async function listProxies() {
  try {
    const token = await getIdToken()
    
    const response = await fetch(`${API_URL}/admin/proxies`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Erro ao buscar procurações')
    }
    
    return { success: true, proxies: data.proxies, count: data.count }
  } catch (error) {
    console.error('Erro ao listar procurações:', error)
    return { success: false, error: error.message, proxies: [] }
  }
}