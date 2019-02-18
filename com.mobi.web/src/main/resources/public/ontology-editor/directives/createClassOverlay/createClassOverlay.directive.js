(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name createClassOverlay
         *
         * @description
         * The `createClassOverlay` module only provides the `createClassOverlay` directive which creates content
         * for a modal to add an class to an ontology.
         */
        .module('createClassOverlay', [])
        /**
         * @ngdoc directive
         * @name createClassOverlay.directive:createClassOverlay
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires prefixes.service:prefixes
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         *
         * @description
         * `createClassOverlay` is a directive that creates content for a modal that creates a class in the current
         * {@link ontologyState.service:ontologyStateService selected ontology}. The form in the modal contains a
         * text input for the class name (which populates the {@link staticIri.directive:staticIri IRI}), a
         * {@link textArea.directive:textArea} for the class description, an
         * {@link advancedLanguageSelect.directive:advancedLanguageSelect}, and a
         * {@link superClassSelect.directive:superClassSelect}. Meant to be used in conjunction with the
         * {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('createClassOverlay', createClassOverlay);

        createClassOverlay.$inject = ['$filter', 'ontologyStateService', 'prefixes', 'ontologyUtilsManagerService'];

        function createClassOverlay($filter, ontologyStateService, prefixes, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                templateUrl: 'ontology-editor/directives/createClassOverlay/createClassOverlay.directive.html',
                scope: {
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.prefixes = prefixes;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.prefix = dvm.os.getDefaultPrefix();
                    dvm.values = [];
                    dvm.clazz = {
                        '@id': dvm.prefix,
                        '@type': [prefixes.owl + 'Class'],
                        [prefixes.dcterms + 'title']: [{
                            '@value': ''
                        }],
                        [prefixes.dcterms + 'description']: [{
                            '@value': ''
                        }]
                    }

                    dvm.nameChanged = function() {
                        if (!dvm.iriHasChanged) {
                            dvm.clazz['@id'] = dvm.prefix + $filter('camelCase')(
                                dvm.clazz[prefixes.dcterms + 'title'][0]['@value'], 'class');
                        }
                    }
                    dvm.onEdit = function(iriBegin, iriThen, iriEnd) {
                        dvm.iriHasChanged = true;
                        dvm.clazz['@id'] = iriBegin + iriThen + iriEnd;
                        dvm.os.setCommonIriParts(iriBegin, iriThen);
                    }
                    dvm.create = function() {
                        if (_.isEqual(dvm.clazz[prefixes.dcterms + 'description'][0]['@value'], '')) {
                            _.unset(dvm.clazz, prefixes.dcterms + 'description');
                        }
                        dvm.ontoUtils.addLanguageToNewEntity(dvm.clazz, dvm.language);
                        // add the entity to the ontology
                        dvm.os.addEntity(dvm.os.listItem, dvm.clazz);
                        // update relevant lists
                        dvm.os.addToClassIRIs(dvm.os.listItem, dvm.clazz['@id']);
                        if (dvm.values.length) {
                            dvm.clazz[prefixes.rdfs + 'subClassOf'] = dvm.values;
                            var superClassIds = _.map(dvm.values, '@id');
                            if (dvm.ontoUtils.containsDerivedConcept(superClassIds)) {
                                dvm.os.listItem.derivedConcepts.push(dvm.clazz['@id']);
                            }
                            dvm.ontoUtils.setSuperClasses(dvm.clazz['@id'], superClassIds);
                        } else {
                            var hierarchy = _.get(dvm.os.listItem, 'classes.hierarchy');
                            hierarchy.push({'entityIRI': dvm.clazz['@id']});
                            dvm.os.listItem.classes.flat = dvm.os.flattenHierarchy(hierarchy, dvm.os.listItem.ontologyRecord.recordId);
                        }
                        dvm.os.listItem.flatEverythingTree = dvm.os.createFlatEverythingTree(dvm.os.listItem);
                        // Update InProgressCommit
                        dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, dvm.clazz);
                        // Save the changes to the ontology
                        dvm.ontoUtils.saveCurrentChanges();
                        // hide the overlay
                        $scope.close()
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }
                }]
            }
        }
})();
