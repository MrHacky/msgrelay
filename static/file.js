"use strict";

var uid = null;
var msghandled = {};
var servers = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
var peers = [];
var cpeers = []; // connected peers
var lshares = [];

function domelem(id)
{
	return document.getElementById(id);
}

function runscript(url, q, f)
{
	if (window.cbfunc) {
		var of = window.cbfunc;
		window.cbfunc = function(data) {
			of(data);
			window.setTimeout(function() {
				runscript(url, q, f);
			}, 100)
		};
		return;
	};
	q.jsonp = 'cbfunc';
	for (var key in q)
		url += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(q[key]);
	var head = document.getElementsByTagName("HEAD")[0];
	var script = document.createElement('script');
	window.cbfunc = function(data) {
		head.removeChild(script);
		window.cbfunc = null;
		f(data);
	};
	script.src = url;
	head.appendChild(script);
}

function sendLocalShare(dest, share)
{
	if (dest == null) {
		for (var i = 0; i < cpeers.length; ++i)
			sendLocalShare(cpeers[i], share);
		return;
	}

	if (share == null) {
		for (var i = 0; i < lshares.length; ++i)
			sendLocalShare(dest, lshares[i]);
		return;
	}

	dest.datachannel.send(JSON.stringify({
		type: 'share',
		name: share.name
	}));
}

function addLocalShareFile(filename, datacb)
{
	console.log(filename);
	var nshare;
	lshares.push(nshare = {
		name: filename,
		data: datacb.getData
	});

	sendLocalShare(null, nshare);
}

function onPeerMessage(peer, msg)
{
	console.log(msg);
	if (msg.type == 'share') {
		var contentdiv = document.getElementById('content');
		var domnode = contentdiv.appendChild(document.createElement('a'));
		domnode.innerHTML = "DOWNLOAD: " + msg.name;
		domnode.href = '#';
		domnode.addEventListener('click', function(evt) {
			evt.stopPropagation();
			evt.preventDefault();
			domnode.parentNode.removeChild(domnode);
			peer.datachannel.send(JSON.stringify({
				'type': 'getfile',
				'path': msg.name
			}));
		});
	} else if (msg.type == 'getfile') {
		var share = lshares.filter(function(x) { return x.name == msg.path; })[0];
		if (!share) return;
		share.data(function(d) {
			peer.datachannel.send(JSON.stringify({
				'type': 'filedata',
				'path': msg.path,
				'data': d
			}));
		});
	} else if (msg.type == 'filedata') {
		var contentdiv = document.getElementById('content');
		var domnode = contentdiv.appendChild(document.createElement('a'));
		domnode.innerHTML = "SAVE: " + msg.path;
		domnode.href = msg.data;
		domnode.download = msg.path;
	}
}

function onPeerConnect(peer)
{
	cpeers.push(peer);
	peer.datachannel.onmessage = function(event) {
		onPeerMessage(peer, JSON.parse(event.data));
	};

	sendLocalShare(peer, null);
}

function onPeerDisconnect(peer)
{
	cpeers = cpeers.filter(function(x) { return x != peer; });
}

function initchannels(peer)
{
	peer.datachannel.onopen = function() {
		peer.state = "connected";
		peer.domnode.innerHTML += '|connected';
		onPeerConnect(peer);
	};
	peer.datachannel.onclose = function() {
		peer.state = "disconnected";
		peer.domnode.innerHTML += '|disconnected';
		onPeerDisconnect(peer);
	}
	return;

	// window.datachannel = ch;
	datachannel.onopen = datachannel.onclose = function() {
		console.log('datachannel state=' + datachannel.readyState);
	};
	datachannel.onmessage = function(event) {
		console.log("Got message from " + ruid + ": " + event.data);
	};
}

function initcall(peer)
{
	peer.pc = new webkitRTCPeerConnection(servers, {optional: [{RtpDataChannels: true}]});
	peer.datachannel = peer.pc.createDataChannel("data", {reliable: false});
	initchannels(peer);

	var offermessage = { type: 'offer', src: uid, dst: peer.uid, description: '', candidates: [] };
	var sendoffer = function() {
		sendoffer = function() {};
		console.log("sending offer");
		console.log(JSON.stringify(offermessage));
		sendmessage(offermessage);
	};

	peer.pc.onicecandidate = function(event) {
	if (event.candidate)
		offermessage.candidates.push(event.candidate);
	else
		sendoffer();
	};

	peer.pc.createOffer(function(desc) {
		peer.pc.setLocalDescription(desc);
		offermessage.description = desc;
	});

	peer.state = "calling";
	peer.domnode.innerHTML += '|calling';
}

function handleoffer(peer, desc, cands)
{
	peer.pc = new webkitRTCPeerConnection(servers, {optional: [{RtpDataChannels: true}]});
	peer.pc.ondatachannel = function(event) {
		peer.datachannel = event.channel;
		initchannels(peer);
	};

	var answermessage = { type: 'answer', src: uid, dst: peer.uid, description: '', candidates: [] };
	var sendanswer = function() {
		sendanswer = function(){};
		console.log("sending answer");
		sendmessage(answermessage);
		console.log('pc2-ice: ' + cands.length);
		for (var i = 0; i < cands.length; ++i)
			peer.pc.addIceCandidate(new RTCIceCandidate(cands[i]));
	};

	peer.pc.onicecandidate = function(event) {  
	if (event.candidate)
		answermessage.candidates.push(event.candidate);
	else
		sendanswer()
	};
	console.log('pc2.setRemoteDescription');
	peer.pc.setRemoteDescription(new RTCSessionDescription(desc));
	peer.pc.createAnswer(function(desc2) {
		console.log('pc2.setLocalDescription');
		peer.pc.setLocalDescription(desc2);
		answermessage.description = desc2;
	});

	peer.state = "answering";
	peer.domnode.innerHTML += '|answering';
}

