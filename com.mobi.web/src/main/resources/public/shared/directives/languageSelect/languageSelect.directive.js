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
        /**
         * @ngdoc overview
         * @name languageSelect
         *
         * @description
         * The `languageSelect` module provides the `languageSelect` directive which provides options for a formatted
         * ui-select for picking language tags.
         *
         */
        .module('languageSelect', [])
        /**
         * @ngdoc directive
         * @name languageSelect.directive:languageSelect
         * @restrict E
         * @requires propertyManager.service:propertyManagerService
         *
         * @description
         * `languageSelect` is a directive which provides options for a formatted ui-select for picking language tags.
         * The directive provides an option to have a clear selection button. If the button is not enabled, the choice
         * defaults to English. The directive is replaced by the content of the template.
         *
         * @param {string} bindModel The variable to bind the value of the language to
         * @param {boolean} disableClear A boolean that indicates if the clear button should be disabled
         */
        .directive('languageSelect', languageSelect);

        languageSelect.$inject = ['propertyManagerService'];

        function languageSelect(propertyManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'directives/languageSelect/languageSelect.directive.html',
                scope: {},
                bindToController: {
                    bindModel: '=ngModel',
                    disableClear: '<'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var pm = propertyManagerService;
                    dvm.languages = pm.languageList;

                    dvm.clear = function() {
                        dvm.bindModel = undefined;
                    }

                    if (dvm.disableClear && typeof dvm.bindModel === 'undefined') {
                        dvm.bindModel = 'en';
                    }
                },
                link: function(scope, element, attrs) {
                    scope.required = 'required' in attrs;
                }
            }
        }
})();
