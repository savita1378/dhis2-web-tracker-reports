/**
 * Created by harsh on 17/2/16.
 */

bidReportsApp.controller('VaccineHistoryController',
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
        $scope.showAlreadyGivenVaccines = false;
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
                promise = MetadataService.getAllEventsByProgramStageAndOU(ProgramStageUID,$scope.selectedOrgUnitUID,OuMode);
                track.push();

                promise.then(function (events) {
                    track.notify();

                    $scope.events = events;
                    $scope.eventsGroupedByTEI = utilityService.prepareMapGroupedById($scope.events,"trackedEntityInstance")
                    if (events.length > 0) {
                        //collect TEI,Enrollment
                        //get all TEIs
                        var m1 = new pipeline(0, 35, $scope.events.length, fetchTEIs);
                        m1.run();
                        track.push();
                        m1.done.then(function (data) {
                            track.notify();
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


            var fetchTEIs = function(index,thiz){
                MetadataService.getTEIByUID($scope.events[index].trackedEntityInstance).then(function(tei){
                    $scope.TEIMap[tei.trackedEntityInstance] = tei;
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

            // for each event extract value if exist
            for (var TEIUID in $scope.eventsGroupedByTEI ){

                var reportDataEvent = {
                    TEI : $scope.TEIMap[TEIUID],
                    prstDeDesValueMap : [],
                    reportTEAPlusDeValueMap : []
                };
                // All des are visible in the start
                reportDataEvent.prstDeDesValueMap=populateValue($scope.programStageDeDes,"visible");

                var evs = $scope.eventsGroupedByTEI[TEIUID];
                //get map of data values of prstde from evs
                var deValueMapForEvent = getDeValueMap($scope.programStageDeDes,evs);
                reportDataEvent.prstDeDesValueMap =mergeMap(reportDataEvent.prstDeDesValueMap,deValueMapForEvent);


             for (var j=0;j<$scope.programStageDeDes.length;j++){
                 if (deValueMapForEvent[$scope.programStageDeDes[j].id]){
                     // value exists
                     reportDataEvent.prstDeDesValueMap[$scope.programStageDeDes[j].id] = deValueMapForEvent[$scope.programStageDeDes[j].id];
                 }

             }

                reportDataEvent.reportTEAPlusDeValueMap = [];
                //var dueDateEvent = { id:"due_date",
                //    name:"due date",
                //    type : "meta",
                //    value : DateUtils.formatFromApiToUser(reportDataEvent.event.dueDate)
                //}

                //var isOverdueEvent = { id:"event_type",
                //    name:"Is OverDue",
                //    type : "meta",
                //    value : DateUtils.getToday() > reportDataEvent.event.dueDate ? true : ''
                //}
             //   reportDataEvent.event.isOverDue = DateUtils.getToday() > reportDataEvent.event.dueDate ? true : false;
               // reportDataEvent.reportTEAPlusDeValueMap[dueDateEvent.id] = dueDateEvent;
                //   reportDataEvent.reportTEAPlusDeValueMap[isOverdueEvent.id] = isOverdueEvent;

                formatAtt(reportDataEvent.reportTEAPlusDeValueMap,reportDataEvent.TEI.attributes);
                formatDes(reportDataEvent.reportTEAPlusDeValueMap,$scope.programStageDeDes,reportDataEvent.prstDeDesValueMap);

                $scope.reportEvents.push(reportDataEvent);

            }

            $scope.loading = false;

        });

        /*End  Functions */


        _prepareReportTemplate = function(){

            $scope.reportTemplate={
                header : [],
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

        getDeValueMap = function(prstDes,evs){

            var deValueMap = [];
            var valueFound = false;
            for (var deCount=0;deCount<prstDes.length;deCount++){
                for (var eventCount=0;eventCount<evs.length;eventCount++){
                    if (evs[eventCount].dataValues)
                        for (var dataValueCount=0;dataValueCount<evs[eventCount].dataValues.length;dataValueCount++){
                            if (prstDes[deCount].id == evs[eventCount].dataValues[dataValueCount].dataElement){

                                // value found! put in map.
                                deValueMap[prstDes[deCount].id] = evs[eventCount].dataValues[dataValueCount].value;
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