(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name previewDataGrid
         *
         * @description 
         * The `previewDataGrid` module only provides the `previewDataGrid` directive which creates
         * a HandsonTable for the {@link delimitedManager.service:delimitedManagerService#dataRows delimited data}
         * loaded into Mobi.
         */
        .module('previewDataGrid', [])
        /**
         * @ngdoc directive
         * @name previewDataGrid.directive:previewDataGrid
         * @scope
         * @restrict E
         * @requires mapperState.service:mapperStateService
         * @requires delimitedManager.service:delimitedManagerService
         * @requires hotRegisterer
         *
         * @description 
         * `previewDataGrid` is a directive that creates a HandsonTable (`hot-table`) with the 
         * {@link delimitedManager.service:delimitedManagerService#dataRows delimited data} loaded into
         * Mobi. The `hot-table` will automatically update whenever new data is loaded, the 
         * {@link mapperState.service:mapperStateService#highlightIndex highlighted column} changes, and
         * when whether or not the data {@link delimitedManager.service:delimitedManagerService#containsHeaders contains headers}
         * changes. The `hot-table` is uneditable and the user cannot select a cell within it. The directive 
         * is replaced by the contents of its template.
         */
        .directive('previewDataGrid', previewDataGrid);

        previewDataGrid.$inject = ['mapperStateService', 'delimitedManagerService', 'hotRegisterer'];

        function previewDataGrid(mapperStateService, delimitedManagerService, hotRegisterer) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.dm = delimitedManagerService;
                    dvm.hotTable;
                    
                    dvm.data = angular.copy(dvm.dm.dataRows);
                    dvm.settings = {
                        minCols: 50,
                        minRows: 50,
                        readOnly: true,
                        readOnlyCellClassName: 'text',
                        disableVisualSelection: 'current',
                        multiSelect: false,
                        fillHandle: false,
                        outsideClickDeselects: false,
                        cells: (row, col, prop) => {
                            var props = {};
                            props.renderer = (hotInstance, el, row, col, prop, value) => {
                                var classes = [];
                                if (row === 0 && dvm.dm.containsHeaders && dvm.dm.dataRows) {
                                    classes.push('header');
                                }
                                if (_.includes(dvm.state.highlightIndexes, '' + col)) {
                                    classes.push('highlight-col');
                                }
                                el.className = _.join(classes, ' ');
                                el.innerHTML = value;
                                return el;
                            };
                            return props;
                        },
                        onBeforeOnCellMouseDown: (event, coords) => {
                            event.stopImmediatePropagation();
                        },
                        onAfterInit: function() {
                            dvm.hotTable = this;
                        }
                    };
                    $scope.$watch('dvm.dm.dataRows', (newValue, oldValue) => {
                        if (!_.isEqual(newValue, oldValue)) {
                            dvm.data = angular.copy(newValue);
                        }
                    });
                    $scope.$watch('dvm.state.highlightIndexes', (newValue, oldValue) => {
                        if (!_.isEqual(newValue, oldValue)) {
                            dvm.hotTable.render();
                        }
                    });
                    $scope.$watch('dvm.dm.containsHeaders', (newValue, oldValue) => {
                        if (newValue !== oldValue && dvm.dm.dataRows) {
                            dvm.hotTable.render();
                        }
                    });
                }],
                templateUrl: 'mapper/directives/previewDataGrid/previewDataGrid.directive.html'
            }
        }
})();