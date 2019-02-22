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
         * @name staticIri
         *
         * @description
         * The `staticIri` module only provides the `staticIri` directive which creates a display of an entity's IRI.
         */
        .module('staticIri', [])
        /**
         * @ngdoc directive
         * @name staticIri.directive:staticIri
         * @scope
         * @restrict E
         * @requires shared.service:ontologyStateService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         * @requires shared.service:modalService
         *
         * @description
         * `staticIri` is a directive that creates a `div` with a display of the provided IRI of an entity. If
         * `duplicateCheck` is true, an {@link shared.directive:errorDisplay} will be displayed if the IRI already
         * exists in the current {@link shared.service:ontologyStateService selected ontology}. The the IRI if
         * for an entity that is not imported, an edit button is displayed that will open the
         * {@link shared.directive:editIriOverlay}. The directive accepts a method that will be called when an
         * edit of the IRI is completed. The directive is replaced by the contents of its template.
         *
         * @param {Function} onEdit A function to be called when the `editIriOverlay` is confirmed
         * @param {string} iri The IRI to be displayed and optionally edited
         * @param {boolean} readOnly Whether the IRI should be editable or not
         * @param {boolean} duplicateCheck Whether the IRI should be checked for duplicates within the selected ontology
         */
        .directive('staticIri', staticIri);

        staticIri.$inject = ['$filter', 'ontologyStateService', 'ontologyUtilsManagerService', 'modalService'];

        function staticIri($filter, ontologyStateService, ontologyUtilsManagerService, modalService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/staticIri/staticIri.directive.html',
                scope: {
                    onEdit: '&'
                },
                bindToController: {
                    iri: '=',
                    readOnly: '<',
                    duplicateCheck: '<',
                    highlightText: '<'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;

                    dvm.setVariables = function(obj) {
                        var splitIri = $filter('splitIRI')(dvm.iri);
                        dvm.iriBegin = splitIri.begin;
                        dvm.iriThen = splitIri.then;
                        dvm.iriEnd = splitIri.end;
                    }
                    dvm.showIriOverlay = function() {
                        var resolveObj = {
                            iriBegin: dvm.iriBegin,
                            iriThen: dvm.iriThen,
                            iriEnd: dvm.iriEnd,
                        };
                        if (dvm.duplicateCheck) {
                            resolveObj.customValidation = {
                                func: dvm.ontoUtils.checkIri,
                                msg: 'This IRI already exists'
                            };
                        }
                        modalService.openModal('editIriOverlay', resolveObj, $scope.onEdit);
                    }

                    $scope.$watch('dvm.iri', function() {
                        dvm.setVariables();
                    });

                    dvm.setVariables();
                }]
            }
        }
})();
