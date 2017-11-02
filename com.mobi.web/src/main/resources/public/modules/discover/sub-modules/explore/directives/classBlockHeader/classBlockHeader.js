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
         * @name classBlockHeader
         *
         * @description
         * The `classBlockHeader` module only provides the `classBlockHeader` directive which creates
         * the dataset selector to determine what class details are to be shown on the page.
         */
        .module('classBlockHeader', [])
        /**
         * @ngdoc directive
         * @name classBlockHeader.directive:classBlockHeader
         * @scope
         * @restrict E
         * @requires discoverState.service:discoverStateService
         * @requires explore.service:exploreService
         * @requires util.service:utilService
         *
         * @description
         * HTML contents in the class block header which provides a dropdown select to allow users to
         * pick a dataset to determine what class details are to be shown on the page.
         */
        .directive('classBlockHeader', classBlockHeader);

        classBlockHeader.$inject = ['$filter', 'discoverStateService', 'exploreService', 'exploreUtilsService', 'utilService', 'uuid'];

        function classBlockHeader($filter, discoverStateService, exploreService, exploreUtilsService, utilService, uuid) {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/sub-modules/explore/directives/classBlockHeader/classBlockHeader.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var es = exploreService;
                    var util = utilService;
                    dvm.ds = discoverStateService;
                    dvm.eu = exploreUtilsService;
                    dvm.datasetClasses = [];

                    dvm.showCancel = function() {
                        dvm.showNewInstanceOverlay = false;
                        dvm.datasetClasses = [];
                    }
                    dvm.showCreate = function() {
                        dvm.eu.getClasses(dvm.ds.explore.recordId)
                            .then(classes => {
                                dvm.datasetClasses = classes;
                                dvm.showNewInstanceOverlay = true
                            }, errorMessage => {
                                dvm.datasetClasses = [];
                                util.createErrorToast(errorMessage);
                            });
                    }
                    dvm.onSelect = function() {
                        es.getClassDetails(dvm.ds.explore.recordId)
                            .then(details => {
                                dvm.ds.explore.classDetails = details;
                            }, errorMessage => {
                                dvm.ds.explore.classDetails = [];
                                util.createErrorToast(errorMessage);
                            });
                    }
                    dvm.create = function(clazz) {
                        es.getClassInstanceDetails(dvm.ds.explore.recordId, clazz.id, {offset: 0, limit: dvm.ds.explore.instanceDetails.limit})
                            .then(response => {
                                dvm.ds.explore.creating = true;
                                dvm.ds.explore.classId = clazz.id;
                                dvm.ds.explore.classDeprecated = clazz.deprecated;
                                dvm.ds.resetPagedInstanceDetails();
                                _.merge(dvm.ds.explore.instanceDetails, es.createPagedResultsObject(response));
                                var iri;
                                if (dvm.ds.explore.instanceDetails.data.length) {
                                    var split = $filter('splitIRI')(_.head(dvm.ds.explore.instanceDetails.data).instanceIRI);
                                    iri = split.begin + split.then + uuid.v4();
                                } else {
                                    var split = $filter('splitIRI')(clazz.id);
                                    iri = 'http://mobi.com/data/' + split.end.toLowerCase() + '/' + uuid.v4();
                                }
                                dvm.ds.explore.instance.entity = [{
                                    '@id': iri,
                                    '@type': [clazz.id]
                                }];
                                dvm.ds.explore.instance.metadata.instanceIRI = iri;
                                dvm.ds.explore.breadcrumbs.push(clazz.title);
                                dvm.ds.explore.breadcrumbs.push('New Instance');
                            }, util.createErrorToast);
                    }
                }
            }
        }
})();