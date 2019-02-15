/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
         * @name instanceView
         *
         * @description
         * The `instanceView` module only provides the `instanceView` directive which creates
         * the instance view page.
         */
        .module('instanceView', [])
        /**
         * @ngdoc directive
         * @name instanceView.directive:instanceView
         * @scope
         * @restrict E
         * @requires discoverState.service:discoverStateService
         * @requires util.service:utilService
         * @requires exploreUtils.service:exploreUtilsService
         * @requires prefixes.service:prefixes
         *
         * @description
         * HTML contents in the instance view page which shows the complete list of properites
         * associated with the selected instance. If a property value is reified, a toggleable
         * dropdown display is included.
         */
        .directive('instanceView', instanceView);

        instanceView.$inject = ['discoverStateService', 'utilService', 'exploreUtilsService', 'prefixes'];

        function instanceView(discoverStateService, utilService, exploreUtilsService, prefixes) {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/sub-modules/explore/directives/instanceView/instanceView.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.ds = discoverStateService;
                    dvm.util = utilService;
                    dvm.eu = exploreUtilsService;
                    dvm.entity = getEntity();

                    dvm.getLimit = function(array, limit) {
                        var len = array.length;
                        return len === limit ? 1 : len;
                    }
                    dvm.getReification = function(propIRI, valueObj) {
                        var reification = dvm.eu.getReification(dvm.ds.explore.instance.entity, dvm.ds.explore.instance.metadata.instanceIRI, propIRI, valueObj);
                        if (reification) {
                            return _.omit(reification, ['@id', '@type', prefixes.rdf + 'subject', prefixes.rdf + 'predicate', prefixes.rdf + 'object']);
                        }
                        return reification;
                    }
                    dvm.edit = function() {
                        dvm.ds.explore.editing = true;
                        dvm.ds.explore.instance.original = angular.copy(dvm.ds.explore.instance.entity);
                    }

                    function getEntity() {
                        return _.omit(dvm.ds.getInstance(), ['@id', '@type']);
                    }

                    $scope.$watch('dvm.ds.explore.instance.entity', () => {
                        dvm.entity = getEntity();
                    });
                }]
            }
        }
})();