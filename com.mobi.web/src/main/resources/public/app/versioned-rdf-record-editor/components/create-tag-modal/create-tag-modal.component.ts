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
import { get } from 'lodash';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { switchMap, tap } from 'rxjs/operators';

import { REGEX } from '../../../constants';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { splitIRI } from '../../../shared/pipes/splitIRI.pipe';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { stateServiceToken } from '../../../shared/injection-token';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { VersionedRdfStateBase } from '../../../shared/models/versionedRdfStateBase.interface';
import { Difference } from '../../../shared/models/difference.class';
import { RESTError } from '../../../shared/models/RESTError.interface';

interface TagConfig {
    title: string,
    iri: string,
    commitId: string,
    description?: string
}

/**
 * @class versioned-rdf-record-editor.CreateTagModal
 * 
 * A component that creates content for a modal to create a tag for the VersionedRDFRecord. The form in the modal
 * contains inputs for the iri and title and a textarea for the description of the tag.
 */
@Component({
    selector: 'app-create-tag-modal',
    templateUrl: './create-tag-modal.component.html'
})
export class CreateTagModalComponent<TData extends VersionedRdfListItem> implements OnInit {
    catalogId: string = get(this._cm.localCatalog, '@id', '');
    iriHasChanged = false;
    iriPattern = REGEX.IRI;
    error = '';

    createTagForm = this._fb.group({
        iri: ['', [Validators.required, Validators.pattern(this.iriPattern)]],
        title: ['', Validators.required],
        description: ['']
    });

    constructor(@Inject(stateServiceToken) private _state: VersionedRdfState<TData>, private _cm: CatalogManagerService,
                private _fb: UntypedFormBuilder, private _dialogRef: MatDialogRef<CreateTagModalComponent<TData>>,
                private _camelCase: CamelCasePipe) {}

    ngOnInit(): void {
        let iri = this._state.getIdentifierIRI();
        const endChar = iri.slice(-1);
        if (endChar !== '/' && endChar !== '#' && endChar !== ':') {
            iri += '/';
        }
        this.createTagForm.controls.iri.setValue(iri);
    }
    nameChanged(): void {
        if (!this.iriHasChanged) {
            const split = splitIRI(this.createTagForm.controls.iri.value);
            const iri = split.begin + split.then + this._camelCase.transform(this.createTagForm.controls.title.value, 
              'class');
            this.createTagForm.controls.iri.setValue(iri);
        }
    }
    createTag(): void {
        const tagConfig: TagConfig = {
            title: this.createTagForm.controls.title.value,
            iri: this.createTagForm.controls.iri.value,
            commitId: this._state.listItem.versionedRdfRecord.commitId,
            description: this.createTagForm.controls.description.value
        };
        let tagId;
        this._cm.createRecordTag(this._state.listItem.versionedRdfRecord.recordId, this.catalogId, tagConfig).pipe(
            switchMap(response => {
                tagId = response;
                const state: VersionedRdfStateBase = {
                    recordId: this._state.listItem.versionedRdfRecord.recordId,
                    branchId: undefined,
                    commitId: this._state.listItem.versionedRdfRecord.commitId,
                    tagId
                };
                return this._state.updateState(state);
            }),
            tap(() => {
                this._state.listItem.versionedRdfRecord.branchId = undefined;
                this._state.listItem.versionedRdfRecord.tagId = tagId;
                this._state.listItem.currentVersionTitle = this.createTagForm.controls.title.value;
                this._state.listItem.inProgressCommit = new Difference();
                this._state.listItem.upToDate = true;
            })
        ).subscribe(() => this._dialogRef.close(true), (error: string | RESTError) => {
            this.error = typeof error === 'string' ? error : error.errorMessage;
        });
    }
}
