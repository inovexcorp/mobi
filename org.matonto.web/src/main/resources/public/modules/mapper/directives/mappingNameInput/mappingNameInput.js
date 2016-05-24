(function() {
    'use strict';

    angular
        .module('mappingNameInput', ['mappingManager'])
        .directive('mappingNameInput', mappingNameInput)
        .directive('uniqueName', uniqueName);

        uniqueName.$inject = ['$parse', 'mappingManagerService'];

        function uniqueName($parse, mappingManagerService) {
            return {
                require: 'ngModel',
                link: function(scope, el, attrs, ctrl) {
                    var previousMappings = mappingManagerService.previousMappingNames;
                    var getter = $parse(attrs.ngModel);
                    var value = getter(scope);
                    ctrl.$validators.uniqueName = function(modelValue, viewValue) {
                        if (ctrl.$isEmpty(modelValue)) {
                            return true;
                        }
                        return viewValue === value || previousMappings.indexOf(viewValue) < 0;
                    }
                }
            }
        }
        function mappingNameInput() {
            return {
                restrict: 'E',
                require: '^form',
                replace: true,
                controllerAs: 'dvm',
                scope: {
                    name: '=',
                    required: '=?',
                    isActive: '=?',
                    focusEvent: '&'
                },
                link: function(scope, el, attrs, form) {
                    scope.form = form;
                    scope.isActive = angular.isDefined(scope.isActive) ? scope.isActive : true;
                    scope.required = angular.isDefined(scope.required) ? scope.required : true;
                },
                controller: ['REGEX', function(REGEX) {
                    var dvm = this;
                    dvm.localNamePattern = REGEX.LOCALNAME;
                }],
                templateUrl: 'modules/mapper/directives/mappingNameInput/mappingNameInput.html'
            }
        }
})();
