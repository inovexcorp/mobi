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
     * @name catalog.component:recordSearch
     * @requires catalogManager.service:catalogManagerService
     *
     * @description
     * `recordSearch` is a component which creates a Bootstrap `input-group` with a text input for searching through
     * catalog Records and a submit button. The `searchText` will be the value of the input, but is one way bound. The
     * `search` function is expected to update the `searchText` binding and will be run when the button is clicked.
     * 
     * @param {Function} search A function that expects a parameter called `searchText` and will be called when the
     * "Search" button is clicked. This function should update the `searchText` binding.
     * @param {string} searchText The value of the text input.
     */
    const recordSearchComponent = {
        templateUrl: 'modules/catalog/directives/recordSearch/recordSearch.html',
        bindings: {
            search: '&',
            searchText: '<',
        },
        controllerAs: 'dvm',
        controller: recordSearchComponentCtrl
    };

    recordSearchComponentCtrl.$inject = ['catalogManagerService'];

    function recordSearchComponentCtrl(catalogManagerService) {
        var dvm = this;
        dvm.cm = catalogManagerService;

        dvm.submitSearch = function() {
            dvm.search({searchText: dvm.searchText});
        }
    }

    angular.module('catalog')
        .component('recordSearch', recordSearchComponent);
})();
