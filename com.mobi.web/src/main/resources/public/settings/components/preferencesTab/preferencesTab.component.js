(function() {
    'use strict';
    /**
     * @ngdoc component
     * @name settings.component:preferencesTab
     * @requires settingsManager.service:settingsManagerService
     *
     * @description
     * `preferencesTab` is a component that creates a Bootstrap `row` with a {@link block.directive:block block} containing
     * a form allowing the current user to change their display preferences. The preferences are displayed using a
     * {@link settings.component:preferencesContainer preferencesContainer} and several
     * {@link settings.component:customPreference customPreference}.
     */
    const preferencesTabComponent = {
        templateUrl: 'settings/components/preferencesTab/preferencesTab.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: preferencesTabComponentCtrl
    };

    preferencesTabComponentCtrl.$inject = ['settingsManagerService'];

    function preferencesTabComponentCtrl(settingsManagerService) {
        var dvm = this;
        dvm.sm = settingsManagerService;
        dvm.settings = dvm.sm.getSettings();

        dvm.save = function() {
            dvm.sm.setSettings(dvm.settings);
        }
    }

    angular.module('settings')
        .component('preferencesTab', preferencesTabComponent);
})();