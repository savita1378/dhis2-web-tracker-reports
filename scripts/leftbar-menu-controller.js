//Controller for column show/hide
bidReportsApp.controller('LeftBarMenuController',
        function($scope,
                $location) {
    $scope.showTodaySchedule = function(){
        $location.path('/schedule-today').search();
    }; 
    

});