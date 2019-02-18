(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name permissionsInput
         *
         * @description
         * The `permissionsInput` module only provides the `permissionsInput` directive
         * which creates a collections of {@link checkbox.directive:checkbox checkboxes} for
         * changing a user or group's permissions and roles.
         */
        .module('permissionsInput', [])
        /**
         * @ngdoc directive
         * @name permissionsInput.directive:permissionsInput
         * @scope
         * @restrict E
         *
         * @description
         * `permissionsInput` is a directive that creates an collection of
         * {@link checkbox.directive:checkbox checkboxes} for changing a user or group's permissions and roles.
         * It takes the state of a user or group's roles from the passed roles object whose keys are the roles and
         * whose values are booleans indicating whether the user/group in question has that role. The directive
         * is replaced by the contents of its template.
         */
        .directive('permissionsInput', permissionsInput);

        function permissionsInput() {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    roles: '=',
                    isDisabledWhen: '<',
                    onChange: '&'
                },
                templateUrl: 'user-management/directives/permissionsInput/permissionsInput.directive.html'
            }
        }
})();
