/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
(function() {
    'use strict';

    angular
        .module('app', [
            /* Third Party */
            'angular-uuid',
            'ngAnimate',
            'ngCookies',
            'ngMessages',
            'ui.codemirror',
            'ui.router',
            'ui.select',

            /* Custom Filters */
            'beautify',
            'camelCase',
            'escapeHTML',
            'removeIriFromArray',
            'removeMatonto',
            'splitIRI',
            'trusted',

            /* Custom Directives */
            'circleButton',
            'confirmationOverlay',
            'customButton',
            'customLabel',
            'errorDisplay',
            'fileInput',
            'leftNav',
            'leftNavItem',
            'pagination',
            'radioButton',
            'tabButton',
            'tabButtonContainer',
            'textArea',
            'textInput',

            /* Custom Modules */
            'catalog',
            'home',
            'login',
            'mapper',
            'nav',
            'ontology-editor',
            'settings',
            'sparql',
            'webtop',

            /* Custom Services */
            'annotationManager',
            'catalogManager',
            'mappingManager',
            'ontologyManager',
            'prefixes',
            'responseObj',
            'settingsManager',
            'updateRefs'
        ])
        .constant('_', window._)
        .constant('REGEX', {
            'IRI': /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i,
            'LOCALNAME': /^[a-zA-Z0-9._\-]+$/,
            'FILENAME': /^[\w\-. ]+$/
        })
        .factory('beforeUnload', beforeUnload)
        .run(function(beforeUnload) {
            // We have to invoke the factory at least once
        });

        beforeUnload.$inject = ['$window', 'ontologyManagerService'];

        function beforeUnload($window, ontologyManagerService) {
            $window.onbeforeunload = function(e) {
                if(ontologyManagerService.getChangedEntries().length) {
                    return true;
                }
            }
            return {};
        }
})();
