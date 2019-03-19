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
     * @name datasets.component:datasetsPage
     *
     * @description
     * `datasetsPage` is a component which creates the main page of the Datasets module. The component contains
     * a {@link datasets.component.datasetsTabset datsetsTabset} for navigating the Datasets module
     */
    const datasetsPageComponent = {
        templateUrl: 'datasets/components/datasetsPage/datasetsPage.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: datasetsPageComponentCtrl
    };

    datasetsPageComponentCtrl.$inject = [];

    function datasetsPageComponentCtrl() {
        var dvm = this;
    }

    angular.module('datasets')
        .component('datasetsPage', datasetsPageComponent);
})();
