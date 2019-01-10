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
        templateUrl: 'modules/catalog/components/recordType/recordType.html',
        bindings: {
            record: '<'
        },
        controllerAs: 'dvm',
        controller: recordTypeComponentCtrl
    };

    recordTypeComponentCtrl.$inject = ['catalogManagerService', 'utilService', 'prefixes'];

    function recordTypeComponentCtrl(catalogManagerService, utilService, prefixes) {
        var dvm = this;
        var util = utilService;
        var cm = catalogManagerService;
        dvm.type = '';

        dvm.$onInit = function() {
            dvm.type = getType();
        }
        dvm.$onChanges = function() {
            dvm.type = getType();
        }
        function getType() {
            var type = _.find(_.difference(cm.recordTypes, cm.coreRecordTypes), type => _.includes(_.get(dvm.record, '@type', []), type));
            return util.getBeautifulIRI(type || prefixes.catalog + 'Record');
        }
    }

    angular.module('catalog') 
        .component('recordType', recordTypeComponent);
})();
