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

    angular
        /**
         * @ngdoc overview
         * @name createGroupOverlay
         *
         * @description
         * The `createGroupOverlay` module only provides the `createGroupOverlay` component which creates content for a
         * modal to add a group to Mobi.
         */
        .module('createGroupOverlay', [])
        /**
         * @ngdoc component
         * @name createGroupOverlay.component:createGroupOverlay
         * @requires userManager.service:userManagerService
         * @requires userState.service:userStateService
         * @requires loginManager.service:loginManagerService
         *
         * @description
         * `createGroupOverlay` is a component that creates content for a modal with a form to add a group to Mobi. The
         * form includes the group title, a group description, and group
         * {@link memberTable.directive:memberTable members}. Meant to be used in conjunction with the
         * {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .component('createGroupOverlay', {
            bindings: {
                close: '&',
                dismiss: '&'
            },
            controllerAs: 'dvm',
            controller: ['$q', 'userManagerService', 'loginManagerService', CreateGroupOverlayController],
            templateUrl: 'user-management/directives/createGroupOverlay/createGroupOverlay.component.html'
        });

    function CreateGroupOverlayController($q, userManagerService, loginManagerService) {
        var dvm = this;
        dvm.um = userManagerService;
        dvm.lm = loginManagerService;
        dvm.newGroup = {
            title: '',
            description: '',
            roles: [],
            members: [dvm.lm.currentUser]
        }
        dvm.errorMessage = '';

        dvm.getTitles = function() {
            return _.map(dvm.um.groups, 'title');
        }
        dvm.add = function() {
            dvm.um.addGroup(dvm.newGroup)
            .then(response => {
                dvm.errorMessage = '';
                dvm.close();
            }, error => dvm.errorMessage = error);
        }
        dvm.addMember = function(member) {
            dvm.newGroup.members.push(member);
        }
        dvm.removeMember = function(member) {
            _.pull(dvm.newGroup.members, member);
        }
        dvm.cancel = function() {
            dvm.dismiss();
        }
    }
})();
