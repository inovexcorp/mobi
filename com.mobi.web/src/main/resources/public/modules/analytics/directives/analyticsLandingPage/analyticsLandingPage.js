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
         * @name analyticsLandingPage
         *
         * @description
         * The `analyticsLandingPage` module only provides the `analyticsLandingPage` directive which creates
         * the analytics landing page within the analytics page.
         */
        .module('analyticsLandingPage', [])
        /**
         * @ngdoc directive
         * @name analyticsLandingPage.directive:analyticsLandingPage
         * @scope
         * @restrict E
         * @requires $q
         * @requires analyticManager.service:analyticManagerService
         * @requires analyticState.service:analyticStateService
         * @requires catalogManager.service:catalogManagerService
         * @requires prefixes.service:prefixes
         * @requires util.service:utilService
         *
         * @description
         * HTML contents in the landing page of the analytics page which provides the users with a link to create
         * new analytics.
         */
        .directive('analyticsLandingPage', analyticsLandingPage);

        analyticsLandingPage.$inject = ['$q', 'analyticManagerService', 'analyticStateService', 'catalogManagerService', 'prefixes', 'utilService'];

        function analyticsLandingPage($q, analyticManagerService, analyticStateService, catalogManagerService, prefixes, utilService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/analytics/directives/analyticsLandingPage/analyticsLandingPage.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var cm = catalogManagerService;
                    var am = analyticManagerService;
                    var state = analyticStateService;
                    dvm.showCreateOverlay = false;
                    dvm.showDeleteOverlay = false;
                    dvm.recordIndex = -1;
                    dvm.util = utilService;
                    var catalogId = cm.localCatalog['@id'];
                    dvm.records = [];
                    dvm.total = 0;
                    dvm.currentPage = 1;
                    dvm.config = {
                        limit: 50,
                        pageIndex: 0,
                        recordType: prefixes.analytic + 'AnalyticRecord',
                        searchText: '',
                        sortOption: {
                            asc: false,
                            field: prefixes.dcterms + 'modified'
                        }
                    };

                    dvm.setRecords = function() {
                        dvm.config.pageIndex = dvm.currentPage - 1;
                        cm.getRecords(catalogId, dvm.config)
                            .then(setPagination, dvm.util.createErrorToast);
                    }
                    dvm.setInitialRecords = function() {
                        dvm.currentPage = 1;
                        dvm.setRecords();
                    }
                    dvm.open = function(analyticRecordId) {
                        am.getAnalytic(analyticRecordId)
                            .then(state.populateEditor, $q.reject)
                            .then(message => {
                                if (!_.isEmpty(message)) {
                                    dvm.util.createErrorToast(message);
                                }
                                state.showEditor();
                            }, dvm.util.createErrorToast);
                    }

                    dvm.showDeleteConfirmation = function(index) {
                        dvm.recordIndex = index;
                        dvm.errorMessage = '';
                        dvm.showDeleteOverlay = true;
                    }

                    dvm.deleteRecord = function() {
                        cm.deleteRecord(_.get(dvm.records[dvm.recordIndex], '@id'), catalogId)
                            .then(() => {
                                _.pullAt(dvm.records, dvm.recordIndex);
                                dvm.recordIndex = -1;
                                dvm.showDeleteOverlay = false;
                            }, errorMessage => dvm.errorMessage = errorMessage);
                    }

                    function setPagination(response) {
                        dvm.records = response.data;
                        var headers = response.headers();
                        dvm.total = _.get(headers, 'x-total-count', 0);
                    }

                    dvm.setInitialRecords();
                }
            }
        }
})();