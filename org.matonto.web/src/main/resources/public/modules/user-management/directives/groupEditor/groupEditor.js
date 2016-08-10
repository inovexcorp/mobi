/*-
 * #%L
 * org.matonto.web
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
         * @name groupEditor
         *
         * @description 
         * The `groupEditor` module only provides the `groupEditor` directive which creates
         * an editor for the {@link userState.service:userStateService#selectedGroup selected group}.
         */
        .module('groupEditor', [])
        /**
         * @ngdoc directive
         * @name groupEditor.directive:groupEditor
         * @scope
         * @restrict E
         * @requires userManager.service:userManagerService
         * @requires userState.service:userStateService
         * @requires loginManager.service:loginManagerService
         *
         * @description 
         * `groupEditor` is a directive that creates a div containing components to edit the 
         * {@link userState.service:userStateService#selectedGroup selected group}. Contains a
         * {@link memberTable.directive:memberTable memberTable} directive. The directive is 
         * replaced by the contents of its template.
         */
        .directive('groupEditor', groupEditor);

    groupEditor.$inject = ['userStateService', 'userManagerService', 'loginManagerService'];

    function groupEditor(userStateService, userManagerService, loginManagerService) {
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
                dvm.errorMessage = '';

                dvm.removeMember = function() {
                    dvm.state.showRemoveMemberConfirm = true;
                }
                dvm.addMember = function() {
                    dvm.um.addUserGroup(dvm.state.memberName, dvm.state.selectedGroup.name).then(response => {
                        dvm.errorMessage = '';
                        dvm.state.memberName = '';
                    }, error => {
                        dvm.errorMessage = error;
                    });
                }
            },
            templateUrl: 'modules/user-management/directives/groupEditor/groupEditor.html'
        };
    }
})();