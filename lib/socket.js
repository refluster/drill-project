'use strict'

let FIFO_ADD_ITEM = './add_item.fifo';

var fs = require('fs');
var readline = require('readline');
var exec = require('child_process').exec;

var items = {};

function readlineCallback(fifoPath, callback) {
	var rs = fs.ReadStream(fifoPath);
	var rl = readline.createInterface({'input': rs, 'output': {}});
	rl.on('line', function (line) {
		var line = line.trim()
		console.log('cor: ' + line);
		callback(JSON.parse(line));
	});
}

var lastItemKey = 0;
function addItem(name, picPath, torque) {
	var dstFileUrlPath = '/img/pic/' + ('0000' + lastItemKey).slice(-5) + '.jpg';
	var cmd = 'cp -f ' + picPath + ' public' + dstFileUrlPath;
	exec(cmd, function(err, stdout, stderr){
	});

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
	exec('mkfifo ' + FIFO_ADD_ITEM, function(err, stdout, stderr){
	});

	// for test
//	addItem('untitled', '/home/uehara/img.sample/002.jpg', 3);
//	addItem('untitled', '#983', 4);
//	addItem('untitled', '#8ab', 5);

	var io = require('socket.io').listen(server);
	io.sockets.on('connection', function(client) {
		console.log("connection");

		client.emit('list/update', items);

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

	function readline(json) {
		var clients = io.sockets.clients();
		var num_client = clients.server.eio.clientsCount;
		addItem(json.name, json.picPath, json.torque);
		io.sockets.emit('list/update', items);
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
		readlineCallback(FIFO_ADD_ITEM, readline);
	}
	readlineCallback(FIFO_ADD_ITEM, readline);
};
