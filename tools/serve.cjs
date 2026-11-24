const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req,res) => {
  let file;
  try { file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); }
  catch { res.writeHead(400).end(); return; }
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (file === root) file = path.join(root,'index.html');
  fs.readFile(file,(error,data) => {
    if(error) {res.writeHead(404).end();return;}
    res.setHeader('Content-Type', ({'.js':'text/javascript','.html':'text/html; charset=utf-8','.glb':'model/gltf-binary'})[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});
if (require.main === module) server.listen(Number(process.env.PORT) || 8001, '127.0.0.1', () => console.log(`A SQUISH: http://127.0.0.1:${server.address().port}`));
module.exports = server;
