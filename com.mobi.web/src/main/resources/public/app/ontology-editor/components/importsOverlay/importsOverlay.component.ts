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
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSelectionListChange } from '@angular/material/list';
import { MatDialogRef } from '@angular/material/dialog';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { get, find, remove, sortBy, map, filter, some, includes } from 'lodash';
import { finalize, switchMap } from 'rxjs/operators';

import { REGEX } from '../../../constants';
import { OntologyDetails } from '../../../datasets/models/ontologyDetails.interface';
import { DCTERMS, ONTOLOGYEDITOR, OWL } from '../../../prefixes';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PaginatedConfig } from '../../../shared/models/paginatedConfig.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { getDctermsValue, getPropertyId } from '../../../shared/utility';

/**
 * @class ontology-editor.ImportsOverlayComponent
 *
 * A component that creates content for a modal that adds an imported ontology to the current
 * {@link shared.OntologyStateService#listItem selected ontology}. The form in the modal contains a `mat-tab-group to
 * choose between a URL import or an ontology within the Mobi instance. The "Server" tab contains a searchable
 * selectable list of ontologies. Only 100 will be shown at a time. Selected ontologies can be removed from the list by
 * either unchecking the checkbox in the list or clicking the x button on the associated chip. Meant to be used in
 * conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'imports-overlay',
    templateUrl: './importsOverlay.component.html',
    styleUrls: ['./importsOverlay.component.scss']
})
export class ImportsOverlayComponent implements OnInit {
    catalogId = '';
    spinnerId = 'imports-overlay';
    ontologies: OntologyDetails[] = [];
    selectedOntologies: OntologyDetails[] = [];
    urlError = '';
    serverError = '';
    getOntologyConfig: PaginatedConfig = {
        pageIndex: 0,
        limit: 100,
        type: `${ONTOLOGYEDITOR}OntologyRecord`,
        sortOption: undefined,
        searchText: ''
    };
    tabIndex = 0;

    importForm: UntypedFormGroup = this.fb.group({
        url: ['', [Validators.required, Validators.pattern(REGEX.IRI)]]
    });

    @ViewChild('ontologiesList') ontologiesList: ElementRef;
    
    constructor(private fb: UntypedFormBuilder, private http: HttpClient, private dialogRef: MatDialogRef<ImportsOverlayComponent>,
        private os: OntologyStateService, private spinnerSvc: ProgressSpinnerService, private cm: CatalogManagerService,
        private toast: ToastService, private pm: PropertyManagerService) {}
    
    ngOnInit(): void {
        this.catalogId = get(this.cm.localCatalog, '@id', '');
        this.getOntologyConfig.sortOption = find(this.cm.sortOptions, {field: `${DCTERMS}title`, asc: true});
    }
    setOntologies(): void {
        if (this.ontologiesList) {
            this.spinnerSvc.startLoadingForComponent(this.ontologiesList, 30);
        }
        this.cm.getRecords(this.catalogId, this.getOntologyConfig, true)
            .pipe(finalize(() => {
                if (this.ontologiesList) {
                    this.spinnerSvc.finishLoadingForComponent(this.ontologiesList);
                }
            }))
            .subscribe((response: HttpResponse<JSONLDObject[]>) => this._parseOntologyResults(response),
            error => this._onError(error, 1));
    }
    selectedUpdate(event: MatSelectionListChange): void {
        this.toggleOntology(event.options[0].value);
    }
    toggleOntology(ontology: OntologyDetails): void {
        ontology.selected = !ontology.selected;
        if (ontology.selected) {
            this.selectedOntologies.push(ontology);
            this.selectedOntologies = sortBy(this.selectedOntologies, 'title');
        } else {
            remove(this.selectedOntologies, ontology);
        }
    }
    onTabChanged(event: MatTabChangeEvent): void {
        if (event.index === 0) {
            this.importForm.controls.url.setValidators([Validators.required, Validators.pattern(REGEX.IRI)]);
            this.importForm.controls.url.setValue(this.importForm.controls.url.value);
        } else if (event.index === 1) {
            this.importForm.controls.url.clearValidators();
            if (this.ontologies.length === 0) {
                this.getOntologyConfig.searchText = '';
                this.selectedOntologies = [];
                this.setOntologies();
            }
        }
    }
    getOntologyIRI(record: JSONLDObject): string {
        return getPropertyId(record, `${ONTOLOGYEDITOR}ontologyIRI`);
    }
    addImport(): void {
        if (this.tabIndex === 0) {
            this.http.get('/mobirest/imported-ontologies/' + encodeURIComponent(this.importForm.controls.url.value))
                .subscribe(() => {
                    this.confirmed([this.importForm.controls.url.value], 0);
                }, () => this._onError('The provided URL was unresolvable.', 0));
        } else if (this.tabIndex === 1) {
            this.confirmed(map(this.selectedOntologies, 'ontologyIRI'), 1);
        }
    }
    confirmed(urls: string[], tabIndex: number): void {
        const importsIRI = `${OWL}imports`;
        const addedUrls = filter(urls, url => this.pm.addId(this.os.listItem.selected, importsIRI, url));
        if (addedUrls.length !== urls.length) {
            this.toast.createWarningToast('Duplicate property values not allowed');
        }
        if (addedUrls.length) {
            const urlObjs = map(addedUrls, url => ({'@id': url}));
            this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, {'@id': this.os.listItem.selected['@id'], [importsIRI]: urlObjs});
            this.os.saveCurrentChanges().pipe(
                switchMap(() => this.os.updateOntology(this.os.listItem.versionedRdfRecord.recordId, this.os.listItem.versionedRdfRecord.branchId, this.os.listItem.versionedRdfRecord.commitId, this.os.listItem.upToDate, this.os.listItem.inProgressCommit))
            ).subscribe(() => {
                this.dialogRef.close(true);
            }, errorMessage => this._onError(errorMessage, tabIndex));
        } else {
            this.dialogRef.close(false);
        }
    }

    private _parseOntologyResults(response: HttpResponse<JSONLDObject[]>) {
        this.serverError = '';
        this.ontologies = map(filter(response.body, record => this._isOntologyUnused(record)), record => ({
            recordId: record['@id'],
            ontologyIRI: this.getOntologyIRI(record),
            title: getDctermsValue(record, 'title'),
            selected: false,
            jsonld: record
        }));
        if (this.selectedOntologies.length) {
            this.ontologies.forEach(ontology => {
                if (some(this.selectedOntologies, {recordId: ontology.recordId})) {
                    ontology.selected = true;
                }
            });
        }
    }
    private _isOntologyUnused(ontologyRecord: JSONLDObject): boolean {
        return ontologyRecord['@id'] !== this.os.listItem.versionedRdfRecord.recordId && !includes(this.os.listItem.importedOntologyIds, this.getOntologyIRI(ontologyRecord));
    }
    private _onError(errorMessage: string, tabIndex: number) {
        if (tabIndex === 0) {
            this.urlError = errorMessage;
        } else if (tabIndex === 1) {
            this.ontologies = [];
            this.serverError = errorMessage;
        }
    }
}
