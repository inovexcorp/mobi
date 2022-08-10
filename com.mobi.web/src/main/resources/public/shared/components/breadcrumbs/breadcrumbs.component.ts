/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import './breadcrumbs.component.scss';

/**
 * @class shared.BreadcrumbsComponent
 *
 * A component that creates a breadcrumb trail based on the provided `items` array of breadcrumb labels. The click
 * behavior of the breadcrumb is determined by the provided `onClick` function which expects the item index as an
 * argument.
 * 
 * @param {string[]} items An array of strings for the breadcrumb labels
 * @param {Function} onClick A function to be called when a breadcrumb is clicked. Expects a number as an argument
 */
@Component({
    selector: 'breadcrumbs',
    templateUrl: './breadcrumbs.component.html'
})
export class BreadcrumbsComponent {
    @Input() items: string[];
    @Output() onClick = new EventEmitter<number>();

    constructor() {}
}