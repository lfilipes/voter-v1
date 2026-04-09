"""
Service for managing assemblies and votes
"""

from firebase_admin import firestore
from datetime import datetime

db = firestore.client()

def create_assembly(cond_id, data):
    """Create a new assembly/voting"""
    assembly_number = data.get('number', '').replace('/', '-')
    assembly_ref = db.collection(f'condominiums/{cond_id}/assemblies').document(assembly_number)
    
    # Create info document
    assembly_ref.set({
        'name': data.get('name'),
        'number': data.get('number'),
        'description': data.get('description'),
        'informative_text': data.get('informative_text'),
        'date': data.get('date'),
        'status': 'active',
        'start_date': firestore.SERVER_TIMESTAMP,
        'end_date': data.get('end_date'),
        'created_at': firestore.SERVER_TIMESTAMP,
        'created_by': data.get('created_by')
    })
    
    return {'success': True, 'assembly_number': assembly_number}

def add_assembly_item(cond_id, assembly_number, item_data):
    """Add an item to an assembly"""
    item_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/items').document()
    item_ref.set({
        'order': item_data.get('order'),
        'title': item_data.get('title'),
        'description': item_data.get('description'),
        'type': item_data.get('type', 'approve_reject'),
        'is_released': item_data.get('is_released', False),
        'is_locked': item_data.get('is_locked', False)
    })
    
    return {'success': True, 'item_id': item_ref.id}

def update_item_release_status(cond_id, assembly_number, item_id, is_released):
    """Update item release status (liberar/bloquear para votação)"""
    item_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/items').document(item_id)
    item_ref.update({
        'is_released': is_released,
        'updated_at': firestore.SERVER_TIMESTAMP
    })

def update_item_lock_status(cond_id, assembly_number, item_id, is_locked):
    """Update item lock status (bloquear item pelo admin)"""
    item_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/items').document(item_id)
    item_ref.update({
        'is_locked': is_locked,
        'updated_at': firestore.SERVER_TIMESTAMP
    })

def get_assembly_items(cond_id, assembly_number):
    """Get all items of an assembly"""
    items_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/items')\
        .order_by('order')
    docs = items_ref.stream()
    
    items = []
    for doc in docs:
        data = doc.to_dict()
        items.append({
            'id': doc.id,
            'order': data.get('order'),
            'title': data.get('title'),
            'description': data.get('description'),
            'type': data.get('type'),
            'is_released': data.get('is_released', False),
            'is_locked': data.get('is_locked', False)
        })
    
    return items

def get_all_assemblies(cond_id):
    """Get all assemblies"""
    assemblies_ref = db.collection(f'condominiums/{cond_id}/assemblies')
    docs = assemblies_ref.stream()
    
    assemblies = []
    for doc in docs:
        data = doc.to_dict()
        # Get items count
        items_count = len(list(db.collection(f'condominiums/{cond_id}/assemblies/{doc.id}/items').stream()))
        
        assemblies.append({
            'number': doc.id,
            'name': data.get('name'),
            'description': data.get('description'),
            'date': data.get('date'),
            'status': data.get('status'),
            'items_count': items_count,
            'created_at': data.get('created_at')
        })
    
    return assemblies

def register_vote(cond_id, assembly_number, grantor_cpf, voted_by_email, voted_by_cpf, vote_type, answers):
    """Register a vote"""
    vote_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/votes').document(grantor_cpf)
    
    # Check if already voted
    if vote_ref.get().exists:
        return {'success': False, 'error': 'Este residente já votou nesta assembleia'}
    
    vote_ref.set({
        'grantor_cpf': grantor_cpf,
        'voted_by_email': voted_by_email,
        'voted_by_cpf': voted_by_cpf,
        'vote_type': vote_type,  # 'direct' or 'proxy'
        'voted_at': firestore.SERVER_TIMESTAMP,
        'answers': answers
    })
    
    return {'success': True}

def has_voted(cond_id, assembly_number, grantor_cpf):
    """Check if a resident has already voted"""
    vote_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/votes').document(grantor_cpf)
    return vote_ref.get().exists

def get_vote(cond_id, assembly_number, grantor_cpf):
    """Get vote details"""
    vote_ref = db.collection(f'condominiums/{cond_id}/assemblies/{assembly_number}/votes').document(grantor_cpf)
    doc = vote_ref.get()
    
    if not doc.exists:
        return None
    
    data = doc.to_dict()
    return {
        'grantor_cpf': data.get('grantor_cpf'),
        'voted_by_email': data.get('voted_by_email'),
        'voted_by_cpf': data.get('voted_by_cpf'),
        'vote_type': data.get('vote_type'),
        'voted_at': data.get('voted_at'),
        'answers': data.get('answers')
    }