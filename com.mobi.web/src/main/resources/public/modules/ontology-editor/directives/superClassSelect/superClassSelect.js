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
         * @name superClassSelect
         *
         * @description
         * The `superClassSelect` module only provides the `superClassSelect` directive which creates a collapsible
         * {@link classSelect.directive:classSelect} for super classes.
         */
        .module('superClassSelect', [])
        /**
         * @ngdoc directive
         * @name superClassSelect.directive:superClassSelect
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires util.service:utilService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         *
         * @description
         * `classSelect` is a directive that creates a collapsible {@link classSelect.directive:classSelect} for
         * selecting the super classes of a class. When collapsed and then reopened, all previous values are cleared.
         * The directive is replaced by the contents of its template.
         *
         * @param {string[]} values The selected class IRIs for super classes
         */
        .directive('superClassSelect', superClassSelect);

        superClassSelect.$inject = ['ontologyStateService', 'utilService', 'ontologyUtilsManagerService'];

        function superClassSelect(ontologyStateService, utilService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/superClassSelect/superClassSelect.html',
                scope: {},
                bindToController: {
                    values: '='
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.util = utilService;
                    dvm.isShown = false;
                    dvm.iris = _.map(dvm.values, '@id');

                    dvm.show = function() {
                        dvm.isShown = true;
                    }
                    dvm.hide = function() {
                        dvm.isShown = false;
                        dvm.iris = [];
                    }

                    $scope.$watch(() => dvm.iris.length, () => dvm.values = _.map(dvm.iris, iri => ({'@id': iri})));
                }]
            }
        }
})();