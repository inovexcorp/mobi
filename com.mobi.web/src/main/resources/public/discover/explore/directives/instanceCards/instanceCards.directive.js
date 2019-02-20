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
         * @name instanceCards
         *
         * @description
         * The `instanceCards` module only provides the `instanceCards` directive which creates a grid of cards
         * with all of the instance details about a class associated with a dataset record.
         */
        .module('instanceCards', [])
        /**
         * @ngdoc directive
         * @name instanceCards.directive:instanceCards
         * @scope
         * @restrict E
         * @requires $q
         * @requires shared.service:discoverStateService
         * @requires explore.service:exploreService
         * @requires shared.service:utilService
         * @requires shared.service:modalService
         *
         * @description
         * `instanceCards` is a directive that creates a div which contains a 3 column grid used to display the
         * instance details for a class associated with a dataset record. The directive is replaced by the
         * contents of its template.
         */
        .directive('instanceCards', instanceCards);

        instanceCards.$inject = ['$q', 'discoverStateService', 'exploreService', 'exploreUtilsService', 'utilService', 'modalService']

        function instanceCards($q, discoverStateService, exploreService, exploreUtilsService, utilService, modalService) {
            return {
                restrict: 'E',
                templateUrl: 'discover/explore/directives/instanceCards/instanceCards.directive.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var ds = discoverStateService;
                    var es = exploreService;
                    var util = utilService;
                    var eu = exploreUtilsService;
                    dvm.chunks = getChunks(ds.explore.instanceDetails.data);
                    dvm.classTitle = _.last(ds.explore.breadcrumbs);
                    dvm.showDeleteOverlay = false;

                    dvm.view = function(item) {
                        es.getInstance(ds.explore.recordId, item.instanceIRI)
                            .then(response => {
                                ds.explore.instance.entity = response;
                                ds.explore.instance.metadata = item;
                                ds.explore.breadcrumbs.push(item.title);
                                return eu.getReferencedTitles(item.instanceIRI, ds.explore.recordId);
                            }, $q.reject)
                            .then(response => {
                                ds.explore.instance.objectMap = {};
                                if (_.has(response, 'results')) {
                                    _.forEach(response.results.bindings, binding => ds.explore.instance.objectMap[binding.object.value] = binding.title.value);
                                }
                            }, util.createErrorToast);
                    }

                    dvm.delete = function(item) {
                        es.deleteInstance(ds.explore.recordId, item.instanceIRI)
                            .then(() => {
                                util.createSuccessToast('Instance was successfully deleted.');
                                ds.explore.instanceDetails.total--;
                                if (ds.explore.instanceDetails.total === 0) {
                                    return es.getClassDetails(ds.explore.recordId);
                                }
                                if (ds.explore.instanceDetails.data.length === 1) {
                                    ds.explore.instanceDetails.currentPage--;
                                }
                                var offset = (ds.explore.instanceDetails.currentPage - 1) * ds.explore.instanceDetails.limit;
                                return es.getClassInstanceDetails(ds.explore.recordId, ds.explore.classId, {offset, limit: ds.explore.instanceDetails.limit});
                            }, $q.reject)
                            .then(response => {
                                if (ds.explore.instanceDetails.total === 0) {
                                    ds.explore.classDetails = response;
                                    ds.clickCrumb(0);
                                } else {
                                    var resultsObject = es.createPagedResultsObject(response);
                                    ds.explore.instanceDetails.data = resultsObject.data;
                                    ds.explore.instanceDetails.links = resultsObject.links;
                                }
                            }, util.createErrorToast);
                    }

                    dvm.confirmDelete = function(item) {
                        modalService.openConfirmModal('<p>Are you sure you want to delete <strong>' + item.title + '</strong>?</p>', () => dvm.delete(item));
                    }

                    $scope.$watch(() => ds.explore.instanceDetails.data, newValue => {
                        dvm.chunks = getChunks(newValue);
                    });

                    function getChunks(data) {
                        return _.chunk(_.orderBy(data, ['title']), 3);
                    }
                }]
            }
        }
})();