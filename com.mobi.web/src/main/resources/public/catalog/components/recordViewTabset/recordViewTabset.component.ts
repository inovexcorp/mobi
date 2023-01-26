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

import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';

/**
 * @class catalog.RecordViewTabsetComponent
 *
 * A component which creates a `mat-tab`group with tabs displaying information about the provided catalog Record. These
 * tabs contain a {@link catalog.RecordMarkdownComponent} and a {@link catalog.BranchListComponent} if the Record is a
 * `VersionedRDFRecord`.
 * 
 * @param {JSONLDObject} record A JSON-LD object for a catalog Record
 * @param {boolean} canEdit Whether the Record can be edited by the current user
 * @param {Function} updateRecord A method to update the Record. Expects a parameter called `record`
 */
@Component({
    selector: 'record-view-tabset',
    templateUrl: './recordViewTabset.component.html'
})
export class RecordViewTabsetComponent {
    isVersionedRDFRecord = false;
    tabIndex = 0;

    private _record: JSONLDObject;

    @Input() set record(value: JSONLDObject) {
        this._record = value;
        this.isVersionedRDFRecord = this.cm.isVersionedRDFRecord(this._record);
    }

    get record(): JSONLDObject {
        return this._record;
    }

    @Input() canEdit: boolean;
    @Output() updateRecord = new EventEmitter<JSONLDObject>();

    constructor(public cm: CatalogManagerService) {}

    updateRecordCall(record: JSONLDObject): void {
        return this.updateRecord.emit(record);
    }
}
