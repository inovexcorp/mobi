/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import { get } from 'lodash';
import { Inject, Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { FormBuilder, Validators } from '@angular/forms';
import { REGEX } from '../../../constants';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { SplitIRIPipe } from '../../../shared/pipes/splitIRI.pipe';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';

interface TagConfig {
    title: string,
    iri: string,
    commitId: string,
    description?: string
}

/**
 * @class shapes-graph-editor.CreateTagModal
 * 
 * A component that creates content for a modal to create a tag for the ShapesGraphRecord. The form in the modal
 * contains inputs for the iri and title and a textarea for the description of the tag.
 */
@Component({
    selector: 'create-tag-modal',
    templateUrl: './createTagModal.component.html'
})
export class CreateTagModal implements OnInit {
    catalogId: string = get(this.cm.localCatalog, '@id', '');
    iriHasChanged = false;
    iriPattern = REGEX.IRI;
    error = '';

    createTagForm = this.fb.group({
        iri: ['', Validators.required],
        title: ['', Validators.required],
        description: ['']
    });

    constructor(private state: ShapesGraphStateService, @Inject('catalogManagerService') private cm,
                private fb: FormBuilder, private dialogRef: MatDialogRef<CreateTagModal>,
                private splitIRI: SplitIRIPipe, private camelCase: CamelCasePipe) {}

    ngOnInit(): void {
        let iri = this.state.listItem.shapesGraphId;
        const endChar = iri.slice(-1);
        if (endChar !== '/' && endChar !== '#' && endChar !== ':') {
            iri += '/';
        }
        this.createTagForm.controls.iri.setValue(iri);
    }
    nameChanged(): void {
        if (!this.iriHasChanged) {
            const split = this.splitIRI.transform(this.createTagForm.controls.iri.value);
            const iri = split.begin + split.then + this.camelCase.transform(this.createTagForm.controls.title.value, 'class');
            this.createTagForm.controls.iri.setValue(iri);
        }
    }
    createTag(): Promise<any> {
        const tagConfig: TagConfig = {
            title: this.createTagForm.controls.title.value,
            iri: this.createTagForm.controls.iri.value,
            commitId: this.state.listItem.versionedRdfRecord.commitId,
            description: this.createTagForm.controls.description.value
        };
        return this.cm.createRecordTag(this.state.listItem.versionedRdfRecord.recordId, get(this.cm.localCatalog, '@id', ''), tagConfig)
            .then(tagId => {
                return this.state.changeShapesGraphVersion(this.state.listItem.versionedRdfRecord.recordId, undefined, this.state.listItem.versionedRdfRecord.commitId, tagId, this.createTagForm.controls.title.value, true);
            }, error => Promise.reject(error))
            .then(() => this.dialogRef.close(true), error => {
                this.error = error;
            });
    }
}