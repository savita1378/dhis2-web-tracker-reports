/**
 * Created by hisp on 2/12/15.
 */

var bidReportsAppServices = angular.module('bidReportsAppServices', [])
    .service('MetadataService',function($q){
       return {
           getOrgUnit : function(id){
               var def = $.Deferred();
               $.ajax({
                   type: "GET",
                   dataType: "json",
                   contentType: "application/json",
                   url: '../../organisationUnits/'+id+".json?fields=id,name,level,programs[id,name,programStages]",
                   success: function (data) {
                       def.resolve(data);
                   }
               });
               return def;
           },
           getTrackedEntitiesForEventsByStatusAndProgramStage : function(status,programStage){
               var def = $.Deferred();
               $.ajax({
                   type: "GET",
                   dataType: "json",
                   contentType: "application/json",
                   url: '../../events.json?programStage='+programStage+'&status='+status,
                   success: function (data) {
                       def.resolve(data.events);
                   }
               });
               return def;
           },
           getEventsByProgramStageAndOU : function(programStage,ouId,ouMode){
               var def = $.Deferred();
               $.ajax({
                   type: "GET",
                   dataType: "json",
                   contentType: "application/json",
                   url: '../../events.json?skipPaging=true&programStage='+programStage+'&orgUnit='+ouId+'&ouMode='+ouMode+'&status=SCHEDULE',
                   success: function (data) {
                       def.resolve(data.events);
                   }
               });
               return def;
           },
           getAllConstants : function(){
               var def = $q.defer();
               $.ajax({
                   type: "GET",
                   dataType: "json",
                   contentType: "application/json",
                   url: '../../constants.json?paging=false',
                   success: function (data) {
                       def.resolve(data.constants);
                   }
               });
               return def.promise;
           },
           getProgramIndicatorsByProgram : function(programUid){
               //var roles = SessionStorageService.get('USER_ROLES');
               //var userRoles = roles && roles.userCredentials && roles.userCredentials.userRoles ? roles.userCredentials.userRoles : [];
               //var ou = SessionStorageService.get('SELECTED_OU');

               var def = $q.defer();
               $.ajax({
                   type: "GET",
                   dataType: "json",
                   contentType: "application/json",
                   url: '../../programIndicators.json?fields=*&paging=false&filter=program.id:eq:'+programUid,
                   success: function (data) {
                       //var pr = data.programs;
                       //var programs = [];
                       //angular.forEach(prs, function(pr){
                       //    if(pr.organisationUnits.hasOwnProperty( ou.id ) && userHasValidRole(pr, userRoles)){
                       //        programs.push(pr);
                       //    }
                       //});
                       def.resolve(data.programIndicators);
                   }
               });
               return def.promise;
           },
           getProgramValidationsByProgram : function(programUid){
               //var roles = SessionStorageService.get('USER_ROLES');
               //var userRoles = roles && roles.userCredentials && roles.userCredentials.userRoles ? roles.userCredentials.userRoles : [];
               //var ou = SessionStorageService.get('SELECTED_OU');

               var def = $q.defer();
               $.ajax({
                   type: "GET",
                   dataType: "json",
                   contentType: "application/json",
                   url: '../../programValidations.json?fields=*&paging=false&filter=program.id:eq:'+programUid,
                   success: function (data) {
                       //var pr = data.programs;
                       //var programs = [];
                       //angular.forEach(prs, function(pr){
                       //    if(pr.organisationUnits.hasOwnProperty( ou.id ) && userHasValidRole(pr, userRoles)){
                       //        programs.push(pr);
                       //    }
                       //});
                       def.resolve(data.programValidations);
                   }
               });
               return def.promise;
           },
           getProgramRuleVariablesByProgram : function(programUid){
               //var roles = SessionStorageService.get('USER_ROLES');
               //var userRoles = roles && roles.userCredentials && roles.userCredentials.userRoles ? roles.userCredentials.userRoles : [];
               //var ou = SessionStorageService.get('SELECTED_OU');

               var def = $q.defer();
               $.ajax({
                   type: "GET",
                   dataType: "json",
                   contentType: "application/json",
                   url: '../../programRuleVariables.json?fields=*&paging=false&filter=program.id:eq:'+programUid,
                   success: function (data) {
                       //var pr = data.programs;
                       //var programs = [];
                       //angular.forEach(prs, function(pr){
                       //    if(pr.organisationUnits.hasOwnProperty( ou.id ) && userHasValidRole(pr, userRoles)){
                       //        programs.push(pr);
                       //    }
                       //});
                       def.resolve(data.programRuleVariables);
                   }
               });
               return def.promise;
           },
           getProgramRulesByProgram : function(programUid){
               //var roles = SessionStorageService.get('USER_ROLES');
               //var userRoles = roles && roles.userCredentials && roles.userCredentials.userRoles ? roles.userCredentials.userRoles : [];
               //var ou = SessionStorageService.get('SELECTED_OU');

               var def = $q.defer();
               $.ajax({
                   type: "GET",
                   dataType: "json",
                   contentType: "application/json",
                   url: '../../programRules.json?fields=*,programRuleActions[*]&paging=false&filter=program.id:eq:'+programUid,
                   success: function (data) {
                       //var pr = data.programs;
                       //var programs = [];
                       //angular.forEach(prs, function(pr){
                       //    if(pr.organisationUnits.hasOwnProperty( ou.id ) && userHasValidRole(pr, userRoles)){
                       //        programs.push(pr);
                       //    }
                       //});
                       def.resolve(data.programRules);
                   }
               });
               return def.promise;
           },

           getProgramStage : function(UID){

               var def = $q.defer();
               $.ajax({
                   type: "GET",
                   dataType: "json",
                   contentType: "application/json",
                   url: '../../programStages/'+UID+".json",
                   success: function (data) {
                       def.resolve(data);
                   }
               });
               return def.promise;
           },
           getAllProgramIds : function(){
               var def = $q.defer();
               $.ajax({
                   type: "GET",
                   dataType: "json",
                   contentType: "application/json",
                   url: '../../programs.json?fields=id',
                   success: function (data) {
                       def.resolve(data.programs);
                   }
               });
               return def.promise;
           },
           getAllProgramStages : function(){
               var def = $q.defer();
               $.ajax({
                   type: "GET",
                   dataType: "json",
                   contentType: "application/json",
                   url: '../../programStages.json?fields=*,programStageDataElements[*,dataElement[*]]',
                   success: function (data) {
                       def.resolve(data.programStages);
                   }
               });
               return def.promise;
           },
           getProgramStage : function(id){
               var def = $q.defer();
               $.ajax({
                   type: "GET",
                   dataType: "json",
                   contentType: "application/json",
                   url: '../../programStages/'+id+".json?fields=id,name,programStageDataElements[*,dataElement[*]]",
                   success: function (data) {
                       def.resolve(data);
                   }
               });
               return def.promise;
           },
           getTEIByUID : function(UID){
               var def = $q.defer();
               $.ajax({
                   type: "GET",
                   dataType: "json",
                   contentType: "application/json",
                   url: '../../trackedEntityInstances/'+UID+'.json',
                   success: function (data) {
                       def.resolve(data);
                   }
               });
               return def.promise;
           },
           getEnrollmentByUID : function(UID){
               var def = $q.defer();
               $.ajax({
                   type: "GET",
                   dataType: "json",
                   contentType: "application/json",
                   url: '../../enrollments/'+UID+'.json',
                   success: function (data) {
                       def.resolve(data);
                   }
               });
               return def.promise;
           },
           getEventsByTEI : function(TEIUID){
               var def = $q.defer();
               $.ajax({
                   type: "GET",
                   dataType: "json",
                   contentType: "application/json",
                   url: '../../events.json?trackedEntityInstance='+TEIUID,
                   success: function (data) {
                       def.resolve(data.events);
                   }
               });
               return def.promise;
           },
           getAllPrograms : function(){
               var def = $q.defer();
               $.ajax({
                   type: "GET",
                   dataType: "json",
                   contentType: "application/json",
                   url: '../../programs.json?fields=id,name,programStages[*],programTrackedEntityAttributes[trackedEntityAttribute[id,displayName]]',
                   success: function (data) {
                       def.resolve(data.programs);
                   }
               });
               return def.promise;
           },
           getProgram : function(UID){

               var def = $q.defer();
               $.ajax({
                   type: "GET",
                   dataType: "json",
                   contentType: "application/json",
                   url: '../../programs/'+UID+".json?fields=id,name,programStages[*],programTrackedEntityAttributes[trackedEntityAttribute[id,displayName]]",
                   success: function (data) {
                       def.resolve(data);
                   }
               });
               return def.promise;
           }
       }
    })

    .service('utilityService', function () {

        return {
            prepareIdToObjectMap : function(object,id){
                var map = [];
                for (var i=0;i<object.length;i++){
                    map[object[i][id]] = object[i];
                }
                return map;
            },
            prepareDataElementIdToObjectMap : function(object,id){
                var map = [];

                for (var i=0;i<object.length;i++){
                    map[object[i].dataElement.id] = object[i];
                }
                return map;
            },
            prepareIdToValueMap: function(object,id,value){
                var map = [];
                for (var i=0;i<object.length;i++){
                    map[object[i][id]] = value;
                }
                return map;
            },
            populateValue: function(object,id,value){
                for (var i=0;i<object.length;i++){
                    object[i][id] = value;
                }
                return object;
            }
        }
    })

    .service('userSettingsService', function ($q) {

        return {

            saveUserSetting : function(key,userSetting){
                var valueJson = JSON.stringify(userSetting);

                var def = $q.defer();
                $.ajax({
                    type: "POST",
                    dataType: "json",
                    contentType: "application/json",
                    url: '../../userSettings/'+key+"?value="+valueJson,
                    success: function (data) {

                        def.resolve(data);
                    }
                });
                return def.promise;
            },
            getUserSetting : function(key){
                var def = $q.defer();
                $.ajax({
                    type: "GET",
                    dataType: "json",
                    contentType: "application/json",
                    url: '../../userSettings/'+key+".json",
                    success: function (data) {

                        def.resolve(data);
                    },
                    error:function(a,b,c){
                        def.resolve(undefined);
                    }
                });
                return def.promise;
            },
            getCurrentUser : function(){
                var def = $q.defer();
                $.ajax({
                    type: "GET",
                    dataType: "json",
                    contentType: "application/json",
                    url: '../../me.json?fields=id,displayName,organisationUnits[id,name,level]',
                    success: function (data) {

                        def.resolve(data);
                    }
                });
                return def.promise;
            }
        }
    })
    .service('sqlViewService', function () {

        return {
            executeSqlView : function(uid,params){
                var def = $.Deferred();
                $.ajax({
                    type: "GET",
                    dataType: "json",
                    contentType: "application/json",
                    url: '../../sqlViews/'+uid+"/data.json?"+params,
                    success: function (data) {
                        def.resolve(data);
                    }
                });
                return def;
            }
        }
    })
