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
         * @name classCards
         *
         * @description
         * The `classCards` module only provides the `classCards` directive which creates a grid of cards
         * with all of the class details about a dataset record.
         */
        .module('classCards', [])
        /**
         * @ngdoc directive
         * @name classCards.directive:classCards
         * @scope
         * @restrict E
         * @requires discoverState.service:discoverStateService
         * @requires explore.service:exploreService
         * @requires util.service:utilService
         *
         * @description
         * `classCards` is a directive that creates a div which contains a 3 column grid used to display the
         * class details associated with a dataset record. The directive is replaced by the contents of its template.
         */
        .directive('classCards', classCards);

        classCards.$inject = ['discoverStateService', 'exploreService', 'utilService'];

        function classCards(discoverStateService, exploreService, utilService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/sub-modules/explore/directives/classCards/classCards.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var ds = discoverStateService;
                    var es = exploreService;
                    var util = utilService;
                    dvm.chunks = _.chunk(_.orderBy(ds.explore.classDetails, ['instancesCount', 'classTitle'], ['desc', 'asc']), 3);
                    
                    dvm.exploreData = function(item) {
                        es.getClassInstanceDetails(ds.explore.recordId, item.classIRI)
                            .then(response => {
                                ds.resetPagedInstanceDetails();
                                _.merge(ds.explore.instanceDetails, es.createPagedResultsObject(response));
                                ds.explore.breadcrumbs.push(item.classTitle);
                            }, util.createErrorToast);
                    }
                }
            }
        }
})();