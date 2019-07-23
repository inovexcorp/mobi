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
(function() {
    'use strict';

    /**
     * @ngdoc component
     * @name shared.component:paging
     *
     * @description
     * `paging` is a component that creates a div element with a `uib-pagination` and some text describing the current
     * page of the pagination. The display states which items are showing as well as the total. The pagination begins at
     * the provided 1-based index of a page. The component expects that the provided `changeEvent` function will update
     * the value of `currentPage` when directional buttons are clicked.
     *
     * @param {number} total The total number of results
     * @param {number} currentPage The index of the current page (1 based)
     * @param {number} limit The limit on the number of items per page
     * @param {Function} changeEvent The function to be called when a directional button is clicked. Should update the
     * value of `currentPage`. Expects an argument called `page`
     */
    const pagingComponent = {
        templateUrl: 'shared/components/paging/paging.component.html',
        bindings: {
            total: '<',
            currentPage: '<',
            limit: '<',
            changeEvent: '&'
        },
        controllerAs: 'dvm',
        controller: pagingComponentCtrl
    };

    pagingComponentCtrl.$inject = ['$timeout']

    function pagingComponentCtrl($timeout) {
        var dvm = this;
        dvm.Math = window.Math;

        dvm.onChange = function() {
            $timeout(function() {
                dvm.changeEvent({page: dvm.currentPage});
            });
        }
    }

    angular.module('shared')
        .component('paging', pagingComponent);
})();
