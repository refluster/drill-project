'use strict'

let NAMED_FIFO_PATH = './test.fifo';

var fs = require('fs');
var readline = require('readline');

function readlineCallback(fifoPath, callback) {
	var rs = fs.ReadStream(fifoPath);
	var rl = readline.createInterface({'input': rs, 'output': {}});
	rl.on('line', function (line) {
		var line = line.trim()
		console.log('cor: ' + line);
		callback(JSON.parse(line));
	});
}

exports.init = function(server) {
	var io = require('socket.io').listen(server);
	io.sockets.on('connection', function(client) {
		console.log("connection");
		
		// client message
		client.on('message', function(){
			console.log("recv mesg");
		});

		// client disconnected
		client.on('disconnect', function(){
			console.log("disconnect");
		});
	});

	function readline(json) {
		var clients = io.sockets.clients();
		var num_client = clients.server.eio.clientsCount;
		io.sockets.emit('list/update', 'hey');
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
		readlineCallback(NAMED_FIFO_PATH, readline);
	}
	readlineCallback(NAMED_FIFO_PATH, readline);
};
