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
            templateUrl: 'user-management/directives/editGroupInfoOverlay/editGroupInfoOverlay.component.html'
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
