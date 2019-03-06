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
         * @name individualTypesModal
         *
         * @description
         * The `individualTypesModal` module only provides the `individualTypesModal` directive which creates
         * content for a modal to edit the types of an individual to an ontology.
         */
        .module('individualTypesModal', [])
        /**
         * @ngdoc directive
         * @name individualTypesModal.directive:individualTypesModal
         * @scope
         * @restrict E
         * @requires shared.service:ontologyStateService
         * @requires shared.service:prefixes
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         *
         * @description
         * `individualTypesModal` is a directive that creates content for a modal that edits the types of the selected
         * individual in the current {@link shared.service:ontologyStateService selected ontology}. The form in
         * the modal contains a 'ui-select' for the classes this individual will be an instance of. Meant to be used in
         * conjunction with the {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('individualTypesModal', individualTypesModal);

        individualTypesModal.$inject = ['$filter', 'ontologyManagerService', 'ontologyStateService', 'ontologyUtilsManagerService', 'prefixes'];

        function individualTypesModal($filter, ontologyManagerService, ontologyStateService, ontologyUtilsManagerService, prefixes) {
            return {
                restrict: 'E',
                templateUrl: 'ontology-editor/directives/individualTypesModal/individualTypesModal.directive.html',
                scope: {
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                    dvm.om = ontologyManagerService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.types = angular.copy(dvm.os.listItem.selected['@type']);

                    dvm.isNamedIndividual = function(iri) {
                        return iri === prefixes.owl + 'NamedIndividual';
                    }
                    dvm.submit = function() {
                        if (dvm.types.length < 2) {
                            dvm.error = 'Individual must have a type other than Named Individual';
                            return;
                        }
                        var originalTypes = angular.copy(dvm.os.listItem.selected['@type']);

                        // Handle vocabulary stuff
                        var wasConcept = dvm.ontoUtils.containsDerivedConcept(originalTypes);
                        var isConcept = dvm.ontoUtils.containsDerivedConcept(dvm.types);
                        var wasConceptScheme = dvm.ontoUtils.containsDerivedConceptScheme(originalTypes);
                        var isConceptScheme = dvm.ontoUtils.containsDerivedConceptScheme(dvm.types);

                        if (isConcept && isConceptScheme) {
                            dvm.error = 'Individual cannot be both a Concept and Concept Scheme';
                            return;
                        }

                        dvm.os.listItem.selected['@type'] = dvm.types;

                        var addedTypes = _.difference(dvm.types, originalTypes);
                        var removedTypes = _.difference(originalTypes, dvm.types);

                        if (addedTypes.length || removedTypes.length) {
                            var unselect = false;

                            // Handle vocabulary stuff
                            var wasConcept = dvm.ontoUtils.containsDerivedConcept(originalTypes);
                            var isConcept = dvm.ontoUtils.containsDerivedConcept(dvm.types);
                            var wasConceptScheme = dvm.ontoUtils.containsDerivedConceptScheme(originalTypes);
                            var isConceptScheme = dvm.ontoUtils.containsDerivedConceptScheme(dvm.types);

                            // Handle added types
                            _.forEach(addedTypes, type => {
                                var indivs = _.get(dvm.os.listItem.classesAndIndividuals, type, []);
                                indivs.push(dvm.os.listItem.selected['@id']);
                                dvm.os.listItem.classesAndIndividuals[type] = indivs;
                            });

                            // Handle removed types
                            _.forEach(removedTypes, type => {
                                var parentAndIndivs = _.get(dvm.os.listItem.classesAndIndividuals, "['" + type + "']", []);
                                if (parentAndIndivs.length) {
                                    _.remove(parentAndIndivs, item => item === dvm.os.listItem.selected['@id']);
                                    if (!parentAndIndivs.length) {
                                        delete dvm.os.listItem.classesAndIndividuals[type];
                                    }
                                }
                            });

                            _.set(dvm.os.listItem, 'classesWithIndividuals', _.keys(dvm.os.listItem.classesAndIndividuals));
                            dvm.os.listItem.individualsParentPath = dvm.os.getIndividualsParentPath(dvm.os.listItem);
                            dvm.os.listItem.individuals.flat = dvm.os.createFlatIndividualTree(dvm.os.listItem);

                            // Made into a Concept
                            if (!wasConcept && isConcept) {
                                dvm.ontoUtils.addConcept(dvm.os.listItem.selected);
                                _.forEach(_.pull(_.keys(dvm.os.listItem.selected), '@id', '@type'), key => {
                                    dvm.ontoUtils.updateVocabularyHierarchies(key, dvm.os.listItem.selected[key]);
                                });
                            }
                            // No longer a Concept
                            if (!isConcept && wasConcept) {
                                delete dvm.os.listItem.concepts.iris[dvm.os.listItem.selected['@id']];                                
                                dvm.os.deleteEntityFromHierarchy(dvm.os.listItem.concepts, dvm.os.listItem.selected['@id']);
                                dvm.os.deleteEntityFromHierarchy(dvm.os.listItem.conceptSchemes, dvm.os.listItem.selected['@id']);
                                dvm.os.listItem.concepts.flat = dvm.os.flattenHierarchy(dvm.os.listItem.concepts);
                                dvm.os.listItem.conceptSchemes.flat = dvm.os.flattenHierarchy(dvm.os.listItem.conceptSchemes);
                                if (dvm.os.listItem.editorTabStates.concepts.entityIRI === dvm.os.listItem.selected['@id']) {
                                    _.unset(dvm.os.listItem.editorTabStates.concepts, 'entityIRI');
                                    _.unset(dvm.os.listItem.editorTabStates.concepts, 'usages');
                                    if (dvm.os.getActiveKey() === 'concepts') {
                                        unselect = true;
                                    }
                                }
                                if (dvm.os.listItem.editorTabStates.schemes.entityIRI === dvm.os.listItem.selected['@id']) {
                                    _.unset(dvm.os.listItem.editorTabStates.schemes, 'entityIRI');
                                    _.unset(dvm.os.listItem.editorTabStates.schemes, 'usages');
                                    if (dvm.os.getActiveKey() === 'schemes') {
                                        unselect = true;
                                    }
                                }
                            }
                            // Made into a Concept Scheme
                            if (!wasConceptScheme && isConceptScheme) {
                                dvm.ontoUtils.addConceptScheme(dvm.os.listItem.selected);
                                _.forEach(_.pull(_.keys(dvm.os.listItem.selected), '@id', '@type'), key => {
                                    dvm.ontoUtils.updateVocabularyHierarchies(key, dvm.os.listItem.selected[key]);
                                });
                            }
                            // No longer a Concept Scheme
                            if (!isConceptScheme && wasConceptScheme) {
                                delete dvm.os.listItem.conceptSchemes.iris[dvm.os.listItem.selected['@id']];                                
                                dvm.os.deleteEntityFromHierarchy(dvm.os.listItem.conceptSchemes, dvm.os.listItem.selected['@id']);
                                dvm.os.listItem.conceptSchemes.flat = dvm.os.flattenHierarchy(dvm.os.listItem.conceptSchemes);
                                if (dvm.os.listItem.editorTabStates.schemes.entityIRI === dvm.os.listItem.selected['@id']) {
                                    _.unset(dvm.os.listItem.editorTabStates.schemes, 'entityIRI');
                                    _.unset(dvm.os.listItem.editorTabStates.schemes, 'usages');
                                    if (dvm.os.getActiveKey() === 'schemes') {
                                        unselect = true;
                                    }
                                }
                            }
                            if (addedTypes.length) {
                                dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, {'@id': dvm.os.listItem.selected['@id'], '@type': addedTypes});
                            }
                            if (removedTypes.length) {
                                dvm.os.addToDeletions(dvm.os.listItem.ontologyRecord.recordId, {'@id': dvm.os.listItem.selected['@id'], '@type': removedTypes});
                            }
                            if (unselect) {
                                dvm.os.unSelectItem();
                            }
                            dvm.ontoUtils.saveCurrentChanges();
                            $scope.close();
                        } else {
                            $scope.close();
                        }
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }
                }]
            }
        }
})();
