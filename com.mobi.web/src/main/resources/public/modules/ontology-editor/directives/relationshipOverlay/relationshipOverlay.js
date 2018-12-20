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
         * content for a modal to add a relationship to a concept in an ontology.
         */
        .module('relationshipOverlay', [])
        /**
         * @ngdoc directive
         * @name relationshipOverlay.directive:relationshipOverlay
         * @scope
         * @restrict E
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyState.service:ontologyStateService
         * @requires util.service:utilService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires propertyManager.service:propertyManagerService
         *
         * @description
         * `axiomOverlay` is a directive that creates content for a modal that adds a SKOS relationship to the
         * {@link ontologyState.service:ontologyStateService selected concept}. The form in the modal contains a
         * `ui-select` of the provided relationships and a `ui-select` of the appropriate values for the selected
         * relationship (concepts or concept schemes). Meant to be used in conjunction with the
         * {@link modalService.directive:modalService}.
         *
         * @param {Object} resolve Information provided to the modal
         * @param {Object[]} resolve.relationshipList The list of relationships available to add to the selected concept
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('relationshipOverlay', relationshipOverlay);

        relationshipOverlay.$inject = ['ontologyManagerService', 'ontologyStateService', 'utilService', 'ontologyUtilsManagerService', 'propertyManagerService'];

        function relationshipOverlay(ontologyManagerService, ontologyStateService, utilService, ontologyUtilsManagerService, propertyManagerService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/relationshipOverlay/relationshipOverlay.html',
                scope: {
                    resolve: '<',
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var pm = propertyManagerService;
                    var om = ontologyManagerService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.os = ontologyStateService;
                    dvm.util = utilService;
                    dvm.array = [];
                    dvm.conceptList = _.without(om.getConceptIRIs(dvm.os.getOntologiesArray(), dvm.os.listItem.derivedConcepts), dvm.os.listItem.selected['@id']);
                    dvm.schemeList = _.without(om.getConceptSchemeIRIs(dvm.os.getOntologiesArray(), dvm.os.listItem.derivedConceptSchemes), dvm.os.listItem.selected['@id']);
                    dvm.values = [];

                    dvm.addRelationship = function() {
                        var addedValues = _.filter(dvm.values, value => pm.addId(dvm.os.listItem.selected, dvm.relationship, value));
                        if (addedValues.length !== dvm.values.length) {
                            dvm.util.createWarningToast('Duplicate property values not allowed');
                        }
                        if (addedValues.length) {
                            var addedValueObjs = _.map(addedValues, value => ({'@id': value}));
                            dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, {'@id': dvm.os.listItem.selected['@id'], [dvm.relationship]: addedValueObjs});
                            dvm.ontoUtils.saveCurrentChanges()
                                .then(() => {
                                    $scope.close({$value: {relationship: dvm.relationship, values: addedValueObjs}})
                                });
                        } else {
                            $scope.close();
                        }
                    }
                    dvm.getValues = function(searchText) {
                        var isSchemeRelationship = _.includes(pm.conceptSchemeRelationshipList, dvm.relationship);
                        var isSemanticRelation = _.includes(dvm.os.listItem.derivedSemanticRelations, dvm.relationship);
                        var list = [];
                        if (!isSchemeRelationship && !isSemanticRelation) {
                            dvm.array = [];
                            return;
                        } else if (isSchemeRelationship) {
                            list = dvm.schemeList;
                        } else {
                            list = dvm.conceptList;
                        }

                        dvm.array = dvm.ontoUtils.getSelectList(list, searchText);
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }
                }]
            }
        }
})();
