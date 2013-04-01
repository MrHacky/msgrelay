var express = require('express');
var app = express();

app.use(express.cookieParser());
app.use(express.cookieSession({ key: "sess9", secret: "----------------", cookie: { maxAge: 60000 } }));
//app.use(express.cookieSession());

app.use('/', function(req, res) {
	var sess = req.session;
	console.log(sess);
	console.log(req.cookies);
	//console.log(sess);
	if (sess.views) {
		++sess.views;
		res.write('<p>views: ' + sess.views + '</p>');
		//res.write('<p>expires in: ' + (sess.cookie.maxAge / 1000) + 's</p>');
		res.end();
	} else {
		sess.views = 1;
		res.send('welcome to the session demo. refresh!');
	}
});

if (require.main === module)
	app.listen(8000);
else
	module.exports = app;
