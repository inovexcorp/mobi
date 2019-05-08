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
     * @name explore.component:exploreTab
     * @requires shared.service:discoverStateService
     *
     * @description
     * `exploreTab` is a component that creates a {@link explore.component:classBlock} to explore data within a dataset.
     * It also provides an {@link explore.component:instanceBlock}, an {@link explore.component:instanceView},
     * an {@link explore.component:instanceEditor}, and an {@link explore.component:instanceCreator} for viewing and
     * managing instance data.
     *
     */
    const exploreTabComponent = {
        templateUrl: 'discover/explore/components/exploreTab/exploreTab.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: exploreTabComponentCtrl
    };

    exploreTabComponent.$inject = ['discoverStateService'];

    function exploreTabComponentCtrl(discoverStateService) {
        var dvm = this;
        dvm.ds = discoverStateService;
    }

    angular.module('explore')
        .component('exploreTab', exploreTabComponent);
})();