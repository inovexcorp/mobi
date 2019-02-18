(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name groupsList
         *
         * @description
         * The `groupsList` module provides the `groupsList` directive which creates an interactable
         * list of all {@link userManager.service:userManagerService#groups groups}, and the
         * `filterGroups` filter which filters a list of groups based on a
         * {@link userState.service:userStateService#filteredGroupList state variable}.
         */
        .module('groupsList', [])
        /**
         * @ngdoc directive
         * @name groupsList.directive:groupsList
         * @scope
         * @restrict E
         * @requires userManager.service:userManagerService
         * @requires userState.service:userStateService
         * @requires loginManager.service:loginManagerService
         *
         * @description
         * `groupsList` is a directive that creates a <ul> containing different subsets of the
         * {@link userManager.service:userManagerService#groups groups} list depending on whether
         * the list should be filtered. Groups can only be edited by admin users. The directive is
         * replaced by the contents of its template.
         */
        .directive('groupsList', groupsList)
        /**
         * @ngdoc filter
         * @name groupsList.filter:filterGroups
         * @kind function
         *
         * @description
         * Takes an array of group Objects from the
         * {@link userManager.service:userManagerService userManagerService} and if the state
         * says that the
         * {@link userState.service:userStateService#filteredGroupList list should be filtered},
         * filters the list of groups to only those that the
         * {@link loginManager.service:loginManagerService#currentUser current User} is a member
         * of.
         *
         * @param {Object[]} groupList The array of group Objects
         * @returns {Object[]} Either the full group list or only the groups the current user is
         * a member of
         */
        .filter('filterGroups', filterGroups);

        filterGroups.$inject = ['userStateService', 'loginManagerService'];

        function filterGroups(userStateService, loginManagerService) {
            return function(groupList) {
                var arr = groupList;
                if (userStateService.filteredGroupList) {
                    arr = _.filter(arr, group => _.includes(group.members, loginManagerService.currentUser));
                }
                return arr;
            }
        }

        groupsList.$inject = ['userStateService', 'userManagerService'];

        function groupsList(userStateService, userManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.state = userStateService;
                    dvm.um = userManagerService;

                    dvm.onClick = function(group) {
                        dvm.state.selectedGroup = group;
                    }
                },
                templateUrl: 'user-management/directives/groupsList/groupsList.directive.html'
            }
        }
})();
