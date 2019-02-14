/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
         * @name newOntologyOverlay
         *
         * @description
         * The `newOntologyOverlay` module only provides the `newOntologyOverlay` directive which creates content for a
         * modal to create a new ontology.
         */
        .module('newOntologyOverlay', [])
        .config(ignoreUnhandledRejectionsConfig)
        /**
         * @ngdoc directive
         * @name newOntologyOverlay.directive:newOntologyOverlay
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires prefixes.service:prefixes
         * @requires util.service:utilService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         *
         * @description
         * `newOntologyOverlay` is a directive that creates content for a modal that creates a new ontology. The form
         * in the modal contains a {@link textInput.directive:textInput} for the name, a field for the IRI, a
         * {@link textArea.directive:textArea} for the description, an
         * {@link advancedLanguageSelect.directive:advancedLanguageSelect}, and a
         * {@link keywordSelect.directive:keywordSelect}. The value of the name field will populate the IRI field
         * unless the IRI value is manually changed.  Meant to be used in conjunction with the
         * {@link modalService.directive:modalService}.
         */
        .directive('newOntologyOverlay', newOntologyOverlay);

        newOntologyOverlay.$inject = ['$q', '$filter', 'REGEX', 'ontologyStateService', 'prefixes', 'utilService', 'ontologyUtilsManagerService'];

        function newOntologyOverlay($q, $filter, REGEX, ontologyStateService, prefixes, utilService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                scope: {
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var util = utilService;
                    var ontoUtils = ontologyUtilsManagerService;

                    dvm.prefixes = prefixes;
                    dvm.iriPattern = REGEX.IRI;
                    dvm.os = ontologyStateService;

                    dvm.nameChanged = function() {
                        if (!dvm.iriHasChanged) {
                            var split = $filter('splitIRI')(dvm.os.newOntology['@id']);
                            dvm.os.newOntology['@id'] = split.begin + split.then + $filter('camelCase')(util.getPropertyValue(dvm.os.newOntology, prefixes.dcterms + 'title'), 'class');
                        }
                    }
                    dvm.create = function() {
                        var title = util.getPropertyValue(dvm.os.newOntology, prefixes.dcterms + 'title');
                        var description = util.getPropertyValue(dvm.os.newOntology, prefixes.dcterms + 'description');
                        if (!description) {
                            delete dvm.os.newOntology[prefixes.dcterms + 'description'];
                        }
                        ontoUtils.addLanguageToNewEntity(dvm.os.newOntology, dvm.os.newLanguage);
                        dvm.os.createOntology(dvm.os.newOntology, title, description, _.map(dvm.os.newKeywords, _.trim))
                            .then(response => dvm.os.createOntologyState({recordId: response.recordId, commitId: response.commitId, branchId: response.branchId}), $q.reject)
                            .then(() => $scope.close(), onError);
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }

                    function onError(errorMessage) {
                        dvm.error = errorMessage;
                    }
                }],
                templateUrl: 'modules/ontology-editor/directives/newOntologyOverlay/newOntologyOverlay.html'
            }
        }
})();
