(function() {
    'use strict';

    function samePassword() {
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: {
                password: "=samePassword"
            },
            link: function(scope, el, attrs, ctrl) {
                ctrl.$validators.samePassword = function(modelValue, viewValue) {
                    var value = modelValue || viewValue;
                    if (ctrl.$isEmpty(value)) {
                        return true;
                    }
                    return value === scope.password;
                };

                scope.$watch("password", function() {
                    ctrl.$validate();
                });
            }
        }
    }
    function passwordConfirmInput() {
        return {
            restrict: 'E',
            require: '^form',
            replace: true,
            controllerAs: 'dvm',
            scope: {
                password: '=',
                confirmedPassword: '=?',
                label: '<'
            },
            link: function(scope, el, attrs, form) {
                scope.form = form;
                scope.required = attrs.hasOwnProperty('required');
            },
            controller: function() {
                var dvm = this;
            },
            templateUrl: 'shared/directives/passwordConfirmInput/passwordConfirmInput.directive.html'
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name passwordConfirmInput
         *
         * @description
         * The `passwordConfirmInput` module provides the `passwordConfirmInput` directive, which
         * creates two password inputs whose values much match, and the `samePassword` directive,
         * which is used for testing whether the values of the two password inputs match.
         */
        .module('passwordConfirmInput', [])
        /**
         * @ngdoc directive
         * @name passwordConfirmInput.directive:passwordConfirmInput
         * @scope
         * @restrict E
         *
         * @description
         * `passwordConfirmInput` is a directive that creates two password inputs with validation
         * to make sure the values of the inputs match each other. The second input is required if
         * the first input has a value, but the first can also be optionally set to required as well.
         * The directive is replaced by the contents of its template.
         *
         * @param {string} password the value to bind to the first password input
         * @param {string} [confirmedPassword=undefined] the value to bind to the second password input
         * @param {string} label the label for the first password input
         */
        .directive('passwordConfirmInput', passwordConfirmInput)
        /**
         * @ngdoc directive
         * @name passwordConfirmInput.directive:samePassword
         * @restrict A
         *
         * @description
         * `samePassword` is a directive which tests whether the ngModel value is the same as the
         * evaluated value of the password variable. It requires the parent element to have an ngModel.
         * If the ngModel value does not match the evaluated value, it sets the samePassword validity
         * of the parent element to false.
         */
        .directive('samePassword', samePassword);
})();
