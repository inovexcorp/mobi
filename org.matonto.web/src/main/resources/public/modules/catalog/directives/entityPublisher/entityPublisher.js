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
(function () {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name entityPublisher
         *
         * @description
         * The `entityPublisher` module only provides the `entityPublisher` directive which creates
         * a div with the username of the user who published an entity.
         */
        .module('entityPublisher', [])
        /**
         * @ngdoc directive
         * @name entityPublisher.directive:entityPublisher
         * @scope
         * @restrict E
         * @requires $filter
         * @requires utilService.service:utilService
         *
         * @description
         * `entityPublisher` is a directive which creates a div with a display of a JSON-LD object's
         * dcterms:description property value. Based on the limited variable, will optionally limit the
         * display to the first 200 characters and provide a button to toggle the full display. The
         * directive is replaced by the contents of its template.
         *
         * @param {boolean} limited Whether or not the display should be limited to the first 200 charaters
         * @param {Object} entity A JSON-LD object
         */
        .directive('entityPublisher', entityPublisher);

    entityPublisher.$inject = ['userManagerService', 'prefixes', 'utilService'];

    function entityPublisher(userManagerService, prefixes, utilService) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {},
            bindToController: {
                entity: '<'
            },
            controller: ['$scope', function($scope) {
                var dvm = this;
                dvm.util = utilService;
                dvm.um = userManagerService;
                dvm.username = '';

                $scope.$watch('dvm.entity', function(newValue, oldValue) {
                    if (dvm.util.getDctermsValue(newValue, 'publisher') !== dvm.util.getDctermsValue(oldValue, 'publisher')) {
                        dvm.um.getUsername(dvm.util.getDctermsValue(dvm.entity, 'publisher'))
                            .then(username => dvm.username = username, dvm.util.createErrorToast);
                    }
                });
            }],
            templateUrl: 'modules/catalog/directives/entityPublisher/entityPublisher.html'
        };
    }
})();
