'use strict'

let FIFO_ADD_ITEM = './add_item.fifo';
let FIFO_ADD_HISTORY = './add_history.fifo';
let FIFO_CHANGE_PROP = './change_prop.fifo';
let FIFO_DELETE_ITEM = './delete_item.fifo';

let fs = require('fs');
let exec = require('child_process').exec;

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
	exec('mkfifo ' + FIFO_CHANGE_PROP, function(err, stdout, stderr){});
	exec('mkfifo ' + FIFO_DELETE_ITEM, function(err, stdout, stderr){});

	var io = require('socket.io').listen(server);
	io.sockets.on('connection', function(client) {
		console.log("connection");

		client.emit('list/update', items);
		client.emit('history/update', history);

		client.on('list/modify', function(d){
			console.log('list/modify ' + d.id)
			var wstream = fs.createWriteStream(FIFO_CHANGE_PROP);
			wstream.write(JSON.stringify({id: d.id, torque: d.v.torque}) + '\n');
			items[d.id] = d.v;
			io.sockets.emit('list/update', items);
		});

		client.on('list/delete', function(d){
			console.log('list/delete ' + d.id)
			var wstream = fs.createWriteStream(FIFO_DELETE_ITEM);
			wstream.write(JSON.stringify({id: d.id}) + '\n');
			delete items[d.id];
			io.sockets.emit('list/update', items);
		});

		// client disconnected
		client.on('disconnect', function(){
			console.log("disconnect");
		});
	});

	function eventAddItem(json) {
		addItem(json.name, json.picPath, json.torque);
		io.sockets.emit('list/update', items);
		console.log('emit list/update');
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
