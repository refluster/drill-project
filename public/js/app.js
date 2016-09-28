app = angular.module('App', ['ngRoute']);

app.config(['$routeProvider', function ($routeProvider) {
	$routeProvider
		.when('/', {
			templateUrl: 'tmpl-list-wide',
			controller: 'ListWideController'
		})
		.when('/list-narrow', {
			templateUrl: 'tmpl-list-narrow',
			controller: 'ListNarrowController'
		})
		.when('/show/:file*', {
			templateUrl: 'tmpl-show',
			controller: 'ShowController'
		})
		.otherwise({
			redirectTo: '/'
		});
}]);

app.service('list', ['$rootScope', '$filter', '$http', function($scope, $filter, $http) {
	this.list = [];

	function pad(n, len) {
		s = n.toString();
		if (s.length < len) {
			s = ('0000000000' + s).slice(-len);
		}
		return s;
	}
	
	this.load = function() {
		this.list = {};
		$http.get("db.json").success(function(db) {
			// insert db into list
			angular.forEach(db, function(v) {
				if (this.list[v.date] == undefined) {
					this.list[v.date] = [];
				}
				this.list[v.date].push({
					fileOrig: v.fileOrig,
					fileLarge: v.fileLarge,
					fileThumb: v.fileThumb});
			}.bind(this));
			$scope.$broadcast('change:list', this.list);
		}.bind(this));
	}.bind(this);

	this.get = function() {
		return this.list;
	}.bind(this);
}]);

app.service('sse', ['$rootScope', function($scope) {
	this.connect = function() {
		this.es = new EventSource("/sse");
	};

	this.setCallback = function(callback) {
		this.es.onmessage = function (event) {
			console.log(event.data);
			callback(event.data);
		};
	}.bind(this);
}]);

app.controller('MainController', ['$scope', 'list', 'sse', function($scope, list, sse) {
	$scope.$on('change:list', function (e, list) {
		$scope.pictureList = list;
	});

	list.load();
	sse.connect();
}]);

app.controller('ListWideController', ['$scope', '$http', 'list', 'sse', function($scope, $http, list, sse) {
	$scope.status = undefined;
	$scope.pictureList = list.get();

	sse.setCallback(function(jsonString) {
		var data = angular.fromJson(jsonString);
		$scope.$apply(function () {
			$scope.progress = data;
			if (data.complete == data.total) {
				$scope.status = 'updating';
				list.load();
			}
        });
		console.log(data);
	});

	$scope.$on('change:list', function (e, list) {
		$scope.pictureList = list;
		$scope.status = undefined;
	});

	$scope.importImage = function() {
		$scope.status = 'importing';
		$http.get('import').success(function(res) {});
	};
}]);

app.controller('ListNarrowController', ['$scope', 'list', function($scope, list) {
	$scope.pictureList = list.get();
}]);

app.controller('ShowController', ['$scope', '$routeParams', 'list', function($scope, $params, sheets) {
	$scope.file = $params.file;
}]);

