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
         * @name classSelect
         *
         * @description
         * The `classSelect` module only provides the `classSelect` directive which creates
         * a ui-select with the passed class list, a selected class, and an optional
         * function to be called when the selected class changes.
         */
        .module('classSelect', [])
        /**
         * @ngdoc directive
         * @name classSelect.directive:classSelect
         * @scope
         * @restrict E
         * @requires ontologyManager.service:ontologyManagerService
         * @requires $filter
         *
         * @description
         * `classSelect` is a directive which creates a ui-select with the passed class
         * list, a selected class object, and an optional function to be called when
         * the selected class is changed. The directive is replaced by the contents of
         * its template.
         *
         * @param {Object[]} classes an array of class objects from the
         * {@link mapperState.service:mapperStateService mapperStateService}
         * @param {Function} [onChange=undefined] an optional function to be called on change
         * of the selected class
         * @param {Object} selectedClass the currently selected class object
         * @param {string} selectedClass.ontologyid the id of the ontology that contains the class
         * @param {Object} selectedClass.classObj the JSON-LD class object
         */
        .directive('classSelect', classSelect);

        classSelect.$inject = ['$filter', 'ontologyManagerService'];

        function classSelect($filter, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    classes: '<',
                    isDisabledWhen: '<',
                    onChange: '&?'
                },
                bindToController: {
                    selectedClass: '='
                },
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;

                    dvm.getOntologyId = function(clazz) {
                        return clazz.ontologyId || $filter('splitIRI')(clazz.classObj['@id']).begin;
                    }
                },
                templateUrl: 'mapper/directives/classSelect/classSelect.directive.html'
            }
        }
})();
