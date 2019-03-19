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
     * @name mapper.component:columnSelect
     * @requires shared.service:delimitedManagerService
     *
     * @description
     * `columnSelect` is a component which creates a `ui-select` bound to the provided `selectedColumn`, but only one
     * way. The provided `changeEvent` function is expected to update the value of `selectedColumn`.
     *
     * @param {string} selectedColumn The currently selected column header index (0-based)
     * @param {Function} changeEvent The function to be called when the selected column changes. Should update the value
     * of `selectedColumn`. Expects an argument called `value`.
     */
    const columnSelectComponent = {
        templateUrl: 'mapper/components/columnSelect/columnSelect.component.html',
        bindings: {
            selectedColumn: '<',
            changeEvent: '&'
        },
        controllerAs: 'dvm',
        controller: columnSelectComponentCtrl
    };

    columnSelectComponentCtrl.$inject = ['delimitedManagerService'];

    function columnSelectComponentCtrl(delimitedManagerService) {
        var dvm = this;
        dvm.isNumber = angular.isNumber;
        dvm.dm = delimitedManagerService;
        dvm.columns = [];
        dvm.preview = '';

        dvm.$onInit = function() {
            dvm.columns = _.map(_.range(0, dvm.dm.dataRows[0].length), num => ({
                num: '' + num,
                header: dvm.dm.getHeader(num)
            }));
            dvm.preview = dvm.selectedColumn ? dvm.getValuePreview(dvm.selectedColumn) : '(None)';
        }
        dvm.compare = function(column, searchText) {
            return _.includes(_.toUpper(column.header), _.toUpper(searchText));
        }
        dvm.getValuePreview = function(num) {
            var firstRowIndex = dvm.dm.containsHeaders ? 1 : 0;
            return _.get(dvm.dm.dataRows, '[' + firstRowIndex + '][' + num + ']', '(None)');
        }
        dvm.onChange = function() {
            dvm.preview = dvm.selectedColumn ? dvm.getValuePreview(dvm.selectedColumn) : '(None)';
            dvm.changeEvent({value: dvm.selectedColumn});
        }
    }

    angular.module('mapper')
        .component('columnSelect', columnSelectComponent);
})();
