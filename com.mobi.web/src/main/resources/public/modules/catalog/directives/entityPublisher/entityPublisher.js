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
         * @requires userManager.service:userManagerService
         * @requires utilService.service:utilService
         *
         * @description
         * `entityPublisher` is a directive which creates a div with a display of a JSON-LD object's
         * dcterms:publisher property value. Retrieves the username of the publisher using the
         * {@link userManager.service:userManagerService userManagerService}. The directive is replaced
         * by the contents of its template.
         *
         * @param {Object} entity A JSON-LD object
         */
        .directive('entityPublisher', entityPublisher);

    entityPublisher.$inject = ['userManagerService', 'utilService'];

    function entityPublisher(userManagerService, utilService) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {
                entity: '<'
            },
            controller: ['$scope', function($scope) {
                var dvm = this;
                var util = utilService;
                var um = userManagerService;

                dvm.getUsername = function() {
                    var iri = util.getDctermsId($scope.entity, 'publisher');
                    if (iri) {
                        return _.get(_.find(um.users, {iri}), 'username', '(None)');
                    }
                    return '(None)';
                }
            }],
            templateUrl: 'modules/catalog/directives/entityPublisher/entityPublisher.html'
        };
    }
})();
