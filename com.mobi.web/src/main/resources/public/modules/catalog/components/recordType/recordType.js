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
     * @name catalog.component:recordType
     * @requires catalogManager.service:catalogManagerService
     * @requires chroma
     *
     * @description
     * `recordType` is a directive that creates a span with the Bootstrap `label` class with different background colors
     * for different record type IRIs.
     *
     * @param {string} type The record type IRI for record
     */
    const recordTypeComponent = {
        templateUrl: 'modules/catalog/directives/recordType/recordType.html',
        bindings: {
            type: '<'
        },
        controllerAs: 'dvm',
        controller: recordTypeComponentCtrl
    };

    recordTypeComponentCtrl.$inject = ['catalogManagerService', 'chroma'];

    function recordTypeComponentCtrl(catalogManagerService, chroma) {
        var dvm = this;
        var cm = catalogManagerService;
        var colors = chroma.scale('Set1').colors(cm.recordTypes.length);

        dvm.getColor = function(type) {
            return _.get(colors, cm.recordTypes.indexOf(type));
        }
    }

    angular.module('catalog') 
        .component('recordType', recordTypeComponent);
})();
