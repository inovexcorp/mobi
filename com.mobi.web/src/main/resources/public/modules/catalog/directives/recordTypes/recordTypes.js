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
         * @name recordTypes
         * @requires catalogManager
         *
         * @description
         * The `recordTypes` module only provides the `recordTypes` directive which creates a div with
         * a collection of {@link recordType.directive:recordType recordTypes} for the sorted and filtered
         * passed record's type IRI strings.
         */
        .module('recordTypes', [])
        /**
         * @ngdoc directive
         * @name recordTypes.directive:recordTypes
         * @scope
         * @restrict E
         * @requires catalogManager.service:catalogManagerService
         *
         * @description
         * `recordTypes` is a directive that creates a div with a {@link recordType.directive:recordType recordType}
         * for each of the passed record's "@type" values. The types are filtered based on whether they are in the list
         * of record types in the {@link catalogManager.service:catalogMangerService catalogManagerService} and sorted
         * alphabetically. The directive is replaced with the content of the template.
         *
         * @param {Object} record The JSON-LD object representing the record
         */
        .directive('recordTypes', recordTypes);

        recordTypes.$inject = ['catalogManagerService'];

        function recordTypes(catalogManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    record: '<'
                },
                controller: function() {
                    var dvm = this;
                    dvm.cm = catalogManagerService;
                },
                templateUrl: 'modules/catalog/directives/recordTypes/recordTypes.html'
            }
        }
})();
