"""
Rotas do módulo Admin
Todas as APIs relacionadas à administração ficam aqui
"""

from flask import Blueprint, request, jsonify
from firebase_admin import auth, storage
import os
import tempfile
from datetime import datetime
from .excel_processor import process_voters_excel, validate_election_data
from .pdf_processor import validate_pdf
from .firestore_service import (
    save_election, get_all_elections,
    save_proxy, get_all_proxies, update_proxy_pdf_url,
    save_voters_batch, is_admin_user
)

admin_bp = Blueprint('admin', __name__)

# ============================================
# FUNÇÃO AUXILIAR - VERIFICA TOKEN ADMIN
# ============================================

def verify_admin_token():
    """
    Verifica o token Firebase e se o usuário é admin
    Retorna (user_data, error_response, status_code)
    """
    auth_header = request.headers.get('Authorization', '')
    
    if not auth_header.startswith('Bearer '):
        return None, jsonify({'error': 'Token de autenticação ausente'}), 401
    
    token = auth_header.split('Bearer ')[1]
    
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get('uid')
        
        # Log para debug
        print(f"Verificando token para UID: {uid}")
        
        # Verifica se é admin
        if not is_admin_user(uid):
            print(f"Usuário {uid} NÃO é admin")
            return None, jsonify({'error': 'Acesso negado. Apenas administradores.'}), 403
        
        print(f"Usuário {uid} é admin - acesso permitido")
        return decoded_token, None, None
        
    except Exception as e:
        print(f"Erro na verificação do token: {str(e)}")
        return None, jsonify({'error': f'Token inválido: {str(e)}'}), 401

# ============================================
# FUNÇÃO AUXILIAR - UPLOAD PARA STORAGE
# ============================================

def upload_pdf_to_storage(file_content, filename, apartment, proxy_id):
    """
    Faz upload do PDF para o Firebase Storage
    
    Retorna a URL pública do arquivo
    """
    try:
        # Obtém o bucket configurado na inicialização do Firebase
        bucket = storage.bucket()
        
        # Log para debug
        print(f"Bucket configurado: {bucket.name}")
        
        # Cria um nome único para o arquivo
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        blob_name = f"proxies/{apartment}/{proxy_id}_{timestamp}.pdf"
        
        blob = bucket.blob(blob_name)
        
        # Upload do arquivo
        blob.upload_from_string(file_content, content_type='application/pdf')
        
        # Torna o arquivo público (opcional - gera URL pública)
        blob.make_public()
        
        print(f"PDF salvo com sucesso em: {blob.public_url}")
        
        return blob.public_url
        
    except Exception as e:
        print(f"Erro detalhado ao fazer upload para Storage: {e}")
        raise e

# ============================================
# ROTA 1: UPLOAD DE EXCEL COM VOTANTES
# ============================================

@admin_bp.route('/upload-voters', methods=['POST'])
def upload_voters_excel():
    """
    Endpoint para upload de Excel com cadastro de votantes
    Recebe: arquivo Excel, nome da votação, número da votação
    """
    # Verifica autenticação
    admin_user, error_response, status_code = verify_admin_token()
    if error_response:
        return error_response, status_code
    
    # Verifica se o arquivo foi enviado
    if 'file' not in request.files:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
    
    # Verifica extensão
    if not file.filename.endswith(('.xlsx', '.xls')):
        return jsonify({'error': 'Arquivo deve ser Excel (.xlsx ou .xls)'}), 400
    
    # Obtém dados da votação
    election_name = request.form.get('election_name')
    election_number = request.form.get('election_number')
    election_date = request.form.get('election_date')
    
    # Log para debug
    print(f"Recebendo Excel - Votação: {election_name}, Número: {election_number}")
    
    # Valida dados da votação
    validation = validate_election_data(election_name, election_number)
    if not validation['valid']:
        return jsonify({'error': validation['errors'][0]}), 400
    
    # Processa o Excel
    file_content = file.read()
    result = process_voters_excel(file_content)
    
    if not result['success']:
        return jsonify({'error': result['error']}), 400
    
    # Salva a votação no Firestore
    election_id = save_election({
        'name': election_name,
        'election_number': election_number,
        'date': election_date,
        'voters_count': len(result['data'])
    })
    
    # Salva os votantes em lote
    voters_saved = save_voters_batch(result['data'], election_number)
    
    return jsonify({
        'success': True,
        'message': 'Votação e votantes cadastrados com sucesso',
        'election_id': election_id,
        'election_number': election_number,
        'voters_saved': voters_saved,
        'total_in_file': result['total_rows'],
        'valid_voters': result['valid_rows']
    }), 200

# ============================================
# ROTA 2: UPLOAD DE PDF (PROCURAÇÃO) COM STORAGE
# ============================================

