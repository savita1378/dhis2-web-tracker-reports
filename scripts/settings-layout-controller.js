//Controller for column show/hide
bidReportsApp.controller('SettingsLayoutController',
        function($scope, $modalInstance,reportTemplate) {

            $scope.reportTemplate = reportTemplate;


        $scope.close = function () {
            debugger
            $modalInstance.close($scope.reportTemplate);
        };
});