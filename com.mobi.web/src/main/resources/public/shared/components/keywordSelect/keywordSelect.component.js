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
     * @name shared.component:keywordSelect
     * 
     * @description
     * `keywordSelect` is a component that creates a `ui-select` for editing keywords on an entity in Mobi. The label
     * for the select shows as Optional. The value of the select is bound to `bindModel`, but only one way. The provided
     * `changeEvent` function is expected to update the value of `bindModel`.
     * 
     * @param {string[]} bindModel An array of strings representing keywords that are bound to the `ui-select`
     * @param {Function} changeEvent A function that will be called when the value of the `ui-select` changes. Should
     * update the value of `bindModel`. Expects an argument called `value`.
     * @param {boolean} [hideLabel=false] Whether the label should be hidden.
     * @param {string} isFocusMe Whether the `ui-select` should be focused once rendered. The presence of the attribute
     * is enough to set it.
     */
    const keywordSelectComponent = {
        templateUrl: 'shared/components/keywordSelect/keywordSelect.component.html',
        bindings: {
            bindModel: '<',
            changeEvent: '&',
            hideLabel: '<',
            isFocusMe: '@'
        },
        controllerAs: 'dvm',
        controller: keywordSelectComponentCtrl
    };

    function keywordSelectComponentCtrl() {
        var dvm = this;
        dvm.keywordList = [];

        dvm.onChange = function() {
            dvm.changeEvent({value: dvm.bindModel});
        }
    }

    angular.module('shared')
        .component('keywordSelect', keywordSelectComponent);

})();
