/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2020 iNovex Information Systems, Inc.
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
import { filter } from 'lodash';

const template = require('./hierarchyFilter.component.html');

import './hierarchyFilter.component.scss';

/**
 * @ngdoc component
 * @name ontology-editor.component:hierarchyFilter
 *
 * @description
 * `hierarchyFilter` is a component that displays a filter icon that opens a dropdown when clicked. The dropdown has a checkbox for each filter that was passed in the filters object to the component.
 *
 * @param {Object[]} filters An array of objects that represents filters. This component expects each filter to have both a flag property to denote whether a filter has been applied and a checked property to denote whether the checkbox associated with the filter has been checked. Each filter should also have a property called filter that contains a function that is the logic for the actual filter matching. Each filter should also have a name property that is used to display the name of the filter next to its checkbox.
 * @param {Function} updateFilters A function to update the filters array in the parent scope.
 * @param {Function} submitEvent A function to apply the filters in the filters array.
 */
const hierarchyFilterComponent = {
    template,
    bindings: {
        filters: '<',
        updateFilters: '&',
        submitEvent: '&'
    },
    controllerAs: 'dvm',
    controller: hierarchyFilterComponentCtrl
};

function hierarchyFilterComponentCtrl() {
    var dvm = this;
    dvm.numFilters = 0;
    dvm.dropdownOpen = false;

    dvm.$onChanges = function() {
        dvm.numFilters = 0;
        dvm.dropdownOpen = false;
    }

    dvm.dropdownToggled = function(open) {
        if (!open) {
            dvm.filters.forEach(filter => { filter.checked = filter.flag; });
        }
    }
    dvm.apply = function() {
        dvm.dropdownOpen = false;
        dvm.filters.forEach(filter => { filter.flag = filter.checked; });
        dvm.updateFilters({value: dvm.filters});
        dvm.numFilters = filter(dvm.filters, 'flag').length;
        dvm.submitEvent();
    }
}
export default hierarchyFilterComponent;