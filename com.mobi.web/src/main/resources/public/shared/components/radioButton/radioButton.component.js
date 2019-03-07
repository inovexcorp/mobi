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
     * @name shared.component:radiobutton
     * @requires $timeout
     *
     * @description 
     * `radioButton` is a directive that creates a radio input styled using the Bootstrap 'radio' class, a custom
     * disabled condition, custom label text, and whether the radio button is supposed to be inline with others. The
     * value of the radio button to be set when selected is set using `ngValue`. The value of the radio button is bound
     * to `bindModel`, but is one way bound. The provided `changeEvent` function is expected to update the value of
     * `bindModel`.
     *
     * @param {*} bindModel The variable to bind the value of the radio button to
     * @param {*} value The value this particular radio button should have
     * @param {function} changeEvent A function to be called when the value of the button changes. Should 
     * update the value of `bindModel`. Expects an argument called `value`
     * @param {string} [displayText=''] Label text to display for the button
     * @param {boolean} [inline=false] Whether the radio button should be inline with others
     * @param {boolean} [isDisabledWhen=false] When the radio button should be disabled.
     *
     * @example
     * <example module="radioButtonExample" deps="radioButton,templates">
     *     <file name="index.html">
     *         <div ng-controller="ctrl as vm">
     *             <label><input type="checkbox" ng-model="disabled"/> Disabled</label>
     *             <radio-button ng-model="value" value="true" display-text="'This a test'" is-disabled-when="disabled"></radio-button>
     *             <pre>{{value}}</pre>
     *             <button ng-click="vm.reset()">Reset</button>
     *         </div>
     *     </file>
     *     <file name="script.js">
     *         angular.module('radioButtonExample', ['radioButton', 'templates'])
     *             .controller('ctrl', ['$scope', function($scope) {
     *                 var vm = this;
     *                 $scope.value = false;
     *                 vm.reset = function() {
     *                     $scope.value = false;
     *                 }
     *             }]);
     *     </file>
     * </example>
     */
    const radioButtonComponent = {
        templateUrl: 'shared/components/radioButton/radioButton.component.html',
         bindings: {
            bindModel: '<',
            value: '<',
            changeEvent: '&',
            displayText: '<',
            inline: '<?',
            isDisabled: '<',
        },
        controllerAs: 'dvm',
        controller: radioButtonComponentCtrl
    };

    radioButtonComponentCtrl.$inject = ['$timeout'];

    function radioButtonComponentCtrl($timeout) {
        var dvm = this;

        dvm.onChange = function() {
            $timeout(function() {
                dvm.changeEvent({value: dvm.bindModel});
            });
        }
    }

    angular.module('shared')
        .component('radioButton', radioButtonComponent);
})();
