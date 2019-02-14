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
     * @name catalog.component:recordViewTabset
     * @requires catalogManager.service:catalogManagerService
     *
     * @description
     * `recordViewTabset` is a component which creates a {@link materialTabset.directive:materialTabset} with tabs
     * displaying information about the provided catalog Record. These tabs contain a
     * {@link catalog.component.recordMarkdown} and a {@link catalog.component:branchList} if the Record is a 
     * `VersionedRDFRecord`.
     * 
     * @param {Object} record A JSON-LD object for a catalog Record
     * @param {boolean} canEdit Whether the Record can be edited by the current user
     * @param {Function} updateRecord A method to update the Record. Expects a parameter called `record`
     */
    const recordViewTabsetComponent = {
        templateUrl: 'modules/catalog/components/recordViewTabset/recordViewTabset.html',
        bindings: {
            record: '<',
            canEdit: '<',
            updateRecord: '&'
        },
        controllerAs: 'dvm',
        controller: recordViewTabsetComponentCtrl
    };

    recordViewTabsetComponentCtrl.$inject = ['catalogManagerService'];

    function recordViewTabsetComponentCtrl(catalogManagerService) {
        var dvm = this;
        var cm = catalogManagerService;
        dvm.isVersionedRDFRecord = false;
        dvm.tabs = {
            overview: true,
            branches: false
        };

        dvm.$onInit = function() {
            dvm.isVersionedRDFRecord = cm.isVersionedRDFRecord(dvm.record);
        }
        dvm.$onChanges = function(changesObj) {
            if (changesObj.record) {
                dvm.isVersionedRDFRecord = cm.isVersionedRDFRecord(changesObj.record.currentValue);
            }
        }
        dvm.updateRecordCall = function(record) {
            return dvm.updateRecord({record});
        }
    }

    angular.module('catalog')
        .component('recordViewTabset', recordViewTabsetComponent);
})();
