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
import { some, find, get, isEmpty } from 'lodash';
import { finalize } from 'rxjs/operators';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { animateChild, query, transition, trigger } from '@angular/animations';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { DCTERMS, ONTOLOGYEDITOR } from '../../../prefixes';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { NewOntologyOverlayComponent } from '../newOntologyOverlay/newOntologyOverlay.component';
import { UploadOntologyOverlayComponent } from '../uploadOntologyOverlay/uploadOntologyOverlay.component';
import { UtilService } from '../../../shared/services/util.service';
import { SettingManagerService } from '../../../shared/services/settingManager.service';

interface OntologyRecordDisplay {
    title: string,
    ontologyIRI: string,
    description: string,
    jsonld: JSONLDObject
}

/**
 * @class ontology-editor.OpenOntologyTabComponent
 *
 * A component that creates a page for opening ontologies. The page includes a paginated searchable list of
 * OntologyRecords with the ability to delete and open. Each ontology displays its title, ontology IRI, and description.
 * In addition, the page includes buttons for {@link ontology-editor.NewOntologyOverlayComponent creating new ontologies}
 * and {@link ontology-editor.UploadOntologyOverlayComponent uploading ontologies}.
 */
@Component({
    selector: 'open-ontology-tab',
    templateUrl: './openOntologyTab.component.html',
    styleUrls: [
        './openOntologyTab.component.scss',
        '../../../shared/directives/dragFile/dragFile.directive.scss'],
    animations: [
        trigger('ngIfAnimation', [
            transition(':enter, :leave', [
                query('@*', animateChild(), { optional: true })
            ])
        ])
    ]
})
export class OpenOntologyTabComponent implements OnInit {
    pageIndex = 0;
    limit = 10;
    totalSize = 0;
    filteredList: OntologyRecordDisplay[] = [];
    searchBindModel = '';
    filterText = '';
    showSnackbar = false;

    @ViewChild('openOntologyFileInput', { static: true }) fileInput: ElementRef;
    @ViewChild('ontologyList', { static: true }) ontologyList: ElementRef;

    constructor(public dialog: MatDialog, private spinnerSvc: ProgressSpinnerService, public om: OntologyManagerService, 
        public os: OntologyStateService, public ms: MapperStateService, private cm: CatalogManagerService, 
        private sm: SettingManagerService, public util: UtilService) {}

    ngOnInit(): void {
        this.setPageOntologyRecords(0, '');
    }
    clickUpload(): void {
        this.fileInput.nativeElement.value = null;
        this.fileInput.nativeElement.click();
    }
    updateFiles(files: FileList): void {
        if (files) {
            this.os.uploadFiles = Array.from(files);
            this.showUploadOntologyOverlay();
        }
    }
    showUploadOntologyOverlay(): void {
        const overlay = this.dialog.open(UploadOntologyOverlayComponent);
        overlay.componentInstance.uploadStarted.subscribe(result => {
            if (result) {
                this.showSnackbar = true;
            } else {
                if (this.os.uploadPending === 0) {
                    this.search();
                }
            }
        });
    }
    closeSnackbar(): void {
        this.showSnackbar = false;
    }
    isOpened(record: JSONLDObject): boolean {
        return some(this.os.list, {versionedRdfRecord: {recordId: record['@id']}});
    }
    open(record: OntologyRecordDisplay): void {
        const listItem: OntologyListItem = find(this.os.list, {versionedRdfRecord: {recordId: record.jsonld['@id']}});
        if (listItem) {
            this.os.listItem = listItem;
            this.os.listItem.active = true;
        } else {
            this.os.openOntology(record.jsonld['@id'], record.title)
                .subscribe(() => {}, error => this.util.createErrorToast(error));
        }
    }
    newOntology(): void {
        this.sm.getDefaultNamespace()
            .subscribe(defaultNamespace => {
                this.dialog.open(NewOntologyOverlayComponent, { autoFocus: false, data: { defaultNamespace } });
            }, error => this.util.createErrorToast(error));
    }
    showDeleteConfirmationOverlay(record: OntologyRecordDisplay): void {
        const recordId = get(record.jsonld, '@id', '');

        let msg = '';
        if (find(this.ms.sourceOntologies, {recordId: recordId})) {
            msg += '<error-display>Warning: The ontology you\'re about to delete is currently open in the mapping tool.</error-display>';
        }
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: `${msg}<p>Are you sure that you want to delete <strong>${record.title}</strong>?</p>`
            }
        }).afterClosed().subscribe(result => {
            if (result) {
                this.deleteOntology(recordId);
            }
        });
    }
    deleteOntology(recordId: string): void {
        this.om.deleteOntology(recordId)
            .subscribe(() => {
                this.os.closeOntology(recordId);
                const state = this.os.getStateByRecordId(recordId);
                if (!isEmpty(state)) {
                    this.os.deleteState(recordId);
                }
                return this.setPageOntologyRecords(0, this.filterText);
            }, error => this.util.createErrorToast(error));
    }
    getPage(pageEvent: PageEvent): void {
        this.setPageOntologyRecords(pageEvent.pageIndex, this.filterText);
    }
    setPageOntologyRecords(page: number, inputFilterText: string): void {
        this.filterText = inputFilterText;
        this.pageIndex = page;
        const catalogId = get(this.cm.localCatalog, '@id', '');
        const paginatedConfig = {
            pageIndex: this.pageIndex,
            limit: this.limit,
            type: ONTOLOGYEDITOR + 'OntologyRecord',
            sortOption: find(this.cm.sortOptions, {field: DCTERMS + 'title', asc: true}),
            searchText: inputFilterText
        };
        this.spinnerSvc.startLoadingForComponent(this.ontologyList);
        this.cm.getRecords(catalogId, paginatedConfig, true)
            .pipe(finalize(() => {
                this.spinnerSvc.finishLoadingForComponent(this.ontologyList);
            }))
            .subscribe((response: HttpResponse<JSONLDObject[]>) => {
                this.filteredList = response.body
                    .filter(item => {
                        return get(item, '@type', []).some(i => i === ONTOLOGYEDITOR + 'OntologyRecord');
                    })
                    .map(record => ({
                        title: this.util.getDctermsValue(record, 'title'),
                        ontologyIRI: this.util.getPropertyId(record, ONTOLOGYEDITOR + 'ontologyIRI'),
                        description: this.util.getDctermsValue(record, 'description'),
                        jsonld: record
                    }));
                if (response.headers !== undefined) {
                    this.totalSize = Number(response.headers.get('x-total-count')) || 0;
                }
            });
    }
    search(): void {
        this.setPageOntologyRecords(0, this.searchBindModel);
    }
}
