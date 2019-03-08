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
     * @name shared.component:blockSearch
     *
     * @description
     * `blockSearch` is a component that creates a styled search bar for use in a {@link shared.component:block}. The
     * search bar contains a text input and a clear button. The search text is bound to `bindModel`, but only one way.
     * The provided `changeEvent` function is expected to update the value of `bindModel`. The behavior when the clear
     * button is clicked is controlled by the provided `clearEvent` function.
     * 
     * @param {string} bindModel The variable bound to the search text input.
     * @param {Function} changeEvent A function that is called when the value of the text input changes. Should update
     * the value of `bindModel`. Expects an argument called `value`.
     * @param {Function} clearEvent A function that is called when the clear button is clicked.
     */
    const blockSearchComponent = {
        templateUrl: 'shared/components/blockSearch/blockSearch.component.html',
        require: '^^block',
        bindings: {
            bindModel: '<',
            changeEvent: '&',
            clearEvent: '&'
        },
        controllerAs: 'dvm',
        controller: blockSearchComponentCtrl
    };

    function blockSearchComponentCtrl() {}
    
    angular.module('shared')
        .component('blockSearch', blockSearchComponent);
})();
