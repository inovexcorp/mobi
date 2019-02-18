(function() {
    'use strict';
    /**
     * @ngdoc component
     * @name settings.component:profileTab
     * @requires userManager.service:userManagerService
     * @requires loginManager.service:loginManagerService
     * @requires prefixes.service:prefixes
     *
     * @description
     * `profileTab` is a component that creates a Bootstrap `row` with a {@link block.directive:block block} that contains a
     * form allowing the current user to change their profile information. This information includes their first name, last
     * name, and email address.
     */
    const profileTabComponent = {
        templateUrl: 'settings/components/profileTab/profileTab.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: profileTabComponentCtrl
    };

    profileTabComponentCtrl.$inject = ['userManagerService', 'loginManagerService', 'prefixes'];

    function profileTabComponentCtrl(userManagerService, loginManagerService, prefixes) {
        var dvm = this;
        dvm.um = userManagerService;
        dvm.lm = loginManagerService;
        dvm.currentUser = undefined;

        dvm.$onInit = function() {
            dvm.currentUser = angular.copy(_.find(dvm.um.users, {username: dvm.lm.currentUser}));
        }
        dvm.save = function() {
            dvm.currentUser.jsonld[prefixes.foaf + 'firstName'] = [{'@value': dvm.currentUser.firstName}];
            dvm.currentUser.jsonld[prefixes.foaf + 'lastName'] = [{'@value': dvm.currentUser.lastName}];
            dvm.currentUser.jsonld[prefixes.foaf + 'mbox'] = [{'@id': dvm.currentUser.email}];
            dvm.um.updateUser(dvm.currentUser.username, dvm.currentUser).then(response => {
                dvm.errorMessage = '';
                dvm.success = true;
                dvm.form.$setPristine();
            }, error => {
                dvm.errorMessage = error;
                dvm.success = false;
            });
        }
    }
    angular.module('settings')
        .component('profileTab', profileTabComponent);
})();