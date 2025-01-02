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
import { Component, Input, OnInit } from '@angular/core';
import { truncate } from 'lodash';

/**
 * @class catalog.LimitDescriptionComponent
 *
 * A component which creates a span with the provided description string limited to a specific number of characters
 * (default is 200) and a button to toggle the full display.
 *
 * @param {string} description A string to be limited
 * @param {number} limit An optional number of characters to limit the description to (default is 200)
 */
@Component({
    selector: 'limit-description',
    templateUrl: './limitDescription.component.html'
})
export class LimitDescriptionComponent implements OnInit {
    full = false;
    display = '';
    descriptionLimit = 200;

    private _description: string;

    @Input() set description(value: string) {
        this._description = value;
        this.full = false;
        this.display = this._getLimitedDescription(this._description);
    }

    get description(): string {
        return this._description;
    }

    @Input() limit?: number;

    constructor() {}

    ngOnInit(): void {
        this.descriptionLimit = this.limit || 200;
    }
    toggleFull(event: MouseEvent): void {
        event.stopPropagation();
        this.full = !this.full;
        this.display = this.full ? this.description : this._getLimitedDescription(this.description);
    }

    private _getLimitedDescription(description: string) {
        return truncate(description, {length: this.descriptionLimit});
    }
}
