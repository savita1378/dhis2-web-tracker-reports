/**
 * Created by hisp on 1/12/15.
 */

var bidReportsApp = angular.module('bidReportsApp',['ui.bootstrap',
    'ngRoute',
    'ngCookies',
    'ngSanitize',
    'ngMessages',
    'd2HeaderBar',
    'd2Directives',
    'd2Filters',
    'd2Services',
    'angularLocalStorage',
    'pascalprecht.translate',
    'bidReportsAppServices'
])

.config(function($routeProvider,$translateProvider){
        $routeProvider.when('/', {
            templateUrl:'views/home.html',
            controller: 'HomeController'
        }).when('/schedule-today', {
            templateUrl:'views/schedule-today.html',
            controller: 'TodayScheduleController'
        }).when('/stock-balance', {
            templateUrl:'views/stock-balance-bid.html',
            controller: 'StockController'
        }).when('/scheduled-vaccines', {
            templateUrl:'views/scheduled-vaccine.html',
            controller: 'ScheduledVaccinesController'
        }).otherwise({
            redirectTo : '/'
        });

        $translateProvider.preferredLanguage('en');
        $translateProvider.useSanitizeValueStrategy('escaped');
        $translateProvider.useLoader('i18nLoader');
    })