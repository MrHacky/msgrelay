module.exports = function(req, res) {
	var spawn = require('child_process').spawn;
	var ls    = spawn('ls', ['-lh', '/usr']);

	var output = "";

	ls.stdout.on('data', function (data) {
	output += ('stdout: ' + data) + "\n";
	});

	ls.stderr.on('data', function (data) {
	output += ('stderr: ' + data) + "\n"
	});

	ls.on('close', function (code) {
		output += 'child process exited with code ' + code;
		res.send(output);
	});
}
