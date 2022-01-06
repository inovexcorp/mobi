/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
const template = require('./unmaskPassword.component.ajs.html');

/**
 * @ngdoc component
 * @name shared.component:unmaskPassword
 *
 * @description
 * `unmask-password` is a component which creates password input with a button to unmask the value for a user to
 * validate their entry before submitting the parent form.
 *
 * @param {string} password The value to bind to the password input
 * @param {string} [inputName=''] The name to give the password input
 * @param {Function} changeEvent A function to be called when the value of the password field is changed. Should
 * update the value of `password`. Expects an argument called `value`.
 * @param {string} label The label for the first password input
 * @param {boolean} [isInvalid=false] Whether the password input is invalid
 * @param {boolean} [isValid=false] Whether the password input is valid
 * @param {boolean} required Whether the password field is required
 * @param {boolean} [isDisabledWhen=false] When the input should be disabled
 */
const unmaskPasswordComponent = {
    template,
    require: {
        form: '^form'
    },
    bindings: {
        password: '<',
        inputName: '<',
        changeEvent: '&',
        label: '<',
        required: '@',
        isInvalid: '<',
        isValid: '<',
        isDisabledWhen: '<'
    },
    controllerAs: 'dvm',
    controller: unmaskPasswordComponentCtrl
};

function unmaskPasswordComponentCtrl() {
    var dvm = this;

    dvm.$onInit = function() {
        dvm.isRequired = dvm.required !== undefined;
    }
}

export default unmaskPasswordComponent;
