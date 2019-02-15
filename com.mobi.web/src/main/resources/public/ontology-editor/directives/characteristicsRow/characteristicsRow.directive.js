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
         * @name characteristicsRow
         *
         * @description
         * The `characteristicsRow` module only provides the `characteristicsRow` directive which creates a
         * Bootstrap `.row` for displaying the {@link characteristicsBlock.directive:characteristicsBlock}.
         */
        .module('characteristicsRow', [])
        /**
         * @ngdoc directive
         * @name characteristicsRow.directive:characteristicsRow
         * @scope
         * @restrict E
         * @requires prefixes.service:prefixes
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         *
         * @description
         * `characteristicsRow` is a directive that creates a Bootstrap `.row` that displays the
         * {@link characteristicsBlock.directive:characteristicsBlock} depending on whether the
         * {@link ontologyState.service:ontologyStateService selected entity} is a object or data property.
         * The directive is replaced by the contents of its template.
         */
        .directive('characteristicsRow', characteristicsRow);

        characteristicsRow.$inject = ['ontologyManagerService', 'ontologyStateService'];

        function characteristicsRow(ontologyManagerService, ontologyStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/characteristicsRow/characteristicsRow.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                }
            }
        }
})();
