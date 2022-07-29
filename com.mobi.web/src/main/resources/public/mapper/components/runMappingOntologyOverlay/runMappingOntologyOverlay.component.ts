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
import { HttpResponse } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatDialogRef } from '@angular/material';
import { find, get } from 'lodash';
import { Observable } from 'rxjs';
import { debounceTime, map, startWith, switchMap } from 'rxjs/operators';

import { DCTERMS, ONTOLOGYEDITOR } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';

import './runMappingOntologyOverlay.component.scss';

interface OntologyPreview {
    id: string,
    title: string,
    ontologyIRI: string
}

/**
 * @class mapper.RunMappingOntologyOverlayComponent
 *
 * A component that creates content for a modal that contains a configuration settings for running the currently
 * selected {@link shared.MapperStateService#selected mapping} against the uploaded
 * {@link shared.DelimitedManagerService#dataRows delimited data} and committing the results to an Ontology. This
 * includes `mat-autocomplete`s to determine which ontology and which branch to commit the mapping to. The user can also
 * choose whether the result data should be considered additions or changes to the existing data on that branch. Meant
 * to be used in conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'run-mapping-ontology-overlay',
    templateUrl: './runMappingOntologyOverlay.component.html'
})
export class RunMappingOntologyOverlayComponent implements OnInit {
    errorMessage = '';
    catalogId = '';
    ontologies = [];
    branches = [];
    branch: JSONLDObject = undefined;
    ontology: OntologyPreview = undefined;
    update = false;

    ontologyControl = new FormControl();
    filteredOntologies: Observable<OntologyPreview[]>;

    constructor(private dialogRef: MatDialogRef<RunMappingOntologyOverlayComponent>, private state: MapperStateService,
        private dm: DelimitedManagerService, private cm: CatalogManagerService,
        @Inject('ontologyStateService') private os, @Inject('utilService') private util) {}

    ngOnInit(): void {
        this.catalogId = get(this.cm.localCatalog, '@id', '');
        this.filteredOntologies = this.ontologyControl.valueChanges
            .pipe(
                debounceTime(500),
                startWith<string | OntologyPreview>(''),
                switchMap(val => {
                    const searchText = typeof val === 'string' ?
                        val :
                        val ?
                            val.title :
                            undefined;
                    const paginatedConfig = {
                        limit: 50,
                        type: ONTOLOGYEDITOR + 'OntologyRecord',
                        sortOption: find(this.cm.sortOptions, {field: DCTERMS + 'title', asc: true}),
                        searchText
                    };
                    return this.cm.getRecords(this.catalogId, paginatedConfig, true)
                        .pipe(
                            map((response: HttpResponse<JSONLDObject[]>) => {
                                return response.body.map(record => ({
                                    id: record['@id'],
                                    title: this.util.getDctermsValue(record, 'title'),
                                    ontologyIRI: this.getOntologyIRI(record)
                                }));
                            })
                        );
                })
            );
    }
    getDisplayText(value: OntologyPreview): string {
        return value ? value.title : '';
    }
    selectOntology(event: MatAutocompleteSelectedEvent): void {
        if (event.option.value) {
            this.ontology = event.option.value;
            this._setOntologyBranches(event.option.value);
        }
    }
    getOntologyIRI(ontology: JSONLDObject): string {
        return this.util.getPropertyId(ontology, ONTOLOGYEDITOR + 'ontologyIRI');
    }
    run(): void {
        if (this.state.editMapping && this.state.isMappingChanged()) {
            this.state.saveMapping()
                .subscribe(id => this._runMapping(id), error => this._onError(error));
        } else {
            this._runMapping(this.state.selected.record.id);
        }
    }
    private _onError(errorMessage: string): void {
        this.errorMessage = errorMessage;
    }
    private _runMapping(id: string): void {
        this.dm.mapAndCommit(id, this.ontology.id, this.branch['@id'], this.update).subscribe(response => {
            if (response.status === 204) {
                this.util.createWarningToast('No commit was submitted, commit was empty due to duplicate data', {timeOut: 8000});
                this._reset();
            } else {
                this._testOntology(this.ontology);
                this._reset();
            }
        }, error => this._onError(error));
    }
    private _reset(): void {
        this.errorMessage = '';
        this.state.step = this.state.selectMappingStep;
        this.state.initialize();
        this.state.resetEdit();
        this.dm.reset();
        this.dialogRef.close();
    }
    private _testOntology(ontology: OntologyPreview): void {
        const item = find(this.os.list, {ontologyRecord: {recordId: ontology.id}});
        let toast = false;
        if (item) {
            if (get(item, 'ontologyRecord.branchId') === this.branch['@id']) {
                item.upToDate = false;
                if (item.merge.active) {
                    this.util.createWarningToast(`You have a merge in progress in the Ontology Editor for ${ontology.title} that is out of date. Please reopen the merge form.`, {timeOut: 5000});
                    toast = true;
                }
            }
            if (item.merge.active && get(item.merge.target, '@id') === this.branch['@id']) {
                this.util.createWarningToast(`You have a merge in progress in the Ontology Editor for ${ontology.title} that is out of date. Please reopen the merge form to avoid conflicts.`, {timeOut: 5000});
                toast = true;
            }
        }
        if (!toast) {
            this.util.createSuccessToast('Successfully ran mapping');
        }
    }
    private _setOntologyBranches(ontology: OntologyPreview): void {
        const paginatedConfig = {
            sortOption: find(this.cm.sortOptions, {field: DCTERMS + 'title', asc: true}),
        };
        if (ontology.id) {
            this.cm.getRecordBranches(ontology.id, this.catalogId, paginatedConfig)
                .subscribe((response: HttpResponse<JSONLDObject[]>) => {
                    this.branches = response.body;
                    this.branch = this.branches.find(branch => this.util.getDctermsValue(branch, 'title') === 'MASTER');
                });
        }
    }
}
