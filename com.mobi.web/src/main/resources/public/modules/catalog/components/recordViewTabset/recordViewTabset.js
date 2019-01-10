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
     * displaying information about the provided catalog Record. If the Record is a VersionedRDFRecord, a tab with a
     * {@link catalog.component:branchList} will be shown.
     * 
     * @param {Object} record A JSON-LD object for a catalog Record
     */
    const recordViewTabsetComponent = {
        templateUrl: 'modules/catalog/components/recordViewTabset/recordViewTabset.html',
        bindings: {
            record: '<'
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
            branches: true
        };

        dvm.$onInit = function() {
            dvm.isVersionedRDFRecord = cm.isVersionedRDFRecord(dvm.record);
        }
        dvm.$onChanges = function(changesObj) {
            dvm.isVersionedRDFRecord = cm.isVersionedRDFRecord(changesObj.record.currentValue);
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name recordViewTabset
         *
         * @description
         * The `recordViewTabset` module only provides the `recordViewTabset` component which creates a tabset that
         * contains information displays about various aspects of a catalog Record.
         */
        .module('catalog')
        /**
         * @ngdoc component
         * @name recordViewTabset.component:recordViewTabset
         * @requires catalogState.service:catalogStateService
         *
         * @description
         * `recordViewTabset` is a component that creates 
         *
         * @param {object} Record A catalog Record JSON-LD object
         */
        .component('recordViewTabset', recordViewTabsetComponent);
})();
