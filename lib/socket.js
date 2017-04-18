'use strict';

let FIFO_ADD_ITEM = './add_item.fifo';
let FIFO_ADD_HISTORY = './add_history.fifo';
let FIFO_CHANGE_PROP = './change_prop.fifo';
let FIFO_DELETE_ITEM = './delete_item.fifo';
let FIFO_LOCK_UNLOCK = './lock_unlock.fifo';

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
	exec('mkdir -p public/img/pic/', function(err, stdout, stderr){});
	// history picture file directory
	exec('mkdir -p public/img/pic_hist/', function(err, stdout, stderr){});

	// named fifo
	exec('mkfifo ' + FIFO_ADD_ITEM, function(err, stdout, stderr){});
	exec('mkfifo ' + FIFO_ADD_HISTORY, function(err, stdout, stderr){});
	exec('mkfifo ' + FIFO_CHANGE_PROP, function(err, stdout, stderr){});
	exec('mkfifo ' + FIFO_DELETE_ITEM, function(err, stdout, stderr){});
	exec('mkfifo ' + FIFO_LOCK_UNLOCK, function(err, stdout, stderr){});

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
			fs.unlink('public/' + items[d.id].picPath, function(e) {
				if (e) throw e;
			});
			var wstream = fs.createWriteStream(FIFO_DELETE_ITEM);
			wstream.write(JSON.stringify({id: d.id}) + '\n');
			delete items[d.id];
			io.sockets.emit('list/update', items);
		});

		client.on('history/reset', function(d){
			history = [];
			io.sockets.emit('history/update', history);
		});

		client.on('lock_unlock/update', function(d){
			console.log('lock_unlock/update ' + d.lock_state)
			var wstream = fs.createWriteStream(FIFO_LOCK_UNLOCK);
			wstream.write(JSON.stringify({lock_state: d.lock_state}) + '\n');
			io.sockets.emit('lock_unlock/update', d);
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

	var lastHistoryKey = 0;
	function eventAddHistory(json) {
		console.log('emit history/update');

		// copy picture
		var dstFileUrlPath = '/img/pic_hist/' + ('0000' + lastHistoryKey).slice(-5) + '.jpg';
		var cmd = 'cp -f ' + json.picPath + ' public' + dstFileUrlPath;
		fileCopy(json.picPath, 'public/' + dstFileUrlPath);
		lastHistoryKey++;

		var h = {};
		//h.date = new Date();
		//h.date = (new Date()).toLocaleString("ja-JP");
		var date = new Date();
		h.date = date.getFullYear() + "/" + (date.getMonth()+1)  + "/"  + date.getDate() + " "
			+ ('00' + date.getHours()).slice(-2) + ":" + ('00' + date.getMinutes()).slice(-2) +":"
			+ ('00' + date.getSeconds()).slice(-2);
		h.id = json.id;
		h.torque = json.torque;
		h.result = json.result;
		h.picPath = dstFileUrlPath;
		history.push(h);
		//alert('締め付け箇所: ' + h.id '\nトルク: ' + h.torque; + '\n締め付け成否: ' + h.result + '\n日付: ' + h.date);
		io.sockets.emit('history/update', history);
	}
	readlineCallback(FIFO_ADD_HISTORY, eventAddHistory);
};
