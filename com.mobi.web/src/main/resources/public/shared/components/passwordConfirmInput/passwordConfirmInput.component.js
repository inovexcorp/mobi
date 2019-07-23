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
     * @name shared.component:passwordConfirmInput
     *
     * @description
     * `passwordConfirmInput` is a component that creates two password inputs with validation to make sure the values of
     * the inputs match each other. The second input is required if the first input has a value, but the first can also
     * be optionally set to required as well. The value of the first input is bound to `password`, but only one way. The
     * provided `changeEvent` function is expected to update the value of `password`. The second input can be optionally
     * bound to the provided `confirmedPassword` variable. This is mainly done for clearing the form after a
     * "submission" event. 
     *
     * @param {string} password The value to bind to the first password input
     * @param {string} confirmedPassword The optional variable to bind the value of the confirm password field to
     * @param {Function} changeEvent A function to be called when the value of the password field is changed. Should
     * update the value of `password`. Expects an argument called `value`.
     * @param {string} label The label for the first password input
     * @param {boolean} required Whether the password field is required
     * @param {boolean} [isDisabledWhen=false] When the inputs should be disabled
     */
    const passwordConfirmInputComponent = {
        templateUrl: 'shared/components/passwordConfirmInput/passwordConfirmInput.component.html',
        require: {
            form: '^form'
        },
        bindings: {
            password: '<',
            confirmedPassword: '<',
            changeEvent: '&',
            label: '<',
            required: '@',
            isDisabledWhen: '<'
        },
        controllerAs: 'dvm',
        controller: passwordConfirmInputComponentCtrl
    };

    function passwordConfirmInputComponentCtrl() {
        var dvm = this;

        dvm.$onInit = function() {
            dvm.isRequired = dvm.required !== undefined;
        }
    }

    angular.module('shared')
        .component('passwordConfirmInput', passwordConfirmInputComponent);
})();
