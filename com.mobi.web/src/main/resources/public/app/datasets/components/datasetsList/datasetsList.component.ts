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
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { get, map, find } from 'lodash';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { CATALOG, DATASET, POLICY, RDF } from '../../../prefixes';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { Dataset } from '../../../shared/models/dataset.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { Repository } from '../../../shared/models/repository.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { DatasetManagerService } from '../../../shared/services/datasetManager.service';
import { DatasetStateService } from '../../../shared/services/datasetState.service';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { RepositoryManagerService } from '../../../shared/services/repositoryManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { EditDatasetOverlayComponent } from '../editDatasetOverlay/editDatasetOverlay.component';
import { NewDatasetOverlayComponent } from '../newDatasetOverlay/newDatasetOverlay.component';
import { UploadDataOverlayComponent } from '../uploadDataOverlay/uploadDataOverlay.component';
import { getDate, getDctermsValue, getPropertyId, getPropertyValue } from '../../../shared/utility';
import { XACMLRequest } from '../../../shared/models/XACMLRequest.interface';

interface DatasetDisplayItem {
    title: string,
    datasetIRI: string,
    description: string,
    modified: string
    ontologies: string[],
    repositoryId: string,
    dataset: Dataset
}

/**
 * @class datasets.DatasetsListComponent
 * 
 * A component containing a paginated searchable list of {@link shared.DatasetStateService Dataset Records} and
 * {@link shared.ConfirmModalComponent confirmModal}s for deleting and clearing datasets. Each dataset displays its
 * title, dataset IRI, description, modified date, repository id, and attached ontologies.
 */
@Component({
    selector: 'datasets-list',
    templateUrl: './datasetsList.component.html',
    styleUrls: ['./datasetsList.component.scss']
})
export class DatasetsListComponent implements OnInit {
    catalogId = '';
    errorMessage = '';
    cachedOntologyTitles = {};
    results: DatasetDisplayItem[] = [];
    searchText = '';
    repositoryMap: {[key: string]: Repository} = {};
    canCreate = false;

    @ViewChild('datasetsList', { static: true }) datasetsList: ElementRef;
    
    constructor(public dm: DatasetManagerService, public state: DatasetStateService, public cm: CatalogManagerService, 
        private dialog: MatDialog, private spinnerSvc: ProgressSpinnerService, private pep: PolicyEnforcementService, 
        private toast: ToastService, private rm: RepositoryManagerService) {}
    
