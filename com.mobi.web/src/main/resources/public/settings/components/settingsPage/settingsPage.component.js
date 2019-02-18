(function() {
    'use strict';
    /**
     * @ngdoc component
     * @name settings.component:settingsPage
     *
     * @description
     * `settingsPage` is a component which creates a {@link tabset.directive:tabset tabset} with
     * {@link tab.directive:tab tabs} for different settings pertaining to the current user. The tabs are
     * {@link settings.component:profileTab profileTab}, {@link settings.component:passwordTab passwordTab}, and the
     * {@link settings.component:preferencesTab preferencesTab}.
     */
    const settingsPageComponent = {
        templateUrl: 'settings/components/settingsPage/settingsPage.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: settingsPageComponentCtrl
    };

    function settingsPageComponentCtrl() {
        var dvm = this;
        dvm.tabs = {
            profile: true,
            group: false,
            password: false,
            preferences: false
        };
    }

    angular.module('settings')
        .component('settingsPage', settingsPageComponent);
})();