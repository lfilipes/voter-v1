"""
Processador de arquivos Excel para o módulo Admin
Responsável por ler e validar planilhas de votantes
"""

import pandas as pd
import io
import re

def validar_cpf(cpf):
    """
    Valida se o CPF tem 11 dígitos (apenas números)
    """
    if not cpf:
        return False
    # Remove qualquer caractere não numérico
    cpf_clean = re.sub(r'\D', '', str(cpf))
    return len(cpf_clean) == 11

def process_voters_excel(file_content):
    """
    Processa um arquivo Excel e extrai a lista de votantes
    
    O Excel deve ter as colunas:
    - nome: Nome completo do votante (obrigatório)
    - email: Email do votante (obrigatório)
    - apartamento: Número do apartamento (obrigatório)
    - cpf: CPF do dono do apartamento (obrigatório)
    
    Retorna:
    - success: booleano
    - data: lista de votantes
    - error: mensagem de erro (se houver)
    - total_rows: número total de linhas
    """
    try:
        # Lê o Excel a partir do conteúdo do arquivo
        df = pd.read_excel(io.BytesIO(file_content))
        
        # Colunas obrigatórias
        required_columns = ['nome', 'email', 'apartamento', 'cpf']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            return {
                'success': False,
                'error': f'Colunas obrigatórias ausentes: {", ".join(missing_columns)}. O Excel deve ter: nome, email, apartamento, cpf',
                'data': []
            }
        
        # Converte para lista de dicionários
        voters = []
        errors = []
        
        for index, row in df.iterrows():
            # Limpa e valida CPF
            cpf_raw = str(row['cpf']).strip()
            cpf_clean = re.sub(r'\D', '', cpf_raw)
            
            if not validar_cpf(cpf_clean):
                errors.append(f"Linha {index + 2}: CPF inválido ({cpf_raw})")
                continue
            
            voter = {
                'name': str(row['nome']).strip(),
                'email': str(row['email']).strip().lower(),
                'apartment': str(row['apartamento']).strip(),
                'cpf': cpf_clean  # Salva apenas números
            }
            
            # Valida email básico
            if '@' not in voter['email'] or '.' not in voter['email']:
                errors.append(f"Linha {index + 2}: Email inválido ({voter['email']})")
                continue
            
            # Valida nome
            if len(voter['name']) < 3:
                errors.append(f"Linha {index + 2}: Nome muito curto ({voter['name']})")
                continue
            
            # Valida apartamento
            if not voter['apartment']:
                errors.append(f"Linha {index + 2}: Apartamento vazio")
                continue
            
            voters.append(voter)
        
        return {
            'success': True,
            'data': voters,
            'total_rows': len(df),
            'valid_rows': len(voters),
            'errors': errors,
            'error': None if not errors else f"{len(errors)} erro(s) encontrado(s)"
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Erro ao processar Excel: {str(e)}',
            'data': []
        }

def validate_election_data(election_name, election_number):
    """Valida os dados da votação"""
    errors = []
    
    if not election_name or len(election_name.strip()) < 3:
        errors.append('Nome da votação deve ter pelo menos 3 caracteres')
    
    if not election_number or len(election_number.strip()) < 1:
        errors.append('Número da votação é obrigatório')
    
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }