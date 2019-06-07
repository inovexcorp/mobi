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
     * @name shared.component:emailInput
     *
     * @description
     * `emailInput` is a component that create an email input field with a
     * {@link shared.component:customLabel customLabel}. The input field is bound to the passed `bindModel`, but only
     * one way. The provided `changeEvent` function is expected to update the `bindModel` value. The component also
     * accepts has several optional customization variables.
     *
     * @param {string} bindModel The variable to bind the value of the input field to
     * @param {function} changeEvent A function to be called when the value of the text input field changes. Should
     * update the value of `bindModel`. Expects an argument called `value`
     * @param {string} [mutedText=''] The muted text to be displayed in the `customLabel`
     * @param {boolean} [required=false] Whether the input should be required
     * @param {string} [inputName=''] The name to give the text input
     * @param {boolean} [isInvalid=false] Whether the text input is invalid
     * @param {boolean} [isValid=false] Whether the text input is valid
     * @param {boolean} [isDisabledWhen=false] When the input should be disabled
     */
    const emailInputComponent = {
        templateUrl: 'shared/components/emailInput/emailInput.component.html',
        bindings: {
            bindModel: '<',
            changeEvent: '&',
            mutedText: '<',
            required: '<',
            inputName: '<',
            isInvalid: '<',
            isValid: '<',
            isDisabledWhen: '<'
        },
        controllerAs: 'dvm',
        controller: emailInputComponentCtrl
    };

    function emailInputComponentCtrl() {}

    angular.module('shared')
        .component('emailInput', emailInputComponent);
})();
