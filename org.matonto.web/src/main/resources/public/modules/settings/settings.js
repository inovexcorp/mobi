(function() {
    'use strict';

    angular
        .module('settings', ['settingsManager', 'customSetting', 'settingsContainer'])
        .controller('SettingsController', SettingsController);

    SettingsController.$inject = ['settingsManagerService', 'prefixes'];

    function SettingsController(settingsManagerService, prefixes) {
        var vm = this;
        vm.settings = settingsManagerService.getSettings();
        vm.rdfs = prefixes.rdfs;

        vm.saveSettings = function() {
            settingsManagerService.saveSettings(vm.settings);
        }
    }
})();
