/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
(function () {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name editGroupInfoOverlay
         *
         * @description
         * The `editGroupInfoOverlay` module only provides the `editGroupInfoOverlay` directive which creates
         * an overlay for changing the {@link userState.service:userStateService#selectedGroup selected group's}
         * information in Mobi.
         */
        .module('editGroupInfoOverlay', [])
        /**
         * @ngdoc directive
         * @name editGroupInfoOverlay.directive:editGroupInfoOverlay
         * @scope
         * @restrict E
         * @requires userManager.service:userManagerService
         * @requires userState.service:userStateService
         *
         * @description
         * `editGroupInfoOverlay` is a directive that creates an overlay with a form to change the
         * {@link userState.service:userStateService#selectedGroup selected group's} information in Matonto. The
         * form contains a field to edit the group's description. The directive is replaced by the contents of
         * its template.
         */
        .directive('editGroupInfoOverlay', editGroupInfoOverlay);

    editGroupInfoOverlay.$inject = ['userStateService', 'userManagerService'];

    function editGroupInfoOverlay(userStateService, userManagerService) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {},
            controller: function() {
                var dvm = this;
                dvm.state = userStateService;
                dvm.um = userManagerService;
                dvm.newGroup = angular.copy(dvm.state.selectedGroup);

                dvm.set = function() {
                    dvm.um.updateGroup(dvm.state.selectedGroup.title, dvm.newGroup).then(response => {
                        dvm.errorMessage = '';
                        dvm.state.displayEditGroupInfoOverlay = false;
                        dvm.state.selectedGroup = _.find(dvm.um.groups, {title: dvm.newGroup.title});
                    }, error => dvm.errorMessage = error);
                }
            },
            templateUrl: 'modules/user-management/directives/editGroupInfoOverlay/editGroupInfoOverlay.html'
        };
    }
})();
