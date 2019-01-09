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
(function() {
    'use strict';

    /**
     * @ngdoc component
     * @name catalog.component:recordTypes
     * @requires catalogManager.service:catalogManagerService
     *
     * @description
     * `recordTypes` is a directive that creates a div with a {@link catalog.component:recordType recordType}
     * for each of the passed catalog Record's "@type" values. The types are filtered based on whether they are in the
     * list of record types in the {@link catalogManager.service:catalogMangerService} and sorted alphabetically.
     *
     * @param {Object} record A JSON-LD object representing a catalog Record
     */
    const recordTypesComponent = {
        templateUrl: 'modules/catalog/directives/recordTypes/recordTypes.html',
        bindings: {
            record: '<'
        },
        controllerAs: 'dvm',
        controller: recordTypesComponentCtrl
    };

    recordTypesComponentCtrl.$inject = ['catalogManagerService'];

    function recordTypesComponentCtrl(catalogManagerService) {
        var dvm = this;
        dvm.cm = catalogManagerService;
    }

    angular.module('catalog')
        .component('recordTypes', recordTypesComponent);
})();
