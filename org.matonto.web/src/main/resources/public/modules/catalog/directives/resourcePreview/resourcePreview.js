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
         * @name resourcePreview
         * @requires catalogManager
         *
         * @description 
         * The `resourcePreview` module only provides the `resourcePreview` directive
         * which creates a preview of information about a particular resource object.
         */
        .module('resourcePreview', ['catalogManager'])
        /**
         * @ngdoc directive
         * @name resourcePreview.directive:resourcePreview
         * @scope
         * @restrict E
         * @requires catalogManager.catalogManagerService
         *
         * @description 
         * `resourcePreview` is a directive that creates a preview of information about
         * the selected particular resource object in the 
         * {@link catalogManager.service:catalogManagerService catalogManagerService}. 
         * The directive is replaced by the content of the template. If no selected 
         * resource is set, a static message is shown.
         *
         * @usage
         * <resource-preview></resource-preview>
         */
        .directive('resourcePreview', resourcePreview);

        resourcePreview.$inject = ['catalogManagerService'];

        function resourcePreview(catalogManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.catalog = catalogManagerService;

                    dvm.getDate = function(date) {
                        var jsDate = dvm.catalog.getDate(date);
                        return jsDate.toDateString();
                    }
                },
                templateUrl: 'modules/catalog/directives/resourcePreview/resourcePreview.html'
            }
        }
})();
