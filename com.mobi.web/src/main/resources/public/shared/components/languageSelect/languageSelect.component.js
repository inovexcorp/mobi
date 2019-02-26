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
     * @name shared.component:languageSelect
     * @requires shared.service:propertyManagerService
     *
     * @description
     * `languageSelect` is a component which provides options for a formatted ui-select for picking language tags. The
     * select is bound to dvm.bindModel, but only one way. The provided `changeEvent` function is expected to update the
     * value of `bindModel`. The component provides an option to have a clear selection button. If the button is not
     * enabled, the choice defaults to English.
     *
     * @param {string} bindModel The variable to bind the value of the language to
     * @package {Function} changeEvent A function that is called when the value of the select changes. Should update the
     * value of `bindModel`. Expects an argument called `value`
     * @param {boolean} disableClear A boolean that indicates if the clear button should be disabled
     * @param {boolean} required Whether the select is a required field. The presence of the attribute is enough to set
     * the value to true
     */
    const languageSelectComponent = {
        templateUrl: 'shared/components/languageSelect/languageSelect.component.html',
        bindings: {
            bindModel: '<',
            changeEvent: '&',
            disableClear: '<',
            required: '@'
        },
        controllerAs: 'dvm',
        controller: languageSelectComponentCtrl
    };

    languageSelectComponentCtrl.$inject = ['propertyManagerService'];

    function languageSelectComponentCtrl(propertyManagerService) {
        var dvm = this;
        var pm = propertyManagerService;
        dvm.languages = [];

        dvm.$onInit = function() {
            dvm.languages = pm.languageList;
            dvm.isRequired = dvm.required !== undefined;

            if (dvm.disableClear && typeof dvm.bindModel === 'undefined') {
                dvm.changeEvent({value: 'en'});
            }
        }
        dvm.clear = function() {
            dvm.changeEvent({value: undefined});
        }
    }

    angular.module('shared')
        .component('languageSelect', languageSelectComponent);
})();
