app = angular.module('App', ['ngRoute']);

app.config(['$routeProvider', function ($routeProvider) {
	$routeProvider
		.when('/', {
			templateUrl: 'tmpl-menu',
			controller: 'MenuController'
		})
		.when('/list', {
			templateUrl: 'tmpl-list',
			controller: 'ListController'
		})
		.when('/history', {
			templateUrl: 'tmpl-history',
			controller: 'HistoryController'
		})
		.when('/info', {
			templateUrl: 'tmpl-info',
			controller: 'InfoController'
		})
		.when('/reset', {
			templateUrl: 'tmpl-reset',
			controller: 'ResetController'
		})
		.when('/auth', {
			templateUrl: 'tmpl-auth',
			controller: 'AuthController'
		})
		.when('/list/modify/:id*', {
			templateUrl: 'tmpl-list-modify',
			controller: 'ListModifyController'
		})
		.otherwise({
			redirectTo: '/'
		});
}]);

app.service('db', ['$rootScope', '$filter', '$http', function($scope, $filter, $http) {
	var socket = io.connect('http://192.168.11.110:3000');
	var hash = {};
	var history = [];
	var isRocked = true;

	socket.on('connect', function(msg) {
		console.log("connect");
	});

	socket.on('list/update', function(d) {
		hash = d;
		$scope.$broadcast('update:db', 3);
		console.log('list/update');
	});

	socket.on('history/update', function(d) {
		history = d;
		$scope.$broadcast('update:db:history');
		console.log('history/update');
	});

	socket.on('rock_unrock/update', function(d) {
		isRocked = (d.rock_state == "unrocked"? false: true);
		console.log('rock_unrock/update ' + d.rock_state);
	});

	this.get = function() {
		return hash;
	};

	this.modify = function(id, item) {
		hash[id] = item;
		socket.emit('list/modify', {id: id, v: item});
	};

	this.getHistory = function() {
		return history;
	};

	this.del = function(id, item) {
		socket.emit('list/delete', {id: id});
	};

	this.resetHistory = function() {
		socket.emit('history/reset');
	};

	this.rock_unrock = function() {
		var rock = (isRocked == true? "unrocked": "rocked");
		socket.emit('rock_unrock/update', {rock_state: rock});
	};
}]);

app.controller('MainController', ['$scope', 'db', function($scope, db) {
	$scope.backHistory = function() {
		window.history.back();
	};
}]);

app.controller('MenuController', ['$scope', 'db', function($scope, db) {
	$scope.rock_unrock = function() {
		db.rock_unrock();
	};

	$('#toggle').bootstrapToggle({
		on: 'Rocked',
		off: 'Unrocked'
    });
}]);

app.controller('ListController', ['$scope', 'db', function($scope, db) {
	$scope.items = db.get();
    $scope.$on('update:db', function(e) {
		console.log('list upd');
		$scope.$apply(function() {
			$scope.items = db.get();
		});
	});
}]);

app.controller('HistoryController', ['$scope', 'db', function($scope, db) {
	$scope.history = db.getHistory()
	$scope.$on('update:db:history', function(e) {
		console.log('history upd');
		$scope.$apply(function() {
			$scope.history = db.getHistory();
			var his = db.getHistory();
			if(his.length == 0) return;
			var nhis = his[his.length-1];
			if(nhis == -1) return;
			if(nhis.result == "成功") document.getElementById("soundok").play();
			if(nhis.result == "失敗") document.getElementById("soundng").play();
			alert('締め付け箇所: ' + db.get()[nhis.id].name
				+ '\nトルク: ' + nhis.torque
				+ '\n締め付け成否: ' + nhis.result
				+ '\n日付: ' + nhis.date);
		});
	});
	$scope.logreset = function() {
		db.resetHistory();
		$scope.history = db.getHistory();
	};
}]);

app.controller('InfoController', ['$scope', 'db', function($scope, db) {
}]);

app.controller('ResetController', ['$scope', 'db', function($scope, db) {
}]);

app.controller('AuthController', ['$scope', 'db', function($scope, db) {
}]);

app.controller('ListModifyController', ['$scope', '$location', '$routeParams', 'db', function($scope, $location, $params, db) {
	$scope.id = $params.id;
	$scope.item = db.get()[$params.id];
	$scope.backup_item = angular.copy($scope.item);

	$scope.update = function() {
		db.modify($scope.id, $scope.item);
		window.history.back();
	};
	$scope.del = function() {
		db.del($scope.id);
		window.history.back();
	};

    $scope.$on('update:db', function(e) {
        $scope.items = db.get();
    });
}]);
