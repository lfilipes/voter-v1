"""
Arquivo principal da aplicação Flask
Inicializa o servidor e registra os módulos
"""

from flask import Flask, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore, storage
from config import Config

# ============================================
# INICIALIZAÇÃO DO FIREBASE ADMIN
# ============================================

cred_dict = {
    "type": "service_account",
    "project_id": Config.FIREBASE_PROJECT_ID,
    "private_key_id": Config.FIREBASE_PRIVATE_KEY_ID,
    "private_key": Config.FIREBASE_PRIVATE_KEY,
    "client_email": Config.FIREBASE_CLIENT_EMAIL,
    "client_id": Config.FIREBASE_CLIENT_ID,
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{Config.FIREBASE_CLIENT_EMAIL}"
}

# Inicializa o Firebase com as configurações de Storage
cred = credentials.Certificate(cred_dict)

# Inicializa com o nome do bucket de storage
firebase_admin.initialize_app(cred, {
    'storageBucket': Config.FIREBASE_STORAGE_BUCKET
})

db = firestore.client()

print(f"✅ Firebase inicializado com sucesso!")
print(f"   Project ID: {Config.FIREBASE_PROJECT_ID}")
print(f"   Storage Bucket: {Config.FIREBASE_STORAGE_BUCKET}")

# ============================================
# INICIALIZAÇÃO DO FLASK
# ============================================

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = Config.MAX_CONTENT_LENGTH
CORS(app, origins=Config.CORS_ORIGINS)

# ============================================
# REGISTRO DOS MÓDULOS
# ============================================

from modules.admin.admin_routes import admin_bp
app.register_blueprint(admin_bp, url_prefix='/api/admin')

from modules.admin.voting_items_routes import voting_bp
app.register_blueprint(voting_bp, url_prefix='/api/voting')

# ============================================
# ENDPOINTS GERAIS
# ============================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Verifica se o servidor está funcionando"""
    return jsonify({'status': 'healthy', 'message': 'Server is running'})

# ============================================
# EXECUÇÃO
# ============================================

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)