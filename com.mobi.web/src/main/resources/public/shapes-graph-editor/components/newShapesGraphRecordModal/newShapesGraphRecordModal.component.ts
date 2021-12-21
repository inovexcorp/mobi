/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, Inject } from '@angular/core';
import { FormArray, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';
import { MatChipInputEvent } from '@angular/material/chips';
import { RdfUpload } from '../../../shared/models/rdfUpload.interface';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';

import './newShapesGraphRecordModal.component.scss';

/**
 * @class shapes-graph-editor.NewShapesGraphRecordModalComponent
 * 
 * A component that creates content for a modal to create a new ShapesGraphRecord.
 */
@Component({
    selector: 'new-shapes-graph-record-modal',
    templateUrl: './newShapesGraphRecordModal.component.html'
})
export class NewShapesGraphRecordModalComponent {
    errorMessage = '';
    createRecordForm = this.fb.group({
        title: ['', Validators.required],
        description: [''],
        keywords: this.fb.array([])
    });
    selectedFile: File;
    // Keyword chips
    selectable = true;
    removable = true;
    addOnBlur = true;
    readonly separatorKeysCodes = [ENTER, COMMA] as const;

    constructor(private dialogRef: MatDialogRef<NewShapesGraphRecordModalComponent>, private fb: FormBuilder,
                private state: ShapesGraphStateService, @Inject('utilService') private util) {}

    create(): void {
        const rdfUpload: RdfUpload = {
            title: this.createRecordForm.controls.title.value,
            description: this.createRecordForm.controls.description.value,
            keywords: this.createRecordForm.controls.keywords.value,
            file: this.selectedFile
        };
        this.state.uploadShapesGraph(rdfUpload)
            .then(() => this.dialogRef.close(true),
                    error => {
                        this.util.createErrorToast(error);
                        this.dialogRef.close(false);
                    }
            );
    }
    add(event: MatChipInputEvent): void {
        const value = (event.value || '').trim();
        const input = event.input;

        if (value && this.keywordControls.value.indexOf(value) < 0) {
            this.keywordControls.push(this.fb.control(value));
        }

        if (input) {
            input.value = '';
        }
    }
    remove(keyword: string): void {
        const index = this.keywordControls.value.indexOf(keyword);
        if (index >= 0) {
            this.keywordControls.removeAt(index);
        }
    }

    get keywordControls(): FormArray {
        return this.createRecordForm.controls.keywords as FormArray;
    }
}
