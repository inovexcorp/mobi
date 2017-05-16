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
        .module('classCards', [])
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
                    dvm.chunks = _.chunk(_.orderBy(ds.explore.classDetails, ['count', 'label'], ['desc', 'asc']), 3);
                    
                    dvm.exploreData = function(item) {
                        es.getClassInstanceDetails(ds.explore.recordId, item.classId)
                            .then(response => {
                                _.merge(ds.explore.instanceDetails, es.createPagedResultsObject(response));
                                ds.explore.breadcrumbs.push(item.label);
                            }, util.createErrorToast);
                    }
                }
            }
        }
})();