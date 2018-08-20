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
         * @requires provManager.service:provManagerService
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         * @requires httpService.service:httpService
         *
         * @description
         * `activityList` is a directive which creates a Bootstrap row with a {@link block.directive:block block}
         * containing a paginated list of `Activities`. The directive is replaced by the contents of its template.
         */
        .directive('activityList', activityList);

        activityList.$inject = ['provManagerService', 'utilService', 'prefixes', 'httpService'];

        function activityList(provManagerService, utilService, prefixes, httpService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/activityLog/directives/activityList/activityList.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var util = utilService;
                    var pm = provManagerService;
                    dvm.id = 'activity-log';
                    dvm.activities = [];
                    dvm.entities = [];
                    dvm.currentPage = 1;
                    dvm.limit = 50;
                    dvm.totalSize = 0;

                    dvm.getPage = function() {
                        pm.getActivities(getConfig(), dvm.id).then(setActivities, createToast);
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
                    }
                    function createToast(errorMessage) {
                        if (errorMessage) {
                            util.createErrorToast(errorMessage);
                        }
                    }
                    function getConfig() {
                        return {pageIndex: dvm.currentPage - 1, limit: dvm.limit};
                    }

                    pm.getActivities(getConfig(), dvm.id).then(setActivities, createToast);

                    $scope.$on('$destroy', () => httpService.cancel(dvm.id));
                }]
            }
        }
})();
