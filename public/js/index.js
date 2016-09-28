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

app.service('db', ['$rootScope', '$filter', '$http', function($scope, $filter, $http) {
	var socket = io.connect('http://localhost:3000');
	socket.on('connect', function(msg) {
		console.log("connect");
	});

	socket.on('list/update', function(msg) {
		console.log('list/update');
	});

	this.hash = {};

	this.get = function() {
		return this.hash;
	}.bind(this);

	this.modify = function(id, item) {
		this.hash[id] = item;
		socket.emit('list/modify', item);
	}

	// for test
	this.hash[0] = {name: 'untitled', picPath: '#39a', torque: 3};
	this.hash[1] = {name: 'untitled', picPath: '#983', torque: 4};
	this.hash[2] = {name: 'untitled', picPath: '#8ab', torque: 5};
}]);

app.controller('MainController', ['$scope', 'db', function($scope, db) {
}]);

app.controller('ListController', ['$scope', 'db', function($scope, db) {
	$scope.items = db.get();
}]);

app.controller('ModifyController', ['$scope', '$location', '$routeParams', 'db', function($scope, $location, $params, db) {
	$scope.id = $params.id;
	$scope.item = db.get()[$params.id];

	$scope.update = function() {
		db.modify($scope.id, $scope.item);
		$location.path('/');
	};
	$scope.cancel = function() {
		$location.path('/');
	};
}]);
