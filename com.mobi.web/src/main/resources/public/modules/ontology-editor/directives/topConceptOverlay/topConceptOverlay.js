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
         * the top concept overlay within the vocabulary editor.
         */
        .module('topConceptOverlay', [])
        /**
         * @ngdoc directive
         * @name topConceptOverlay.directive:topConceptOverlay
         * @scope
         * @restrict E
         * @requires responseObj.service:responseObj
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires prefixes.service:prefixes
         * @requires util.service:utilService
         *
         * @description
         * HTML contents in the top concept overlay with provides the users with an overlay which can be used to add
         * skos:hasTopConcept(s) to the selected skos:ConceptScheme.
         *
         * @param {function} closeOverlay the function to be called to close the overlay
         * @param {function} onSubmit the function to be called after a top concept is added
         */
        .directive('topConceptOverlay', topConceptOverlay);

        topConceptOverlay.$inject = ['ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'prefixes', 'utilService'];

        function topConceptOverlay(ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, prefixes, utilService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/topConceptOverlay/topConceptOverlay.html',
                scope: {},
                bindToController: {
                    closeOverlay: '&',
                    onSubmit: '&'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var om = ontologyManagerService;
                    var state = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.util = utilService;
                    dvm.values = [];
                    dvm.conceptList = om.getConceptIRIs(state.getOntologiesArray(), state.listItem.derivedConcepts);

                    dvm.addTopConcept = function() {
                        var axiom = prefixes.skos + 'hasTopConcept';
                        state.listItem.selected[axiom] = _.union(_.get(state.listItem.selected, axiom, []), dvm.values);
                        state.addToAdditions(state.listItem.ontologyRecord.recordId, {'@id': state.listItem.selected['@id'], [axiom]: dvm.values});
                        dvm.closeOverlay();
                        dvm.ontoUtils.saveCurrentChanges();
                        dvm.onSubmit({relationship: {namespace: prefixes.skos, localName: 'hasTopConcept'}, values: dvm.values})
                    }
                }
            }
        }
})();
