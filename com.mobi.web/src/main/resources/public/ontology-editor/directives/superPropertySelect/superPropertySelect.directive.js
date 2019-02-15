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
         * @name superPropertySelect
         *
         * @description
         * The `superPropertySelect` module only provides the `superPropertySelect` directive which creates
         * the super property select.
         */
        .module('superPropertySelect', [])
        .config(ignoreUnhandledRejectionsConfig)
        /**
         * @ngdoc directive
         * @name superPropertySelect.directive:superPropertySelect
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires util.service:utilService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         *
         * @description
         * HTML contents in the super property select which provides a link to show a dropdown select of
         * all available properties IRIs in the subobject idetified by the provided key.
         */
        .directive('superPropertySelect', superPropertySelect);

        superPropertySelect.$inject = ['ontologyStateService', 'utilService', 'ontologyUtilsManagerService'];

        function superPropertySelect(ontologyStateService, utilService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/superPropertySelect/superPropertySelect.directive.html',
                scope: {},
                bindToController: {
                    key: '<',
                    values: '='
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.util = utilService;
                    dvm.isShown = false;
                    dvm.array = [];

                    dvm.show = function() {
                        dvm.isShown = true;
                    }
                    dvm.hide = function() {
                        dvm.isShown = false;
                        dvm.values = [];
                    }
                    dvm.getValues = function(searchText) {
                        dvm.array =  dvm.ontoUtils.getSelectList(_.keys(os.listItem[dvm.key].iris), searchText, dvm.ontoUtils.getDropDownText);
                    }
                }
            }
        }
})();