(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name topConceptOverlay
         *
         * @description
         * The `topConceptOverlay` module only provides the `topConceptOverlay` directive which creates
         * content for a modal to add a top concept to a concept scheme.
         */
        .module('topConceptOverlay', [])
        /**
         * @ngdoc directive
         * @name topConceptOverlay.directive:topConceptOverlay
         * @scope
         * @restrict E
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires prefixes.service:prefixes
         * @requires util.service:utilService
         *
         * @description
         * `topConceptOverlay` is a directive that creates content for a modal that adds skos:hasTopConcept(s) to the
         * {@link ontologyState.service:ontologyStateService selected concept scheme}. The form in the modal
         * contains a `ui-select` with all the concepts in the current
         * {@link ontologyState.service:ontologyStateService selected ontology}. Meant to be used in conjunction with
         * the {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('topConceptOverlay', topConceptOverlay);

        topConceptOverlay.$inject = ['ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'prefixes', 'utilService'];

        function topConceptOverlay(ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, prefixes, utilService) {
            return {
                restrict: 'E',
                templateUrl: 'ontology-editor/directives/topConceptOverlay/topConceptOverlay.directive.html',
                scope: {
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var om = ontologyManagerService;
                    var os = ontologyStateService;
                    var axiom = prefixes.skos + 'hasTopConcept';
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.util = utilService;
                    dvm.values = [];

                    var concepts = getConceptList();
                    dvm.filteredConcepts = concepts;

                    dvm.addTopConcept = function() {
                        os.listItem.selected[axiom] = _.union(_.get(os.listItem.selected, axiom, []), dvm.values);
                        os.addToAdditions(os.listItem.ontologyRecord.recordId, {'@id': os.listItem.selected['@id'], [axiom]: dvm.values});
                        dvm.ontoUtils.saveCurrentChanges();
                        $scope.close({$value: {relationship: prefixes.skos + 'hasTopConcept', values: dvm.values}});
                    }
                    dvm.getConcepts = function(searchText) {
                        dvm.filteredConcepts = dvm.ontoUtils.getSelectList(concepts, searchText);
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }

                    function getConceptList() {
                        var all = om.getConceptIRIs(os.getOntologiesArray(), os.listItem.derivedConcepts);
                        var set = _.map(_.get(os.listItem.selected, axiom), '@id');
                        return _.difference(all, set);
                    }
                }]
            }
        }
})();
