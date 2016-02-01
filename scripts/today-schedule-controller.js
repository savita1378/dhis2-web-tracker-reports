/**
 * Created by hisp on 2/12/15.
 */

bidReportsApp
    .controller('TodayScheduleController', function ($rootScope,
                                                     $scope,
                                                     $timeout,
                                                     MetadataService,
                                                     utilityService,
                                                     DateUtils,
                                                     orderByFilter,
                                                     TrackerRulesFactory,
                                                     TrackerRulesExecutionService,
                                                     userSettingsService,
                                                     $modal) {
        
        const userSettingKeySuffix = "-bidReportsApp";
        $scope.loading = false;
        $scope.selectedOuMode = {name : "SELECTED"};

        //initially load tree
        selection.load();

        // Listen for OU changes
        selection.setListenerFunction(function () {
            $scope.selectedOrgUnitUid = selection.getSelected();
            loadPrograms();
        }, false);

        //get all programs & extract TEI from programTEI
        MetadataService.getAllPrograms().then(function(programs){
            $scope.programs = programs;
            $scope.programsMap = utilityService.prepareIdToObjectMap(programs,"id");

            // Extract TEA from PTEA and put them in a map
            $scope.programTEAMap = [];
            for (var i=0;i< programs.length;i++){
                    $scope.programTEAMap[programs[i].id] =extractTEAFromPTEA(programs[i].programTrackedEntityAttributes);
            }

        })

        //get all programStages and put them in a map for further use
        $scope.programStagesMap = [];
        MetadataService.getAllProgramStages().then(function (programStages) {
            $scope.programStages = programStages;


            $scope.programStagesMap = [];
            $scope.programStageDeDesMap = [];
            for (var i=0;i< $scope.programStages.length;i++){
                    $scope.programStagesMap[$scope.programStages[i].id] = $scope.programStages[i];
                    $scope.programStageDeDesMap[$scope.programStages[i].id] = extractDeFromPrstDe($scope.programStages[i].programStageDataElements);
            }
        })


        //# get program rules for all programs and put them in a map for further use
        $scope.programRulesByProgramMap = [];
        $scope.programRulesLoadingPromise = $.Deferred();
        //get all programs
        MetadataService.getAllProgramIds().then(function (programs) {
            function fetchRules(index, programs) {
                if (index >= programs.length) {
                    $scope.programRulesLoadingPromise.resolve("Done");
                    return
                }

                TrackerRulesFactory.getRules(programs[index].id).then(function (rules) {
                    $scope.programRulesByProgramMap[programs[index].id] = rules;
                    fetchRules(index+1,programs);
                })
            }

            fetchRules(0, programs);
        }) //#

        //get current User
         userSettingsService.getCurrentUser().then(function(user){
            $scope.currentUser = user;
         })
       
        // Get all scheduled events
        // Get TEI attributes


        // show attributes and data elements of an event
        var report = {
            TEI: "",
            Attributes: [],
            Event: {
                DataElementsWithValue: [{id: "", value: ""}]
            }
        }

        $scope.generateReport = function () {
            totalRuleTime=0;TotalEventsByTEITime=0;TotalTEITime=0;TotalEnrollmentTime=0;
        reportStartTime = window.performance.now();

            $scope.programRulesLoadingPromise.then(function(response){
                if (response == "Done"){
                    $scope.makeReport();
                }
            })
        }

            $scope.makeReport = function () {

            $scope.reportEventsMap = [];
            $scope.reportEvents = [];
            $scope.loading = true;

            prepareReportTemplate();

            $scope.TEIMap = [];
            MetadataService.getEventsByProgramStageAndOU($scope.selectedProgramStage.id,$scope.selectedOrgUnit.id,$scope.selectedOuMode.name).then(function (events) {

                if (!events) {
                    // show message
                    $timeout(function(){
                        $scope.loading = false;
                    })

                    return;
                }

                //filter scheduled events- doing like this because API filter not working
                $scope.events = filterByStatus(events, 'SCHEDULE');


                function runRulesForEvent(eventCount){


                    if (eventCount >= $scope.events.length) {

                        calculateTotals();
                        $scope.loading = false;
                        reportEndTime = window.performance.now();
                        console.log("report generationtime"+(reportEndTime - reportStartTime))
                        console.log("TotalEventsByTEITime"+TotalEventsByTEITime)
                        console.log("TotalTEITime"+TotalTEITime)
                        console.log("TotalEnrollmentTime"+TotalEnrollmentTime)


                        console.log("totalruletime"+totalRuleTime)

                        return
                    }

                        var eventId = $scope.events[eventCount].event;

                    $scope.reportEventsMap[eventId] = [];

                    //for (var i=0;i<$scope.events.length;i++){
                    //    $scope.TEIMap[$scope.events[i].trackedEntityInstance] = $scope.events[i].trackedEntityInstance;
                    //    $scope.TEIMap.length++;
                    //}

                    // populate program rules
                    $scope.reportEventsMap[eventId].allProgramRules = $scope.programRulesByProgramMap[$scope.selectedProgram.id];

                    //get programstage data elements
                    $scope.reportEventsMap[eventId].prstDes = utilityService.prepareDataElementIdToObjectMap($scope.programStagesMap[$scope.events[eventCount].programStage].programStageDataElements,"id");
                    $scope.reportEventsMap[eventId].prstDeDes = $scope.programStageDeDesMap[$scope.events[eventCount].programStage];

                    $scope.prstDesMap = utilityService.prepareIdToObjectMap($scope.reportEventsMap[eventId].prstDeDes, "id");
                    getTEITimeStart = window.performance.now();
                    //get TEI
                    MetadataService.getTEIByUID($scope.events[eventCount].trackedEntityInstance).then(function (TEI) {
                        getTEITimeEnd = window.performance.now();
                        TotalTEITime = TotalTEITime +(getTEITimeEnd - getTEITimeStart);
                        //   $scope.TEI = TEI;
                        $scope.reportEventsMap[eventId].TEI = TEI;

                        getEnrollmentTimeStart = window.performance.now();

                        //get enrollment
                        MetadataService.getEnrollmentByUID($scope.events[eventCount].enrollment).then(function (enrollment) {
                            getEnrollmentTimeEnd = window.performance.now();
                            TotalEnrollmentTime = TotalEnrollmentTime +(getEnrollmentTimeEnd - getEnrollmentTimeStart);

                            //      $scope.enrollment = enrollment;
                            $scope.reportEventsMap[eventId].enrollment = enrollment;

                            getEventsByTEITimeStart = window.performance.now();

                            // get events
                            MetadataService.getEventsByTEI($scope.events[eventCount].trackedEntityInstance).then(function (events) {
                                getEventsByTEITimeEnd = window.performance.now();
                                TotalEventsByTEITime = TotalEventsByTEITime +(getEventsByTEITimeEnd - getEventsByTEITimeStart);
                                $scope.events[eventCount].eventDate = DateUtils.getToday();
                                for (var count=0;count<events.length;count++){

                                    //populate datavalue in the event itself----required by tracker rules execution!!
                                    if (events[count].dataValues){
                                        for (var i=0;i<events[count].dataValues.length;i++){
                                            events[count][events[count].dataValues[i].dataElement] = events[count].dataValues[i].value;
                                        }
                                    }

                                    if ($scope.events[eventCount].event == events[count].event){
                                        if (!events[count].eventDate)
                                            events[count].eventDate = DateUtils.getToday();

                                        $scope.reportEventsMap[eventId].event = events[count];
                                    }

                                    if (events[count].eventDate) {
                                        events[count].sortingDate = events[count].eventDate;
                                    }else{
                                        events[count].sortingDate = events[count].dueDate;
                                    }
                                }

                                // sort events
                                //events = orderByFilter(events, '-sortingDate');

                                var sortedEvents = []
                                sort(events,sortedEvents);

                               events = sortedEvents;

                                $scope.reportEventsMap[eventId].evs = {
                                    all: events,
                                    byStage: getEventsByStage(events)
                                };


                                var flag = {debug: true, verbose: false}


                                // All des are visible in the start
                                $scope.reportEventsMap[eventId].prstDeDesValueMap=populateValue($scope.reportEventsMap[eventId].prstDeDes);
                                executeRuleStart = window.performance.now();
                                //run rules
                                var rulesEffectResponse = TrackerRulesExecutionService.executeRulesBID(
                                    $scope.reportEventsMap[eventId].allProgramRules,
                                    $scope.reportEventsMap[eventId].event,
                                    $scope.reportEventsMap[eventId].evs,
                                    $scope.reportEventsMap[eventId].prstDes,
                                    $scope.reportEventsMap[eventId].TEI,
                                    $scope.reportEventsMap[eventId].enrollment,
                                    flag)
                                exeuteRuleEnd = window.performance.now();
                                totalRuleTime = totalRuleTime + (exeuteRuleEnd - executeRuleStart);
                                console.log("exe_"+eventId + ":"+(exeuteRuleEnd - executeRuleStart))
                                var rulesEffect = rulesEffectResponse.ruleeffects[rulesEffectResponse.event];

                                //get map of data values of prstde from evs
                                $scope.deValueMapForEvent = getDeValueMap($scope.reportEventsMap[eventId].prstDeDes,$scope.selectedProgramStage.id,$scope.reportEventsMap[eventId].evs);
                                $scope.reportEventsMap[eventId].prstDeDesValueMap =mergeMap($scope.reportEventsMap[eventId].prstDeDesValueMap,$scope.deValueMapForEvent);

                                for (var key in rulesEffect) {
                                    var effect = rulesEffect[key];
                                    if (effect.dataElement) {
                                        if ($scope.prstDesMap[effect.dataElement.id]) {
                                            if ($scope.deValueMapForEvent[effect.dataElement.id]){
                                                // value exists
                                                $scope.reportEventsMap[eventId].prstDeDesValueMap[effect.dataElement.id] = $scope.deValueMapForEvent[effect.dataElement.id];
                                            }
                                            else if (effect.action == "HIDEFIELD" && effect.ineffect) {
                                                $scope.reportEventsMap[eventId].prstDeDesValueMap[effect.dataElement.id] = "hidden";
                                            }
                                        }
                                    }
                                }
                                $scope.reportEventsMap[eventId].reportTEAPlusDeValueMap = [];
                               var dueDateEvent = { id:"due_date",
                                    name:"due date",
                                    type : "meta",
                                    value : DateUtils.formatFromApiToUser($scope.reportEventsMap[eventId].event.dueDate)
                               }

                                var isOverdueEvent = { id:"event_type",
                                    name:"Is OverDue",
                                    type : "meta",
                                    value : DateUtils.getToday() > $scope.reportEventsMap[eventId].event.dueDate ? true : ''
                                }
                                $scope.reportEventsMap[eventId].event.isOverDue = DateUtils.getToday() > $scope.reportEventsMap[eventId].event.dueDate ? true : false;
                                $scope.reportEventsMap[eventId].reportTEAPlusDeValueMap[dueDateEvent.id] = dueDateEvent;
                                $scope.reportEventsMap[eventId].reportTEAPlusDeValueMap[isOverdueEvent.id] = isOverdueEvent;

                                formatAtt($scope.reportEventsMap[eventId].reportTEAPlusDeValueMap,$scope.reportEventsMap[eventId].TEI.attributes);
                                formatDes($scope.reportEventsMap[eventId].reportTEAPlusDeValueMap,$scope.reportEventsMap[eventId].prstDeDes,$scope.reportEventsMap[eventId].prstDeDesValueMap);

                                $scope.reportEvents.push($scope.reportEventsMap[eventId]);
                                runRulesForEvent(eventCount+1);
                            })
                        })
                    })
                }

                runRulesForEvent(0);
            })


            }

        $scope.showHideColumns = function(){
            var modalInstance = $modal.open({
                templateUrl: 'views/settingsLayout.html',
                controller: 'SettingsLayoutController',
                resolve: {
                    reportTemplate: function () {
                        return $scope.reportTemplate;
                    }
                }
            });


            modalInstance.result.then(function (reportTemplate) {
                $scope.reportTemplate = reportTemplate;
            }, function () {
            });
        }

        // save layout to user setting
        $scope.saveLayoutForUser = function(){

            var userSetting = {
                scheduledReport : [{program : $scope.selectedProgram.id,
                                    programStage : $scope.selectedProgramStage.id,
                                    layout : getHeaderLayoutList()
                                  }]
                }

            var key = $scope.currentUser.id + userSettingKeySuffix;
            userSettingsService.saveUserSetting(key,userSetting).then(function(response){
                // show message to user

                if (response.httpStatus == "OK") {
                    $scope.messageToUser = "Settings Saved";
                }else {
                    $scope.messageToUser = "An unexpected thing happened";
                }
                $timeout(function(){
                    $scope.messageToUser = "";
                },1500)
            });
        }

        sort = function(events,sortedEvents){
            if (events.length == 0){
            return
            }

            var minEvent = events[0];
            for (var i=0 ;i<events.length;i++){
                if (minEvent.sortingDate > events[i].sortingDate){
                    minEvent = events[i]
                }
            }
            sortedEvents.push(minEvent);
            var newEvents = [];
            for (var j=0;j<events.length;j++){
                if (events[j].event != minEvent.event){
                    newEvents.push(events[j]);
                }
            }
            sort(newEvents,sortedEvents)
        }
        getDeValueMap = function(prstDes,programStage,evs){

            var deValueMap = [];
            var valueFound = false;
            for (var deCount=0;deCount<prstDes.length;deCount++){
                for (var eventCount=0;eventCount<evs.byStage[programStage].length;eventCount++){
                    if (evs.byStage[programStage][eventCount].dataValues)
                    for (var dataValueCount=0;dataValueCount<evs.byStage[programStage][eventCount].dataValues.length;dataValueCount++){
                        if (prstDes[deCount].id == evs.byStage[programStage][eventCount].dataValues[dataValueCount].dataElement){

                            // value found! put in map.
                            deValueMap[prstDes[deCount].id] = evs.byStage[programStage][eventCount].dataValues[dataValueCount].value;
                            valueFound = true;
                            break
                        }
                    }

                    if (valueFound){
                        valueFound=false;
                        break
                    }
                }
            }
            return deValueMap;
        }
        extractDeValue = function(deId,evs,programStageId){
            
            for (var i=0;i<evs.byStage[programStageId].length;i++){
                if (evs.byStage[programStageId][i].dataValues){
                    for (var dvCount=0; dvCount < evs.byStage[programStageId][i].dataValues.length;dvCount++){
                        if (evs.byStage[programStageId][i].dataValues[dvCount].dataElement == deId){

                            //value found!
                            return evs.byStage[programStageId][i].dataValues[dvCount].value;
                        }
                    }
                }
            }
            return false;
            
        }
        mergeMap = function(overWrittenMap,overWriterMap){

            for (key in overWriterMap){
                overWrittenMap[key] = overWriterMap[key];
            }
            return overWrittenMap
        }
        getHeaderLayoutList = function(){
            var layoutList = [];
            for (var i=0;i<$scope.reportTemplate.header.length;i++){
                layoutList.push({id: $scope.reportTemplate.header[i].id, show:$scope.reportTemplate.header[i].show });
            }
            return layoutList;
        }

        //listen for rule effect changes
        $scope.$on('ruleeffectsupdated', function (event, args) {

            if ($rootScope.ruleeffects[args.event]) {
            }
        });

        // internal functions
        loadPrograms = function () {
            MetadataService.getOrgUnit($scope.selectedOrgUnitUid).then(function (orgUnit) {
                $timeout(function () {
                    $scope.selectedOrgUnit = orgUnit;
                });
            })
        }

        extractDeFromPrstDe = function(prstDes){
            var des = [];
            for (var i=0;i<prstDes.length;i++){
                des.push(prstDes[i].dataElement);
            }
            return des;
        }
        extractTEAFromPTEA = function(programTEA){
            var TEAs = [];
            for (var i=0;i<programTEA.length;i++){
                TEAs.push(programTEA[i].trackedEntityAttribute);
            }
            return TEAs;
        }

        populateValue = function(prstDeDes){
            var des = [];
            for (var i=0;i<prstDeDes.length;i++){
                des[prstDeDes[i].id] = "visible";
            }
            return des;
        }

        prepareReportTemplate = function(){

            $scope.reportTemplateHeaderLayoutMap = [];
            $scope.totals = [];

            userSettingsService.getUserSetting($scope.currentUser.id+userSettingKeySuffix).then(function (userSetting) {
                if (userSetting)
                for (var i = 0; i < userSetting.scheduledReport.length; i++) {
                    if (userSetting.scheduledReport[i].program == $scope.selectedProgram.id &&
                        userSetting.scheduledReport[i].programStage == $scope.selectedProgramStage.id) {
                        $scope.reportTemplateHeaderLayoutMap = utilityService.prepareIdToObjectMap(userSetting.scheduledReport[i].layout,"id");
                    }
                }
                    
                // JSONFORMAT -
                // reportTemplate = {
                //    header : [
                //        {
                //            name:"",
                //            id:"",
                //            show:true
                //        }],
                //    data : []
                //};

                $scope.reportTemplate={
                                        header : [{name:"Due Date",
                                                    id: "due_date",
                                                    type:"meta",
                                                    show : true},
                                                {name:"Is OverDue?",
                                                id: "event_type",
                                                type:"meta",
                                                show : true}
                                        ],
                                        data : [],
                                        totals:[]
                                        }
                // Fill TEA
                for (var i=0;i< $scope.programTEAMap[$scope.selectedProgram.id].length;i++){
                    $scope.reportTemplate.header.push({
                        name : $scope.programTEAMap[$scope.selectedProgram.id][i].displayName,
                        id : $scope.programTEAMap[$scope.selectedProgram.id][i].id,
                        type: "attribute",
                        show : $scope.reportTemplateHeaderLayoutMap[ $scope.programTEAMap[$scope.selectedProgram.id][i].id]?$scope.reportTemplateHeaderLayoutMap[ $scope.programTEAMap[$scope.selectedProgram.id][i].id].show:true });
                }

                //Fill prstDes
                for (var i=0;i<$scope.programStageDeDesMap[$scope.selectedProgramStage.id].length;i++){
                    $scope.totals[ $scope.programStageDeDesMap[$scope.selectedProgramStage.id][i].id]=0 ;

                    $scope.reportTemplate.header.push({
                        name : $scope.programStageDeDesMap[$scope.selectedProgramStage.id][i].name,
                        id : $scope.programStageDeDesMap[$scope.selectedProgramStage.id][i].id,
                        type: "dataElement",
                        show : $scope.reportTemplateHeaderLayoutMap[$scope.programStageDeDesMap[$scope.selectedProgramStage.id][i].id]?$scope.reportTemplateHeaderLayoutMap[$scope.programStageDeDesMap[$scope.selectedProgramStage.id][i].id].show : true });
                }

            })
        }

        calculateTotals = function(){

            for (var i=0;i<$scope.reportEvents.length;i++){
                for (var deCount=0;deCount<$scope.reportEvents[i].prstDeDes.length;deCount++){
                    if ($scope.reportEvents[i].prstDeDesValueMap[$scope.reportEvents[i].prstDeDes[deCount].id] == "visible"){
                        $scope.totals[$scope.reportEvents[i].prstDeDes[deCount].id] = $scope.totals[$scope.reportEvents[i].prstDeDes[deCount].id]+1;
                    }
                }
            }
        }
      
        formatAtt = function(map,attributes){
            for (var i=0;i<attributes.length;i++){

              map[attributes[i].attribute] =      {
                        id:attributes[i].attribute,
                        name:attributes[i].displayName,
                        type : "attribute",
                        value : attributes[i].value
                    }

            }
        }

        formatDes = function(map,des,deValueMap){
            for (var i=0;i<des.length;i++){
              map[des[i].id]=      {
                        id:des[i].id,
                        name:des[i].name,
                        type : "dataElement",
                        value : deValueMap[des[i].id]
                    }

            }
        }
        getEventsByStage = function (events) {
            var eventsByStage = [];
            for (var i = 0; i < events.length; i++) {
                if (!eventsByStage[events[i].programStage]) {
                    eventsByStage[events[i].programStage] = [];
                }
                eventsByStage[events[i].programStage].push(events[i]);
            }
            return eventsByStage;
        }
        filterByStatus = function (events, status) {
            var filteredEvents = [];

            for (var i = 0; i < events.length; i++) {
                if (events[i].status == status) {
                    filteredEvents.push(events[i]);
                }
            }
            return filteredEvents;
        }

    });