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
         * @name saveAnalyticOverlay
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
         * @requires util.service:utilService
         *
         * @description
         * HTML contents in the save analytic overlay which with inputs for the analytic's title, description,
         * and keywords.
         */
        .directive('saveAnalyticOverlay', saveAnalyticOverlay);
        
        saveAnalyticOverlay.$inject = ['analyticManagerService', 'analyticStateService', 'prefixes', 'utilService'];
        
        function saveAnalyticOverlay(analyticManagerService, analyticStateService, prefixes, utilService) {
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
                    dvm.config = angular.copy(state.record);
                    
                    dvm.submit = function() {
                        _.unset(state, 'selectedConfigurationId');
                        _.merge(dvm.config, state.createTableConfigurationConfig());
                        manager.createAnalytic(dvm.config)
                            .then(ids => {
                                dvm.close();
                                state.record = angular.copy(dvm.config);
                                state.record.analyticRecordId = ids.analyticRecordId;
                                state.selectedConfigurationId = ids.configurationId;
                                utilService.createSuccessToast('Analytic successfully saved');
                            }, errorMessage => dvm.error = errorMessage);
                    }
                }
            }
        }
})();