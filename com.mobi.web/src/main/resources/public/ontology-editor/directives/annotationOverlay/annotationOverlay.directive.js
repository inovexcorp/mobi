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
         * @name annotationOverlay
         *
         * @description
         * The `annotationOverlay` module only provides the `annotationOverlay` directive which creates content
         * for a modal to add or edit an annotation on an entity.
         */
        .module('annotationOverlay', [])
        /**
         * @ngdoc directive
         * @name annotationOverlay.directive:annotationOverlay
         * @scope
         * @restrict E
         * @requires shared.service:propertyManagerService
         * @requires shared.service:ontologyStateService
         * @requires shared.service:utilService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires shared.service:prefixes
         *
         * @description
         * `annotationOverlay` is a directive that creates content for a modal that adds or edits an annotation on the
         * {@link shared.service:ontologyStateService selected entity}. The form in the modal contains a
         * `ui-select` for the annotation property, a {@link shared.directive:textArea} for the annotation value, and
         * a {@link shared.directive:languageSelect}. If the annotation is owl:deprecated, the `textArea` and
         * `languageSelect` are replaced by {@link shared.directive:radiobutton radio buttons} for the boolean
         * value. Meant to be used in conjunction with the {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('annotationOverlay', annotationOverlay);

        annotationOverlay.$inject = ['propertyManagerService', 'ontologyStateService', 'utilService', 'ontologyUtilsManagerService', 'prefixes'];

        function annotationOverlay(propertyManagerService, ontologyStateService, utilService, ontologyUtilsManagerService, prefixes) {
            return {
                restrict: 'E',
                templateUrl: 'ontology-editor/directives/annotationOverlay/annotationOverlay.directive.html',
                scope: {
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.pm = propertyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.util = utilService;
                    dvm.prefixes = prefixes;
                    dvm.annotations = [];

                    dvm.$onInit = function() {
                        dvm.annotations = _.union(_.keys(dvm.os.listItem.annotations.iris), dvm.pm.defaultAnnotations, dvm.pm.owlAnnotations);
                    }
                    dvm.disableProp = function(annotation) {
                        return annotation === prefixes.owl + 'deprecated' && _.has(dvm.os.listItem.selected, "['" + prefixes.owl + 'deprecated' + "']");
                    }
                    dvm.selectProp = function() {
                        dvm.os.annotationValue = '';
                        if (dvm.os.annotationSelect === prefixes.owl + 'deprecated') {
                            dvm.os.annotationType = prefixes.xsd + 'boolean';
                            dvm.os.annotationLanguage = '';
                        } else {
                            dvm.os.annotationType = undefined;
                            dvm.os.annotationLanguage = 'en';
                        }
                    }
                    dvm.submit = function() {
                        if (dvm.os.editingAnnotation) {
                            dvm.editAnnotation();
                        } else {
                            dvm.addAnnotation();
                        }
                    }
                    dvm.isDisabled = function() {
                        var isDisabled = dvm.annotationForm.$invalid || dvm.os.annotationValue === ''
                        if (!dvm.os.editingAnnotation) {
                            isDisabled = isDisabled || dvm.os.annotationSelect === undefined;
                        }
                        return isDisabled;
                    }
                    dvm.addAnnotation = function() {
                        var added = dvm.pm.addValue(dvm.os.listItem.selected, dvm.os.annotationSelect, dvm.os.annotationValue, dvm.os.annotationType, dvm.os.annotationLanguage);
                        if (added) {
                            dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, createJson(dvm.os.annotationValue, dvm.os.annotationType, dvm.os.annotationLanguage));
                            dvm.ontoUtils.saveCurrentChanges();
                            dvm.ontoUtils.updateLabel();
                        } else {
                            dvm.util.createWarningToast('Duplicate property values not allowed');
                        }
                        $scope.close();
                    }
                    dvm.editAnnotation = function() {
                        var oldObj = angular.copy(_.get(dvm.os.listItem.selected, "['" + dvm.os.annotationSelect + "']['" + dvm.os.annotationIndex + "']"));
                        var edited = dvm.pm.editValue(dvm.os.listItem.selected, dvm.os.annotationSelect, dvm.os.annotationIndex, dvm.os.annotationValue, dvm.os.annotationType, dvm.os.annotationLanguage);
                        if (edited) {
                            dvm.os.addToDeletions(dvm.os.listItem.ontologyRecord.recordId, createJson(_.get(oldObj, '@value'), _.get(oldObj, '@type'), _.get(oldObj, '@language')));
                            dvm.os.addToAdditions(dvm.os.listItem.ontologyRecord.recordId, createJson(dvm.os.annotationValue, dvm.os.annotationType, dvm.os.annotationLanguage));
                            dvm.ontoUtils.saveCurrentChanges();
                            dvm.ontoUtils.updateLabel();
                        } else {
                            dvm.util.createWarningToast('Duplicate property values not allowed');
                        }
                        $scope.close();
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }

                    function createJson(value, type, language) {
                        var valueObj = dvm.pm.createValueObj(value, type, language);
                        return dvm.util.createJson(dvm.os.listItem.selected['@id'], dvm.os.annotationSelect, valueObj);
                    }
                }]
            }
        }
})();
