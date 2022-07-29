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
import { ENTER } from '@angular/cdk/keycodes';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatChipInputEvent } from '@angular/material';
import { map, get } from 'lodash';

import { CATALOG } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';

import './catalogRecordKeywords.component.scss';

/**
 * @class catalog.CatalogRecordKeywordsComponent
 *
 * A component which creates a div with Bootstrap `badge` spans for the keywords on the
 * provided catalog Record. The keywords will be sorted alphabetically. If the user is allowed to edit
 * the content, upon clicking the area it provides a `mat-chips` input. A save icon is provided to call the supplied
 * callback. When changes are made to the field and the area is blurred, the display is reset to the initial state.
 * 
 * @param {JSONLDObject} record A JSON-LD object for a catalog Record
 * @param {boolean} canEdit A boolean indicating if the user can edit the keywords
 * @param {Function} saveEvent A function to call with the current updated record as a parameter when the save button is pressed
 */
@Component({
    selector: 'catalog-record-keywords',
    templateUrl: './catalogRecordKeywords.component.html'
})
export class CatalogRecordKeywordsComponent {
    keywords: string[] = [];
    editedKeywords: string[] = [];
    edit = false;
    readonly separatorKeysCodes: number[] = [ENTER];

    private _record: JSONLDObject;

    @Input() set record(value: JSONLDObject) {
        this._record = value;
        this.keywords = this.getKeywords(this._record);
        this.editedKeywords = Object.assign([], this.keywords);
    }

    get record(): JSONLDObject {
        return this._record;
    }

    @Input() canEdit: boolean;
    @Output() saveEvent = new EventEmitter<JSONLDObject>();

    constructor() {}

    addKeyword(event: MatChipInputEvent): void {
        if (event.value) {
            this.editedKeywords.push(event.value);
        }
        if (event.input) {
            event.input.value = '';
        }
    }
    removeKeyword(keyword: string): void {
        const index = this.editedKeywords.indexOf(keyword);
        if (index >= 0) {
            this.editedKeywords.splice(index, 1);
        }
    }
    saveChanges(): void {
        this.edit = false;
        this.record[CATALOG + 'keyword'] = map(this.editedKeywords, keyword => ({'@value': keyword}));
        this.saveEvent.emit(this.record);
    }
    cancelChanges(): void {
        this.editedKeywords = this.keywords;
        this.edit = false;
    }

    private getKeywords(record: JSONLDObject) {
        return map(get(record, CATALOG + 'keyword', []), '@value').sort();
    }
}
