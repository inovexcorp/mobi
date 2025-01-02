/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * @class shared.SearchBarComponent
 *
 * A component that creates a 'mat-form-field' element with an input for searching a list of items. The search will be
 * submitted when the enter button is clicked. The component takes a function to be called when the search is submitted.
 *
 * @param {string} bindModel The contents of the search input
 * @param {Function} submitEvent The function to be called when the enter button is clicked
 */
@Component({
    selector: 'search-bar',
    templateUrl: './searchBar.component.html'
})
export class SearchBarComponent {
    @Input() bindModel: string;
    @Output() bindModelChange = new EventEmitter<string>();

    @Output() submitEvent = new EventEmitter<null>();

    constructor() {}

    search(): void {
        this.submitEvent.emit();
    }
    updateValue(newValue: string): void {
        this.bindModelChange.emit(newValue);
    }
}
