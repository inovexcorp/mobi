(function() {
    'use strict';

    angular
        .module('app', [
            'angular-uuid',
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
            'customButton',
            'objectSelect',
            'stringSelect',
            'circleButton',
            'customButton'
        ])
        .constant('_', window._);
})();