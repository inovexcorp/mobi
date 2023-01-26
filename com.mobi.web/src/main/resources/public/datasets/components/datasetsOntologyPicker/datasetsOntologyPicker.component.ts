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
import { HttpResponse } from '@angular/common/http';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatSelectionListChange } from '@angular/material';
import { find, get, remove, some, sortBy } from 'lodash';
import { finalize } from 'rxjs/operators';

import { DCTERMS, ONTOLOGYEDITOR } from '../../../prefixes';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PaginatedConfig } from '../../../shared/models/paginatedConfig.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { UtilService } from '../../../shared/services/util.service';
import { OntologyDetails } from '../../models/ontologyDetails.interface';

import './datasetsOntologyPicker.component.scss';

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
    templateUrl: './datasetsOntologyPicker.component.html'
})
export class DatasetsOntologyPickerComponent implements OnInit {
    catalogId = '';
    error = '';
    ontologies: OntologyDetails[] = [];
    spinnerId = 'datasets-ontology-picker';
    ontologySearchConfig: PaginatedConfig = {
        pageIndex: 0,
        sortOption: undefined,
        type: '',
        limit: 100,
        searchText: ''
    };

    @Input() selected: OntologyDetails[];
    @Output() selectedChange = new EventEmitter<OntologyDetails[]>();

    @ViewChild('datasetOntologies') datasetOntologies: ElementRef;

    constructor(public cm: CatalogManagerService, public util: UtilService, 
        private spinnerSvc: ProgressSpinnerService) {}

    ngOnInit(): void {
        this.catalogId = get(this.cm.localCatalog, '@id');
        this.ontologySearchConfig.sortOption = find(this.cm.sortOptions, {field: DCTERMS + 'title', asc: true});
        this.ontologySearchConfig.type = ONTOLOGYEDITOR + 'OntologyRecord';
        this.setOntologies();
    }
    getOntologyIRI(record: JSONLDObject): string {
        return this.util.getPropertyId(record, ONTOLOGYEDITOR + 'ontologyIRI');
    }
    setOntologies(): void {
        this.spinnerSvc.startLoadingForComponent(this.datasetOntologies, 30);
        this.cm.getRecords(this.catalogId, this.ontologySearchConfig, true)
            .pipe(finalize(() => this.spinnerSvc.finishLoadingForComponent(this.datasetOntologies)))
            .subscribe((response: HttpResponse<JSONLDObject[]>) => this.parseOntologyResults(response),
            error => this._onError(error));
    }
    selectedUpdate(event: MatSelectionListChange): void {
        this.toggleOntology(event.option.value);
    }
    parseOntologyResults(response: HttpResponse<JSONLDObject[]>): void {
        this.error = '';
        this.ontologies = response.body.map(record => ({
            recordId: record['@id'],
            ontologyIRI: this.getOntologyIRI(record),
            title: this.util.getDctermsValue(record, 'title'),
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
            remove(this.selected, {recordId: ontology.recordId});
        }
        this.selectedChange.emit(this.selected);
    }

    private _onError(errorMessage) {
        this.ontologies = [];
        this.error = errorMessage;
        this.spinnerSvc.finishLoadingForComponent(this.datasetOntologies);
    }
}
