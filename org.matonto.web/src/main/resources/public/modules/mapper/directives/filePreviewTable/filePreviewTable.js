(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name filePreviewTable
         * @requires  ontologyManager
         * @requires  mappingManager
         * @requires  mapperState
         * @requires  csvManager
         *
         * @description 
         * The `filePreviewTable` module only provides the `filePreviewTable` directive which creates
         * an expandable preview of an uploaded delimited file.
         */
        .module('filePreviewTable', ['csvManager', 'mapperState', 'mappingManager', 'ontologyManager'])
        /**
         * @ngdoc directive
         * @name filePreviewTable.directive:filePreviewTable
         * @scope
         * @restrict E
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         * @requires  csvManager.service:csvManagerService
         *
         * @description 
         * `filePreviewTable` is a directive that creates a div with a table of rows from an uploaded 
         * delimited file and a button to toggle the number of rows shown. The rows are hidden using 
         * ngIf. A passed in highlight index can be used to highlight a specific column. The table 
         * can also be clickable and sets the selected column when a th or td is clicked. When a column
         * is clicked, it also switches the highlighted column. The directive assumes that a CSS transition 
         * has been set on the parent div and sets event listeners for transition ends to only show more 
         * rows once the transition has completed. The directive is replaced by the contents of its template.
         */
        .directive('filePreviewTable', filePreviewTable);

        filePreviewTable.$inject = ['csvManagerService', 'mapperStateService', 'mappingManagerService', 'ontologyManagerService'];

        function filePreviewTable(csvManagerService, mapperStateService, mappingManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                link: function(scope, elem, attrs, ctrl) {
                    ["transitionend","webkitTransitionEnd","mozTransitionEnd"].forEach(function(transitionEnd) {
                        elem[0].addEventListener(transitionEnd, () => {
                            if (ctrl.big) {
                                ctrl.showNum = csvManagerService.filePreview.rows.length;
                                scope.$digest();
                            }
                        });
                    });
                },
                controller: function() {
                    var dvm = this;
                    dvm.csv = csvManagerService;
                    dvm.state = mapperStateService;
                    dvm.manager = mappingManagerService;
                    dvm.ontology = ontologyManagerService;

                    dvm.big = false;
                    dvm.showNum = 5;

                    dvm.toggleTable = function() {
                        dvm.big = !dvm.big;
                        if (!dvm.big) {
                            dvm.showNum = 5;
                        }
                    }
                    dvm.getHighlightIdx = function() {
                        return dvm.isClickable() ? dvm.csv.filePreview.headers.indexOf(dvm.state.selectedColumn) : -1;
                    }
                    dvm.isClickable = function() {
                        return dvm.manager.isDataMapping(_.find(dvm.manager.mapping.jsonld, {'@id': dvm.state.selectedPropMappingId})) 
                            || (!!dvm.state.selectedProp && !dvm.ontology.isObjectProperty(_.get(dvm.state.selectedProp, '@type', [])));
                    }
                    dvm.clickColumn = function(index) {
                        dvm.state.selectedColumn = dvm.csv.filePreview.headers[index];
                    }
                },
                templateUrl: 'modules/mapper/directives/filePreviewTable/filePreviewTable.html'
            }
        }
})();
