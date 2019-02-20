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
         * @name propSelect
         *
         * @description
         * The `propSelect` module only provides the `propSelect` directive which creates
         * a ui-select with the passed property list, a selected property, and an optional
         * function to be called when the selected property changes.
         */
        .module('propSelect', [])
        /**
         * @ngdoc directive
         * @name propSelect.directive:propSelect
         * @scope
         * @restrict E
         * @requires shared.service:ontologyManagerService
         * @requires $filter
         *
         * @description
         * `propSelect` is a directive which creates a ui-select with the passed property
         * list, a selected property object, and an optional function to be called when
         * the selected property is changed. The directive is replaced by the contents of
         * its template.
         *
         * @param {object[]} props an array of property objects from the
         * {@link shared.service:ontologyManagerService ontologyManagerService}
         * @param {boolean} isDisabledWhen whether or not the select should be disabled
         * @param {function} [onChange=undefined] an optional function to be called on change
         * of the selected property
         * @param {object} selectedProp the currently selected property object
         */
        .directive('propSelect', propSelect);

        propSelect.$inject = ['$filter', 'ontologyManagerService'];

        function propSelect($filter, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    props: '<',
                    isDisabledWhen: '<',
                    onChange: '&?'
                },
                bindToController: {
                    selectedProp: '='
                },
                controller: function() {
                    var dvm = this;
                    dvm.om = ontologyManagerService;

                    dvm.getOntologyId = function(prop) {
                        return prop.ontologyId || $filter('splitIRI')(prop.propObj['@id']).begin;
                    }
                },
                templateUrl: 'mapper/directives/propSelect/propSelect.directive.html'
            }
        }
})();
