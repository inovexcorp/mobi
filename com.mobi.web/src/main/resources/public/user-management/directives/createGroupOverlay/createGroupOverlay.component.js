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
