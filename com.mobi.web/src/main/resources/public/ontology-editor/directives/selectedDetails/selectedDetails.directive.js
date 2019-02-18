(function() {
    'use strict';

    angular
        .module('selectedDetails', [])
        .directive('selectedDetails', selectedDetails);

        selectedDetails.$inject = ['$filter', 'ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'manchesterConverterService', 'modalService'];

        function selectedDetails($filter, ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, manchesterConverterService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/selectedDetails/selectedDetails.directive.html',
                scope: {},
                bindToController: {
                    readOnly: '<'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var mc = manchesterConverterService;
                    var ontoUtils = ontologyUtilsManagerService;
                    dvm.os = ontologyStateService;
                    dvm.om = ontologyManagerService;

                    dvm.getTypes = function() {
                        return _.join(_.orderBy(
                                _.map(_.get(dvm.os.listItem.selected, '@type', []), t => { 
                                    if (dvm.om.isBlankNodeId(t)) {
                                        return mc.jsonldToManchester(t, dvm.os.listItem.ontology);
                                    } else {
                                        return $filter('prefixation')(t);
                                    }
                                })
                        ), ', ');
                    }
                    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
                        dvm.os.onEdit(iriBegin, iriThen, iriEnd)
                            .then(() => {
                                ontoUtils.saveCurrentChanges();
                                ontoUtils.updateLabel();
                            });
                    }
                    dvm.showTypesOverlay = function() {
                        modalService.openModal('individualTypesModal');
                    }
                }
            }
        }
})();
