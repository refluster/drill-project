// var socket = io.connect('http://localhost:3000');
var socket = io.connect('http://localhost:3000');
socket.on('connect', function(msg) {
	console.log("connect");
});

// ��å�������������Ȥ�
socket.on('list/update', function(msg) {
	console.log('list/update');
	document.getElementById("msg").innerHTML += msg.value;
});

// ��å�����������
function SendMsg() {
	var msg = document.getElementById("message").value;
	console.log('send msg');
	// ��å�������ȯ�ͤ���
	socket.emit('message', { value: msg });
}
// ���Ǥ���
function DisConnect() {
	var msg = socket.socket.transport.sessid + "�����Ǥ��ޤ�����";
	// ��å�������ȯ�ͤ���
	socket.emit('message', { value: msg });
	// socket�����Ǥ���
	socket.disconnect();
}
