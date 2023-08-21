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
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { get, map } from 'lodash';
import { Observable, of, throwError } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

import { CATALOG, DELIM, POLICY, RDF } from '../../../prefixes';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { Difference } from '../../../shared/models/difference.class';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { MappingOntology } from '../../../shared/models/mappingOntology.interface';
import { MappingRecord } from '../../../shared/models/mappingRecord.interface';
import { MappingState } from '../../../shared/models/mappingState.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { MappingManagerService } from '../../../shared/services/mappingManager.service';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CreateMappingOverlayComponent } from '../createMappingOverlay/createMappingOverlay.component';
import { DownloadMappingOverlayComponent } from '../downloadMappingOverlay/downloadMappingOverlay.component';
import { ViewMappingModalComponent } from '../viewMappingModal/viewMappingModal.component';
import { getDate, getDctermsValue, getPropertyId } from '../../../shared/utility';

/**
 * @class mapper.MappingSelectPageComponent
 * 
 * A component that creates a searchable, paginated list of mapping records. Contains a
 * {@link shared.SearchBarComponent} and a `mat-paginator` for handling the list. Each mapping is displayed with its
 * title, last modified date, and description and has a menu of actions including editing, running,
 * duplicating, and downloading the mapping. The component also contains a button to create a new mapping.
 */
@Component({
    selector: 'mapping-select-page',
    templateUrl: './mappingSelectPage.component.html'
})
export class MappingSelectPageComponent implements OnInit {
    results: MappingRecord[] = [];
    searchText = '';
    submittedSearch = false;

    @ViewChild('mappingList', { static: true }) mappingList: ElementRef;

    constructor(public state: MapperStateService, private mm: MappingManagerService, private cm: CatalogManagerService,
        private dialog: MatDialog, private spinnerSvc: ProgressSpinnerService,
        private pep: PolicyEnforcementService, private toast: ToastService) {}
    
