var appfunc = function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World 2\n');
}

if (require.main === module) {
	require('http').createServer(appfunc).listen(1337)
} else
	module.exports = appfunc;
