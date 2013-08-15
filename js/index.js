function indexCtrl($scope, $http, $templateCache, $compile, $location) {
	$scope.searchImage = function() {
		location.href = "search_img.html?q="+encodeURI($scope.searchValue);
	};
}
