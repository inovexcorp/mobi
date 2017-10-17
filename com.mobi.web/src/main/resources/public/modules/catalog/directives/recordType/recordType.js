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
         * @name recordType
         * @requires catalogManager
         *
         * @description
         * The `recordType` module only provides the `recordType` directive which
         * creates a span with the Bootstrap 'label' class with different colors for
         * different record type IRIs.
         */
        .module('recordType', [])
        /**
         * @ngdoc directive
         * @name recordType.directive:recordType
         * @scope
         * @restrict E
         * @requires catalogManager.service:catalogManagerService
         *
         * @description
         * `recordType` is a directive that creates a span with the Bootstrap 'label'
         * class with different background colors for different record type IRIs. The
         * directive is replaced with the content of the template.
         *
         * @param {string} type The record type IRI for record
         */
        .directive('recordType', recordType);

        recordType.$inject = ['catalogManagerService', 'chroma'];

        function recordType(catalogManagerService, chroma) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    type: '<'
                },
                controller: function() {
                    var dvm = this;
                    dvm.cm = catalogManagerService;
                    var colors = chroma.scale('Set1').colors(dvm.cm.recordTypes.length);

                    dvm.getColor = function(type) {
                        return _.get(colors, dvm.cm.recordTypes.indexOf(type));
                    }
                },
                templateUrl: 'modules/catalog/directives/recordType/recordType.html'
            }
        }
})();
