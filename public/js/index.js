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
		.when('/modify/:id*', {
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
		this.list.push(item);
	}

	// for test
	this.insert({id: 0, name: 'untitled', picPath: '#39a', torque: 3});
	this.insert({id: 1, name: 'untitled', picPath: '#983', torque: 4});
	this.insert({id: 2, name: 'untitled', picPath: '#8ab', torque: 5});
}]);

app.controller('MainController', ['$scope', 'list', function($scope, list) {
}]);

app.controller('ListController', ['$scope', 'list', function($scope, list) {
	$scope.items = list.get();
}]);

app.controller('ModifyController', ['$scope', '$location', '$routeParams', 'list', function($scope, $location, $params, list) {
	$scope.id = $params.id;
	$scope.item = list.get()[$params.id];

	$scope.update = function() {
		$location.path('/');
	};
	$scope.cancel = function() {
		$location.path('/');
	};
}]);
