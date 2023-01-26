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

import { ENTER } from '@angular/cdk/keycodes';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material';
import './keywordSelect.component.scss';

/**
 * @class shared.KeywordSelectComponent
 * 
 * A component that creates an input with a `mat-chip-list` for editing keywords on an entity in Mobi. Uses the
 * `keywords` control on the provided `FormGroup` to capture the set keywords. Has an optional cancel event handler.
 * 
 * @param {FormGroup} parentForm The parent FormGroup to attach this input to. Expected to have a `keywords` control
 * @param {Function} cancelEvent An optional function that will be called when the escape key is hit while focusing the
 * keyword input
 */
@Component({
    selector: 'keyword-select',
    templateUrl: './keywordSelect.component.html'
})
export class KeywordSelectComponent {
    readonly separatorKeysCodes: number[] = [ENTER];
    
    @Input() parentForm: FormGroup;
    @Output() cancelEvent = new EventEmitter<null>();
    
    constructor() {}

    addKeyword(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value;

        if ((value || '').trim()) {
            this.parentForm.controls.keywords.setValue([...this.parentForm.controls.keywords.value, value.trim()]);
            this.parentForm.controls.keywords.updateValueAndValidity();
        }

        // Reset the input value
        if (input) {
            input.value = '';
        }
    }
    removeKeyword(keyword: string): void {
        const idx = this.parentForm.controls.keywords.value.indexOf(keyword);
        if (idx >= 0) {
            this.parentForm.controls.keywords.value.splice(idx, 1);
            this.parentForm.controls.keywords.updateValueAndValidity();
        }
    }
    cancel(): void {
        this.cancelEvent.emit();
    }
}
