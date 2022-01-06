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
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { isArray, join, map } from 'lodash';

@Component({
    selector: 'file-input',
    templateUrl: 'fileInput.component.html',
})
export class FileInputComponent implements OnInit {

    /**
     * File extensions to accept.
     * @type {string[]}
     */
    @Input() accept: string[];
    /**
     * Text to display above the button.
     * @type {string}
     */
    @Input() displayText: string;
    /**
     * Accept multiple files on upload.
     * @type {string}
     */
    @Input() multiple: string;
    /**
     * Sets the input field as required
     * @type {string}
     */
    @Input() required: string;
    /**
     * The file or files object to populate
     * @type {File[] | File}
     */
    @Input() files: File[] | File;
    /**
     * The event for when the files object is updated.
     * @type {EventEmitter<File[] | File>}
     */
    @Output() filesChange: EventEmitter<File[] | File> = new EventEmitter<File[] | File>();

    isMultiple: boolean;
    isRequired: boolean;
    selected: boolean;
    text: string;
    id: string;

    ngOnInit(): void {
        this.isMultiple = this.multiple !== undefined;
        this.isRequired = this.required !== undefined;
        if ((isArray(this.files) && this.files.length) || this.files) {
            this.selected = true;
            this.text = isArray(this.files) ? FileInputComponent.collectFileNames(this.files) : this.files.name;
        } else {
            this.resetText();
        }
    }
    update(event) {
        let files: File[] = [...event.target.files];
        if (files.length) {
            if (this.multiple) {
                this.selected = true;
                this.text = FileInputComponent.collectFileNames(files);
                this.filesChange.emit(files);
            } else {
                this.selected = true;
                this.text = files[0].name;
                this.filesChange.emit(files[0]);
            }
        } else {
            this.selected = false;
            this.resetText();
            this.filesChange.emit(this.multiple ? [] : undefined);
        }
    }

    private static collectFileNames(files: File[]): string {
        return join(map(files, 'name'), ', ');
    }
    private resetText(): void {
        this.text = this.multiple ? 'No files selected' : 'No file selected';
    }
}
