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
(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name analyticsButtonStack
         *
         * @description
         * The `analyticsButtonStack` module only provides the `analyticsButtonStack` directive which creates
         * the analytics button stack within the analytics page.
         */
        .module('analyticsButtonStack', [])
        /**
         * @ngdoc directive
         * @name analyticsButtonStack.directive:analyticsButtonStack
         * @scope
         * @restrict E
         * @requires analyticState.service:analyticStateService
         * @requires analyticManager.service:analyticManagerService
         * @requires util.service:utilService
         *
         * @description
         * HTML contents in the button stack section of the analytics page which provides the users with a stack
         * buttons to do various actions with the page.
         */
        .directive('analyticsButtonStack', analyticsButtonStack);
        
        analyticsButtonStack.$inject = ['analyticStateService', 'analyticManagerService', 'utilService'];

        function analyticsButtonStack(analyticStateService, analyticManagerService, utilService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/analytics/directives/analyticsButtonStack/analyticsButtonStack.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var manager = analyticManagerService;
                    var util = utilService;
                    dvm.state = analyticStateService;
                    dvm.showSaveOverlay = false;
                    
                    dvm.save = function() {
                        if (!_.has(dvm.state, 'record.analyticRecordId')) {
                            dvm.showSaveOverlay = true;
                        } else {
                            manager.updateAnalytic(_.set(dvm.state.createTableConfigurationConfig(), 'analyticRecordId', dvm.state.record.analyticRecordId))
                                .then(() => {
                                    util.createSuccessToast('Analytic successfully saved');
                                }, util.createErrorToast);
                        }
                    }
                }
            }
        }
})();
