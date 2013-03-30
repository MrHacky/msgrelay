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
app.use('/msgrelay', require('./msgrelay/app.js'));

app.listen(80);
