(function() {
    'use strict';

    angular
        .module('filePreviewTable', ['csvManager', 'mapperState', 'mappingManager', 'ontologyManager'])
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
