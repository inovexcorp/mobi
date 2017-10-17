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
         * @name newAnalyticOverlay
         *
         * @description
         * The `newAnalyticOverlay` module only provides the `newAnalyticOverlay` directive which creates
         * the new analytic overlay within the analytics page.
         */
        .module('newAnalyticOverlay', [])
        /**
         * @ngdoc directive
         * @name newAnalyticOverlay.directive:newAnalyticOverlay
         * @scope
         * @restrict E
         * @requires analyticState.service:analyticStateService
         * @requires datasetManager.service:datasetManagerService
         * @requires prefixes.service:prefixes
         * @requires util.service:utilService
         *
         * @description
         * HTML contents in the new analytic overlay which contain a list of datasets to specify the data
         * used to create an analytic.
         */
        .directive('newAnalyticOverlay', newAnalyticOverlay);
        
        newAnalyticOverlay.$inject = ['analyticStateService', 'datasetManagerService', 'prefixes', 'utilService'];
        
        function newAnalyticOverlay(analyticStateService, datasetManagerService, prefixes, utilService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/analytics/directives/newAnalyticOverlay/newAnalyticOverlay.html',
                scope: {},
                bindToController: {
                    onCancel: '&'
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var state = analyticStateService;
                    var dm = datasetManagerService;
                    var util = utilService;
                    dvm.datasets = _.map(dm.datasetRecords, arr => {
                        var record = _.find(arr, '@type');
                        var ontologies = state.getOntologies(arr, record);
                        return {
                            id: record['@id'],
                            datasetIRI: util.getPropertyId(record, prefixes.dataset + 'dataset'),
                            selected: false,
                            title: util.getDctermsValue(record, 'title'),
                            ontologies
                        };
                    });
                    
                    dvm.submit = function() {
                        state.datasets = _.map(_.filter(dvm.datasets, 'selected'), dataset => ({
                            id: dataset.id,
                            ontologies: dataset.ontologies
                        }));
                        state.showEditor();
                        dvm.onCancel();
                    }
                    
                    dvm.change = function(changed) {
                        _.forEach(dvm.datasets, dataset => {
                            if (dataset.id !== changed.id) {
                                dataset.selected = false;
                            }
                        });
                    }
                    
                    dvm.isSubmittable = function() {
                        return _.some(dvm.datasets, 'selected');
                    }
                }
            }
        }
})();