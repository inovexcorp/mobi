(function() {
    'use strict';

    angular
        .module('app', [
            'angular-uuid',
            'ngCookies',
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
            'confirmationOverlay'
        ])
        .constant('_', window._);
})();
