'use strict'

let FIFO_ADD_ITEM = './add_item.fifo';
let FIFO_ADD_HISTORY = './add_history.fifo';

var fs = require('fs');
var readline = require('readline');
var exec = require('child_process').exec;

var items = {};
var history = [];

function fileCopy(src, dest) {
	return new Promise((resolve,reject)=>{
		var r = fs.createReadStream(src)
		    .on("error",(err)=>{reject(err);}),
			w = fs.createWriteStream(dest)
		    .on("error",(err)=>{reject(err);})
		    .on("close",()=>{resolve();});
		r.pipe(w);
	});
}

function readlineCallback(fifoPath, callback) {
	fs.readFile(fifoPath, 'utf8', function (err, stdout) {
		var line = stdout.split("\n")[0]
		console.log('cor: ' + line);
		readlineCallback(fifoPath, callback);
		callback(JSON.parse(line));
	});
}

var lastItemKey = 0;
function addItem(name, picPath, torque) {
	var dstFileUrlPath = '/img/pic/' + ('0000' + lastItemKey).slice(-5) + '.jpg';
	var cmd = 'cp -f ' + picPath + ' public' + dstFileUrlPath;

	fileCopy(picPath, 'public/' + dstFileUrlPath);
	items[lastItemKey] = {
		name: name,
		picPath: dstFileUrlPath,
		torque: torque
	};
	lastItemKey ++;
}

exports.init = function(server) {
	// picture file directory
	exec('mkdir -p public/img/pic/', function(err, stdout, stderr){
	});

	// named fifo
	exec('mkfifo ' + FIFO_ADD_ITEM, function(err, stdout, stderr){});
	exec('mkfifo ' + FIFO_ADD_HISTORY, function(err, stdout, stderr){});

	// for test
//	addItem('untitled', '/home/uehara/img.sample/002.jpg', 3);
//	addItem('untitled', '#983', 4);
//	addItem('untitled', '#8ab', 5);

	var io = require('socket.io').listen(server);
	io.sockets.on('connection', function(client) {
		console.log("connection");

		client.emit('list/update', items);
		client.emit('history/update', history);

		client.on('list/modify', function(d){
			items[d.id] = d.v;
			io.sockets.emit('list/update', items);
		});

		client.on('list/delete', function(d){
			delete items[d.id];
			io.sockets.emit('list/update', items);
		});

		// client disconnected
		client.on('disconnect', function(){
			console.log("disconnect");
		});
	});

	function eventAddItem(json) {
		var clients = io.sockets.clients();
		var num_client = clients.server.eio.clientsCount;
		addItem(json.name, json.picPath, json.torque);
		io.sockets.emit('list/update', items);
		console.log('emit list/update');
/*
		if (num_client > 0) {
			for (var key in clients.sockets) {
				console.log('bcast');
				clients.sockets[key].broadcast.emit('list/update', 'hey');
				clients.sockets[key].emit('list/update', 'hey');
				break;
			}
		}
*/
	}
	readlineCallback(FIFO_ADD_ITEM, eventAddItem);

	function eventAddHistory(json) {
		console.log('emit history/update');
		var h = {};
		h.date = new Date();
		h.id = json.id;
		h.torque = json.torque;
		h.result = json.result;
		history.push(h);
		io.sockets.emit('history/update', history);
	}
	readlineCallback(FIFO_ADD_HISTORY, eventAddHistory);
};
