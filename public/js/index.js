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
}]);

app.controller('MainController', ['$scope', 'db', function($scope, db) {
}]);

app.controller('MenuController', ['$scope', 'db', function($scope, db) {
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
	var resetNum = 0;
	$scope.history = db.getHistory()
	$scope.$on('update:db:history', function(e) {
		console.log('history upd');
		$scope.$apply(function() {
			$scope.history = db.getHistory().slice(resetNum);
			var his = db.getHistory();
			var nhis = his[his.length-1];
			if(nhis.result == "成功")document.getElementById("soundok").play();
			if(nhis.result == "失敗")document.getElementById("soundng").play();
			alert('締め付け箇所: ' + db.get()[nhis.id].name
				+ '\nトルク: ' + nhis.torque
				+ '\n締め付け成否: ' + nhis.result
				+ '\n日付: ' + nhis.date);
		});
	});
	$scope.logreset = function() {
		resetNum = db.getHistory().length;
		$scope.history = db.getHistory().slice(resetNum);
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
		$location.path('/');
	};
	$scope.cancel = function() {
		db.get()[$params.id] = $scope.backup_item;
		$location.path('/');
	};
	$scope.del = function() {
		db.del($scope.id);
		$location.path('/');
	};

    $scope.$on('update:db', function(e) {
        $scope.items = db.get();
    });
}]);
