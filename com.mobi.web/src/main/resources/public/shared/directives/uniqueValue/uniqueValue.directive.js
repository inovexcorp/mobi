(function () {
    'use strict';

    function uniqueValue() {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, el, attrs, ctrl) {
                ctrl.$validators.uniqueValue = function(modelValue, viewValue) {
                    var value = modelValue || viewValue;
                    if (ctrl.$isEmpty(value)) {
                        return true;
                    }
                    return !_.includes(scope.$eval(attrs.uniqueValue), value);
                }
            }
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name uniqueValue
         *
         * @description
         * The `uniqueValue` module only provides the `uniqueValue` directive which tests whether a value
         * is already used in the provided array.
         */
        .module('uniqueValue', [])
        /**
         * @ngdoc directive
         * @name uniqueValue.directive:uniqueValue
         * @restrict A
         *
         * @description
         * `uniqueValue` is a directive which tests whether the ngModel value is in the passed list of values.
         * It requires the parent element to have an ngModel. If the ngModel value is within the passed array,
         * it sets the uniqueValue validity of the parent element to false.
         */
        .directive('uniqueValue', uniqueValue);
})();
