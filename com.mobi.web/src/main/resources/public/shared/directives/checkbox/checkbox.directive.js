(function() {
    'use strict';

    checkbox.$inject = ['$timeout'];

    function checkbox($timeout) {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            bindToController: {
                bindModel: '=ngModel',
                changeEvent: '&',
                displayText: '<',
                inline: '<?',
                isDisabled: '<'
            },
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;

                dvm.onChange = function() {
                    $timeout(function() {
                        dvm.changeEvent();
                    });
                }
            },
            templateUrl: 'shared/directives/checkbox/checkbox.directive.html'
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name checkbox
         */
        .module('checkbox', [])
        /**
         * @ngdoc directive
         * @name checkbox.directive:checkbox
         * @scope
         * @restrict E
         * @requires $timeout
         *
         * @description 
         * `checkbox` is a directive that creates a checkbox styled using the Bootstrap "checkbox"
         * class, a custom on change function, a custom disabled condition, and custom label text.
         * The true and false values of the checkbox will always be the boolean true and false values.
         * The directive is replaced by the content of the template.
         *
         * @param {*} bindModel the variable to bind the value of the checkbox to
         * @param {function=undefined} changeEvent a function to be called when the value of the checkbox 
         * changes
         * @param {string=''} displayText label text to display for the checkbox
         * @param {boolean=false} isDisabledWhen when the checkbox should be disabled
         */
        .directive('checkbox', checkbox);
})();