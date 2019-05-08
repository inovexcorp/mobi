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

    /**
     * @ngdoc component
     * @name user-management.component:permissionsInput
     *
     * @description
     * `permissionsInput` is a component that creates an collection of {@link shared.component:checkbox checkboxes} for
     * changing a user or group's permissions and roles. It takes the state of a user or group's roles from the provided
     * `roles` object whose keys are the roles and whose values are booleans indicating whether the user/group in
     * question has that role. The `roles` object is only bound one way so the provided `changeEvent` function is
     * expected to update its value.
     * 
     * @param {Object} roles An object representing a user/group's roles with the keys as role IRIs and values as
     * booleans
     * @param {boolean} isDisabledWhen Whether the permissions should be disabled
     * @param {Function} changeEvent A function to be called whenever a role value changes. Should update the value of 
     * `roles`. Expects an argument called `value`.
     */
    const permissionsInputComponent = {
        templateUrl: 'user-management/components/permissionsInput/permissionsInput.component.html',
        bindings: {
            roles: '<',
            isDisabledWhen: '<',
            changeEvent: '&'
        },
        controllerAs: 'dvm',
        controller: permissionsInputComponentCtrl
    };

    function permissionsInputComponentCtrl() {
        var dvm = this;

        dvm.onChange = function(value) {
            dvm.roles.admin = value;
            dvm.changeEvent({value: dvm.roles});
        }
    }

    angular.module('user-management')
        .component('permissionsInput', permissionsInputComponent);
})();
