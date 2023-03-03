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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { map, get, sortBy, remove, difference, includes, forEach, concat, find } from 'lodash';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { CATALOG, DATASET, ONTOLOGYEDITOR } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { Repository } from '../../../shared/models/repository.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { DatasetManagerService } from '../../../shared/services/datasetManager.service';
import { DatasetStateService } from '../../../shared/services/datasetState.service';
import { RepositoryManagerService } from '../../../shared/services/repositoryManager.service';
import { UtilService } from '../../../shared/services/util.service';
import { OntologyDetails } from '../../models/ontologyDetails.interface';


/**
 * @class datasets.EditDatasetOverlayComponent
 *
 * A component that creates content for a modal with a form containing fields for editing an existing Dataset Record.
 * The form contains fields for the title, description, keywords, and
 * {@link datasets.DatasetsOntologyPickerComponent ontologies to be linked} to the Dataset Record. Meant to be used in
 * conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'edit-dataset-overlay',
    templateUrl: './editDatasetOverlay.component.html',
    styleUrls: ['./editDatasetOverlay.component.scss']
})
export class EditDatasetOverlayComponent implements OnInit {
    catalogId = '';
    error = '';
    datasetIRI = '';
    repositoryId = '';
    repository: Repository;
    keywords = [];
    selectedOntologies: OntologyDetails[] = [];
    editDatasetForm: FormGroup;

    constructor(private dialogRef: MatDialogRef<EditDatasetOverlayComponent>, private fb: FormBuilder,
        public state: DatasetStateService, public dm: DatasetManagerService, public cm: CatalogManagerService, 
        public util: UtilService, private rm: RepositoryManagerService) {}

    ngOnInit(): void {
        this.catalogId = get(this.cm.localCatalog, '@id');
        const keywords = map(this.state.selectedDataset.record[CATALOG + 'keyword'], '@value');
        keywords.sort();
        this.editDatasetForm = this.fb.group({
            title: [this.util.getDctermsValue(this.state.selectedDataset.record, 'title'), [ Validators.required]],
            description: [this.util.getDctermsValue(this.state.selectedDataset.record, 'description')],
            keywords: [keywords]
        });
        this.datasetIRI = this.util.getPropertyId(this.state.selectedDataset.record, DATASET + 'dataset');
        this.repositoryId = this.util.getPropertyValue(this.state.selectedDataset.record, DATASET + 'repository');
        this.rm.getRepository(this.repositoryId).subscribe(repo => {
            this.repository = repo;
        }, () => console.warn('Could not retrieve repository'));
        
        const selectedOntologies = this.state.selectedDataset.identifiers
            .map(identifier => this.util.getPropertyId(identifier, DATASET + 'linksToRecord'));
        forkJoin(selectedOntologies.map(id => this.cm.getRecord(id, this.catalogId).pipe(catchError(error => of(error)))))
            .subscribe((responses: (JSONLDObject[] | string)[]) => {
                const foundRecords = responses.filter((res):res is JSONLDObject[] => typeof res !== 'string');
                const matchingRecords = foundRecords.map(response => find(response, mr => selectedOntologies.includes(mr['@id'])));
                this.selectedOntologies = sortBy(matchingRecords.map(record => ({
                    recordId: record['@id'],
                    ontologyIRI: this.getOntologyIRI(record),
                    title: this.util.getDctermsValue(record, 'title'),
                    selected: true,
                    jsonld: record
                })), 'title');
            });
    }
    getOntologyIRI(record: JSONLDObject): string {
        return this.util.getPropertyId(record, ONTOLOGYEDITOR + 'ontologyIRI');
    }
    update(): void {
        const newRecord = Object.assign({}, this.state.selectedDataset.record);

        this.util.updateDctermsValue(newRecord, 'title', this.editDatasetForm.controls.title.value.trim());
        this.util.updateDctermsValue(newRecord, 'description', this.editDatasetForm.controls.description.value.trim());

        newRecord[CATALOG + 'keyword'] = [];
        this.editDatasetForm.controls.keywords.value
            .forEach(kw => this.util.setPropertyValue(newRecord, CATALOG + 'keyword', kw.trim()));

        const curOntologies = map(this.selectedOntologies, 'recordId');
        const oldOntologies = this.state.selectedDataset.identifiers
            .map(identifier => this.util.getPropertyId(identifier, DATASET + 'linksToRecord'));

        const newIdentifiers = Object.assign([], this.state.selectedDataset.identifiers);

        const added = difference(curOntologies, oldOntologies);
        const deleted = remove(newIdentifiers, identifier => 
                !includes(curOntologies, this.util.getPropertyId(identifier, DATASET + 'linksToRecord')));

        forEach(deleted, identifier => {
            remove(newRecord[DATASET + 'ontology'], {'@id': identifier['@id']});
        });

        if (added.length > 0) {
            forkJoin(added.map(recordId => this.cm.getRecordMasterBranch(recordId, this.catalogId)))
                .subscribe(responses => {
                    responses.forEach((branch, idx) => {
                        const id = this.util.getSkolemizedIRI();
                        newIdentifiers.push(this._createBlankNode(id, added[idx], branch['@id'], 
                            this.util.getPropertyId(branch, CATALOG + 'head')));
                        this.util.setPropertyId(newRecord, DATASET + 'ontology', id);
                    });
                    this._triggerUpdate(newRecord, newIdentifiers);
                }, error => this.error = error);
        } else {
            this._triggerUpdate(newRecord, newIdentifiers);
        }
    }

    private _createBlankNode(id, recordId, branchId, commitId) {
        return {
            '@id': id,
            [DATASET + 'linksToRecord']: [{ '@id': recordId }],
            [DATASET + 'linksToBranch']: [{ '@id': branchId }],
            [DATASET + 'linksToCommit']: [{ '@id': commitId }]
        };
    }
    private _triggerUpdate(newRecord, newIdentifiers) {
        const jsonld = concat(newIdentifiers, newRecord);

        // Send unparsed object to the update endpoint.
        this.dm.updateDatasetRecord(newRecord['@id'], this.catalogId, jsonld).subscribe(() => {
            this.util.createSuccessToast('Dataset successfully updated');
            this.state.selectedDataset.identifiers = newIdentifiers;
            this.state.selectedDataset.record = newRecord;
            this.dialogRef.close(true);
        }, error => this.error = error);
    }
}
