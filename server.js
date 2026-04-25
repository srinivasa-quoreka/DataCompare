/**
 * FT Validator -- Static File Server
 * Serves index.html on a local network so all team members can access via browser.
 * No npm dependencies -- uses only built-in Node.js modules.
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const PORT     = process.env.PORT || 5000;
const HOST     = '0.0.0.0';
const ROOT_DIR = __dirname;
const INDEX    = 'index.html';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

function getLocalIPs() {
  const nets = os.networkInterfaces();
  const ips  = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push({ name, address: net.address });
      }
    }
  }
  return ips;
}

function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    return res.end('Method Not Allowed');
  }

  let urlPath = req.url.split('?')[0];
  if (urlPath === '/' || urlPath === '') urlPath = '/' + INDEX;

  const safePath = path.normalize(urlPath).replace(/^(\.\.[\\/])+/, '');
  const filePath = path.join(ROOT_DIR, safePath);

  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403); return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      const indexPath = path.join(ROOT_DIR, INDEX);
      fs.readFile(indexPath, (err2, data) => {
        if (err2) { res.writeHead(404); return res.end('Not Found'); }
        res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-cache' });
        res.end(data);
      });
      return;
    }

    const ext    = path.extname(filePath).toLowerCase();
    const mime   = MIME[ext] || 'application/octet-stream';
    const isHtml = ext === '.html';

    fs.readFile(filePath, (err3, data) => {
      if (err3) { res.writeHead(500); return res.end('Server Error'); }
      res.writeHead(200, {
        'Content-Type':   mime,
        'Content-Length': data.length,
        'Cache-Control':  isHtml ? 'no-cache' : 'public, max-age=3600',
      });
      res.end(data);
    });
  });

  const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
  console.log('[' + ts + '] ' + req.method + ' ' + req.url);
}

const server = http.createServer(handler);

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('  ============================================');
  console.log('   FT Validator -- Server Running');
  console.log('  ============================================');
  console.log('');
  console.log('  Local:   http://localhost:' + PORT);
  console.log('');

  const ips = getLocalIPs();
  if (ips.length) {
    console.log('  Network URLs (share with your team):');
    ips.forEach(function(i) {
      console.log('    http://' + i.address + ':' + PORT + '   (' + i.name + ')');
    });
  } else {
    console.log('  WARNING: No network interfaces found.');
    console.log('  Run ipconfig to find your IP address.');
  }
  console.log('');
  console.log('  Press Ctrl+C to stop.');
  console.log('');
});

server.on('error', function(err) {
  if (err.code === 'EADDRINUSE') {
    console.error('');
    console.error('  ERROR: Port ' + PORT + ' is already in use.');
    console.error('  Run DIAGNOSE_AND_FIX.bat as Administrator, or');
    console.error('  change the port: set PORT=9000 in the bat file.');
    console.error('');
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

process.on('SIGINT',  function() { console.log('\nStopping...'); server.close(function() { process.exit(0); }); });
process.on('SIGTERM', function() { console.log('\nStopping...'); server.close(function() { process.exit(0); }); });
