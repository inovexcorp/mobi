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
     * @name shared.component:branchSelect
     * @requires shared.service:utilService
     *
     * @description
     * `branchSelect` is a component which creates a Bootstrap form-group div containing a `ui-select` to select a
     * Branch JSON-LD object from within the provided array of Branch JSON-LD objects. The selected Branch is bound to
     * `bindModel`, but only one way. The provided `changeEvent` function is expected to update the value of
     * `bindModel`. The select can be disabled and set to be required using parameters.
     *
     * @param {Object} bindModel The variable to bind the value of the select field to
     * @param {Function} changeEvent A function to call when the value of the select is changed. Should update the value
     * of `bindModel`. Expects an argument called `value`.
     * @param {Object[]} branches An array of JSON-LD objects representing Branches
     * @param {boolean} required An expression that determines whether the select is required
     * @param {boolean} isDisabledWhen An expression that determines whether the select is disabled
     */
    const branchSelectComponent = {
        templateUrl: 'shared/components/branchSelect/branchSelect.component.html',
        bindings: {
            bindModel: '<',
            changeEvent: '&',
            branches: '<',
            required: '<',
            isDisabledWhen: '<',
        },
        controllerAs: 'dvm',
        controller: branchSelectComponentCtrl
    };

    branchSelectComponentCtrl.$inject = ['$timeout', 'utilService'];

    function branchSelectComponentCtrl($timeout, utilService) {
        var dvm = this;
        dvm.util = utilService;

        dvm.onChange = function() {
            $timeout(function() {
                dvm.changeEvent({value: dvm.bindModel});
            });
        }
    }

    angular.module('shared')
        .component('branchSelect', branchSelectComponent);
})();
