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
     * @ngdoc directive
     * @name shared.component:searchBar
     *
     * @description
     * `searchBar` is a component that creates a Bootstrap '.input-group' div element with an input for searching a list
     * of items. The search will be submitted when the enter button is clicked. The component takes a function to be
     * called when the search is submitted. The value of the input is bound to `bindModel`, but only one way. The
     * provided `changeEvent` function is expected to update the value of `bindModel`.
     *
     * @param {string} bindModel The contents of the search input
     * @param {Function} changeEvent The function to be called when the text of the input changes. Should update the
     * value of `bindModel`. Expects an argument called `value`
     * @param {Function} submitEvent The function to be called when the enter button is clicked
     */
    const searchBarComponent = {
        templateUrl: 'shared/components/searchBar/searchBar.component.html',
        bindings: {
            bindModel: '<',
            changeEvent: '&',
            submitEvent: '&'
        },
        controllerAs: 'dvm',
        controller: searchBarComponentCtrl
    };

    function searchBarComponentCtrl() {
        var dvm = this;

        dvm.onKeyUp = function(event) {
            if (event.keyCode === 13) {
                dvm.submitEvent();
            }
        }
    }

    angular.module('shared')
        .component('searchBar', searchBarComponent);
})();
