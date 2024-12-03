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
import { HttpResponse } from '@angular/common/http';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, OnChanges } from '@angular/core';
import { MatSelectionListChange } from '@angular/material/list';
import { find, get, some, sortBy, filter } from 'lodash';
import { finalize } from 'rxjs/operators';

import { CATALOG, DCTERMS, ONTOLOGYEDITOR } from '../../../prefixes';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PaginatedConfig } from '../../../shared/models/paginatedConfig.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyDetails } from '../../models/ontologyDetails.interface';
import { getDctermsValue, getPropertyId } from '../../../shared/utility';

/**
 * @class datasets.DatasetsOntologyPickerComponent
 *
 * A component which creates a searchable list for selecting ontologies along with an editable display of selected
 * ontologies. The `selected` binding will determine which ontologies will display as selected and it is two way bound.
 *
 * @param {OntologyDetails[]} selected A list of objects representing the selected ontologies
 */
@Component({
    selector: 'datasets-ontology-picker',
    templateUrl: './datasetsOntologyPicker.component.html',
    styleUrls: ['./datasetsOntologyPicker.component.scss']
})
export class DatasetsOntologyPickerComponent implements OnChanges {
    catalogId = '';
    error = '';
    ontologies: OntologyDetails[] = [];
    ontologySearchConfig: PaginatedConfig = {
        pageIndex: 0,
        sortOption: undefined,
        type: [],
        limit: 100,
        searchText: ''
    };

    @Input() readyFlag: boolean; // Wait for parent component to set ready flag
    @Input() selected: OntologyDetails[];
    @Output() selectedChange = new EventEmitter<OntologyDetails[]>();
    @Output() interceptorErrorDetection  = new EventEmitter<void>();

    @ViewChild('datasetOntologies', { static: true }) datasetOntologies: ElementRef;

    constructor(public cm: CatalogManagerService, private spinnerSvc: ProgressSpinnerService) {}

    ngOnChanges(): void {
        this.catalogId = get(this.cm.localCatalog, '@id');
        this.ontologySearchConfig.sortOption = find(this.cm.sortOptions, {field: `${DCTERMS}title`, asc: true});
        this.ontologySearchConfig.type = [`${ONTOLOGYEDITOR}OntologyRecord`];
        this.setOntologies();
    }
    getOntologyIRI(record: JSONLDObject): string {
        return getPropertyId(record, `${CATALOG}trackedIdentifier`);
    }
    setOntologies(): void {
        if (this.readyFlag) {
            let nextCalled = false;
            this.spinnerSvc.startLoadingForComponent(this.datasetOntologies, 30);
            this.cm.getRecords(this.catalogId, this.ontologySearchConfig, true)
                .pipe(
                    finalize(() => this.spinnerSvc.finishLoadingForComponent(this.datasetOntologies))
                ).subscribe({
                    next: (response: HttpResponse<JSONLDObject[]>) => {
                        nextCalled = true;
                        this.parseOntologyResults(response);
                    }, 
                    error: (error) => {
                        nextCalled = true;
                        this._onError(error)
                    },
                    complete: () => {
                        if (!nextCalled) {
                            this.interceptorErrorDetection.emit()
                        }
                    }
                });
        }
    }
    selectedUpdate(event: MatSelectionListChange): void {
        this.toggleOntology(event.options[0].value);
    }
    parseOntologyResults(response: HttpResponse<JSONLDObject[]>): void {
        this.error = '';
        this.ontologies = response.body.map(record => ({
            recordId: record['@id'],
            ontologyIRI: this.getOntologyIRI(record),
            title: getDctermsValue(record, 'title'),
            selected: some(this.selected, {recordId: record['@id']}),
            jsonld: record
        }));
        this.spinnerSvc.finishLoadingForComponent(this.datasetOntologies);
    }
    toggleOntology(ontology: OntologyDetails): void {
        ontology.selected = !ontology.selected;
        if (ontology.selected) {
            this.selected.push(ontology);
            this.selected = sortBy(this.selected, 'title');
        } else {
            this.selected = filter(this.selected, function(selectedRecord) {
                return ontology.recordId !== selectedRecord.recordId;
            });
        }
        this.selectedChange.emit(this.selected);
    }

    private _onError(errorMessage: string): void {
        this.ontologies = [];
        this.error = errorMessage;
        this.spinnerSvc.finishLoadingForComponent(this.datasetOntologies);
    }
}
