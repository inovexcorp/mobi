/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
    /**
     * @ngdoc component
     * @name home.component:activityCard
     * @requires provManager.service:provManagerService
     * @requires util.service:utilService
     * @requires prefixes.service:prefixes
     * @requires http.service:httpService
     *
     * @description
     * `activityCard` is a component which creates a Bootstrap `.card` containing a infinite scrolled list of the
     * most recent activities in the application. The activities are loaded 10 at a time and are displayed using
     * {@link home.component:activityTitle activityTitles}.
     */
    const activityCardComponent = {
        templateUrl: 'modules/home/components/activityCard/activityCard.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: activityCardComponentCtrl
    };

    activityCardComponentCtrl.$inject = ['provManagerService', 'utilService', 'prefixes', 'httpService'];

    function activityCardComponentCtrl(provManagerService, utilService, prefixes, httpService) {
        var dvm = this;
        var increment = 10;
        var pm = provManagerService;
        var util = utilService;
        dvm.limit = increment;
        dvm.id = 'activity-log';
        dvm.activities = [];
        dvm.entities = [];
        dvm.totalSize = 0;

        dvm.$onInit = function() {
            dvm.setPage();
        }
        dvm.$onDestroy = function() {
            httpService.cancel(dvm.id);
        }
        dvm.loadMore = function() {
            dvm.limit += increment;
            dvm.setPage();
        }
        dvm.setPage = function() {
            httpService.cancel(dvm.id);
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
            return {pageIndex: 0, limit: dvm.limit};
        }
    }

    angular.module('home')
        .component('activityCard', activityCardComponent);
})();