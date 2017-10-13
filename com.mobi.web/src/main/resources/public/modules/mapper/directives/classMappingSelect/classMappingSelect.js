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
         * @name classMappingSelect
         *
         * @description
         * The `classMappingSelect` module only provides the `classMappingSelect` directive which creates
         * a `ui-select` with all the class mappings in the current
         * {@link mapperState.service:mapperStateService#mapping mapping}.
         */
        .module('classMappingSelect', [])
        /**
         * @ngdoc directive
         * @name classMappingSelect.directive:classMappingSelect
         * @scope
         * @restrict E
         * @requires mapperState.service:mapperStateService
         * @requires mappingManager.service:mappingManagerService
         * @requires ontologyManager.service:ontologyManagerService
         *
         * @description
         * `classMappingSelect` is a directive that creates a div with `ui-select` containing all the class
         * mappings in the current {@link mapperState.service:mapperStateService#mapping mapping}.
         * The model for the `ui-select` will be the id of the selected class mapping. The directive is
         * replaced by the contents of its template.
         *
         * @param {Function} onChange A method to be called when the selected class mapping changes
         * @param {string} bindModel The id of the selected class mapping
         */
        .directive('classMappingSelect', classMappingSelect);

        classMappingSelect.$inject = ['mappingManagerService', 'utilService', 'mapperStateService'];

        function classMappingSelect(mappingManagerService, utilService, mapperStateService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                	onChange: '&'
                },
                bindToController: {
                    bindModel: '=ngModel'
                },
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.mm = mappingManagerService;
                    dvm.util = utilService;
                },
                templateUrl: 'modules/mapper/directives/classMappingSelect/classMappingSelect.html'
            }
        }
})();
