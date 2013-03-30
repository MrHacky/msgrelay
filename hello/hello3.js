var express = require('express');
var app = express();

app.get('/', function(req, res){
  res.send('hello world 3');
});

app.get('/:test', function(req, res){
  res.send('hello world 3:' + req.params.test);
});

if (require.main === module)
	app.listen(3000);
else
	module.exports = app;
