/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
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
        .config(['$qProvider', function($qProvider) {
            $qProvider.errorOnUnhandledRejections(false);
        }])
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
                templateUrl: 'modules/ontology-editor/directives/topConceptOverlay/topConceptOverlay.html',
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
