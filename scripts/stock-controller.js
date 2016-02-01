/**
 * Created by hisp on 2/12/15.
 */

bidReportsApp
    .controller('StockController', function ($rootScope,
                                                     $scope,
                                                     $timeout,
                                                    sqlViewService,
                                             userSettingsService,
                                             MetadataService,
                                             utilityService,
                                             DateUtils,
                                             orderByFilter,
                                             TrackerRulesFactory,
                                             TrackerRulesExecutionService
                                                    ) {



        /* HARDCODE PARAMETERS */
        const sqlViewSelected = /*"Y52YnK869WO";*/"sjOobMQc3g4";
        const sqlViewChildren = "lTqNF1rWha3";
        const sqlViewDescendent = "CraSsUTG2aw";

        const ProgramUID = "SSLpOM0r1U7";
        const ProgramStageUID = "s53RFfXA75f";
        const OuMode = "SELECTED";
        const de = [
            {id:"bpBUOvqy1Jn", groupby :"BCG"},
            {id:"EMcT5j5zR81", groupby :"BCG"},
            {id:"KRF40x6EILp", groupby :"BCG"},
            {id:"no7SkAxepi7", groupby :"BCG"}
        ];

        const attr = [  "sB1IHYu2xQT",
            "wbtl3uN0spv"
        ];

        /*End HARDCODE PARAMETERS */
        $scope.showReport = false;
        $scope.selectedOuMode = {name : "SELECTED"};


        /* Initialize variables to be used throughout file   */
        $scope.TEIMap = [];
        $scope.EnrollmentMap = [];
        $scope.EventsByTEIMap = [];
        $scope.programStageDeDesMap = [];
        $scope.loading = true;
        /* End */


        _fetchMetaData().then(function(){

            _prepareStockBalanceReport();

            // make report template
            _prepareReportTemplate();

            $scope.reportEvents = [];

            // for each event run rules
            for (var i=0;i<$scope.events.length;i++){
                var eventUID = $scope.events[i].event;
                var TEIUID = $scope.events[i].trackedEntityInstance;
                var enrollmentUID = $scope.events[i].enrollment;

                var sortedEvents = []
                var evs = $scope.EventsByTEIMap[TEIUID];
                sort(evs, sortedEvents);
                evs = sortedEvents;

                evs = {
                    all: evs,
                    byStage: getEventsByStage(evs)
                };
                var reportDataEvent = {
                    event : $scope.events[i],
                    TEI : $scope.TEIMap[TEIUID],
                    prstDeDesValueMap : [],
                    reportTEAPlusDeValueMap : []
                };
                // All des are visible in the start
                reportDataEvent.prstDeDesValueMap=populateValue($scope.programStageDeDes,"visible");

                var rulesEffect = _runRules($scope.events[i],$scope.programRules,$scope.programStageDeByDeDeMap,$scope.TEIMap[TEIUID],$scope.EnrollmentMap[enrollmentUID],evs);


                //get map of data values of prstde from evs
                var deValueMapForEvent = getDeValueMap($scope.programStageDeDes,$scope.programStage.id,evs);
                reportDataEvent.prstDeDesValueMap =mergeMap(reportDataEvent.prstDeDesValueMap,deValueMapForEvent);


                // processRuleEffects
                for (var key in rulesEffect) {
                    var effect = rulesEffect[key];
                    if (effect.dataElement) {
                        if ($scope.programStageDeDeMap[effect.dataElement.id]) {
                            if (deValueMapForEvent[effect.dataElement.id]){
                                // value exists
                                reportDataEvent.prstDeDesValueMap[effect.dataElement.id] = deValueMapForEvent[effect.dataElement.id];
                            }
                            else if (effect.action == "HIDEFIELD" && effect.ineffect) {
                                reportDataEvent.prstDeDesValueMap[effect.dataElement.id] = "hidden";
                            }
                        }
                    }
                }
                reportDataEvent.reportTEAPlusDeValueMap = [];
                var dueDateEvent = { id:"due_date",
                    name:"due date",
                    type : "meta",
                    value : DateUtils.formatFromApiToUser(reportDataEvent.event.dueDate)
                }

                //var isOverdueEvent = { id:"event_type",
                //    name:"Is OverDue",
                //    type : "meta",
                //    value : DateUtils.getToday() > reportDataEvent.event.dueDate ? true : ''
                //}
                reportDataEvent.event.isOverDue = DateUtils.getToday() > reportDataEvent.event.dueDate ? true : false;
                reportDataEvent.reportTEAPlusDeValueMap[dueDateEvent.id] = dueDateEvent;
                //   reportDataEvent.reportTEAPlusDeValueMap[isOverdueEvent.id] = isOverdueEvent;

                formatAtt(reportDataEvent.reportTEAPlusDeValueMap,reportDataEvent.TEI.attributes);
                formatDes(reportDataEvent.reportTEAPlusDeValueMap,$scope.programStageDeDes,reportDataEvent.prstDeDesValueMap);

                $scope.reportEvents.push(reportDataEvent);
            }

            calculateTotals($scope.programStageDeDes);
            $scope.loading = false;

        });

        /*End  Functions */

        function _runRules(event,programRules,allDes,tei,enrollment,evs){

            //populate datavalue in the event itself----required by tracker rules execution!!
            if (event.dataValues) {
                for (var i = 0; i < event.dataValues.length; i++) {
                    event[event.dataValues[i].dataElement] = event.dataValues[i].value;
                }
            }

            if (!event.eventDate)
                event.eventDate = DateUtils.getToday();


            if (event.eventDate) {
                event.sortingDate = event.eventDate;
            } else {
                event.sortingDate = event.dueDate;
            }

            var flag = {debug: true, verbose: false}

            //run rules
            var rulesEffectResponse = TrackerRulesExecutionService.executeRulesBID(
                programRules,
                event,
                evs,
                allDes,
                tei,
                enrollment,
                flag)

            return rulesEffectResponse.ruleeffects[rulesEffectResponse.event];

        }

        function _prepareReportTemplate(){

            $scope.reportTemplate={
                header : [{name:"Due Date",
                    id: "due_date",
                    type:"meta",
                    show : true}
                ],
                data : [],
                totals:[]
            }

            for (var i=0;i<attr.length;i++) {
                $scope.reportTemplate.header.push({
                    name: $scope.programAttrMap[attr[i]].displayName,
                    id: attr[i],
                    type: "attribute"
                })
            }
            for (var i=0;i<de.length;i++) {
                $scope.reportTemplate.header.push({
                    name: $scope.programStageDeDeMap[de[i].id].displayName,
                    id: de[i].id,
                    type: "dataElement",
                    groupby : de[i].groupby
                })
            }
        }

        function getDeValueMap(prstDes,programStage,evs){

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

        function extractDeFromPrstDe(prstDes){
            var des = [];
            for (var i=0;i<prstDes.length;i++){
                des.push(prstDes[i].dataElement);
            }
            return des;
        }

        function sort(events,sortedEvents){
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

        function formatAtt(map,attributes){
            for (var i=0;i<attributes.length;i++){

                map[attributes[i].attribute] =      {
                    id:attributes[i].attribute,
                    name:attributes[i].displayName,
                    type : "attribute",
                    value : attributes[i].value
                }

            }
        }

        function formatDes(map,des,deValueMap){
            for (var i=0;i<des.length;i++){
                map[des[i].id]=      {
                    id:des[i].id,
                    name:des[i].name,
                    type : "dataElement",
                    value : deValueMap[des[i].id]
                }

            }
        }
        function getEventsByStage (events) {
            var eventsByStage = [];
            for (var i = 0; i < events.length; i++) {
                if (!eventsByStage[events[i].programStage]) {
                    eventsByStage[events[i].programStage] = [];
                }
                eventsByStage[events[i].programStage].push(events[i]);
            }
            return eventsByStage;
        }

        function populateValue(prstDeDes,value){
            var des = [];
            for (var i=0;i<prstDeDes.length;i++){
                des[prstDeDes[i].id] = value;
            }
            return des;
        }
        function mergeMap(overWrittenMap,overWriterMap){

            for (key in overWriterMap){
                overWrittenMap[key] = overWriterMap[key];
            }
            return overWrittenMap
        }

        function _prepareStockBalanceReport(){

            var template = [
                {
                    name : "BCG",
                    balanceDeId:"",
                    groupby:"",
                    demand:0,
                    balance:0
                },
                {
                    name:"OPV",
                    balanceDeId:"",
                    groupby:"",
                    demand:0,
                    balance:0
                },
                {
                    name:"DPT",
                    balanceDeId:"",
                    groupby:"",
                    demand:0,
                    balance:0
                },
                {
                    name:"PCV",
                    balanceDeId:"",
                    groupby:"",
                    demand:0,
                    balance:0
                },
                {
                    name:"RV",
                    balanceDeId:"",
                    groupby:"",
                    demand:0,
                    balance:0
                },
                {
                    name:"Measles",
                    balanceDeId:"",
                    groupby:"",
                    demand:0,
                    balance:0
                }
            ]

            userSettingsService.getCurrentUser().then(function(user){
                $scope.currentUser = user;
                $scope.selectedOrgUnit = $scope.currentUser.organisationUnits[0];
                prepareToExecuteSQLView($scope.selectedOrgUnit);
            });

            function prepareToExecuteSQLView(ou){
                var params = "var=level:"+ou.level +"&var=ouuid:"+ou.id ;
                sqlViewService.executeSqlView(sqlViewSelected,params).then(function(data){
                    $timeout(function(){
                        $scope.stockBalance = data;
                        $scope.showReport = true;
                    })
                })
            }
        }
        function calculateTotals(prstDeDes){
            $scope.totals= utilityService.prepareIdToValueMap(prstDeDes,"id",0);

            for (var i=0;i<$scope.reportEvents.length;i++){
                for (var deCount=0;deCount<prstDeDes.length;deCount++){
                    if ($scope.reportEvents[i].prstDeDesValueMap[prstDeDes[deCount].id] == "visible"){
                        $scope.totals[prstDeDes[deCount].id] = $scope.totals[prstDeDes[deCount].id]+1;
                    }
                }
            }
        }
        /* Functions */
        function _fetchMetaData(){

            var track = new promiseTracker();
            var promise;

            // Get OU UID from Current User
            promise = userSettingsService.getCurrentUser();
            track.push();

            promise.then(function(currentUser){
                $scope.currentUser = currentUser;
                $scope.selectedOrgUnit = currentUser.organisationUnits[0];
                $scope.selectedOrgUnitUID = currentUser.organisationUnits[0].id;
                $scope.selectedOrgUnitUID = "DQjaNvP9ulw";

                // Get Events which are scheduled
                promise = MetadataService.getEventsByProgramStageAndOU(ProgramStageUID,$scope.selectedOrgUnitUID,OuMode);
                track.push();

                track.notify();
                promise.then(function (events) {
                    track.notify()

                    $scope.events = events;

                    //collect TEI,Enrollment
                    //get all TEIs
                    var m1 = new pipeline(0,35,$scope.events.length,fetchTEIs);
                    m1.run();
                    track.push();
                    m1.done.then(function(data){
                        track.notify();
                    });

                    var m2 = new pipeline(0,35,$scope.events.length,fetchEnrollments);
                    m2.run();
                    track.push();
                    m2.done.then(function(data){
                        track.notify();
                    });

                    var m3 = new pipeline(0,35,$scope.events.length,fetchEvents);
                    m3.run();
                    track.push();
                    m3.done.then(function(data){
                        track.notify();
                    });
                })
            })

            //get program & extract TEI from programTEI
            promise = MetadataService.getProgram(ProgramUID);
            track.push();

            promise.then(function(program){
                $scope.program = program;
                $scope.programAttrMap = [];
                for (var i=0;i<$scope.program.programTrackedEntityAttributes.length;i++){
                    $scope.programAttrMap[$scope.program.programTrackedEntityAttributes[i].trackedEntityAttribute.id] = $scope.program.programTrackedEntityAttributes[i].trackedEntityAttribute;
                }
                track.notify();

            })

            //get programStage
            promise = MetadataService.getProgramStage(ProgramStageUID);
            track.push();

            promise.then(function(programStage){
                $scope.programStage = programStage;
                $scope.programStageDeDes = extractDeFromPrstDe($scope.programStage.programStageDataElements);
                $scope.programStageDeDeMap = utilityService.prepareIdToObjectMap($scope.programStageDeDes ,"id");

                //DeByDeDe : map where id is dataelementid and it maps to  its program data element object-  (PS: This is how it is required by rules engine : mujhe gaali mat nikalo)
                $scope.programStageDeByDeDeMap = utilityService.prepareDataElementIdToObjectMap($scope.programStage.programStageDataElements ,"id");

                track.notify();

            })

            // Get Program Rules for the selected Program
            promise = TrackerRulesFactory.getRules(ProgramUID);
            track.push();

            promise.then(function (rules) {
                $scope.programRules = rules;
                track.notify();
            })

            //   promise =
            var fetchTEIs = function(index,thiz){
                MetadataService.getTEIByUID($scope.events[index].trackedEntityInstance).then(function(tei){
                    $scope.TEIMap[tei.trackedEntityInstance] = tei;
                    thiz.removeItem();
                })
            }
            var fetchEnrollments = function(index,thiz){
                MetadataService.getEnrollmentByUID($scope.events[index].enrollment).then(function(enrollment){
                    $scope.EnrollmentMap[enrollment.enrollment] = enrollment;
                    thiz.removeItem();
                })
            }

            var fetchEvents = function(index,thiz){
                MetadataService.getEventsByTEI($scope.events[index].trackedEntityInstance).then(function(events){
                    if (events.length > 0){
                        $scope.EventsByTEIMap[events[0].trackedEntityInstance] = events;
                    }
                    thiz.removeItem();
                })

            }
            return track.done;
        }

    });