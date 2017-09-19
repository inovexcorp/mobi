/*-
 * #%L
 * org.matonto.web
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
         * @name activityList
         *
         * @description
         * The `activityList` module only provides the `activityList` directive which creates a paginated list of
         * provenance data.
         */
        .module('activityList', [])
        /**
         * @ngdoc directive
         * @name activityList.directive:activityList
         * @scope
         * @restrict E
         * @requires $q
         * @requires provManager.service:provManagerService
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `activityList` is a directive which creates a Bootstrap row with a {@link block.directive:block block}
         * containing a paginated list of `Activities`. The directive is replaced by the contents of its template.
         */
        .directive('activityList', activityList);

        activityList.$inject = ['$q', 'provManagerService', 'utilService', 'prefixes'];

        function activityList($q, provManagerService, utilService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/activityLog/directives/activityList/activityList.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var util = utilService;
                    var pm = provManagerService;
                    dvm.activities = [];
                    dvm.entities = [];
                    dvm.paginatedConfig = {
                        pageIndex: 0,
                        limit: 50
                    };
                    dvm.totalSize = 0;
                    dvm.links = {
                        prev: '',
                        next: ''
                    };

                    dvm.getPage = function(direction) {
                        if (direction === 'prev') {
                            util.getResultsPage(dvm.links.prev, util.rejectError)
                                .then(response => {
                                    setActivities(response);
                                    dvm.paginatedConfig.pageIndex -= 1;
                                }, util.createErrorToast);
                        } else {
                            util.getResultsPage(dvm.links.next, util.rejectError)
                                .then(response => {
                                    setActivities(response);
                                    dvm.paginatedConfig.pageIndex += 1;
                                }, util.createErrorToast);
                        }
                    }
                    dvm.getTimeStamp = function(activity) {
                        var dateStr = util.getPropertyValue(activity, prefixes.prov + 'endedAtTime');
                        return util.getDate(dateStr, 'short')
                    }

                    function setActivities(response) {
                        dvm.activities = response.data.activities;
                        dvm.entities = response.data.entities;
                        var headers = response.headers();
                        dvm.totalSize = _.get(headers, 'x-total-count', 0);
                        var links = util.parseLinks(_.get(headers, 'link', ''));
                        dvm.links.prev = _.get(links, 'prev', '');
                        dvm.links.next = _.get(links, 'next', '');
                    }

                    pm.getActivities(dvm.paginatedConfig).then(setActivities, util.createErrorToast);
                }
            }
        }
})();
