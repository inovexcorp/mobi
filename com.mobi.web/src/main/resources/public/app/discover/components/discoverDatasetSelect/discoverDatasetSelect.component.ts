/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { UntypedFormGroup } from '@angular/forms';

/**
 * @class discover.DiscoverDatasetSelectComponent
 *
 * A component that creates a form containing a {@link shared.DatasetSelectComponent} to select a dataset and a button
 * to clear the selection.
 * 
 * @param {FormGroup} parentForm The parent FormGroup the {@link shared.DatasetSelectComponent} should be attached to
 * @param {string} recordId The IRI of the selected dataset record
 * @param {Function} recordIdChange A function to be called when the value of the {@link shared.DatasetSelectComponent}
 * changes.
 */

@Component({
    selector: 'discover-dataset-select',
    templateUrl: './discoverDatasetSelect.component.html',
    styleUrls: ['./discoverDatasetSelect.component.scss']
})
export class DiscoverDatasetSelectComponent {
    @Input() parentForm: UntypedFormGroup;
    @Input() recordId: string;
    @Output() recordIdChange = new EventEmitter<Record<string, unknown>>();

    clear(): void {
        this.parentForm.controls.datasetSelect.setValue('');
        this.recordId = '';
        this.recordIdChange.emit({});
    }
    onChange(recordObject: {recordId: string, recordTitle: string}): void {
        this.recordId = recordObject.recordId;
        this.recordIdChange.emit({'recordId': this.recordId, 'recordTitle': recordObject.recordTitle});
    }
}
