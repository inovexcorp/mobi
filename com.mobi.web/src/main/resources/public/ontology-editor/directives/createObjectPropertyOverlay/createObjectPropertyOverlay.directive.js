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
         * @name createObjectPropertyOverlay
         *
         * @description
         * The `createObjectPropertyOverlay` module only provides the `createObjectPropertyOverlay` directive which
         * creates content for a modal to add an object property to an ontology.
         */
        .module('createObjectPropertyOverlay', [])
        /**
         * @ngdoc directive
         * @name createObjectPropertyOverlay.directive:createObjectPropertyOverlay
         * @scope
         * @restrict E
         * @requires shared.service:ontologyManagerService
         * @requires shared.service:ontologyStateService
         * @requires shared.service:prefixes
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         *
         * @description
         * `createObjectPropertyOverlay` is a directive that creates content for a modal that creates an object property
         * in the current {@link shared.service:ontologyStateService selected ontology}. The form in the modal
         * contains a text input for the property name (which populates the {@link staticIri.directive:staticIri IRI}),
         * a {@link shared.directive:textArea} for the property description,
         * {@link advancedLanguageSelect.directive:advancedLanguageSelect},
         * {@link shared.directive:checkbox checkboxes} for the property characteristics, an
         * {@link shared.directive:iriSelect} for the domain, an {@link shared.directive:iriSelect} for the range,
         * and a {@link superPropertySelect.directive:superPropertySelect}. Meant to be used in conjunction with the
         * {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('createObjectPropertyOverlay', createObjectPropertyOverlay);

        createObjectPropertyOverlay.$inject = ['$filter', 'ontologyManagerService', 'ontologyStateService', 'prefixes', 'ontologyUtilsManagerService'];

        function createObjectPropertyOverlay($filter, ontologyManagerService, ontologyStateService, prefixes, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                templateUrl: 'ontology-editor/directives/createObjectPropertyOverlay/createObjectPropertyOverlay.directive.html',
                scope: {
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;

                    dvm.characteristics = [
                        {
                            checked: false,
                            typeIRI: prefixes.owl + 'FunctionalProperty',
                            displayText: 'Functional Property',
                        },
                        {
                            checked: false,
                            typeIRI: prefixes.owl + 'AsymmetricProperty',
                            displayText: 'Asymmetric Property',
                        }
                    ];
                    dvm.prefixes = prefixes;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.prefix = dvm.os.getDefaultPrefix();
                    dvm.values = [];
                    dvm.property = {
                        '@id': dvm.prefix,
                        '@type': [dvm.prefixes.owl + 'ObjectProperty'],
                        [prefixes.dcterms + 'title']: [{
                            '@value': ''
                        }],
                        [prefixes.dcterms + 'description']: [{
                            '@value': ''
                        }]
                    };
                    dvm.domains = [];
                    dvm.ranges = [];

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
                        _.forEach(dvm.characteristics, (obj, key) => {
                            if (obj.checked) {
                                dvm.property['@type'].push(obj.typeIRI);
                            }
                        });
                        if (dvm.domains.length) {
                            dvm.property[prefixes.rdfs + 'domain'] = _.map(dvm.domains, iri => ({'@id': iri}));
                        }
                        if (dvm.ranges.length) {
                            dvm.property[prefixes.rdfs + 'range'] = _.map(dvm.ranges, iri => ({'@id': iri}));
                        }
                        dvm.ontoUtils.addLanguageToNewEntity(dvm.property, dvm.language);
                        dvm.os.updatePropertyIcon(dvm.property);
                        // add the entity to the ontology
                        dvm.os.addEntity(dvm.os.listItem, dvm.property);
                        // update lists
                        updateLists();
                        dvm.os.listItem.flatEverythingTree = dvm.os.createFlatEverythingTree(dvm.os.listItem);
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

                    function updateLists() {
                        dvm.os.listItem.objectProperties.iris[dvm.property['@id']] = dvm.os.listItem.ontologyId;
                        if (dvm.values.length) {
                            dvm.property[prefixes.rdfs + 'subPropertyOf'] = dvm.values;
                            dvm.ontoUtils.setSuperProperties(dvm.property['@id'], _.map(dvm.values, '@id'), 'objectProperties');
                            if (dvm.ontoUtils.containsDerivedSemanticRelation(_.map(dvm.values, '@id'))) {
                                dvm.os.listItem.derivedSemanticRelations.push(dvm.property['@id']);
                            }
                        } else {
                            dvm.os.listItem.objectProperties.hierarchy.push({'entityIRI': dvm.property['@id']});
                            dvm.os.listItem.objectProperties.flat = dvm.os.flattenHierarchy(dvm.os.listItem.objectProperties.hierarchy, dvm.os.listItem.ontologyRecord.recordId);
                        }
                    }
                }]
            }
        }
})();
