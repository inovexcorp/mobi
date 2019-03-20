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
     * @name search.component:discoverSearchTab
     * @requires shared.service:discoverStateService
     *
     * @description
     * HTML contents in the search tab within the discover page which gives the users the option to
     * create a SPARQL query using the provided inputs.
     */
    const discoverSearchTabComponent = {
        templateUrl: 'discover/search/components/discoverSearchTab/discoverSearchTab.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: discoverSearchTabComponentCtrl
    };

    discoverSearchTabComponent.$inject = ['discoverStateService'];

    function discoverSearchTabComponentCtrl(discoverStateService) {
        var dvm = this;
        dvm.ds = discoverStateService;
    }

    angular.module('search')
        .component('discoverSearchTab', discoverSearchTabComponent);
})();