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
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatChipInputEvent, MatDialogRef } from '@angular/material';
import { map, trim, uniq } from 'lodash';

import { Mapping } from '../../../shared/models/mapping.class';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { MappingManagerService } from '../../../shared/services/mappingManager.service';

/**
 * @class mapper.CreateMappingOverlayComponent
 *
 * A component that creates content for a modal with three inputs for metadata about a new MappingRecord: a text input
 * for the title, a textarea for the description, and a field for the keywords. Meant to be used in conjunction with the
 * `MatDialog` service.
 * 
 */
@Component({
    selector: 'create-mapping-overlay',
    templateUrl: './createMappingOverlay.component.html'
})
export class CreateMappingOverlayComponent implements OnInit {
    errorMessage = '';
    createMappingForm = this.fb.group({
        title: ['', [ Validators.required]],
        description: [''],
        keywords: [[]]
    });
    readonly separatorKeysCodes: number[] = [ENTER];

    constructor(private mm: MappingManagerService, private state: MapperStateService, private fb: FormBuilder,
        private dialogRef: MatDialogRef<CreateMappingOverlayComponent>,) {}
    
    ngOnInit(): void {
        if (this.state.selected.record) {
            this.createMappingForm.controls.title.setValue(this.state.selected.record.title);
            this.createMappingForm.controls.description.setValue(this.state.selected.record.description);
            this.createMappingForm.controls.keywords.setValue(this.state.selected.record.keywords);
        }
    }
    cancel(): void {
        this.state.editMapping = false;
        this.state.newMapping = false;
        this.state.selected = undefined;
        this.state.sourceOntologies = [];
        this.state.availableClasses = [];
        this.dialogRef.close();
    }
    continue(): void {
        this.state.selected.config = {
            title: this.createMappingForm.controls.title.value,
            description: this.createMappingForm.controls.description.value,
            keywords: uniq(map(this.createMappingForm.controls.keywords.value, trim))
        };
        const newId = this.mm.getMappingId(this.createMappingForm.controls.title.value);
        if (this.state.selected.mapping) {
            this.state.selected.mapping = this.state.selected.mapping.copy(newId);
            const sourceOntologyInfo = this.state.selected.mapping.getSourceOntologyInfo();
            this.mm.getSourceOntologies(sourceOntologyInfo)
                .subscribe(ontologies => {
                    this.state.sourceOntologies = ontologies;
                    this.state.availableClasses = this.state.getClasses(ontologies);
                    this._nextStep();
                }, () => this._onError('Error retrieving mapping'));
        } else {
            this.state.selected.mapping = new Mapping(newId);
            this.state.sourceOntologies = [];
            this.state.availableClasses = [];
            this._nextStep();
        }
    }
    addKeyword(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value;

        if ((value || '').trim()) {
            this.createMappingForm.controls.keywords.setValue([...this.createMappingForm.controls.keywords.value, value.trim()]);
            this.createMappingForm.controls.keywords.updateValueAndValidity();
        }

        // Reset the input value
        if (input) {
            input.value = '';
        }
    }
    removeKeyword(keyword: string): void {
        const idx = this.createMappingForm.controls.keywords.value.indexOf(keyword);
        if (idx >= 0) {
            this.createMappingForm.controls.keywords.value.splice(idx, 1);
            this.createMappingForm.controls.keywords.updateValueAndValidity();
        }
    }

    private _nextStep() {
        this.errorMessage = '';
        this.state.selected.difference.additions = Object.assign([], this.state.selected.mapping.getJsonld());
        this.state.step = this.state.fileUploadStep;
        this.dialogRef.close();
    }
    private _onError(message) {
        this.errorMessage = message;
    }
}
