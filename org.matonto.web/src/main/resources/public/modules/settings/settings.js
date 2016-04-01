(function() {
    'use strict';

    angular
        .module('settings', ['settingsManager'])
        .controller('SettingsController', SettingsController);

    SettingsController.$inject = ['settingsManagerService'];

    function SettingsController(settingsManagerService) {
        var vm = this;
        vm.settings = settingsManagerService.getSettings();

        vm.saveSettings = function() {
            settingsManagerService.saveSettings(vm.settings);
        }
    }
})();
