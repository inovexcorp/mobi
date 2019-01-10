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
     * @name catalog.component:recordFilters
     * @requires catalogManager.service:catalogManagerService
     *
     * @description
     * `recordFilters` is a component which creates a Bootstrap `form-group` with a
     * {@link catalogManager.service:catalogManagerService record type} filter select. The `recordType` will be the
     * value of the select, but is one way bound. The `changeFilter` function is expected to update the `recordType`
     * binding.
     * 
     * @param {Function} changeFilter A function that expects a parameter called `recordType` and will be called when
     * the value of the select is changed. This function should update the `recordType` binding.
     * @param {string} recordType The value of the select. Should be a catalog Record type string.
     */
    const recordFiltersComponent = {
        templateUrl: 'modules/catalog/components/recordFilters/recordFilters.html',
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