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
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { isArray, join, map } from 'lodash';

@Component({
  selector: 'file-input',
  templateUrl: 'fileInput.component.html',
})
export class FileInputComponent implements OnChanges {
  /**
   * File extensions to accept. Required Field.
   * @type {string[]}
   */
  @Input() accept: string[];
  /**
   * Text to display above the button. Optional Field.
   * @type {string}
   */
  @Input() displayText?: string;
  /**
   * Accept multiple files on upload. Optional Field.
   * @type {string | boolean}
   */
  @Input() multiple?: string | boolean;
  /**
   * Sets the input field as required. Optional Field.
   * @type {string | boolean}
   */
  @Input() required?: string | boolean;
  /**
   * The file or files object to populate. Required Field.
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

  /**
   * Method that is invoked immediately after the default change detector has checked 
   * data-bound properties if at least one has changed
   *
   * @returns {void}
   */
  ngOnChanges(changes: SimpleChanges): void {
    if ('required' in changes) {
      const isRequiredCurrentValue = changes.required.currentValue;
      if (isRequiredCurrentValue === true || isRequiredCurrentValue === false) {
        this.isRequired = isRequiredCurrentValue;
      } else {
        this.isRequired = isRequiredCurrentValue !== undefined;
      }
    } else {
      this.isRequired = false;
    }
    if ('multiple' in changes) {
      const multipleCurrentValue = changes?.multiple.currentValue;
      if (multipleCurrentValue === true || multipleCurrentValue === false) {
        this.isMultiple = multipleCurrentValue;
      } else {
        this.isMultiple = multipleCurrentValue !== undefined;
      }
    } else {
      this.isMultiple = false;
    }
    if ('files' in changes) {
      this._handleFilesField(changes.files.currentValue);
    }
  }

  /**
   * Handles the input for file selection and sets the appropriate text based on the files provided.
   * 
   * @private
   * @param {File[] | File} files - The file or array of files selected by the user.
   */
  private _handleFilesField(files: File[] | File): void {
    const isFilesArray = isArray(files);
    if (isFilesArray && files.length) {
      this.selected = true;
      this.text = this._collectFileNames(files);
    } else if (!isFilesArray && files) {
      this.selected = true;
      this.text = files.name;
    } else {
      this.selected = false;
      this._resetText();
    }
  }

  /**
   * Handles file selection updates.
   * - Captures the file(s) selected by the user from the file input element.
   * - Updates the component's selected state and display text based on the selected file(s).
   * - Emits the selected file(s) through the `filesChange` output event.
   * - If no files are selected, resets the display text and emits an empty array or `undefined`.
   * 
   * @param {Event} event - The DOM event triggered by the file input element.
   * @returns {void}
   */
  update(event: Event): void {
    const target = event.target as HTMLInputElement;
    const files: File[] = target.files && target.files.length ? [...Array.from(target.files)] : [];
    this._fileUpdateEvent(files);
  }

  /**
   * Handles the event when files are selected or updated, updating the component's state accordingly.
   * 
   * @private
   * @param {File[]} files - An array of `File` objects representing the files selected by the user.
   */
  private _fileUpdateEvent(files: File[]): void {
    if (files.length) {
      if (this.isMultiple) {
        this.selected = true;
        this.text = this._collectFileNames(files);
        this.filesChange.emit(files);
      } else {
        this.selected = true;
        this.text = files[0].name;
        this.filesChange.emit(files[0]);
      }
    } else {
      this.selected = false;
      this._resetText();
      this.filesChange.emit(this.multiple ? [] : undefined);
    }
  }

  /**
   * Collects the names of the selected files into a single comma-separated string.
   * - Static method, used internally to format file names for display.
   * 
   * @param {File[]} files - An array of File objects selected by the user.
   * 
   * @private
   * @returns {string} - A comma-separated string of file names.
   */
  private _collectFileNames(files: File[]): string {
    return join(map(files, 'name'), ', ');
  }

  /**
   * Resets the display text when no files are selected.
   * - Sets the text to 'No file selected' or 'No files selected' based on whether multiple files are allowed.
   * 
   * @private
   * @returns {void}
   */
  private _resetText(): void {
    this.text = this.isMultiple ? 'No files selected' : 'No file selected';
  }
}
