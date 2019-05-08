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
     * @name shared.component:textInput
     *
     * @description
     * `textInput` is a component that creates a Bootstrap "form-group" div with a text input element and a
     * {@link shared.component:customLabel customLabel}. The `customLabel` uses the provided `displayText` and
     * `mutedText` for display. The text input is bound to the passed `bindModel` variable, but only one way. The 
     * provided `changeEvent` is expected to update the value of the `bindModel`. The name of the input is configurable 
     * along with whether it is required. The input can optionally be focused on rendering as well. The `isInvalid` and
     * `isValid` parameters provide a way to change the styling based on the validity of the input.
     *
     * @param {string} bindModel The variable to bind the value of the text input field to
     * @param {Function} changeEvent A function to be called when the value of the text input field changes. Expects an
     * argument called `value` and should update the value of `bindModel`.
     * @param {string} [displayText=''] The text to be displayed in the customLabel
     * @param {string} [mutedText=''] The muted text to be displayed in the customLabel
     * @param {boolean} [required=false] Whether the text input should be required
     * @param {string} [inputName=''] The name to give the text input
     * @param {boolean} [isInvalid=false] Whether the text input is invalid
     * @param {boolean} [isValid=false] Whether the text input is valid
     * @param {boolean} isFocusMe Whether the text input should be focused once rendered
     */
    const textInputComponent = {
        templateUrl: 'shared/components/textInput/textInput.component.html',
        bindings: {
            bindModel: '<',
            changeEvent: '&',
            displayText: '<',
            mutedText: '<',
            required: '<',
            inputName: '<',
            isInvalid: '<',
            isValid: '<',
            isFocusMe: '<?'
        },
        controllerAs: 'dvm',
        controller: textInputComponentCtrl
    };

    function textInputComponentCtrl() {}

    angular.module('shared')
        .component('textInput', textInputComponent);
})();
