// var socket = io.connect('http://localhost:3000');
var socket = io.connect('http://localhost:3000');
socket.on('connect', function(msg) {
	console.log("connect");
});

// メッセージを受けたとき
socket.on('list/update', function(msg) {
	console.log('list/update');
	document.getElementById("msg").innerHTML += msg.value;
});

// メッセージを送る
function SendMsg() {
	var msg = document.getElementById("message").value;
	console.log('send msg');
	// メッセージを発射する
	socket.emit('message', { value: msg });
}
// 切断する
function DisConnect() {
	var msg = socket.socket.transport.sessid + "は切断しました。";
	// メッセージを発射する
	socket.emit('message', { value: msg });
	// socketを切断する
	socket.disconnect();
}
