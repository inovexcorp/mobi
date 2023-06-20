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

import { Component, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MappingRecord } from '../../../shared/models/mappingRecord.interface';

import { MappingManagerService } from '../../../shared/services/mappingManager.service';

/**
 * @class mapper.DownloadMappingOverlayComponent
 *
 * A component that content for a modal to download the provided {@link MappingRecord} in a variety of different formats
 * using a {@link mapper.MapperSerializationSelectComponent}. Meant to be used in conjunction with the `MatDialog`
 * service.
 */
@Component({
    selector: 'download-mapping-overlay',
    templateUrl: './downloadMappingOverlay.component.html'
})
export class DownloadMappingOverlayComponent {
    downloadMappingForm: UntypedFormGroup = this.fb.group({
        serialization: ['turtle', Validators.required]
    });

    constructor(private dialogRef: MatDialogRef<DownloadMappingOverlayComponent>, private fb: UntypedFormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: {record: MappingRecord}, private mm: MappingManagerService) {}

    download(): void {
        this.mm.downloadMapping(this.data.record.id, this.downloadMappingForm.controls.serialization.value);
        this.dialogRef.close(true);
    }
}
