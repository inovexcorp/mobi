(function() {
    'use strict';

    angular
        .module('app', [
            'angular-uuid',
            'ngCookies',
            'ngFileSaver',
            'catalog',
            'home',
            'login',
            'mapper',
            'nav',
            'ontology-editor',
            'webtop',
            'trusted',
            'removeMatonto',
            'ui.router',
            'ui.select',
            'textInput',
            'textArea',
            'radioButton',
            'customButton',
            'objectSelect',
            'stringSelect',
            'circleButton',
            'customButton',
            'confirmationOverlay',
            'settings'
        ])
        .constant('_', window._);
})();
