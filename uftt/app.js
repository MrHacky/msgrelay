var msgs = [];

(function() {
	var msgcounts = [];
	var lastlen = 0;
	setInterval(function() {
		var cnt = msgs.length;
		msgcounts.push(cnt - lastlen);

		if (msgcounts.length > 4) {
			var pop = msgcounts[0];
			msgcounts = msgcounts.slice(1);
			msgs = msgs.slice(pop);
		}

		lastlen = msgs.length;
		//console.log("#msgs: " + msgs.length);
	}, 15*60*1000);
})();

var count = 0;
var appfunc = function(req, res) {
	var urlinfo = require('url').parse(req.url, true);
	if (urlinfo.pathname != '/') {
		res.writeHead(404);
		res.end();
		return;
	}
	var query = urlinfo.query;
	var jsonp = query.jsonp;

	if (query.reg) {
		msgs.push({
			class: query.class,
			type: query.type,
			port: +query.port || 47189,
			address: process.env.VMC_APP_PORT ? : req.header('x-forwarded-for') : req.socket.remoteAddress

		});
	}

	var response = ""
		+ "*S*T*A*R*T*\r\n"
		+ msgs
			.filter(function(x) { return query.class == x.class && query.type == x.type; })
			.map(function(x) { return x.address + "\t" + x.port + "\r\n"; })
			.sort()
			.filter((function() { var l; return function(x) { return [l !== x, l = x][0] }; })())
			.join("")
		+ "*S*T*O*P*\r\n"
	;

	res.writeHead(200, "OK", {
		'Content-Type': "text/plain"
	});

	res.end(response);
};

if (require.main === module) {
	require('http').createServer(appfunc).listen(process.env.VMC_APP_PORT || 1337, null);
} else
	module.exports = appfunc;

