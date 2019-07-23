/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
         * @name ontologyClassSelect
         *
         * @description
         * The `ontologyClassSelect` module only provides the `ontologyClassSelect` directive which creates a `ui-select` of all the
         * classes in the imports closure of an ontology.
         */
        .module('ontologyClassSelect', [])
        /**
         * @ngdoc directive
         * @name ontologyClassSelect.directive:ontologyClassSelect
         * @scope
         * @restrict E
         * @requires shared.service:ontologyStateService
         * @requires shared.service:utilService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         *
         * @description
         * `ontologyClassSelect` is a directive that creates a Bootstrap `form-group` with a `ui-select` of the IRIs of
         * all the classes in the current {@link shared.service:ontologyStateService selected ontology} and its
         * imports. The directive is replaced by the contents of its template.
         *
         * @param {string[]} values The selected IRIs from the `ui-select`
         * @param {Function} lockChoice An optional expression to determine whether a selected class should be locked
         */
        .directive('ontologyClassSelect', ontologyClassSelect);

        ontologyClassSelect.$inject = ['ontologyStateService', 'utilService', 'ontologyUtilsManagerService'];

        function ontologyClassSelect(ontologyStateService, utilService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'ontology-editor/directives/ontologyClassSelect/ontologyClassSelect.directive.html',
                scope: {},
                bindToController: {
                    values: '=',
                    lockChoice: '&'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.util = utilService;
                    dvm.array = [];

                    dvm.getValues = function(searchText) {
                        dvm.array =  dvm.ontoUtils.getSelectList(_.keys(os.listItem.classes.iris), searchText, dvm.ontoUtils.getDropDownText);
                    }
                }
            }
        }
})();