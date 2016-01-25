/**
 * Created by hisp on 2/12/15.
 */

bidReportsApp
    .controller('StockBalanceController', function ($rootScope,
                                                     $scope,
                                                     $timeout,
                                                    MetadataService,
                                                    sqlViewService
                                                    ) {

        const sqlViewSelected = "Y52YnK869WO";
        const sqlViewChildren = "lTqNF1rWha3";
        const sqlViewDescendent = "CraSsUTG2aw";

        $scope.showReport = false;
        $scope.selectedOuMode = {name : "SELECTED"};

        //initially load tree
        selection.load();

        // Listen for OU changes
        selection.setListenerFunction(function () {
            $scope.selectedOrgUnitUid = selection.getSelected();
            MetadataService.getOrgUnit($scope.selectedOrgUnitUid).then(function(ou){
                $timeout(function(){
                    $scope.selectedOrgUnit = ou;
                })
            })
        }, false);

        function reset(){
            switch($scope.selectedOuMode.name){
                case 'SELECTED' : $scope.currentSqlView = sqlViewSelected; break
                case 'DESCENDANTS' : $scope.currentSqlView = sqlViewDescendent; break
                case 'CHILDREN' : $scope.currentSqlView = sqlViewChildren; break

                default : $scope.currentSqlView = sqlViewSelected;
            }
        }

        function prepareToExecuteSQLView(ou){
            var params = "var=level:"+ou.level +"&var=ouuid:"+ou.id ;
            sqlViewService.executeSqlView($scope.currentSqlView,params).then(function(data){
                $timeout(function(){
                    $scope.stockBalance = data;
                    $scope.showReport = true;
                })
            })
        }

        $scope.generateReport = function () {
            reset();
            prepareToExecuteSQLView($scope.selectedOrgUnit);
        }
    });