function handleanswer(peer, desc, cands)
{
	console.log('pc1.setRemoteDescription');
	peer.pc.setRemoteDescription(new RTCSessionDescription(desc));
	console.log('pc1-ice: ' + cands.length);
	for (var i = 0; i < cands.length; ++i)
		peer.pc.addIceCandidate(new RTCIceCandidate(cands[i]));

	peer.state = "got-answer";
	peer.domnode.innerHTML += '|got-answer';
}

function handlemessage(msg)
{
	if (msg.src == uid) return;
	if (msg.dst && msg.dst != uid) return;
	console.log(msg);

	var contentdiv = document.getElementById('content');
	if (msg.type == 'announce') {
		if (uid < msg.uid) {
			var domnode = contentdiv.appendChild(document.createElement('div'));
			var peer = { uid: msg.uid, state: "none", domnode: domnode };
			peers.push(peer);
			domnode.innerHTML = peer.uid;
			initcall(peer);
		}
	} else if (msg.type == 'offer') {
		var domnode = contentdiv.appendChild(document.createElement('div'));
		var peer = { uid: msg.src, state: "none", domnode: domnode };
		peers.push(peer);
		domnode.innerHTML = peer.uid;
		handleoffer(peer, msg.description, msg.candidates);
	} else if (msg.type == 'answer') {
		var peer = peers.filter(function(x) { return x.uid == msg.src && x.state == "calling"; })[0];
		if (peer)
			handleanswer(peer, msg.description, msg.candidates);
	} else if (msg.type == 'ice1' || msg.type == 'ice2') {
		handleice(msg.type, uid, msg.src, msg.candidate);
	} else if (msg.type == 'text') {
		console.log("message from " + msg.src + ": " + msg.text);
	}
}

function sendmessage(msg)
{
	var maxlen = 500;
	var pfx = '';
	var msgstr = JSON.stringify(msg);
	//if (msg.type == 'offer' || msg.type == 'answer') {
	// pfx = '|';
	//  msgstr = sigmsgtostr(msg);
	//}
	var rawdata = msgstr;//base64_encode(RawDeflate.deflate(msgstr, 9));
	console.log("sendmessage: " + rawdata.length);
	msgrelay({ type: 'send', uid: msg.src, dst: msg.dst, data: rawdata}, function(data) {
		console.log(data);
	});
}

function handlemessageraw(rawdata)
{
	//var msg = JSON.parse(RawDeflate.inflate(base64_decode(rawdata.data)));
	var msg = JSON.parse(rawdata.data);
	msg.src = rawdata.src;
	handlemessage(msg);
}

function msgrelay(q, f)
{
	q.gid = 'sbs-rtc-sig';
	q.rnd = Math.random();
	runscript("http://msgrelay.eu01.aws.af.cm/msgrelay?", q, f);
	//runscript("/msgrelay?", q, f);
	//runscript("http://hackynode.info.tm/msgrelay?", q, f);
}

function listpastes()
{
	msgrelay({ type: 'list', uid: uid}, function(data) {
		for (var i = 0; i < data.uids.length; ++i) {
			if (!msghandled["a"+data.uids[i]]) {
				msghandled["a"+data.uids[i]] = true;
				handlemessage({type: "announce", uid: data.uids[i]});
				if (data.uids[i] == uid)
					domelem('status').innerHTML = 'Online';
			}
		}
		var newmids = [];
		for (var i = 0; i < data.mids.length; ++i) {
			if (!msghandled[data.mids[i]]) {
				msghandled[data.mids[i]] = true;
				newmids.push(data.mids[i]);
			}
		}
		if (newmids.length > 0) {
			msgrelay({ type: 'recv', uid: uid, mids: newmids.join(",")}, function(data) {
			for (var i = 0; i < data.msgs.length; ++i)
				handlemessageraw(data.msgs[i]);
			});
		};

		window.setTimeout(function() { listpastes(); }, 1000);
	});
}

function announce()
{
	function reannounce() {
		window.setTimeout(function() {
			msgrelay({type: 'announce', gid: 'sbs-rtcsig', uid: uid}, function(data) {
				reannounce();
			});
		}, 50*1000);
	};

	msgrelay({type: 'announce', gid: 'sbs-rtcsig'}, function(data) {
		uid = data.uid;
		console.log("UID: " + uid);

		listpastes();

		domelem('status').innerHTML = "Verifying...";

		reannounce();
	});
}

function setUserName()
{
	var username = domelem('username').value;
	console.log(username);
	localStorage.username = username;
}

document.addEventListener('DOMContentLoaded',function() {
	if (localStorage.username) {
		domelem('username').value = localStorage.username;
		setUserName();
	}

	announce();

	domelem('status').innerHTML = "Announcing...";
});
