/**
 * Created by hisp on 1/12/15.
 */

bidReportsApp
.controller('HomeController', function( $rootScope,
                                         $scope,
                                        $location){


        $scope.openReport = function(template){
            $location.path('/'+template).search();
        }
    });
