import socket
import sqlite3
import time
import threading
import json
from flask import Flask, jsonify
from flask_cors import CORS
from dnslib import DNSRecord, DNSHeader, RR, A, QTYPE

# --- CONFIGURATION ---
DNS_IP = '0.0.0.0'
DNS_PORT = 53
API_PORT = 5000  # React will talk to this port
DB_FILE = 'netshield_logs.db'
UPSTREAM_DNS = ('8.8.8.8', 53)

# --- WEB API SETUP ---
app = Flask(__name__)
CORS(app)  # Allow React to talk to Python

BLOCKLIST = {
    'doubleclick.net', 'google-analytics.com', 'ads.google.com',
    'graph.facebook.com', 'criteo.com', 'flurry.com'
}
WHITELIST = {'google.com', 'github.com'}
DNS_CACHE = {}

# --- DATABASE HELPERS ---
def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row # Allows accessing columns by name
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''CREATE TABLE IF NOT EXISTS query_logs 
                    (id INTEGER PRIMARY KEY AUTOINCREMENT,
                     timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                     client_ip TEXT, domain TEXT, status TEXT)''')
    conn.commit()
    conn.close()

def log_to_db(client_ip, domain, status):
    def _write():
        try:
            conn = get_db_connection()
            conn.execute('INSERT INTO query_logs (client_ip, domain,
status) VALUES (?, ?, ?)',
			(client_ip, domain, status))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Db Error: {e}")
    threading.Thread(target=_write).start()

# --- API ENDPOINTS (The Bridge) ---

@app.route('/api/stats')
def get_stats():
    """Returns total counts for the dashboard cards."""
    conn = get_db_connection()
    total = conn.execute('SELECT COUNT(*) FROM query_logs').fetchone()[0]
    blocked = conn.execute("SELECT COUNT(*) FROM query_logs WHERE 
status='BLOCKED'").fetchone()[0]
    conn.close()
    return jsonify({'total': total, 'blocked': blocked})

@app.route('/api/recent')
def get_recent():
    """Returns the last 50 logs for the table."""
    conn = get_db_connection()
    logs = conn.execute('SELECT * FROM query_logs ORDER BY id DESC LIMIT 
50').fetchall()
    conn.close()
    # Convert database rows to a list of dictionaries
    return jsonify([dict(row) for row in logs])

# --- DNS LOGIC ---
def dns_server_loop():
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        sock.bind((DNS_IP, DNS_PORT))
        print(f"[*] DNS Server running on Port {DNS_PORT}")
        
        while True:
            data, addr = sock.recvfrom(512)
            request = DNSRecord.parse(data)
            qname = str(request.q.qname)
            
            # Check Blocklist
            is_blocked = False
            for blocked in BLOCKLIST:
                if qname.rstrip('.').endswith(blocked):
                    is_blocked = True
                    break
            
            if is_blocked:
                reply = DNSRecord(DNSHeader(id=request.header.id, qr=1, 
aa=1, ra=1), q=request.q)
                reply.add_answer(RR(qname, QTYPE.A, rdata=A("0.0.0.0"), 
ttl=60))
                sock.sendto(reply.pack(), addr)
                print(f"🚫 BLOCKED: {qname}")
                log_to_db(addr[0], qname, "BLOCKED")
            else:
                # Forward to Google
                fwd_sock = socket.socket(socket.AF_INET, 
socket.SOCK_DGRAM)
                fwd_sock.sendto(data, UPSTREAM_DNS)
                response, _ = fwd_sock.recvfrom(512)
                sock.sendto(response, addr)
                print(f"✅ ALLOWED: {qname}")
                log_to_db(addr[0], qname, "ALLOWED")
                
    except Exception as e:
        print(f"DNS Error: {e}")

if __name__ == '__main__':
    init_db()
    
    # 1. Start DNS Server in Background Thread
    dns_thread = threading.Thread(target=dns_server_loop)
    dns_thread.daemon = True # Kills thread when main app quits
    dns_thread.start()
    
    # 2. Start Web API on Main Thread
    print(f"[*] API Server running on http://127.0.0.1:{API_PORT}")
    app.run(port=API_PORT, debug=False)
