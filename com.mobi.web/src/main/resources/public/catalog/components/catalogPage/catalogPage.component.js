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
     * @name catalog.component:catalogPage
     * @requires shared.service:catalogStateService
     *
     * @description
     * `catalogPage` is a component which creates the main page of the Catalog module. The component contains different
     * content depending on whether a catalog Record has been selected.
     */
    const catalogPageComponent = {
        templateUrl: 'catalog/components/catalogPage/catalogPage.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: catalogPageComponentCtrl
    };

    catalogPageComponentCtrl.$inject = ['catalogStateService'];

    function catalogPageComponentCtrl(catalogStateService) {
        var dvm = this;
        dvm.state = catalogStateService;
    }

    angular.module('catalog')
        .component('catalogPage', catalogPageComponent);
})();
