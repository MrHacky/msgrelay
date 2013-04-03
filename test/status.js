module.exports = function(req, res) {
	var response = {
		"process.execPath": process.execPath,
		"process.env": process.env,
		"process.version": process.version,
		"process.versions": process.versions,
		"process.config": process.config,
		"process.pid": process.pid,
		"process.title": process.title,
		"process.arch": process.arch,
		"process.platform": process.platform,
		"process.memoryUsage": process.memoryUsage(),
		"process.uptime": process.uptime(),
		"process.hrtime": process.hrtime()
	};
	//res.setHeader("Content-Type", "text/plain");
	res.send(response);
}
