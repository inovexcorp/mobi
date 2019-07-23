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
     * @name mapper.component:previewDataGrid
     *
     * @description 
     * `previewDataGrid` is a component that creates a HandsonTable (`hot-table`) with the provided delimited `rows`
     * array. The `hot-table` will automatically update whenever new data is provided, the provided `highlightIndexes`
     * change, and whether the data `containsHeaders` changes. The `hot-table` is uneditable and the user cannot select
     * a cell within it.
     * 
     * @param {string[]} rows An array of arrays of delimited data.
     * @param {string[]} highlightIndexes An array of 0-based indexes in strings indicating which columns should be
     * highlighted.
     * @param {boolean} containsHeaders Whether the delimited data contains a header row
     */
    const previewDataGridComponent = {
        templateUrl: 'mapper/components/previewDataGrid/previewDataGrid.component.html',
        bindings: {
            rows: '<',
            highlightIndexes: '<',
            containsHeaders: '<'
        },
        controllerAs: 'dvm',
        controller: previewDataGridComponentCtrl
    };

    function previewDataGridComponentCtrl() {
        var dvm = this;
        dvm.hotTable;
        dvm.settings = {};
        dvm.data = [];
        
        dvm.$onInit = function() {
            dvm.data = angular.copy(dvm.rows);
            dvm.settings = {
                minCols: 50,
                minRows: 50,
                readOnly: true,
                readOnlyCellClassName: 'text',
                disableVisualSelection: 'current',
                multiSelect: false,
                fillHandle: false,
                outsideClickDeselects: false,
                cells: (row, col, prop) => {
                    var props = {};
                    props.renderer = (hotInstance, el, row, col, prop, value) => {
                        var classes = [];
                        if (row === 0 && dvm.containsHeaders && dvm.rows) {
                            classes.push('header');
                        }
                        if (_.includes(dvm.highlightIndexes, '' + col)) {
                            classes.push('highlight-col');
                        }
                        el.className = _.join(classes, ' ');
                        el.innerHTML = value;
                        return el;
                    };
                    return props;
                },
                onBeforeOnCellMouseDown: (event, coords) => {
                    event.stopImmediatePropagation();
                },
                onAfterInit: function() {
                    dvm.hotTable = this;
                }
            };
        }
        dvm.$onChanges = function(changesObj) {
            if (_.has(changesObj, 'rows')) {
                dvm.data = angular.copy(changesObj.rows.currentValue);
            }
            if (dvm.hotTable && (_.has(changesObj, 'highlightIndexes') || (_.has(changesObj, 'containsHeaders') && dvm.rows))) {
                dvm.hotTable.render();
            }
        }
    }

    angular.module('mapper')
        .component('previewDataGrid', previewDataGridComponent);
})();