(function () {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name usersList
         *
         * @description
         * The `usersList` module only provides the `usersList` directive which creates
         * an interactable list of all {@link userManager.service:userManagerService#users users}.
         */
        .module('usersList', [])
        /**
         * @ngdoc directive
         * @name usersList.directive:usersList
         * @scope
         * @restrict E
         * @requires userManager.service:userManagerService
         * @requires userState.service:userStateService
         * @requires loginManager.service:loginManagerService
         *
         * @description
         * `usersList` is a directive that creates a <ul> containing the
         * {@link userManager.service:userManagerService#users users} list. Users can only be edited
         * by admin users. The directive is replaced by the contents of its template.
         */
        .directive('usersList', usersList);

    usersList.$inject = ['userStateService', 'userManagerService', 'loginManagerService'];

    function usersList(userStateService, userManagerService, loginManagerService) {
        return {
            restrict: 'E',
            controllerAs: 'dvm',
            replace: true,
            scope: {},
            controller: function() {
                var dvm = this;
                dvm.state = userStateService;
                dvm.um = userManagerService;
                dvm.lm = loginManagerService;

                dvm.onClick = function(user) {
                    dvm.state.selectedUser = user;
                }
            },
            templateUrl: 'user-management/directives/usersList/usersList.directive.html'
        };
    }
})();
