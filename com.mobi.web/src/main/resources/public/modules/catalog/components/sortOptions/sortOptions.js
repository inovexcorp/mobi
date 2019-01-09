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
(function () {
    'use strict';

    /**
     * @ngdoc component
     * @name catalog.component:sortOptions
     * @requires catalogManager.service:catalogManagerService
     *
     * @description
     * `sortOptions` is a component which creates a Bootstrap `form-group` with a select containing all sort options
     * from the {@link catalogManager.service:catalogManagerService}. The `sortOption` will be the value of the select,
     * but is one way bound. The `changeSort` function is expected to update the `sortOption` binding.
     *
     * @param {Function} changeSort A function that expects a parameter called `sortOption` and will be called when
     * the value of the select is changed. This function should update the `sortOption` binding.
     * @param {Object} sortOption A value from the `sortOptions` array in the
     * {@link catalogManager.service:catalogManagerService}
     */
    const sortOptionsComponent = {
        templateUrl: 'modules/catalog/directives/sortOptions/sortOptions.html',
        bindings: {
            sortOption: '<',
            changeSort: '&'
        },
        controllerAs: 'dvm',
        controller: sortOptionsComponentCtrl
    };

    sortOptionsComponentCtrl.$inject = ['catalogManagerService'];

    function sortOptionsComponentCtrl(catalogManagerService) {
        var dvm = this;
        dvm.cm = catalogManagerService;

        dvm.sort = function() {
            dvm.changeSort({sortOption: dvm.sortOption});
        }
    }
    angular.module('catalog')
        .component('sortOptions', sortOptionsComponent);
})();
