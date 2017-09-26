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
         * @name classAndPropertyBlock
         *
         * @description
         * The `classAndPropertyBlock` module only provides the `classAndPropertyBlock` directive which creates
         * the class and property block within the analytics page.
         */
        .module('classAndPropertyBlock', [])
        /**
         * @ngdoc directive
         * @name classAndPropertyBlock.directive:classAndPropertyBlock
         * @scope
         * @restrict E
         * @requires analyticState.service:analyticStateService
         * @requires prefixes.service:prefixes
         * @requires util.service:utilService
         *
         * @description
         * HTML contents in the class and property block which contain class and property lists to be dragged
         * out onto the editor section to create an analytic.
         */
        .directive('classAndPropertyBlock', classAndPropertyBlock);
        
        classAndPropertyBlock.$inject = ['analyticStateService', 'prefixes', 'utilService'];
        
        function classAndPropertyBlock(analyticStateService, prefixes, utilService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/analytics/directives/classAndPropertyBlock/classAndPropertyBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var util = utilService;
                    dvm.state = analyticStateService;
                    
                    if (!dvm.state.classes.length && !dvm.state.properties.length) {
                        dvm.state.setClassesAndProperties()
                            .then(undefined, util.createErrorToast);
                    }
                    
                    dvm.isDisabled = function(classes) {
                        return !_.includes(classes, _.get(dvm.state.selectedClass, 'id'));
                    }
                }
            }
        }
})();