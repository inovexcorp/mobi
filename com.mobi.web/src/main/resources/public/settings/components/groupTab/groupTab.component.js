(function() {
    'use strict';
    /**
     * @ngdoc component
     * @name settings.component:groupTab
     * @requires userManager.service:userManagerService
     * @requires loginManager.service:loginManagerService
     *
     * @description
     * `groupTab` is a component which creates a Bootstrap list of groups a user is in.
     */
    const groupTabComponent = {
        templateUrl: 'settings/components/groupTab/groupTab.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: groupTabComponentCtrl
    };

    groupTabComponentCtrl.$inject = ['userManagerService', 'loginManagerService'];

    function groupTabComponentCtrl(userManagerService, loginManagerService) {
        var dvm = this;
        dvm.um = userManagerService;
        dvm.lm = loginManagerService;
        dvm.groups = [];

        dvm.$onInit = function() {
            dvm.groups = _.filter(dvm.um.groups, group => _.includes(group.members, dvm.lm.currentUser));
        }
    }

    angular.module('settings')
        .component('groupTab', groupTabComponent);
})();