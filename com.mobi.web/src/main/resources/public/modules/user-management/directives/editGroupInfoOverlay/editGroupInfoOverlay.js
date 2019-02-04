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
         * The `editGroupInfoOverlay` module only provides the `editGroupInfoOverlay` component which creates content
         * for a modal to change a groups's information in Mobi.
         */
        .module('editGroupInfoOverlay', [])
        /**
         * @ngdoc component
         * @name editGroupInfoOverlay.component:editGroupInfoOverlay
         * @requires userManager.service:userManagerService
         * @requires userState.service:userStateService
         * @requires util.service:utilService
         *
         * @description
         * `editGroupInfoOverlay` is a component that creates content for a modal with a form to change the
         * {@link userState.service:userStateService#selectedGroup selected group's} information in Mobi. The
         * form contains a field to edit the group's description. Meant to be used in conjunction with the
         * {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .component('editGroupInfoOverlay', {
            bindings: {
                close: '&',
                dismiss: '&'
            },
            controllerAs: 'dvm',
            controller: ['userStateService', 'userManagerService', 'utilService', EditGroupInfoOverlayController],
            templateUrl: 'modules/user-management/directives/editGroupInfoOverlay/editGroupInfoOverlay.html'
        });

    function EditGroupInfoOverlayController(userStateService, userManagerService, utilService) {
        var dvm = this;
        dvm.state = userStateService;
        dvm.um = userManagerService;
        dvm.newGroup = angular.copy(dvm.state.selectedGroup);

        dvm.set = function() {
            utilService.updateDctermsValue(dvm.newGroup.jsonld, 'description', dvm.newGroup.description);
            dvm.um.updateGroup(dvm.state.selectedGroup.title, dvm.newGroup).then(response => {
                dvm.errorMessage = '';
                dvm.state.selectedGroup = _.find(dvm.um.groups, {title: dvm.newGroup.title});
                dvm.close();
            }, error => dvm.errorMessage = error);
        }
        dvm.cancel = function() {
            dvm.dismiss();
        }
    }
})();
