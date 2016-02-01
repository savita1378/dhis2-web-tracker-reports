//Controller for column show/hide
bidReportsApp.controller('LeftBarMenuController',
    function ($scope,
              $location) {

        $scope.showTodaySchedule = function () {
            $location.path('/schedule-today').search();
        };

        $scope.showStockBalance = function () {
            $location.path('/stock-balance').search();
        };
        $scope.showScheduledVaccines = function () {
            $location.path('/scheduled-vaccines').search();
        };
    });