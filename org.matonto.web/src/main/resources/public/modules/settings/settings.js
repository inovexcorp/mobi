(function() {
    'use strict';

    angular
        .module('settings', ['settingsManager', 'customSetting', 'settingsContainer'])
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
