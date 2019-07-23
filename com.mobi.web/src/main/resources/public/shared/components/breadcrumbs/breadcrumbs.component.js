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
     * @name shared.component:breadcrumbs
     *
     * @description
     * `editIriOverlay` is a component that creates a breadcrumb trail based on the provided `items` array of breadcrumb
     * labels. The click behavior of the breadcrumb is determined by the provided `onClick` function which expects the
     * item index as an argument.
     * 
     * @param {string[]} items An array of strings for the breadcrumb labels
     * @param {Function} onClick A function to be called whena breadcrumb is clicked. Expects `index` as an argument
     */
    const breadcrumbsComponent = {
        templateUrl: 'shared/components/breadcrumbs/breadcrumbs.component.html',
        bindings: {
            items: '<',
            onClick: '&'
        },
        controllerAs: 'dvm',
        controller: breadcrumbsComponentCtrl
    };

    function breadcrumbsComponentCtrl() {}

    angular.module('shared')
        .component('breadcrumbs', breadcrumbsComponent);
})();