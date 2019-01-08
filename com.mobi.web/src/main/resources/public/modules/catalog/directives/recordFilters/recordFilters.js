/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
(function () {
    'use strict';

    /**
     * @ngdoc component
     * @name recordFilters.component:recordFilters
     * @requires catalogManager.service:catalogManagerService
     *
     * @description
     * `recordFilters` is a component which creates a Bootstrap `row` with a
     * {@link catalogManager.service:catalogManagerService#recordTypes record type} filter select, a
     * {@link catalogState.service:catalogStateService search text} input, and a submit button. A
     * submission of this form will affect the
     * {@link catalogState.service:catalogStateService#results list of records} shown in a
     * {@link resultsBlock.directive:resultsBlock resultsBlock} and navigate back to the current
     * {@link catalogState.service:catalogStateService#catalogs catalog}.
     */
    const recordFiltersComponent = {
        templateUrl: 'modules/catalog/directives/recordFilters/recordFilters.html',
        bindings: {
            changeFilter: '&',
            recordType: '<'
        },
        controllerAs: 'dvm',
        controller: recordFiltersComponentCtrl
    };

    recordFiltersComponentCtrl.$inject = ['catalogManagerService'];

    function recordFiltersComponentCtrl(catalogManagerService) {
        var dvm = this;
        dvm.cm = catalogManagerService;

        dvm.filter = function() {
            dvm.changeFilter({recordType: dvm.recordType});
        }
    }

    angular.module('catalog')
        .component('recordFilters', recordFiltersComponent);
})();