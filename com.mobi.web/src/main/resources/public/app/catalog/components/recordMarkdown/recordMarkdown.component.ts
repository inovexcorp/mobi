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
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { isEmpty } from 'lodash';

import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { getDctermsValue, removeDctermsValue, updateDctermsValue } from '../../../shared/utility';

/**
 * @class catalog.RecordMarkdownComponent
 *
 * A component which creates a display for the `dcterms:abstract` of the provided catalog Record as markdown HTML. If
 * the user can edit the record, as determined by the provided `canEdit` boolean, the display will turn into a
 * `MatMarkdownEditor`. Saving the edited markdown will call the provided `updateRecord` method passing the edited
 * Record JSON-LD.
 * 
 * @param {JSONLDObject} record A JSON-LD object for a catalog Record
 * @param {boolean} canEdit Whether the Record can be edited by the current user
 * @param {Function} updateRecord A method to update the Record. Expects a parameter called `record` and that the
 * method will return a Promise.
 */
@Component({
    selector: 'record-markdown',
    templateUrl: './recordMarkdown.component.html'
})
export class RecordMarkdownComponent {
    text = '';
    edit = false;
    editMarkdown = ''
    showPreview = false;

    private _record: JSONLDObject;

    @Input() set record(value: JSONLDObject) {
        this._record = value;
        this._updateHtml(this._record);
    }

    get record(): JSONLDObject {
        return this._record;
    }

    @Input() canEdit: boolean;
    @Output() updateRecord = new EventEmitter<JSONLDObject>();

    constructor() {}
    
    showEdit(): void {
        if (this.canEdit) {
            this.edit = true;
            this.editMarkdown = getDctermsValue(this.record, 'abstract');
        }
    }
    saveEdit(): void {
        const originalValue = getDctermsValue(this.record, 'abstract');
        if (originalValue === this.editMarkdown) {
            this.edit = false;
            this.editMarkdown = '';
        } else {
            if (!this.editMarkdown) {
                removeDctermsValue(this.record, 'abstract', originalValue);
            } else {
                updateDctermsValue(this.record, 'abstract', this.editMarkdown);
            }
            this.updateRecord.emit(this.record);
            this.edit = false;
            this.editMarkdown = '';
            this._updateHtml(this.record);
        }
    }
    cancelEdit(): void {
        this.edit = false;
        this.editMarkdown = '';
        this.showPreview = false;
    }
    
    private _updateHtml(record: JSONLDObject): void {
        if (record && !isEmpty(record)) {
            this.text = getDctermsValue(record, 'abstract');
        }
    }
}
