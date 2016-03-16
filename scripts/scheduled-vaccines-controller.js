/**
 * Created by hisp on 28/1/16.
 */
//Controller for column show/hide
bidReportsApp.controller('ScheduledVaccinesController',
function($scope,
         userSettingsService,
         MetadataService,
         utilityService,
         DateUtils,
         TrackerRulesFactory,
         TrackerRulesExecutionService) {

/* HARDCODE PARAMETERS */
    const ProgramUID = "SSLpOM0r1U7";
    const ProgramStageUID = "s53RFfXA75f";
    const OuMode = "SELECTED";
    const de = [
        {id:"bpBUOvqy1Jn", groupby :"BCG" ,name:"BCG"},
        {id:"EMcT5j5zR81", groupby :"BCG" ,name:"BCG scar"},
        {id:"KRF40x6EILp", groupby :"BCG" ,name:"BCG repeat dose"},
        {id:"no7SkAxepi7", groupby :"OPV" ,name:"OPV 0"},
        {id:"CfPM8lsEMzH", groupby :"OPV" ,name:"OPV 1"},
        {id:"K3TcJM1ySQA", groupby :"DPT" ,name:"DPT-HepB-Hib1"},
        {id:"fmXCCPENnwR", groupby :"PCV" ,name:"PCV 1"},
        {id:"nIqQYeSwU9E", groupby :"RV" ,name:"RV 1"},
        {id:"sDORmAKh32v", groupby :"OPV" ,name:"OPV 2"},
        {id:"PvHUllrtPiy", groupby :"PCV" ,name:"PCV 2"},
        {id:"wYg2gOWSyJG", groupby :"RV" ,name:"RV 2"},
        {id:"nQeUfqPjK5o", groupby :"OPV" ,name:"OPV 3"},
        {id:"pxCZNoqDVJC", groupby :"DPT" ,name:"DPT-HepB-Hib3"},
        {id:"B4eJCy6LFLZ", groupby :"PCV" ,name:"PCV 3"},
        {id:"cNA9EmFaiAa", groupby :"OPV" ,name:"OPV 4"},
        {id:"g8dMiUOTFla", groupby :"Measles" ,name:"Measles 1"},
        {id:"Bxh1xgIY9nA", groupby :"Measles" ,name:"Measles 2"}
                ];

    const attr = [  "sB1IHYu2xQT",
                                        "wbtl3uN0spv"
                    ];

/*End HARDCODE PARAMETERS */

/* Initialize variables to be used throughout file   */
    $scope.TEIMap = [];
    $scope.EnrollmentMap = [];
    $scope.EventsByTEIMap = [];
    $scope.programStageDeDesMap = [];
    $scope.loading = true;
    $scope.showAlreadyGivenVaccines = true;
/* End */
    /* Functions */
    _fetchMetaData = function(){
        var track = new promiseTracker();
        var promise;

    // Get OU UID from Current User
        promise = userSettingsService.getCurrentUser();
        track.push();

        promise.then(function(currentUser){
            $scope.currentUser = currentUser;
            $scope.selectedOrgUnit = currentUser.organisationUnits[0];
            $scope.selectedOrgUnitUID = currentUser.organisationUnits[0].id;

            // Get Events which are scheduled
            promise = MetadataService.getEventsByProgramStageAndOU(ProgramStageUID,$scope.selectedOrgUnitUID,OuMode);
            track.push();

            track.notify();
            promise.then(function (events) {
                track.notify();

                $scope.events = events;

                if (events.length > 0) {
                    //collect TEI,Enrollment
                    //get all TEIs
                    var m1 = new pipeline(0, 35, $scope.events.length, fetchTEIs);
                    m1.run();
                    track.push();
                    m1.done.then(function (data) {
                        track.notify();
                    });

                    var m2 = new pipeline(0, 35, $scope.events.length, fetchEnrollments);
                    m2.run();
                    track.push();
                    m2.done.then(function (data) {
                        track.notify();
                    });

                    var m3 = new pipeline(0, 35, $scope.events.length, fetchEvents);
                    m3.run();
                    track.push();
                    m3.done.then(function (data) {
                        track.notify();
                    });
                }
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
    _fetchMetaData().then(function(){
        // _makeReport();

        // make report template
        _prepareReportTemplate();

        $scope.reportEvents = [];

        // for each event run rules
        for (var i=0;i<$scope.events.length;i++){
            var eventUID = $scope.events[i].event;
            var TEIUID = $scope.events[i].trackedEntityInstance;
            var enrollmentUID = $scope.events[i].enrollment;

            if (TEIUID == "uteaIH2XEX4"){
                debugger
            }
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
                            reportDataEvent.prstDeDesValueMap[effect.dataElement.id] = deValueMapForEvent[effect.dataElement.id];

                        }
                        else
                        if (effect.action == "HIDEFIELD" && effect.ineffect) {
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

        $scope.loading = false;

    });

/*End  Functions */

    _runRules = function(event,programRules,allDes,tei,enrollment,evs){

        //populate datavalue in the event itself----required by tracker rules execution!!
        if (event.dataValues) {
            for (var i = 0; i < event.dataValues.length; i++) {
                event[event.dataValues[i].dataElement] = event.dataValues[i].value;
            }
        }

        if (!event.eventDate)
            event.eventDate = DateUtils.getToday();
        //event.eventDate = undefined;



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

    _prepareReportTemplate = function(){

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

        $scope.reportTemplate.header.push({
            name: "Age",
            id: "age",
            type: "attribute"
        })

        for (var i=0;i<de.length;i++) {
            $scope.reportTemplate.header.push({
                name: $scope.programStageDeDeMap[de[i].id].displayName,
                id: de[i].id,
                type: "dataElement",
                groupby : de[i].groupby
            })
        }
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

    extractDeFromPrstDe = function(prstDes){
        var des = [];
        for (var i=0;i<prstDes.length;i++){
            des.push(prstDes[i].dataElement);
        }
        return des;
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
    formatAtt = function(map,attributes){
        map["age"] =      {
            id:"age",
            name:"Age",
            type : "attribute",
            value : "N/A"
        }

        for (var i=0;i<attributes.length;i++){

            if (attributes[i].attribute == "rKtHjgcO2Bn"){
                if (attributes[i].value){
                    map["age"] =      {
                        id:"age",
                        name:"Age",
                        type : "attribute",
                        value : getAge(attributes[i].value)
                    }
                }
            }
            map[attributes[i].attribute] =      {
                id:attributes[i].attribute,
                name:attributes[i].displayName,
                type : "attribute",
                value : attributes[i].value
            }

        }
    }

    function getAge(dateString) {

        var birthdate = new Date(dateString).getTime();
        var now = new Date().getTime();
        // now find the difference between now and the birthdate
        var n = (now - birthdate)/1000;

        if (n < 604800) { // less than a week
            var day_n = Math.floor(n/86400);
            return day_n + ' day' + (day_n > 1 ? 's' : '');
        } else if (n < 2629743) {  // less than a month
            var week_n = Math.floor(n/604800);
            return week_n + ' week' + (week_n > 1 ? 's' : '');
        } else if (n < 63113852) { // less than 24 months
            var month_n = Math.floor(n/2629743);
            return month_n + ' month' + (month_n > 1 ? 's' : '');
        } else {
            var year_n = Math.floor(n/31556926);
            return year_n + ' year' + (year_n > 1 ? 's' : '');
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

    populateValue = function(prstDeDes,value){
        var des = [];
        for (var i=0;i<prstDeDes.length;i++){
            des[prstDeDes[i].id] = value;
        }
        return des;
    }
    mergeMap = function(overWrittenMap,overWriterMap){

        for (key in overWriterMap){
            overWrittenMap[key] = overWriterMap[key];
        }
        return overWrittenMap
    }
})