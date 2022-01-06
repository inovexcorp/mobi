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
import { Component, Input, OnInit } from '@angular/core';
import './spinner.component.scss';
/**
 * @title progress-spinner
 * @description
 * `progress-spinner` is a component that creates a spinning icon with a transparent background
 */
@Component({
    selector: 'progress-spinner',
    templateUrl: 'spinner.component.html',
})
export class SpinnerComponent implements OnInit {
    @Input()  diameter: number;

    ngOnInit(): void {
        this.diameter =  this.diameter || 50;
    }
}
