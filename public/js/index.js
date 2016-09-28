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



//////////////////////////////

app = angular.module('App', ['ngRoute']);

app.config(['$routeProvider', function ($routeProvider) {
	$routeProvider
		.when('/', {
			templateUrl: 'tmpl-list',
			controller: 'ListController'
		})
		.when('/modify/:file*', {
			templateUrl: 'tmpl-modify',
			controller: 'ModifyController'
		})
		.otherwise({
			redirectTo: '/'
		});
}]);

app.service('list', ['$rootScope', '$filter', '$http', function($scope, $filter, $http) {
	this.list = [];

	this.get = function() {
		return this.list;
	}.bind(this);

	this.insert = function(item) {
		this.list.add(item);
	}
}]);

app.controller('MainController', ['$scope', 'list', function($scope, list) {
}]);

app.controller('ListController', ['$scope', 'list', function($scope, list) {
	$scope.items = list.get();
}]);

app.controller('ModifyController', ['$scope', 'list', function($scope, list) {
}]);
