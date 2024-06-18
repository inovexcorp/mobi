/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';

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
    templateUrl: './keywordSelect.component.html',
    styleUrls: ['./keywordSelect.component.scss']
})
export class KeywordSelectComponent implements OnChanges {

    /**
     * Represents the chip input element.
     *
     * @typedef {ElementRef<HTMLInputElement>} chipInput
     */
    @ViewChild('chipInput') chipInput: ElementRef<HTMLInputElement>;

    readonly separatorKeysCodes: number[] = [ENTER];
    
    @Input() parentForm: UntypedFormGroup;
    @Input() clearInput: number;
    @Output() cancelEvent = new EventEmitter<null>();
    
    constructor() {}

    addKeyword(event: MatChipInputEvent): void {
        const input: HTMLInputElement = event.chipInput?.inputElement;
        const value: string = event.value;

        if ((value || '').trim()) {
            const keywords = [...this.parentForm.controls.keywords.value, value.trim()];
            this._updateKeywordsValue(keywords);
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
            this._updateKeywordsValue(this.parentForm.controls.keywords.value);
        }
    }
    cancel(): void {
        this.cancelEvent.emit();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.clearInput?.currentValue !== changes.clearInput?.previousValue) {
            this._clearInput();
        }
    }

    /**
     * Clears the input value of a chip input field and the corresponding form control.
     *
     * @description
     * This method clears the value of the chip input field and the corresponding form control if the chip input
     * element and the clearInput option are both available.
     *
     * @return {void} This method does not return anything.
     */
    private _clearInput(): void {
        if (this.chipInput && this.clearInput > 0) {
            this._updateKeywordsValue([]);
            this.chipInput.nativeElement.value = '';
        }
    }

    /**
     * Updates the `keywords` value of the parentForm control and triggers validation.
     *
     * @param {any} value - The new value to update the control with.
     *
     * @return {void}
     */
    private _updateKeywordsValue(value: any): void {
        this.parentForm.controls.keywords.setValue(value);
        this.parentForm.controls.keywords.updateValueAndValidity();
    }
}
