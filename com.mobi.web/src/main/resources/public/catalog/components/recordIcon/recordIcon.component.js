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
     * @name catalog.component:recordIcon
     * @requires catalogState.service:catalogStateService
     *
     * @description
     * `recordIcon` is a component that creates a Font Awesome Icon stack for the provided catalog Record using the
     * {@link catalogState.service:catalogStateService}.
     *
     * @param {object} Record A catalog Record JSON-LD object
     */
    const recordIconComponent = {
        templateUrl: 'catalog/components/recordIcon/recordIcon.component.html',
        bindings: {
            record: '<'
        },
        controllerAs: 'dvm',
        controller: recordIconComponentCtrl
    };

    recordIconComponentCtrl.$inject = ['catalogStateService'];

    function recordIconComponentCtrl(catalogStateService) {
        var dvm = this;
        var state = catalogStateService;
        dvm.icon = '';

        dvm.$onInit = function() {
            dvm.icon = state.getRecordIcon(dvm.record);
        }
        dvm.$onChanges = function(changesObj) {
            dvm.icon = state.getRecordIcon(changesObj.record.currentValue);
        }
    }

    angular.module('catalog')
        .component('recordIcon', recordIconComponent);
})();
