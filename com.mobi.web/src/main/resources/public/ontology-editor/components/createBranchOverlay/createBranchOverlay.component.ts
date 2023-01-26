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
import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';
import { get } from 'lodash';
import { switchMap } from 'rxjs/operators';

import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { CATALOG } from '../../../prefixes';
import { NewConfig } from '../../../shared/models/newConfig.interface';

/**
 * @class ontology-editor.CreateBranchOverlayComponent
 *
 * A component that creates content for a modal that creates a branch in the current
 * {@link shared.OntologyStateService#listItem selected ontology}. The form in the modal contains a field for the branch
 * title and a field for the branch description. Meant to be used in conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'create-branch-overlay',
    templateUrl: './createBranchOverlay.component.html',
})
export class CreateBranchOverlayComponent implements OnInit {
    error: string;
    catalogId: string;
    
    createForm = this.fb.group({
        title: ['', Validators.required],
        description: [''],
    });
    
    constructor(private fb: FormBuilder,
        private dialogRef: MatDialogRef<CreateBranchOverlayComponent>, 
        private os: OntologyStateService, 
        private cm: CatalogManagerService) {}

    ngOnInit(): void {
        this.catalogId = get(this.cm.localCatalog, '@id', '');
    }
    create(): void  {
        const branchConfig: NewConfig = this.createForm.value;
        this.cm.createRecordBranch(this.os.listItem.versionedRdfRecord.recordId, this.catalogId, branchConfig, this.os.listItem.versionedRdfRecord.commitId)
            .pipe(
                switchMap((branchId: string) => this.cm.getRecordBranch(branchId, this.os.listItem.versionedRdfRecord.recordId, this.catalogId)),
                switchMap((branch: JSONLDObject) => { 
                    this.os.listItem.branches.push(branch);
                    this.os.listItem.versionedRdfRecord.branchId = branch['@id'];
                    const commitId = branch[CATALOG + 'head'][0]['@id'];
                    this.os.collapseFlatLists();
                    this.os.listItem.upToDate = true;
                    this.os.resetStateTabs();
                    return this.os.updateState({
                        recordId: this.os.listItem.versionedRdfRecord.recordId, 
                        commitId, 
                        branchId: this.os.listItem.versionedRdfRecord.branchId
                    });
                })
            ).subscribe(() => {
                this.dialogRef.close(true);
                this.os.resetStateTabs();
            }, error => this.onError(error));
    }
    onError(errorMessage: string): void {
        this.error = errorMessage;
    }
}