    ngOnInit(): void {
        this.searchText = this.state.paginationConfig.searchText;
        this.setResults();
        this.submittedSearch = !!this.searchText;
    }
    searchRecords(): void {
        this.state.resetPagination();
        this.state.paginationConfig.searchText = this.searchText;
        this.setResults();
        this.submittedSearch = !!this.searchText;
    }
    getPage(pageEvent: PageEvent): void {
        this.state.paginationConfig.pageIndex = pageEvent.pageIndex;
        this.setResults();
    }
    setResults(): void {
        const catalogId = get(this.cm.localCatalog, '@id', '');
        this.spinnerSvc.startLoadingForComponent(this.mappingList);
        this.cm.getRecords(catalogId, this.state.paginationConfig)
            .pipe(finalize(() => {
                this.spinnerSvc.finishLoadingForComponent(this.mappingList);
            }))
            .subscribe((response: HttpResponse<JSONLDObject[]>) => {
                this.results = response.body.map(record => ({
                    id: record['@id'],
                    title: getDctermsValue(record, 'title'),
                    description: getDctermsValue(record, 'description') || '(No Description)',
                    keywords: map(get(record, `['${CATALOG}keyword']`, []), '@value'),
                    modified: getDate(getDctermsValue(record, 'modified'), 'short'),
                    branch: getPropertyId(record, `${CATALOG}masterBranch`)
                }));
                this.state.totalSize = Number(response.headers.get('x-total-count')) || 0;
            }, error => this.toast.createErrorToast(error));
    }
    view(mappingRecord: MappingRecord): void {
        this.state.getMappingState(mappingRecord)
            .subscribe((mappingState: MappingState) => {
                this.dialog.open(ViewMappingModalComponent, {
                    data: {
                        state: mappingState
                    }
                });
            }, error => this.toast.createErrorToast(error));
    }
    run(mappingRecord: MappingRecord): void {
        this.setStateIfCompatible(mappingRecord)
            .subscribe((ontologies: MappingOntology[]) => {
                this.state.highlightIndexes = this.state.getMappedColumns();
                this.state.sourceOntologies = ontologies;
                this.state.availableClasses = this.state.getClasses(ontologies);
                this.state.step = this.state.fileUploadStep;
            }, error => error ? this.toast.createErrorToast(error) : undefined);
    }
    edit(mappingRecord: MappingRecord): void {
        const request = {
            resourceId: mappingRecord.id,
            actionId: `${CATALOG}Modify`,
            actionAttrs: {
                [`${CATALOG}branch`]: mappingRecord.branch
            }
        };
        this.pep.evaluateRequest(request)
            .subscribe(response => {
                const hasPermission = response !== this.pep.deny;
                if (hasPermission) {
                    this.setStateIfCompatible(mappingRecord)
                        .subscribe((ontologies: MappingOntology[]) => {
                            this.state.editMapping = true;
                            this.state.sourceOntologies = ontologies;
                            this.state.availableClasses = this.state.getClasses(ontologies);
                            this.state.step = this.state.fileUploadStep;
                        }, error => error ? this.toast.createErrorToast(error) : undefined);
                } else {
                    this.toast.createErrorToast('You do not have permission to create mappings');
                }
            }, () => {
                this.toast.createErrorToast('Could not retrieve record permissions');
            });
    }
    showNew(): void {
        const request = {
            resourceId: get(this.cm.localCatalog, '@id', ''),
            actionId: `${POLICY}Create`,
            actionAttrs: {
                [`${RDF}type`]: `${DELIM}MappingRecord`
            }
        };
        this.pep.evaluateRequest(request)
            .subscribe(response => {
                const hasPermission = response !== this.pep.deny;
                if (hasPermission) {
                    this.state.startCreateMapping();
                    this.state.selected = {
                        mapping: undefined,
                        difference: new Difference()
                    };
                    this.dialog.open(CreateMappingOverlayComponent);
                } else {
                    this.toast.createErrorToast('You do not have permission to create mappings');
                }
            }, () => {
                this.toast.createErrorToast('Could not retrieve record permissions');
            });
    }
    confirmDeleteMapping(mappingRecord: MappingRecord): void {
        const request = {
            resourceId: mappingRecord.id,
            actionId: `${POLICY}Delete`
        };
        this.pep.evaluateRequest(request)
            .subscribe(response => {
                const hasPermission = response !== this.pep.deny;
                if (hasPermission) {
                    this.dialog.open(ConfirmModalComponent, {
                        data: {
                            content: `Are you sure you want to delete <strong>${mappingRecord.title}</strong>?`
                        }
                    }).afterClosed().subscribe((result: boolean) => {
                        if (result) {
                            this.deleteMapping(mappingRecord);
                        }
                    });
                } else {
                    this.toast.createErrorToast('You do not have permission to delete this mapping');
                }
            }, () => {
                this.toast.createErrorToast('Could not retrieve record permissions');
            });
    }
    download(mappingRecord: MappingRecord): void {
        this.dialog.open(DownloadMappingOverlayComponent, {
            data: {
                record: mappingRecord
            }
        });
    }
    duplicate(mappingRecord: MappingRecord): void {
        const request = {
            resourceId: get(this.cm.localCatalog, '@id', ''),
            actionId: `${POLICY}Create`,
            actionAttrs: {
                [`${RDF}type`]: `${DELIM}MappingRecord`
            }
        };
        this.pep.evaluateRequest(request)
            .subscribe(response => {
                const hasPermission = response !== this.pep.deny;
                if (hasPermission) {
                    this.setStateIfCompatible(mappingRecord)
                        .subscribe(() => {
                            this.state.startCreateMapping();
                            this.dialog.open(CreateMappingOverlayComponent);
                        }, error => error ? this.toast.createErrorToast(error) : undefined);
                } else {
                    this.toast.createErrorToast('You do not have permission to create mappings');
                }
            }, () => {
                this.toast.createErrorToast('Could not retrieve record permissions');
            });
    }
    deleteMapping(mappingRecord: MappingRecord): void {
        this.mm.deleteMapping(mappingRecord.id)
            .subscribe(() => {
                this.state.resetPagination();
                this.setResults();
            }, error => this.toast.createErrorToast(error));
    }
    setStateIfCompatible(mappingRecord: MappingRecord): Observable<MappingOntology[]> {
        return this.state.getMappingState(mappingRecord)
            .pipe(switchMap((mappingState: MappingState) => {
                return this.mm.getSourceOntologies(mappingState.mapping.getSourceOntologyInfo())
                    .pipe(switchMap(ontologies => {
                        if (this.mm.areCompatible(mappingState.mapping, ontologies)) {
                            this.state.selected = mappingState;
                            return of(ontologies);
                        } else {
                            this.toast.createErrorToast('The source ontology for the mapping and/or its imported ontologies have been changed and are no longer compatible. Unable to open the mapping', {timeOut: 8000});
                            return throwError(null);
                        }
                    }));
            }));
    }
}
