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
import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { trim, map } from 'lodash';

import { REGEX } from '../../../constants';
import { DatasetRecordConfig } from '../../../shared/models/datasetRecordConfig.interface';
import { Repository } from '../../../shared/models/repository.interface';
import { DatasetManagerService } from '../../../shared/services/datasetManager.service';
import { RepositoryManagerService } from '../../../shared/services/repositoryManager.service';
import { UtilService } from '../../../shared/services/util.service';
import { OntologyDetails } from '../../models/ontologyDetails.interface';

/**
 * @class datasets.NewDatasetOverlayComponent
 *
 * A component that creates content for a modal with a form containing fields for creating a new Dataset Record. The
 * fields are for the title, repository id, dataset IRI, description, {@link shared.KeywordSelectComponent keywords},
 * and {@link datasets.DatasetsOntologyPickerComponent ontologies to be linked} to the new Dataset Record. The
 * repository id is a static field for now. Meant to be used in conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'new-dataset-overlay',
    templateUrl: './newDatasetOverlay.component.html'
})
export class NewDatasetOverlayComponent implements OnInit {
    iriPattern = REGEX.IRI;
    error = '';
    createDatasetForm = this.fb.group({
        title: ['', [ Validators.required]],
        description: [''],
        datasetIRI: ['', [Validators.pattern(this.iriPattern)]],
        repository: ['system', [Validators.required]],
        keywords: [[]]
    });
    selectedOntologies: OntologyDetails[] = [];
    repositories: Repository[] = [];

    constructor(private dialogRef: MatDialogRef<NewDatasetOverlayComponent>, private fb: UntypedFormBuilder,
        public dm: DatasetManagerService, public util: UtilService, private rm: RepositoryManagerService) {}
    
    ngOnInit(): void {
        this.rm.getRepositories().subscribe(repos => {
            this.repositories = repos;
        });
    }

    create(): void {
        const recordConfig: DatasetRecordConfig = {
            title: this.createDatasetForm.controls.title.value,
            description: this.createDatasetForm.controls.description.value,
            repositoryId: this.createDatasetForm.controls.repository.value,
            datasetIRI: this.createDatasetForm.controls.datasetIRI.value || '',
            keywords: map(this.createDatasetForm.controls.keywords.value, trim),
            ontologies: map(this.selectedOntologies, 'recordId')
        };
        this.dm.createDatasetRecord(recordConfig)
            .subscribe(() => {
                this.util.createSuccessToast('Dataset successfully created');
                this.dialogRef.close(true);
            }, error => this.error = error);
    }
}
