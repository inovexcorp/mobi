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
     * @name shared.component:textArea
     *
     * @description
     * `textArea` is a component which creates a Bootstrap "form-group" div with a textarea element and a
     * {@link shared.component:customLabel}. The `customLabel` uses the provided `displayText` and `mutedText`
     * for display. The textarea is bound to the passed in `bindModel` variable, but only one way. The provided
     * `changeEvent` is expected to update the value of the `bindModel`. The name of the textarea input is configurable
     * along with whether it is required. The textarea can optionally be focused on rendering as well.
     *
     * @param {string} bindModel The variable to bind the value of the textarea to
     * @param {Function} changeEvent A function to be called when the value of the textarea changes. Expects an
     * argument called `value` and should update the value of `bindModel`.
     * @param {string} [displayText=''] The text to be displayed in the `customLabel`
     * @param {string} [mutedText=''] The muted text to be displayed in the `customLabel`
     * @param {boolean} [required=false] Whether the textarea is required
     * @param {string} textAreaName The name of the textarea input
     * @param {boolean} Whether the textarea should be focused once rendered
     */
    const textAreaComponent = {
        templateUrl: 'shared/components/textArea/textArea.component.html',
        bindings: {
            bindModel: '<',
            changeEvent: '&',
            displayText: '<',
            mutedText: '<',
            required: '<',
            textAreaName: '<',
            isFocusMe: '<?'
        },
        controllerAs: 'dvm',
        controller: textAreaComponentCtrl
    };

    function textAreaComponentCtrl() {}

    angular.module('shared')
        .component('textArea', textAreaComponent);
})();
