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
     * @name shared.component:checkbox
     * @requires $timeout
     *
     * @description 
     * `checkbox` is a component that creates a checkbox styled using the Bootstrap "checkbox" class, a custom disabled
     * condition, and custom label text. The true and false values of the checkbox will always be the boolean true and
     * false values. The `bindModel` variable is one way bound so the provided `changeEvent` function is expected to
     * update the value of `bindModel`.
     *
     * @param {boolean} bindModel the variable to bind the value of the checkbox to
     * @param {function} changeEvent a function to be called when the value of the checkbox changes. Should
     * update the value of `bindModel`. Expects an argument called `value`
     * @param {string} [displayText=''] label text to display for the checkbox
     * @param {boolean} [isDisabledWhen=false] when the checkbox should be disabled
     */
    const checkboxComponent = {
        templateUrl: 'shared/components/checkbox/checkbox.component.html',
        bindings: {
            bindModel: '<',
            changeEvent: '&',
            displayText: '<',
            inline: '<?',
            isDisabled: '<'
        },
        controllerAs: 'dvm',
        controller: checkboxComponentCtrl
    };

    checkboxComponentCtrl.$inject = ['$timeout'];

    function checkboxComponentCtrl($timeout) {
        var dvm = this;

        dvm.onChange = function() {
            $timeout(function() {
                dvm.changeEvent({value: dvm.bindModel});
            });
        }
    }

    angular.module('shared')
        .component('checkbox', checkboxComponent);
})();