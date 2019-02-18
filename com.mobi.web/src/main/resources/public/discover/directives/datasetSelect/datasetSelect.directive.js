(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name datasetSelect
         *
         * @description
         * The `datasetSelect` module only provides the `datasetSelect` directive which creates
         * the dataset select.
         */
        .module('datasetSelect', [])
        /**
         * @ngdoc directive
         * @name datasetSelect.directive:datasetSelect
         * @scope
         * @restrict E
         * @requires util.service:utilService
         * @requires datasetManager.service:datasetManagerService
         * @requires prefixes.service:prefixes
         *
         * @description
         * HTML contents in the dataset select which provides a dropdown select of all datasets.
         */
        .directive('datasetSelect', datasetSelect);

        datasetSelect.$inject = ['utilService', 'datasetManagerService', 'prefixes'];

        function datasetSelect(utilService, datasetManagerService, prefixes) {
            return {
                restrict: 'E',
                templateUrl: 'discover/directives/datasetSelect/datasetSelect.directive.html',
                replace: true,
                scope: {
                    onSelect: '&?'
                },
                bindToController: {
                    bindModel: '=ngModel'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.dm = datasetManagerService;
                    dvm.util = utilService;
                    dvm.datasetRecords = _.map(dvm.dm.datasetRecords, dvm.dm.getRecordFromArray);

                    if (!_.some(dvm.datasetRecords, {'@id': dvm.bindModel})) {
                        dvm.bindModel = '';
                    }
                }
            }
        }
})();
