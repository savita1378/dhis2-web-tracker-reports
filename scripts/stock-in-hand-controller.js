/**
 * Created by hisp on 2/12/15.
 */

bidReportsApp
    .controller('StockInHandController', function ($rootScope,
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
        const deMap = utilityService.prepareIdToObjectMap(de,"id");

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
        $scope.template = [
            {
                name : "BCG",
                balanceDeId:"YCphYFZA8YG",
                group:"BCG",
                demand:0,
                balance:0
            },
            {
                name:"OPV",
                balanceDeId:"rczOvUL6XdS",
                group:"OPV",
                demand:0,
                balance:0
            },
            {
                name:"DPT",
                balanceDeId:"LG7LZuHdxWi",
                group:"DPT",
                demand:0,
                balance:0
            },
            {
                name:"PCV",
                balanceDeId:"ex0fnpbdMnN",
                group:"PCV",
                demand:0,
                balance:0
            },
            {
                name:"RV",
                balanceDeId:"coNVUUsyLcl",
                group:"RV",
                demand:0,
                balance:0
            },
            {
                name:"Measles",
                balanceDeId:"JcGcvIplsiL",
                group:"Measles",
                demand:0,
                balance:0
            }
        ];
        $scope.balanceDeToTemplateObjectMap = utilityService.prepareIdToObjectMap($scope.template,"balanceDeId");
        $scope.groupToTemplateObjectMap = utilityService.prepareIdToObjectMap($scope.template,"group");

        /* End */


        _fetchMetaData().then(function(){
            _prepareStockBalanceReport();
            $timeout(function(){
                $scope.template;
                $scope.loading = false;
            })
        });


        function _prepareStockBalanceReport() {
                _fillTemplateWithBalanceData($scope.stockBalance);
        }


        function _fillTemplateWithBalanceData(data){
            for (var i=0;i<data.height;i++){
                $scope.balanceDeToTemplateObjectMap[data.rows[i][0]].balance = data.rows[i][2];
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

                track.push();
                track.notify();
                fetchSQLViewData($scope.selectedOrgUnit).then(function(data){
                    $scope.stockBalance = data;
                    track.notify();
                });
            })

            function fetchSQLViewData(ou) {
                var def = $.Deferred();
                var params = "var=level:" + ou.level + "&var=ouuid:" + ou.id;
                sqlViewService.executeSqlView(sqlViewSelected, params).then(function (data) {
                    def.resolve(data);
                })
                return def;
            }

            return track.done;
        }

    });