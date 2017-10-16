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
         * @name relationshipOverlay
         *
         * @description
         * The `relationshipOverlay` module only provides the `relationshipOverlay` directive which creates
         * the relationship overlay within the vocabulary editor.
         */
        .module('relationshipOverlay', [])
        /**
         * @ngdoc directive
         * @name relationshipOverlay.directive:relationshipOverlay
         * @scope
         * @restrict E
         * @requires $filter
         * @requires responseObj.service:responseObj
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyState.service:ontologyStateService
         * @requires util.service:utilService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         *
         * @description
         * HTML contents in the relationship overlay with provides the users with an overlay which can be used to add
         * a SKOS relationship to the selected entity.
         *
         * @param {Object[]} relationshipList the list of relationships available to add to the selected entity
         * @param {function=undefined} onSubmit the function to be called after a relationship is added
         */
        .directive('relationshipOverlay', relationshipOverlay);

        relationshipOverlay.$inject = ['$filter', 'responseObj', 'ontologyManagerService', 'ontologyStateService', 'utilService', 'ontologyUtilsManagerService'];

        function relationshipOverlay($filter, responseObj, ontologyManagerService, ontologyStateService, utilService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/relationshipOverlay/relationshipOverlay.html',
                scope: {
                    relationshipList: '<',
                    onSubmit: '&?'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.ro = responseObj;
                    dvm.os = ontologyStateService;
                    dvm.util = utilService;
                    dvm.concepts = [];
                    dvm.conceptList = dvm.om.getConceptIRIs(dvm.os.getOntologiesArray(), dvm.os.listItem.derivedConcepts);
                    dvm.schemeList = dvm.om.getConceptSchemeIRIs(dvm.os.getOntologiesArray(), dvm.os.listItem.derivedConceptSchemes);

                    dvm.addRelationship = function() {
                        var axiom = dvm.ro.getItemIri(dvm.relationship);
                        dvm.os.listItem.selected[axiom] = _.union(_.get(dvm.os.listItem.selected, axiom, []), dvm.values);
                        dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, {'@id': dvm.os.listItem.selected['@id'],
                            [axiom]: dvm.values});
                        dvm.os.showRelationshipOverlay = false;
                        dvm.ontoUtils.saveCurrentChanges();
                    }
                }
            }
        }
})();
