var appfunc = function(req, res) {
  res.send('Hello World 4\n');
}

if (require.main === module)
	require('express')().get('/', appfunc).listen(3000);
else
	module.exports = appfunc;
