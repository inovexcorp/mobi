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

import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ToastService } from '../../services/toast.service';

/**
 * @class shared.InlineEditComponent
 *
 * A component which creates a `div` to display transcluded content. If the user is allowed to edit the content, upon
 * clicking the area it provides an `input` or a `textArea` for editing. A save icon is provided to call the supplied
 * callback. When changes are made to the field and the area is blurred, the display is reset to the initial state.
 *
 * @param {String} text The text field to edit
 * @param {boolean} canEdit A boolean indicating if the user can edit the field
 * @param {boolean} area A boolean indicating if the editable field should be a `textArea`
 * @param {boolean} required A boolean indicating if the editable field must have a non empty value
 * @param {String} placeholder Placeholder text to display when the field is empty
 * @param {Function} saveEvent A function to call when the "save" button is clicked
 */
@Component({
    selector: 'inline-edit',
    templateUrl: './inlineEdit.component.html',
    styleUrls: ['./inlineEdit.component.scss']
})
export class InlineEditComponent {
    edit = false;
    editedText = '';

    private _text: string;

    @Input() set text(value: string) {
        this._text = value;
        this.editedText = this._text;
    }

    get text(): string {
        return this._text;
    }

    @Input() canEdit: boolean;
    @Input() required: boolean;
    @Input() area: boolean;
    @Input() placeholder: string;
    @Output() saveEvent = new EventEmitter<string>();

    constructor(private toast: ToastService) {}
    
    saveChanges(): void {
        if (this.required && this.editedText === '') {
            this.onBlur();
            this.toast.createWarningToast('Text input must not be empty');
        } else {
            this.edit = false;
            this.saveEvent.emit(this.editedText);
        }
    }
    onBlur(): void {
        this.editedText = this.text;
        this.edit = false;
    }
}
