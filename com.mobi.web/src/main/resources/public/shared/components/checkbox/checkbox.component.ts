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
import { MatCheckboxChange } from '@angular/material/checkbox';

/**
 * @ngdoc component
 * @name shared.component:checkbox
 * @requires $timeout
 *
 * @description 
 * `checkbox` is a component that creates a checkbox styled using the Bootstrap "checkbox" class, a custom disabled
 * condition, and custom label text. The true and false values of the checkbox will always be the boolean true and
 * false values. The `bindModel` variable is one way bound so the provided `changeEvent` function is expected to
 * update the value of `bindModel`.
 *
 * @param {boolean} model the variable to bind the value of the checkbox to
 * @param {function} modelChange an EventEmitter for when the checkbox value is updated. Should update the value of `model`.
 * @param {string} [displayText=''] label text to display for the checkbox
 * @param {boolean} [isDisabledWhen=false] when the checkbox should be disabled
 */

@Component({
    selector: 'checkbox',
    templateUrl: './checkbox.component.html'
})
export class CheckboxComponent {
    @Input() model: boolean;
    @Output() modelChange = new EventEmitter<boolean>();

    @Input() displayText: string;
    @Input() inline?: boolean;
    @Input() isDisabled: boolean;

    onChange($event: MatCheckboxChange): void {
        setTimeout(() => this.modelChange.emit($event.checked));
    }
}
