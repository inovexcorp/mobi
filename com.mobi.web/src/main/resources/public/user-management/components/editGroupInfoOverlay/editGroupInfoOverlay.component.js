/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

    /**
     * @ngdoc component
     * @name user-management.component:editGroupInfoOverlay
     * @requires shared.service:userManagerService
     * @requires shared.service:userStateService
     * @requires shared.service:utilService
     *
     * @description
     * `editGroupInfoOverlay` is a component that creates content for a modal with a form to change the
     * {@link shared.service:userStateService#selectedGroup selected group's} information in Mobi. The
     * form contains a field to edit the group's description. Meant to be used in conjunction with the
     * {@link shared.service:modalService}.
     *
     * @param {Function} close A function that closes the modal
     * @param {Function} dismiss A function that dismisses the modal
     */
    const editGroupInfoOverlayComponent = {
        templateUrl: 'user-management/components/editGroupInfoOverlay/editGroupInfoOverlay.component.html',
        bindings: {
            close: '&',
            dismiss: '&'
        },
        controllerAs: 'dvm',
        controller: editGroupInfoOverlayComponentCtrl,
    };

    editGroupInfoOverlayComponentCtrl.$inject = ['userStateService', 'userManagerService', 'utilService'];

    function editGroupInfoOverlayComponentCtrl(userStateService, userManagerService, utilService) {
        var dvm = this;
        dvm.state = userStateService;
        dvm.um = userManagerService;
        dvm.newGroup = {};

        dvm.$onInit = function() {
            dvm.newGroup = angular.copy(dvm.state.selectedGroup);
        }
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

    angular.module('user-management')
        .component('editGroupInfoOverlay', editGroupInfoOverlayComponent);
})();
