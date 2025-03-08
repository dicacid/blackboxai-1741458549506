from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
from logger import logger

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/', methods=['GET'])
def index():
    """Root endpoint that provides API documentation."""
    api_docs = {
        'name': 'Cryptix API Service',
        'version': '1.0.0',
        'description': 'API service for logging and monitoring Cryptix platform activities',
        'endpoints': {
            '/': {
                'methods': ['GET'],
                'description': 'This documentation'
            },
            '/health': {
                'methods': ['GET'],
                'description': 'Health check endpoint',
                'response': {
                    'status': 'String - current health status',
                    'timestamp': 'ISO 8601 timestamp'
                }
            },
            '/log': {
                'methods': ['GET', 'POST'],
                'description': 'Request logging endpoint',
                'response': {
                    'message': 'String - confirmation message',
                    'request_details': {
                        'method': 'HTTP method used',
                        'url': 'Request URL',
                        'headers': 'Request headers',
                        'timestamp': 'ISO 8601 timestamp',
                        'remote_addr': 'Client IP address',
                        'body': 'Request body (POST requests only)'
                    }
                }
            },
            '/fraud': {
                'methods': ['POST'],
                'description': 'Analyze a transaction for fraud detection',
                'request': {
                    'transaction': {
                        'value': 'Transaction value',
                        'timestamp': 'Transaction timestamp',
                        'from': 'Sender address',
                        'to': 'Receiver address'
                    }
                },
                'response': {
                    'analysis': 'Object containing fraud analysis results'
                }
            },
            '/recommendations': {
                'methods': ['GET'],
                'description': 'Get personalized event recommendations for a user',
                'request': {
                    'userId': 'User identifier',
                    'limit': 'Optional limit for number of recommendations'
                },
                'response': {
                    'recommendations': 'Array of recommended events'
                }
            }
        }
    }
    logger.info("API documentation accessed")
    return jsonify(api_docs)

# Error Handlers
@app.errorhandler(404)
def not_found_error(error):
    """Handle 404 errors by returning JSON response."""
    error_message = {
        'error': 'Resource not found',
        'status_code': 404
    }
    logger.warning(f"404 Error: {request.url}")
    return jsonify(error_message), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors by returning JSON response."""
    error_message = {
        'error': 'Internal server error',
        'status_code': 500
    }
    logger.error(f"500 Error: {str(error)}")
    return jsonify(error_message), 500

# Health Check Endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint."""
    logger.info("Health check endpoint accessed")
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    })

# Logging Endpoint
@app.route('/log', methods=['GET', 'POST'])
def log_request():
    """Endpoint that logs request details and returns them."""
    # Collect request details
    request_details = {
        'method': request.method,
        'url': request.url,
        'headers': dict(request.headers),
        'timestamp': datetime.utcnow().isoformat(),
        'remote_addr': request.remote_addr
    }
    
    # Add request body for POST requests
    if request.method == 'POST':
        try:
            request_details['body'] = request.get_json()
        except Exception as e:
            request_details['body'] = 'Could not parse JSON body'
    
    # Log the request details
    logger.info(f"Request logged: {request_details}")
    
    return jsonify({
        'message': 'Request logged successfully',
        'request_details': request_details
    })

# Fraud Detection Endpoint
@app.route('/fraud', methods=['POST'])
def analyze_fraud():
    """Analyze a transaction for fraud detection."""
    data = request.get_json()
    transaction = data.get('transaction')
    
    if not transaction:
        return jsonify({'error': 'Transaction data is required'}), 400
    
    # Call the fraud detection system (to be implemented)
    # analysis = fraud_detection_system.analyze_transaction(transaction)
    
    # Placeholder response
    analysis = {
        'riskScore': 0.85,
        'isFraudulent': True
    }
    
    logger.info("Fraud analysis completed")
    return jsonify({'analysis': analysis})

# Recommendations Endpoint
@app.route('/recommendations', methods=['GET'])
def get_recommendations():
    """Get personalized event recommendations for a user."""
    user_id = request.args.get('userId')
    limit = request.args.get('limit', default=10, type=int)
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    # Call the recommendation engine (to be implemented)
    # recommendations = recommendation_engine.get_recommendations(user_id, limit)
    
    # Placeholder response
    recommendations = [
        {'eventId': 1, 'eventName': 'Concert A'},
        {'eventId': 2, 'eventName': 'Festival B'}
    ]
    
    logger.info("Recommendations retrieved")
    return jsonify({'recommendations': recommendations})

if __name__ == '__main__':
    logger.info("Starting Flask API server...")
    app.run(host='0.0.0.0', port=5000, debug=True)
