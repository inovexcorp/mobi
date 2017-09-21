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
         * @name newAnalyticOverlay
         *
         * @description
         * The `saveAnalyticOverlay` module only provides the `saveAnalyticOverlay` directive which creates
         * the save analytic overlay within the analytics page.
         */
        .module('saveAnalyticOverlay', [])
        /**
         * @ngdoc directive
         * @name saveAnalyticOverlay.directive:saveAnalyticOverlay
         * @scope
         * @restrict E
         * @requires analyticManager.service:analyticManagerService
         * @requires analyticState.service:analyticStateService
         * @requires prefixes.service:prefixes
         *
         * @description
         * HTML contents in the save analytic overlay which with inputs for the analytic's title, description,
         * and keywords.
         */
        .directive('saveAnalyticOverlay', saveAnalyticOverlay);
        
        saveAnalyticOverlay.$inject = ['analyticManagerService', 'analyticStateService', 'prefixes'];
        
        function saveAnalyticOverlay(analyticManagerService, analyticStateService, prefixes) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/analytics/directives/saveAnalyticOverlay/saveAnalyticOverlay.html',
                scope: {},
                bindToController: {
                    close: '&'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var manager = analyticManagerService;
                    var state = analyticStateService;
                    dvm.error = '';
                    dvm.config = {};
                    
                    dvm.cancel = function() {
                        state.record = {};
                        dvm.close();
                    }
                    
                    dvm.submit = function() {
                        dvm.config.type = prefixes.analytic + 'TableConfiguration';
                        dvm.config.json = JSON.stringify({
                            datasetRecordId: state.datasets[0].id,
                            row: state.selectedClass.id,
                            columns: _.map(state.selectedProperties, 'id')
                        });
                        manager.createAnalytic(dvm.config)
                            .then(analyticRecordId => {
                                dvm.close();
                                state.showLanding();
                            }, errorMessage => dvm.error = errorMessage);
                    }
                }
            }
        }
})();