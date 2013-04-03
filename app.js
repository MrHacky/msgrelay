var express = require('express');
var app = express();

// simple logger
app.use(function(req, res, next){
  console.log('%s %s', req.method, req.url);
  next();
});

// respond
app.use('/hello1', require('./hello/hello1.js'));
app.use('/hello2', require('./hello/hello2.js'));
app.use('/hello3', require('./hello/hello3.js'));
app.use('/hello4', require('./hello/hello4.js'));

app.use('/test/shell', require('./test/shell.js'));
app.use('/test/session', require('./test/session.js'));
app.use('/test/status', require('./test/status.js'));

app.use('/msgrelay', require('./msgrelay/app.js'));
app.use('/uftt/bootstrap', require('./uftt/app.js'));

app.use('/static', express.static('./static/'));

if (process.env.XMOD_MV && require('fs').existsSync(process.env.XMOD_MV))
	app.use('/mv', require(process.env.XMOD_MV))

app.listen(process.env.VMC_APP_PORT || 80);
