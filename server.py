import http.server
import socketserver
import json
import urllib.request
import urllib.parse
import os
from datetime import datetime

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Initialize SimpleHTTPRequestHandler to serve from DIRECTORY
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # TODO(security): Enforce secure HTTP headers to prevent XSS and Clickjacking
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        # Allow fonts from googleapi and images from secure cloudfront/maven CDN
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' https: data:; "
            "connect-src 'self';"
        )
        super().end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        
        # Simple router for the API sync endpoint
        if path == "/api/sync":
            self.handle_sync()
        else:
            # Fallback to standard static file serving
            super().do_GET()

    def handle_sync(self):
        try:
            page = 1
            limit = 1000
            all_items = []
            
            # Fetch page 1
            url = f"https://api.maven.com/free_lessons/discoverable?limit={limit}&page={page}"
            req = urllib.request.Request(
                url,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            )
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode('utf-8'))
                
            metadata = data.get("metadata", {})
            total = metadata.get("total", 0)
            total_pages = metadata.get("pages", 1)
            items = data.get("items", [])
            all_items.extend(items)
            
            # Fetch subsequent pages if total exceeds limit
            while len(all_items) < total and page < total_pages:
                page += 1
                next_url = f"https://api.maven.com/free_lessons/discoverable?limit={limit}&page={page}"
                next_req = urllib.request.Request(
                    next_url,
                    headers={
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                )
                with urllib.request.urlopen(next_req) as next_response:
                    page_data = json.loads(next_response.read().decode('utf-8'))
                    page_items = page_data.get("items", [])
                    if not page_items:
                        break
                    all_items.extend(page_items)
            
            # Save the aggregated list to lessons.json
            output_file = os.path.join(DIRECTORY, "lessons.json")
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(all_items, f, indent=2)
                
            # Send JSON response
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            response_data = {
                "status": "success",
                "count": len(all_items),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
        except Exception as e:
            # Fail closed and return generic error message to frontend
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            response_data = {
                "status": "error",
                "message": "Failed to sync lessons with Maven API."
            }
            self.wfile.write(json.dumps(response_data).encode('utf-8'))

def run_server():
    os.chdir(DIRECTORY)
    socketserver.TCPServer.allow_reuse_address = True
    # TODO(security): Server MUST listen on localhost (127.0.0.1) when testing/local. Do NOT use 0.0.0.0
    with socketserver.TCPServer(("127.0.0.1", PORT), MyHandler) as httpd:
        print(f"Serving Free Maven Lessons Curator at http://127.0.0.1:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.server_close()

if __name__ == "__main__":
    run_server()
