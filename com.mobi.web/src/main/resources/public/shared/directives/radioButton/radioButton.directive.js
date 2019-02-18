(function() {
    'use strict';

    radioButton.$inject = ['$timeout'];

    function radioButton($timeout) {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            bindToController: {
                bindModel: '=ngModel',
                changeEvent: '&',
                displayText: '<',
                inline: '<?',
                isDisabled: '<',
                value: '<'
            },
            controllerAs: 'dvm',
            controller: ['$scope', function($scope) {
                var dvm = this;

                dvm.onChange = function() {
                    $timeout(function() {
                        dvm.changeEvent();
                    });
                }
            }],
            templateUrl: 'shared/directives/radioButton/radioButton.directive.html'
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name radiobutton
         *
         * @description 
         * The `radioButton` module only provides the `radioButton` directive which creates
         * a radio input styled with Bootstrap classes, a custom change function, a custom 
         * disabled condition, and custom label text.
         */
        .module('radioButton', [])
        /**
         * @ngdoc directive
         * @name radioButton.directive:radiobutton
         * @scope
         * @restrict E
         * @requires $timeout
         *
         * @description 
         * `radioButton` is a directive that creates a radio input styled using the Bootstrap
         * 'radio' class, a custom on change function, a custom disabled condition, and custom 
         * label text. The value of the radio button is set using ngvalue. The directive is 
         * replaced by the content of the template.
         *
         * @param {*} bindModel The variable to bind the value of the radio button to
         * @param {*} value The value this particular radio button should have
         * @param {function} [changeEvent=undefined] A function to be called when the value of the button 
         * changes
         * @param {string} [displayText=''] Label text to display for the button
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
        .directive('radioButton', radioButton);
})();
