var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end('Hello 42 from GitHub pusher!');
}).listen(process.env.VMC_APP_PORT || 1337, null);
