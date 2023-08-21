/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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

import { OnChanges, Component, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';

export interface HierarchyFilter {
  name: string,
  checked: boolean,
  flag: boolean,
  filter: (HierarchyNode) => boolean
}
/**
 * @class ontology-editor.HierarchyFilterComponent
 *
 * `hierarchyFilter` is a component that displays a filter icon that opens a dropdown when clicked. The dropdown has a checkbox for each filter that was passed in the filters object to the component.
 *
 * @param {Object[]} filters An array of objects that represents filters. This component expects each filter to have both a flag property to denote whether a filter has been applied and a checked property to denote whether the checkbox associated with the filter has been checked. Each filter should also have a property called filter that contains a function that is the logic for the actual filter matching. Each filter should also have a name property that is used to display the name of the filter next to its checkbox.
 * @param {Function} updateFilters A function to update the filters array in the parent scope.
 * @param {Function} submitEvent A function to apply the filters in the filters array.
 */
@Component({
    selector: 'hierarchy-filter',
    templateUrl: './hierarchyFilter.component.html',
    styleUrls: ['./hierarchyFilter.component.scss']
})
export class HierarchyFilterComponent implements OnChanges {
    @Input() filters: Array<HierarchyFilter>;
    @Output() updateFilters = new EventEmitter<Array<HierarchyFilter>>();
    @Output() submitEvent = new EventEmitter<null>();

    @ViewChild('trigger', { static: true }) trigger: MatMenuTrigger;

    numFilters = 0;

    constructor() {}

    ngOnChanges(): void {
        this.numFilters = 0;
    }
    dropdownClosed(): void {
        this.filters.forEach(filter => {
            filter.checked = filter.flag;
        });
    }
    apply(): void {
        this.filters.forEach(filter => {
            filter.flag = filter.checked;
        });
        this.trigger.closeMenu();
        this.updateFilters.emit(this.filters);
        this.numFilters = filter(this.filters, 'flag').length;
        this.submitEvent.emit();
    }
}
