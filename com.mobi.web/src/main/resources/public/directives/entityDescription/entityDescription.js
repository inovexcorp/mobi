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
(function () {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name entityDescription
         *
         * @description
         * The `entityDescription` module only provides the `entityDescription` directive which creates
         * a div with an optionally expandable display of the dcterms:description of an entity.
         */
        .module('entityDescription', [])
        .config(ignoreUnhandledRejectionsConfig)
        /**
         * @ngdoc directive
         * @name entityDescription.directive:entityDescription
         * @scope
         * @restrict E
         * @requires $filter
         * @requires utilService.service:utilService
         *
         * @description
         * `entityDescription` is a directive which creates a div with a display of a JSON-LD object's
         * dcterms:description property value. Based on the limited variable, will optionally limit the
         * display to the first 200 characters and provide a button to toggle the full display. The
         * directive is replaced by the contents of its template.
         *
         * @param {boolean} limited Whether or not the display should be limited to the first 200 charaters
         * @param {Object} entity A JSON-LD object
         */
        .directive('entityDescription', entityDescription);

    entityDescription.$inject = ['$filter', 'utilService'];

    function entityDescription($filter, utilService) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {
                limited: '<'
            },
            bindToController: {
                entity: '<'
            },
            link: function(scope, el, attrs) {
                scope.limited = attrs.limited !== undefined;
            },
            controller: function() {
                var dvm = this;
                dvm.util = utilService;
                dvm.descriptionLimit = 200;
                dvm.full = false;

                dvm.getLimitedDescription = function() {
                    var description = dvm.getDescription();
                    return dvm.full || description.length < dvm.descriptionLimit ? description : $filter('limitTo')(description, dvm.descriptionLimit) + '...';
                }
                dvm.getDescription = function() {
                    return dvm.util.getDctermsValue(dvm.entity, 'description');
                }
            },
            templateUrl: 'directives/entityDescription/entityDescription.html'
        };
    }
})();
