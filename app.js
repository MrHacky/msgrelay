var http = require('http');
var crypto = require('crypto')
var msgs = [];

(function() {
        var msgcounts = [];
        var lastlen = 0;
        setInterval(function() {
                //console.log('timer');
                //console.log(msgs);
                //console.log(msgcounts);

                var cnt = msgs.length;
                msgcounts.push(cnt - lastlen);

                if (msgcounts.length > 6) {
                        var pop = msgcounts[0];
                        msgcounts = msgcounts.slice(1);
                        msgs = msgs.slice(pop);
                }

                lastlen = msgs.length;
                console.log("#msgs: " + msgs.length);
        }, 10000);
})();

var getmsgid;
(function() {
        var mcnt = 0;
        getmsgid = function() {
                if (mcnt > 999999999)
                        mcnt = 0;
                return ++mcnt;
        };
})();

var count = 0;
var server = http.createServer(function(req, res) {
        var urlinfo = require('url').parse(req.url, true);
        if (urlinfo.pathname != '/msgrelay') {
                res.writeHead(404);
                res.end();
                return;
        }
        var query = urlinfo.query;
        var jsonp = query.jsonp;
        var response = { status: "OK"};

        if (query.type == "announce") {
                var uid = crypto.randomBytes(4).readUInt32LE(0);
                var gid = query.gid;

                msgs.push({
                        gid:gid,
                        uid:uid
                });

                response.uid = uid;
        } else if (query.type == "list") {
                response.uids = msgs
                        .filter(function(x) { return !x.mid && x.gid == query.gid; })
                        .map(function(x) { return x.uid; })
                ;
                response.mids = msgs
                        .filter(function(x) { return x.mid && x.gid == query.gid && x.dst == query.uid; })
                        .map(function(x) { return x.mid; })
                ;
        } else if (query.type == "send") {
                msgs.push({
                        mid: getmsgid(),
                        gid: query.gid,
                        src: query.uid,
                        dst: query.dst,
                        data: ""+query.data
                });
        } else if (query.type == "recv") {
                //console.log(msgs);
                var mids = (""+query.mids).split(",").map(function(x) { return +x; });
                //console.log(mids);
                response.msgs = msgs
                        .filter(function(x) { return x.mid && x.dst == query.uid && x.gid == query.gid && mids.indexOf(x.mid) >= 0; })
                        .map(function(x) { return { mid: x.mid, src: x.src, data: x.data }; })
                ;
        } else if (query.type == "dbg") {
                response.msgs = msgs;
        }

        res.writeHead(200, "OK", {
                'Content-Type': query.jsonp ? "application/javascript" : "application/json"
        });

        response = JSON.stringify(response);
        if (jsonp)
                res.end(""+jsonp+"("+response+");");
        else
                res.end(response);
        //console.log(req.method);
        //console.log(req.url);
        //console.log('-');
});
server.listen(process.env.VMC_APP_PORT || 1337, null);
