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
         * @name editMappingForm
         *
         * @description
         * The `editMappingForm` module only provides the `editMappingForm` directive which creates
         * a form with different sections for editing the current
         * {@link mapperState.service:mapperStateService#mapping mapping}.
         */
        .module('editMappingForm', [])
        /**
         * @ngdoc directive
         * @name editMappingForm.directive:editMappingForm
         * @scope
         * @restrict E
         * @requires mapperState.service:mapperStateService
         * @requires util.service:utilService
         *
         * @description
         * `editMappingForm` is a directive that creates a div with a section to view and edit the
         * current {@link mapperState.service:mapperStateService#mapping mapping} configuration,
         * a section to {@link classMappingSelect.directive:classMappingSelect select a class mapping}
         * and delete the selected class mapping, and
         * {@link classMappingDetails.directive:classMappingDetails class mapping details}. The
         * directive is replaced by the contents of its template.
         */
        .directive('editMappingForm', editMappingForm);

        editMappingForm.$inject = ['mapperStateService', 'utilService'];

        function editMappingForm(mapperStateService, utilService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = mapperStateService;
                    dvm.util = utilService;
                },
                templateUrl: 'modules/mapper/directives/editMappingForm/editMappingForm.html'
            }
        }
})();
