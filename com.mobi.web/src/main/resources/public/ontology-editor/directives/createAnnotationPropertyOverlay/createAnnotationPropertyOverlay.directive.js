/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
         * @name createAnnotationPropertyOverlay
         *
         * @description
         * The `createAnnotationPropertyOverlay` module only provides the `createAnnotationPropertyOverlay` directive
         * which creates content for a modal to add an annotation property to an ontology.
         */
        .module('createAnnotationPropertyOverlay', [])
        /**
         * @ngdoc directive
         * @name createAnnotationPropertyOverlay.directive:createAnnotationPropertyOverlay
         * @scope
         * @restrict E
         * @requires shared.service:ontologyManagerService
         * @requires shared.service:ontologyStateService
         * @requires shared.service:prefixes
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         *
         * @description
         * `createAnnotationPropertyOverlay` is a directive that creates content for a modal that creates an annotation
         * property in the current {@link shared.service:ontologyStateService selected ontology}.
         * The form in the modal contains a text input for the property name (which populates the
         * {@link staticIri.directive:staticIri IRI}), a {@link shared.component:textArea} for the property
         * description, and an {@link advancedLanguageSelect.directive:advancedLanguageSelect}. Meant to be used in
         * conjunction with the {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('createAnnotationPropertyOverlay', createAnnotationPropertyOverlay);

        createAnnotationPropertyOverlay.$inject = ['$filter', 'ontologyManagerService', 'ontologyStateService', 'prefixes', 'ontologyUtilsManagerService'];

        function createAnnotationPropertyOverlay($filter, ontologyManagerService, ontologyStateService, prefixes, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                templateUrl: 'ontology-editor/directives/createAnnotationPropertyOverlay/createAnnotationPropertyOverlay.directive.html',
                scope: {
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.prefixes = prefixes;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.prefix = dvm.os.getDefaultPrefix();
                    dvm.property = {
                        '@id': dvm.prefix,
                        '@type': [dvm.prefixes.owl + 'AnnotationProperty'],
                        [prefixes.dcterms + 'title']: [{
                            '@value': ''
                        }],
                        [prefixes.dcterms + 'description']: [{
                            '@value': ''
                        }]
                    };

                    dvm.nameChanged = function() {
                        if (!dvm.iriHasChanged) {
                            dvm.property['@id'] = dvm.prefix + $filter('camelCase')(dvm.property[prefixes.dcterms + 'title'][0]['@value'], 'property');
                        }
                    }
                    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
                        dvm.iriHasChanged = true;
                        dvm.property['@id'] = iriBegin + iriThen + iriEnd;
                        dvm.os.setCommonIriParts(iriBegin, iriThen);
                    }
                    dvm.create = function() {
                        if (dvm.property[prefixes.dcterms + 'description'][0]['@value'] === '') {
                            _.unset(dvm.property, prefixes.dcterms + 'description');
                        }
                        dvm.ontoUtils.addLanguageToNewEntity(dvm.property, dvm.language);
                        dvm.os.updatePropertyIcon(dvm.property);
                        // add the entity to the ontology
                        dvm.os.addEntity(dvm.os.listItem, dvm.property);
                        // update lists
                        updateLists('annotations');
                        // Update InProgressCommit
                        dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, dvm.property);
                        // Save the changes to the ontology
                        dvm.ontoUtils.saveCurrentChanges();
                        // hide the overlay
                        $scope.close();
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }

                    function updateLists(key) {
                        dvm.os.listItem[key].iris[dvm.property['@id']] = dvm.os.listItem.ontologyId;
                        dvm.os.listItem[key].hierarchy.push({'entityIRI': dvm.property['@id']});
                        dvm.os.listItem[key].flat = dvm.os.flattenHierarchy(dvm.os.listItem[key].hierarchy, dvm.os.listItem.ontologyRecord.recordId);
                    }
                }]
            }
        }
})();
