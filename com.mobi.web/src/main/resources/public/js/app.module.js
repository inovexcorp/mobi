/*-
 * #%L
 * com.mobi.web
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
            'ngAria',
            'ngCookies',
            'ngMaterial',
            'ngclipboard',
            'ngHandsontable',
            'ngMessages',
            'toastr',
            'ui.bootstrap',
            'ui.codemirror',
            'ui.router',
            'ui.select',
            'vs-repeat',

            /* Custom Filters */
            'beautify',
            'branchesToDisplay',
            'camelCase',
            'escapeHTML',
            'inArray',
            'prefixation',
            'removeIriFromArray',
            'removeMobi',
            'showProperties',
            'splitIRI',
            'trusted',
            'uniqueKey',

            /* Custom Directives */
            'aDisabled',
            'block',
            'blockContent',
            'blockFooter',
            'blockHeader',
            'blockSearch',
            'branchSelect',
            'breadcrumbs',
            'checkbox',
            'circleButton',
            'circleButtonStack',
            'clickAnywhereButHere',
            'commitChangesDisplay',
            'commitDifferenceTabset',
            'commitHistoryTable',
            'commitInfoOverlay',
            'confirmationOverlay',
            'customLabel',
            'dragFile',
            'dragMe',
            'dropOnMe',
            'emailInput',
            'entityDates',
            'entityDescription',
            'errorDisplay',
            'fileInput',
            'focusMe',
            'infoMessage',
            'keywordSelect',
            'materialTab',
            'materialTabset',
            'pagination',
            'pagingDetails',
            'passwordConfirmInput',
            'radioButton',
            'rdfVisualization',
            'recordKeywords',
            'sidebar',
            'spinner',
            'statementContainer',
            'statementDisplay',
            'staticIri',
            'stepProgressBar',
            'tab',
            'tabset',
            'targetedSpinner',
            'textArea',
            'textInput',
            'uniqueValue',
            'userAccessControls',
            'valueDisplay',

            /* Custom Modules */
            'analytics',
            'activityLog',
            'catalog',
            'datasets',
            'discover',
            'home',
            'login',
            'mapper',
            'merge-requests',
            'ontology-editor',
            'settings',
            'user-management',
            'webtop',

            /* Custom Services */
            'analyticManager',
            'analyticState',
            'catalogManager',
            'catalogState',
            'datasetManager',
            'datasetState',
            'delimitedManager',
            'discoverState',
            'd3Transformer',
            'httpService',
            'loginManager',
            'manchesterConverter',
            'mapperState',
            'mappingManager',
            'mergeRequestManager',
            'mergeRequestsState',
            'ontologyManager',
            'ontologyState',
            'policyEnforcement',
            'policyManager',
            'prefixes',
            'propertyManager',
            'provManager',
            'recordPermissionsManager',
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
        .constant('antlr', window.antlr)
        .constant('sparqljs', window.sparqljs)
        .constant('d3', window.d3)
        .constant('REGEX', {
            'IRI': /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i,
            'LOCALNAME': /^[a-zA-Z0-9._\-]+$/,
            'FILENAME': /^[\w\-. ]+$/,
            'UUID': /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
            'DATETIME': /^\d{4}(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?)?)?)?$/i,
            'INTEGER': /^[-+]?\d+$/,
            'DECIMAL': /^[-+]?\d*[.]?\d*$/,
            'ANYTHING': /^.+$/
        })
        .constant('INDENT', 1.28571429)
        .constant('REST_PREFIX', '/mobirest/')
        .config(httpInterceptorConfig)
        .config(ariaConfig)
        .config(theming)
        .factory('requestInterceptor', requestInterceptor)
        .service('beforeUnload', beforeUnload)
        .run(function(beforeUnload) {
            // We have to invoke the service at least once
        });

        beforeUnload.$inject = ['$window', '$rootScope', 'ontologyStateService', 'mapperStateService'];

        function beforeUnload($window, $rootScope, ontologyStateService, mapperStateService) {
            $window.onbeforeunload = function(e) {
                if ($rootScope.isDownloading) {
                    $rootScope.isDownloading = false;
                    return undefined;
                } else {
                    var ontologyHasChanges = _.some(ontologyStateService.list, ontologyStateService.hasChanges);
                    var mappingHasChanges = mapperStateService.isMappingChanged();
                    if (ontologyHasChanges || mappingHasChanges) {
                        return true;
                    }
                }
            }
        }

        httpInterceptorConfig.$inject = ['$httpProvider'];

        function httpInterceptorConfig($httpProvider) {
            $httpProvider.interceptors.push('requestInterceptor');
        }

        requestInterceptor.$inject = ['$q', '$rootScope', '$httpParamSerializer'];

        function requestInterceptor($q, $rootScope, $httpParamSerializer) {
            $rootScope.pendingRequests = 0;

            function checkConfig(config) {
                return !_.includes(config.url, '.html') && !_.has(config, 'timeout');
            }

            function handleStop(config) {
                if (checkConfig(config)) {
                    $rootScope.pendingRequests--;
                }
            }

            return {
                'request': function (config) {
                    if (checkConfig(config)) {
                        $rootScope.pendingRequests++;
                    }
                    return config || $q.when(config);
                },
                'requestError': function(rejection) {
                    handleStop(rejection.config);
                    return $q.reject(rejection);
                },
                'response': function(response) {
                    handleStop(response.config);
                    return response || $q.when(response);
                },
                'responseError': function(rejection) {
                    handleStop(rejection.config);
                    return $q.reject(rejection);
                }
            };
        }

        function ariaConfig($ariaProvider) {
            $ariaProvider.config({
                tabindex: false
            });
        }

        function theming($mdThemingProvider) {
            var primary = $mdThemingProvider.definePalette('mobiPrimary', {
                '50': 'E6E8F3',
                '100': 'C1C5E2',
                '200': '989FCF',
                '300': '6E79BC',
                '400': '4F5CAD',
                '500': '303F9F',
                '600': '2B3997',
                '700': '24318D',
                '800': '1E2983',
                '900': '131B72',
                'A100': 'A8AEFF',
                'A200': '757EFF',
                'A400': '424FFF',
                'A700': '2937FF',
                'contrastDefaultColor': 'light',
                'contrastDarkColors': ['50', '100', '200', '300', '400', 'A100'],
                'contrastLightColors': undefined
            });
            var secondary = $mdThemingProvider.definePalette('mobiSecondary', {
                '50': 'E8EAF6',
                '100': 'C5CBE9',
                '200': '9FA8DA',
                '300': '7985CB',
                '400': '5C6BC0',
                '500': '3F51B5',
                '600': '394AAE',
                '700': '3140A5',
                '800': '29379D',
                '900': '1B278D',
                'A100': 'C6CBFF',
                'A200': '939DFF',
                'A400': '606EFF',
                'A700': '4757FF',
                'contrastDefaultColor': 'light',
                'contrastDarkColors': ['50', '100', '200', '300', '400', 'A100'],
                'contrastLightColors': undefined
            });
            $mdThemingProvider.theme('default')
                .primaryPalette('mobiPrimary')
                .accentPalette('mobiSecondary');
        }
})();
