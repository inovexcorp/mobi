(function() {
    'use strict';

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
         * @param {function=undefined} changeEvent A function to be called when the value of the button 
         * changes
         * @param {string=''} displayText Label text to display for the button
         * @param {boolean=false} isDisabledWhen When the radio button should be disabled.
         *
         * @usage
         * <!-- With defaults -->
         * <radio-button ng-model="variableName" value="'Test1'"></radio-button>
         *
         * <!-- With all params -->
         * <radio-button ng-model="variableName" value="'Test2'" change-event="console.log('Value changed')" display-text="'This is a label'" is-disabled-when="false"></radio-button>
         */
        .directive('radioButton', radioButton);

        radioButton.$inject = ['$timeout'];

        function radioButton($timeout) {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    bindModel: '=ngModel',
                    value: '=',
                    changeEvent: '&',
                    displayText: '=',
                    isDisabledWhen: '='
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;

                    dvm.onChange = function() {
                        $timeout(function() {
                            $scope.changeEvent();                            
                        });
                    }
                }],
                templateUrl: 'directives/radioButton/radioButton.html'
            }
        }
})();