    ngOnInit(): void {
        this.catalogId = get(this.cm.localCatalog, '@id', '');
        this.setResults();
        this.searchText = this.state.paginationConfig.searchText;
        this.state.submittedSearch = !!this.state.paginationConfig.searchText;
        this.rm.getRepositories().subscribe(repos => {
            repos.forEach(repo => {
                this.repositoryMap[repo.id] = repo;
            });
        });
        this._checkCreatePermission();
    }
    getIdentifiedOntologyIds(dataset: Dataset): string[] {
        return map(dataset.identifiers, identifier => identifier[`${DATASET}linksToRecord`][0]['@id']);
    }
    getRecordTitle(record: JSONLDObject): string {
        return getDctermsValue(record, 'title');
    }
    setCachedOntologyTitles(datasets: Dataset[]): Observable<null> {
        const toRetrieve = [];
        datasets.forEach((dataset: Dataset) => {
            this.getIdentifiedOntologyIds(dataset).forEach(id => {
                if (!(id in this.cachedOntologyTitles) && !toRetrieve.includes(id)) {
                    toRetrieve.push(id);
                }
            });
        });
        if (toRetrieve.length) {
            return forkJoin(map(toRetrieve, id => this.cm.getRecord(id, this.catalogId).pipe(catchError(error => of(error)))))
                .pipe(switchMap((responses: (JSONLDObject[] | string)[]) => {
                    responses.forEach((response, idx: number) => {
                        if (typeof response === 'string') {
                            this.cachedOntologyTitles[toRetrieve[idx]] = '(Ontology not found)';
                        } else {
                            const record = find(response, mr => toRetrieve.includes(mr['@id']));
                            this.cachedOntologyTitles[record['@id']] = this.getRecordTitle(record);
                        }
                    });
                    return of(null);
                }));
        } else {
            return of(null);
        }
    }
    getPage(pageEvent: PageEvent): void {
        this.state.paginationConfig.pageIndex = pageEvent.pageIndex;
        this.setResults();
    }
    delete(dataset: Dataset): void {
        this.dm.deleteDatasetRecord(dataset.record['@id'])
            .subscribe(() => {
                this.toast.createSuccessToast('Dataset successfully deleted');
                if (this.results.length === 1 && this.state.paginationConfig.pageIndex > 0) {
                    this.state.paginationConfig.pageIndex -= 1;
                }
                this.setResults();
                this.state.submittedSearch = !!this.state.paginationConfig.searchText;
            }, error => this.toast.createErrorToast(error));
    }
    setResults(): void {
        this.spinnerSvc.startLoadingForComponent(this.datasetsList);
        this.state.setResults().subscribe(results => {
            this.setCachedOntologyTitles(results).subscribe(() => {
                this.results = results.map(dataset => ({
                    title: getDctermsValue(dataset.record, 'title'),
                    datasetIRI: getPropertyId(dataset.record, `${DATASET}dataset`),
                    description: getDctermsValue(dataset.record, 'description') || '(No Description)',
                    modified: getDate(getDctermsValue(dataset.record, 'modified'), 'short'),
                    repositoryId: getPropertyValue(dataset.record, `${DATASET}repository`),
                    ontologies: this.getIdentifiedOntologyIds(dataset).map(ontologyId => this.cachedOntologyTitles[ontologyId]),
                    dataset
                }));
                this.spinnerSvc.finishLoadingForComponent(this.datasetsList);
            });
        });
    }
    clear(dataset: Dataset): void {
        this.dm.clearDatasetRecord(dataset.record['@id'])
            .subscribe(() => {
                this.toast.createSuccessToast('Dataset successfully cleared');
            }, error => this.toast.createErrorToast(error));
    }
    showUploadData(dataset: Dataset): void {
        const request = {
            resourceId: dataset.record['@id'],
            actionId: `${CATALOG}Modify`
        };
        this.pep.evaluateRequest(request)
            .subscribe(response => {
                const hasPermission = response !== this.pep.deny;
                if (hasPermission) {
                    this.state.selectedDataset = dataset;
                    this.dialog.open(UploadDataOverlayComponent);
                } else {
                    this.toast.createErrorToast('You do not have permission to modify dataset record');
                }
            }, () => {
                this.toast.createErrorToast('Could not retrieve record permissions');
            });
    }
    showEdit(dataset: Dataset): void {
        const request = {
            resourceId: dataset.record['@id'],
            actionId: `${POLICY}Update`
        };
        this.pep.evaluateRequest(request)
            .subscribe(response => {
                const hasPermission = response !== this.pep.deny;
                if (hasPermission) {
                    this.state.selectedDataset = dataset;
                    this.dialog.open(EditDatasetOverlayComponent).afterClosed().subscribe((result: boolean) => {
                        if (result) {
                            this.setResults();
                        }
                    });
                } else {
                    this.toast.createErrorToast('You do not have permission to update dataset record');
                }
            }, () => {
                this.toast.createErrorToast('Could not retrieve record permissions');
            });
    }
    showNew(): void {
        this.dialog.open(NewDatasetOverlayComponent).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.setResults();
            }
        });
    }
    showClear(dataset: Dataset): void {
        const request = {
            resourceId: dataset.record['@id'],
            actionId: `${CATALOG}Modify`
        };
        this.pep.evaluateRequest(request)
            .subscribe(response => {
                const hasPermission = response !== this.pep.deny;
                if (hasPermission) {
                    this.dialog.open(ConfirmModalComponent, {
                        data: {
                            content: `Are you sure you want to clear <strong>${getDctermsValue(dataset.record, 'title')}</strong>?`
                        }
                    }).afterClosed().subscribe((result: boolean) => {
                        if (result) {
                            this.clear(dataset);
                        }
                    });
                } else {
                    this.toast.createErrorToast('Could not retrieve record permissions');
                }
            });
    }
    showDelete(dataset: Dataset): void {
        const request = {
            resourceId: dataset.record['@id'],
            actionId: `${POLICY}Delete`
        };
        this.pep.evaluateRequest(request)
            .subscribe(response => {
                const hasPermission = response !== this.pep.deny;
                if (hasPermission) {
                    this.dialog.open(ConfirmModalComponent, {
                        data: {
                            content: `Are you sure you want to delete <strong>${getDctermsValue(dataset.record, 'title')}</strong>?`
                        }
                    }).afterClosed().subscribe((result: boolean) => {
                        if (result) {
                            this.delete(dataset);
                        }
                    });
                } else {
                    this.toast.createErrorToast('You do not have permission to delete dataset record');
                }
            }, () => {
                this.toast.createErrorToast('Could not retrieve record permissions');
            });
    }
    searchRecords(): void {
        this.state.resetPagination();
        this.state.paginationConfig.searchText = this.searchText;
        this.setResults();
        this.state.submittedSearch = !!this.state.paginationConfig.searchText;
    }
    private _checkCreatePermission(): void {
        const request = {
            resourceId: `http://mobi.com/catalog-local`,
            actionId: `${POLICY}Create`,
            actionAttrs: {
                [RDF + 'type']: `${DATASET}DatasetRecord`
            }
        } as XACMLRequest;
        this.pep.evaluateRequest(request)
            .subscribe(response => {
                this.canCreate = response === this.pep.permit;
            }, () => {
                this.toast.createErrorToast('Could not retrieve dataset creation permissions');
            });
    }
}