@admin_bp.route('/upload-proxy', methods=['POST'])
def upload_proxy_pdf():
    """
    Endpoint para upload de PDF de procuração
    Recebe: arquivo PDF + dados do formulário
    O PDF é salvo no Firebase Storage
    """
    # Verifica autenticação
    admin_user, error_response, status_code = verify_admin_token()
    if error_response:
        return error_response, status_code
    
    # Verifica se o arquivo foi enviado
    if 'file' not in request.files:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
    
    # Verifica extensão
    if not file.filename.endswith('.pdf'):
        return jsonify({'error': 'Arquivo deve ser PDF'}), 400
    
    # Obtém os dados do formulário
    apartment = request.form.get('apartment', '').strip()
    grantor_email = request.form.get('grantor_email', '').strip().lower()
    grantor_cpf = request.form.get('grantor_cpf', '').strip()
    grantee_cpf = request.form.get('grantee_cpf', '').strip()
    
    # Log para debug
    print("=" * 50)
    print("Recebendo upload de procuração:")
    print(f"  - Apartamento: {apartment}")
    print(f"  - Email outorgante: {grantor_email}")
    print(f"  - CPF outorgante: {grantor_cpf}")
    print(f"  - CPF outorgado: {grantee_cpf}")
    print(f"  - Arquivo: {file.filename}")
    print("=" * 50)
    
    # Valida dados obrigatórios
    missing_fields = []
    if not apartment:
        missing_fields.append('apartamento')
    if not grantor_email:
        missing_fields.append('email do outorgante')
    if not grantor_cpf:
        missing_fields.append('CPF do outorgante')
    if not grantee_cpf:
        missing_fields.append('CPF do outorgado')
    
    if missing_fields:
        return jsonify({
            'error': f'Campos obrigatórios faltando: {", ".join(missing_fields)}'
        }), 400
    
    # Valida formato do email
    if '@' not in grantor_email or '.' not in grantor_email:
        return jsonify({'error': 'Email do outorgante inválido'}), 400
    
    # Valida CPFs (11 dígitos)
    def validar_cpf(cpf):
        cpf_clean = ''.join(filter(str.isdigit, cpf))
        return len(cpf_clean) == 11
    
    if not validar_cpf(grantor_cpf):
        return jsonify({'error': 'CPF do outorgante inválido (deve ter 11 dígitos)'}), 400
    
    if not validar_cpf(grantee_cpf):
        return jsonify({'error': 'CPF do outorgado inválido (deve ter 11 dígitos)'}), 400
    
    # Valida o PDF
    file_content = file.read()
    validation = validate_pdf(file_content)
    
    if not validation['success']:
        return jsonify({'error': validation['error']}), 400
    
    # Primeiro, salva os dados no Firestore para obter o ID
    proxy_id = save_proxy({
        'apartment': apartment,
        'grantor_email': grantor_email,
        'grantor_cpf': grantor_cpf,
        'grantee_cpf': grantee_cpf,
        'original_filename': file.filename,
        'pdf_page_count': validation['page_count'],
        'pdf_url': None  # Será atualizado após upload
    })
    
    # Faz upload do PDF para o Storage
    try:
        pdf_url = upload_pdf_to_storage(file_content, file.filename, apartment, proxy_id)
        
        # Atualiza o documento com a URL do PDF
        update_proxy_pdf_url(proxy_id, pdf_url)
        
        return jsonify({
            'success': True,
            'message': 'Procuração cadastrada com sucesso',
            'proxy_id': proxy_id,
            'pdf_url': pdf_url,
            'data': {
                'apartment': apartment,
                'grantor_email': grantor_email,
                'grantor_cpf': grantor_cpf,
                'grantee_cpf': grantee_cpf,
                'filename': file.filename
            }
        }), 200
        
    except Exception as e:
        # Se falhar o upload, ainda temos os dados no Firestore
        return jsonify({
            'success': False,
            'error': f'Erro ao salvar o PDF: {str(e)}. Os dados foram salvos, mas o arquivo não.',
            'proxy_id': proxy_id
        }), 500

# ============================================
# ROTA 3: LISTAR VOTAÇÕES
# ============================================

@admin_bp.route('/elections', methods=['GET'])
def list_elections():
    """
    Retorna todas as votações cadastradas
    """
    # Verifica autenticação
    admin_user, error_response, status_code = verify_admin_token()
    if error_response:
        return error_response, status_code
    
    elections = get_all_elections()
    
    return jsonify({
        'success': True,
        'elections': elections,
        'count': len(elections)
    }), 200

# ============================================
# ROTA 4: LISTAR PROCURAÇÕES
# ============================================

@admin_bp.route('/proxies', methods=['GET'])
def list_proxies():
    """
    Retorna todas as procurações cadastradas
    """
    # Verifica autenticação
    admin_user, error_response, status_code = verify_admin_token()
    if error_response:
        return error_response, status_code
    
    proxies = get_all_proxies()
    
    return jsonify({
        'success': True,
        'proxies': proxies,
        'count': len(proxies)
    }), 200

# ============================================
# ROTA 5: LISTAR VOTANTES POR VOTAÇÃO
# ============================================

@admin_bp.route('/voters/<election_number>', methods=['GET'])
def list_voters_by_election(election_number):
    """
    Retorna todos os votantes de uma votação específica
    """
    # Verifica autenticação
    admin_user, error_response, status_code = verify_admin_token()
    if error_response:
        return error_response, status_code
    
    # Busca os votantes
    from .firestore_service import get_voters_by_election
    voters = get_voters_by_election(election_number)
    
    return jsonify({
        'success': True,
        'voters': voters,
        'count': len(voters),
        'election_number': election_number
    }), 200