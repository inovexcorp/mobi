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

import { filter } from 'lodash';

const template = require('./hierarchyFilter.component.html');

import './hierarchyFilter.component.scss';

/**
 * @ngdoc component
 * @name ontology-editor.component:everythingTree
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:ontologyStateService
 * @requires shared.service:utilService
 *
 * @description
 * `hierarchyFilter` is a component that creates a a `div` containing a {@link shared.component:searchBar} and
 * hierarchy of {@link ontology-editor.component:treeItem}. When search text is provided, the hierarchy filters
 * what is shown based on value matches with predicates in the
 * {@link shared.service:ontologyManagerService entityNameProps}.
 *
 * @param {Object[]} hierarchy An array which represents a flattened everything hierarchy
 * @param {Function} updateSearch A function to update the state variable used to track the search filter text
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
