(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name userManagementTabset
         *
         * @description
         * The `userManagementTabset` module only provides the `userManagementTabset` directive
         * which creates the main {@link tabset.directive:tabset tabset} for the user management
         * area.
         */
        .module('userManagementTabset', [])
        /**
         * @ngdoc directive
         * @name userManagementTabset.directive:userManagementTabset
         * @scope
         * @restrict E
         * @requires userState.service:userStateService
         *
         * @description
         * `userManagementTabset` is a directive which creates a {@link tabset.directive:tabset tabset} with different
         * pages depending on whether the {@link usersPage.directive:usersPage users},
         * {@link groupsPage.directive:groupsPage groups}, or
         * {@link permissionsPage.directive:permissionsPage permissions} of Mobi should be shown. The directive is
         * replaced by the contents of its template.
         */
        .directive('userManagementTabset', userManagementTabset);

        userManagementTabset.$inject = ['userStateService'];

        function userManagementTabset(userStateService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'user-management/directives/userManagementTabset/userManagementTabset.directive.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.state = userStateService;
                }
            }
        }
})();
