import http.server, socketserver
class H(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        t = super().guess_type(path)
        if str(path).endswith('.html'): return 'text/html; charset=utf-8'
        return t
with socketserver.TCPServer(('127.0.0.1', 8100), H) as httpd:
    httpd.serve_forever()
