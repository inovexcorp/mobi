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
        /**
         * @ngdoc overview
         * @name resourceType
         * @requires catalogManager
         *
         * @description 
         * The `resourceType` module only provides the `resourceType` directive which
         * creates a span with the Bootstrap 'label' class with different colors for 
         * different resource type IRIs.
         */
        .module('resourceType', ['catalogManager'])
        /**
         * @ngdoc directive
         * @name resourceType.directive:resourceType
         * @scope
         * @restrict E
         * @requires catalogManager.catalogManagerService
         *
         * @description 
         * `resourceType` is a directive that creates a span with the Bootstrap 'label'
         * class with different background colors for different resource type IRIs. The
         * directive is replaced with the content of the template.
         *
         * @param {string} type The resource type IRI for a resource object
         *
         * @usage
         * <resource-type type="'https://matonto.org/ontologies/catalog#Ontology'"></resource-type>
         */
        .directive('resourceType', resourceType);

        resourceType.$inject = ['catalogManagerService'];

        function resourceType(catalogManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    type: '='
                },
                controller: function() {
                    var dvm = this;
                    dvm.getType = function(type) {
                        return catalogManagerService.getType(type);
                    }
                },
                templateUrl: 'modules/catalog/directives/resourceType/resourceType.html'
            }
        }
})();
