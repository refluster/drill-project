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

	socket.on('lock_unlock/update', function(d) {
		if (d.lock_state == "locked") {
			$('#toggle').bootstrapToggle('on');
		} else {
			$('#toggle').bootstrapToggle('off');
		}
		console.log('lock_unlock/update ' + d.lock_state);
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

	this.lock_unlock = function() {
		var lock = ($('#toggle').prop('checked') == true? "unlocked": "locked");
		socket.emit('lock_unlock/update', {lock_state: lock});
	};
}]);

app.controller('MainController', ['$scope', 'db', function($scope, db) {
	$scope.backHistory = function() {
		window.history.back();
	};
}]);

app.controller('MenuController', ['$scope', 'db', function($scope, db) {
	$scope.lock_unlock = function() {
		db.lock_unlock();
	};

	$('#toggle').bootstrapToggle({
		on: 'Locked',
		off: 'Unlocked'
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
			if ($scope.history.length == 0) return;
			var last = $scope.history[$scope.history.length - 1];
			var msgAlert = 'トルク: ' + last.torque	+ '\n締め付け成否: ' + last.result;
			if (last.result == "成功") {
				msgAlert = '締め付け箇所: ' + db.get()[nh.id].name + '\n' + msgAlert;
				document.getElementById("soundok").play();
			} else if (last.result == "失敗") {
				document.getElementById("soundng").play();
			}
			alert(msgAlert);
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
