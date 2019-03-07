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
         * @name permissionsInput
         *
         * @description
         * The `permissionsInput` module only provides the `permissionsInput` directive
         * which creates a collections of {@link shared.component:checkbox checkboxes} for
         * changing a user or group's permissions and roles.
         */
        .module('permissionsInput', [])
        /**
         * @ngdoc directive
         * @name permissionsInput.directive:permissionsInput
         * @scope
         * @restrict E
         *
         * @description
         * `permissionsInput` is a directive that creates an collection of
         * {@link shared.component:checkbox checkboxes} for changing a user or group's permissions and roles.
         * It takes the state of a user or group's roles from the passed roles object whose keys are the roles and
         * whose values are booleans indicating whether the user/group in question has that role. The directive
         * is replaced by the contents of its template.
         */
        .directive('permissionsInput', permissionsInput);

        function permissionsInput() {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    roles: '=',
                    isDisabledWhen: '<',
                    onChange: '&'
                },
                templateUrl: 'user-management/directives/permissionsInput/permissionsInput.directive.html'
            }
        }
})();
