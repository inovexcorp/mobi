/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { switchMap } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { REGEX } from '../../../constants';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { splitIRI } from '../../../shared/pipes/splitIRI.pipe';
import { TagConfig } from '../../../shared/models/tagConfig.interface';

/**
 * @class ontology-editor.CreateTagOverlayComponent
 *
 * A component that creates content for a modal that creates a tag on the current
 * {@link shared.OntologyStateService#listItem selected ontology} on the commit that is currently being viewed. The form
 * in the modal contains two text inputs for the tag IRI and the title of the tag. Meant to be used in conjunction with
 * the `MatDialog` service.
 */
@Component({
    selector: 'create-tag-overlay',
    templateUrl: './createTagOverlay.component.html',
    styleUrls: ['./createTagOverlay.component.scss']
})
export class CreateTagOverlayComponent implements OnInit {
    iriPattern = REGEX.IRI;
    catalogId = '';
    error = '';
    iriHasChanged = false;

    createForm = this.fb.group({
        title: ['', [ Validators.required]],
        iri: ['', [Validators.required, Validators.pattern(this.iriPattern)]],
    });

    constructor(private fb: UntypedFormBuilder, private dialogRef: MatDialogRef<CreateTagOverlayComponent>,
        private cm: CatalogManagerService, public os: OntologyStateService, private camelCase: CamelCasePipe) {}

    ngOnInit(): void {
        this.catalogId = get(this.cm.localCatalog, '@id', '');
        let tagIRI = this.os.listItem.ontologyId;
        const endChar = this.os.listItem.ontologyId.slice(-1);
        if (endChar !== '/' && endChar !== '#' && endChar !== ':') {
            tagIRI += '/';
        }
        this.createForm.controls.iri.setValue(tagIRI);
        this.createForm.controls.title.valueChanges.subscribe(newVal => this.nameChanged(newVal));
    }
    manualIRIEdit(): void {
        this.iriHasChanged = true;
    }
    nameChanged(newName: string): void {
        if (!this.iriHasChanged) {
            const split = splitIRI(this.createForm.controls.iri.value);
            this.createForm.controls.iri.setValue(split.begin + split.then + this.camelCase.transform(newName, 'class'));
        }
    }
    create(): void {
        const tagConfig: TagConfig = {
            iri: this.createForm.controls.iri.value,
            title: this.createForm.controls.title.value,
            commitId: this.os.listItem.versionedRdfRecord.commitId
        };
        this.cm.createRecordTag(this.os.listItem.versionedRdfRecord.recordId, this.catalogId, tagConfig).pipe(
            switchMap(() => this.cm.getRecordVersion(tagConfig.iri, this.os.listItem.versionedRdfRecord.recordId, this.catalogId)),
            switchMap(tag => {
                this.os.listItem.tags.push(tag);
                this.os.listItem.versionedRdfRecord.branchId = '';
                return this.os.updateState({recordId: this.os.listItem.versionedRdfRecord.recordId, commitId: tagConfig.commitId, tagId: tag['@id']});
            }))
            .subscribe(() => {
                this.dialogRef.close(true);
            }, error => this._onError(error));
    }

    private _onError(errorMessage) {
        this.error = errorMessage;
    }
}
