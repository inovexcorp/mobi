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
            'ngHandsontable',
            'ngMessages',
            'toastr',
            'ui.bootstrap',
            'ui.codemirror',
            'ui.router',
            'ui.select',

            /* Custom Filters */
            'beautify',
            'camelCase',
            'escapeHTML',
            'inArray',
            'prefixation',
            'removeIriFromArray',
            'removeMatonto',
            'showProperties',
            'splitIRI',
            'trusted',

            /* Custom Directives */
            'block',
            'blockContent',
            'blockFooter',
            'blockHeader',
            'blockSearch',
            'checkbox',
            'circleButton',
            'circleButtonStack',
            'clickAnywhereButHere',
            'commitChangesDisplay',
            'commitHistoryTable',
            'commitInfoOverlay',
            'confirmationOverlay',
            'customHeader',
            'customLabel',
            'emailInput',
            'entityDates',
            'entityDescription',
            'errorDisplay',
            'fileInput',
            'focusMe',
            'infoMessage',
            'keywordSelect',
            'pagination',
            'pagingDetails',
            'passwordConfirmInput',
            'radioButton',
            'recordKeywords',
            'stepProgressBar',
            'tab',
            'tabset',
            'textArea',
            'textInput',
            'uniqueValue',

            /* Custom Modules */
            'catalog',
            'datasets',
            'home',
            'login',
            'mapper',
            'nav',
            'ontology-editor',
            'settings',
            'sparql',
            'user-management',
            'webtop',

            /* Custom Services */
            'catalogManager',
            'catalogState',
            'datasetManager',
            'datasetState',
            'delimitedManager',
            'loginManager',
            'mapperState',
            'mappingManager',
            'ontologyManager',
            'ontologyState',
            'prefixes',
            'propertyManager',
            'responseObj',
            'settingsManager',
            'sparqlManager',
            'stateManager',
            'updateRefs',
            'userManager',
            'userState',
            'util'
        ])
        .constant('chroma', window.chroma)
        .constant('Snap', window.Snap)
        .constant('REGEX', {
            'IRI': /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i,
            'LOCALNAME': /^[a-zA-Z0-9._\-]+$/,
            'FILENAME': /^[\w\-. ]+$/
        })
        .config(httpInterceptorConfig)
        .factory('requestInterceptor', requestInterceptor)
        .service('beforeUnload', beforeUnload)
        .run(function(beforeUnload) {
            // We have to invoke the service at least once
        });

        beforeUnload.$inject = ['$window', 'ontologyManagerService', 'ontologyStateService', 'mapperStateService'];

        function beforeUnload($window, ontologyManagerService, ontologyStateService, mapperStateService) {
            $window.onbeforeunload = function(e) {
                var ontologyHasChanges = _.some(ontologyManagerService.list, listItem => {
                    return ontologyStateService.hasChanges(_.get(listItem, 'recordId'));
                });
                var mappingHasChanges = mapperStateService.changedMapping;
                if (ontologyHasChanges || mappingHasChanges) {
                    return true;
                }
            }
        }

        httpInterceptorConfig.$inject = ['$httpProvider'];

        function httpInterceptorConfig($httpProvider) {
            $httpProvider.interceptors.push('requestInterceptor');
        }

        requestInterceptor.$inject = ['$q', '$rootScope'];

        function requestInterceptor($q, $rootScope) {
            $rootScope.pendingRequests = 0;
            return {
                'request': function (config) {
                    $rootScope.pendingRequests++;
                    return config || $q.when(config);
                },
                'requestError': function(rejection) {
                    $rootScope.pendingRequests--;
                    return $q.reject(rejection);
                },
                'response': function(response) {
                    $rootScope.pendingRequests--;
                    return response || $q.when(response);
                },
                'responseError': function(rejection) {
                    $rootScope.pendingRequests--;
                    return $q.reject(rejection);
                }
            };
        }
})();
