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

exports.init = function(driver, server) {
	var io = require('socket.io').listen(server);
	io.sockets.on('connection', function(client) {
		console.log("connection");
		
		// client disconnected
		client.on('disconnect', function(){
			console.log("disconnect");
		});
	});

	function readline(json) {
		var clients = io.sockets.clients();
		var num_client = clients.length;
		if (num_client > 0) {
			io.sockets.broadcast.emit('hey');
		}
		readlineCallback(NAMED_FIFO_PATH, readline);
	}
	readlineCallback(NAMED_FIFO_PATH, readline);
};
