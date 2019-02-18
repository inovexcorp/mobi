(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name ontologyPropertyOverlay
         *
         * @description
         * The `ontologyPropertyOverlay` module only provides the `ontologyPropertyOverlay` directive which creates
         * content for a modal to add or edit an ontology property on an ontology.
         */
        .module('ontologyPropertyOverlay', [])
        /**
         * @ngdoc directive
         * @name ontologyPropertyOverlay.directive:ontologyPropertyOverlay
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires propertyManager.service:propertyManagerService
         * @requires util.service:utilService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `ontologyPropertyOverlay` is a directive that creates content for a modal that adds or edits an ontology
         * property on the current {@link ontologyState.service:ontologyStateService selected ontology}. The form in
         * the modal contains a `ui-select` for the ontology property (or annotation). If an ontology property is
         * selected, text input is provided for the value (must be a valid IRI). If an annotation is selected, a
         * {@link textArea.directive:textArea} is provided for the annotation value with a
         * {@link languageSelect.directive:languageSelect}, unless the annotation is owl:deprecated in which case the
         * `textArea` and `languageSelect` are replaced by {@link radioButton.directive:radioButton radio buttons} for
         * the boolean value. Meant to be used in conjunction with the {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('ontologyPropertyOverlay', ontologyPropertyOverlay);

        ontologyPropertyOverlay.$inject = ['ontologyStateService', 'REGEX', 'propertyManagerService', 'utilService', 'ontologyUtilsManagerService', 'prefixes'];

        function ontologyPropertyOverlay(ontologyStateService, REGEX, propertyManagerService, utilService, ontologyUtilsManagerService, prefixes) {
            return {
                restrict: 'E',
                templateUrl: 'ontology-editor/directives/ontologyPropertyOverlay/ontologyPropertyOverlay.directive.html',
                scope: {
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var pm = propertyManagerService;
                    dvm.prefixes = prefixes;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.os = ontologyStateService;
                    dvm.iriPattern = REGEX.IRI;
                    dvm.util = utilService;
                    dvm.properties = _.union(pm.ontologyProperties, _.keys(dvm.os.listItem.annotations.iris));


                    dvm.submit = function() {
                        if (dvm.os.editingOntologyProperty) {
                            dvm.editProperty();
                        } else {
                            dvm.addProperty();
                        }
                    }
                    dvm.isOntologyProperty = function() {
                        return !!dvm.os.ontologyProperty && _.some(pm.ontologyProperties, property => dvm.os.ontologyProperty === property);
                    }
                    dvm.isAnnotationProperty = function() {
                        return !!dvm.os.ontologyProperty && _.has(dvm.os.listItem.annotations.iris, dvm.os.ontologyProperty);
                    }
                    dvm.selectProp = function() {
                        dvm.os.ontologyPropertyValue = '';
                        if (dvm.os.ontologyProperty === prefixes.owl + 'deprecated') {
                            dvm.os.ontologyPropertyType = prefixes.xsd + 'boolean';
                            dvm.os.ontologyPropertyLanguage = '';
                        } else {
                            dvm.os.ontologyPropertyType = undefined;
                            dvm.os.ontologyPropertyLanguage = 'en';
                        }
                    }
                    dvm.addProperty = function() {
                        var value, added = false;
                        if (dvm.isOntologyProperty()) {
                            value = dvm.os.ontologyPropertyIRI;
                            added = pm.addId(dvm.os.listItem.selected, dvm.os.ontologyProperty, dvm.os.ontologyPropertyIRI);
                        } else if (dvm.isAnnotationProperty()) {
                            value = dvm.os.ontologyPropertyValue;
                            added = pm.addValue(dvm.os.listItem.selected, dvm.os.ontologyProperty, dvm.os.ontologyPropertyValue, dvm.os.ontologyPropertyType, dvm.os.ontologyPropertyLanguage);
                        }
                        if (added) {
                            dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, createJson(value, dvm.os.ontologyPropertyType, dvm.os.ontologyPropertyLanguage));
                            dvm.ontoUtils.saveCurrentChanges();
                        } else {
                            dvm.util.createWarningToast('Duplicate property values not allowed');
                        }
                        $scope.close();
                    }
                    dvm.editProperty = function() {
                        var oldObj = angular.copy(_.get(dvm.os.listItem.selected, "['" + dvm.os.ontologyProperty + "']['" + dvm.os.ontologyPropertyIndex + "']"));
                        var value, edited = false;
                        if (dvm.isOntologyProperty()) {
                            value = dvm.os.ontologyPropertyIRI;
                            edited = pm.editId(dvm.os.listItem.selected, dvm.os.ontologyProperty, dvm.os.ontologyPropertyIndex, value);
                        } else if (dvm.isAnnotationProperty()) {
                            value = dvm.os.ontologyPropertyValue;
                            edited = pm.editValue(dvm.os.listItem.selected, dvm.os.ontologyProperty, dvm.os.ontologyPropertyIndex, value, dvm.os.ontologyPropertyType, dvm.os.ontologyPropertyLanguage);
                        }
                        if (edited) {
                            dvm.os.addToDeletions(dvm.os.listItem.ontologyRecord.recordId, createJson(_.get(oldObj, '@value', _.get(oldObj, '@id')), _.get(oldObj, '@type'), _.get(oldObj, '@language')));
                            dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, createJson(value, dvm.os.ontologyPropertyType, dvm.os.ontologyPropertyLanguage));
                            dvm.ontoUtils.saveCurrentChanges();
                        } else {
                            dvm.util.createWarningToast('Duplicate property values not allowed');
                        }
                        $scope.close();
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }

                    function createJson(value, type, language) {
                        var valueObj = {};
                        if (dvm.isOntologyProperty()) {
                            valueObj = {'@id': value};
                        } else if (dvm.isAnnotationProperty()) {
                            valueObj = pm.createValueObj(value, dvm.os.ontologyPropertyType, language);
                        }
                        return dvm.util.createJson(dvm.os.listItem.selected['@id'], dvm.os.ontologyProperty, valueObj);
                    }
                }]
            }
        }
})();
