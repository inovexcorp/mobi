/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { get, find, includes } from 'lodash';

import { CATALOG, DCTERMS, DELIM, ONTOLOGYEDITOR, SHAPESGRAPHEDITOR } from '../../../prefixes';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PaginatedConfig } from '../../../shared/models/paginatedConfig.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { getDctermsValue, getPropertyId } from '../../../shared/utility';
import { MergeRequestRecord } from '../../models/merge-request-record';

/**
 * @class merge-requests.RequestRecordSelectComponent
 *
 * A component which creates a div containing a search form, a list of VersionedRDFRecords and a pagination controls to
 * select the VersionedRDFRecord for a new MergeRequest.
 */
@Component({
    selector: 'request-record-select',
    templateUrl: './requestRecordSelect.component.html',
    styleUrls: ['./requestRecordSelect.component.scss']
})
export class RequestRecordSelectComponent implements OnInit {
    catalogId = '';
    mergeRequestRecords: MergeRequestRecord[] = [];
    totalSize = 0;
    config: PaginatedConfig = {
        type: [CATALOG + 'VersionedRDFRecord'],
        limit: 20,
        searchText: '',
        sortOption: undefined,
        pageIndex: 0
    };
    versionedRDFRecordIriMapping = {
        [`${ONTOLOGYEDITOR}OntologyRecord`]: `${CATALOG}trackedIdentifier`,
        [`${DELIM}MappingRecord`]: 'id',
        [`${SHAPESGRAPHEDITOR}ShapesGraphRecord`]: `${CATALOG}trackedIdentifier`,
        'default': 'id'
    };

    @ViewChild('mrRecords', { static: true }) mrRecords: ElementRef;

    constructor(public cm: CatalogManagerService, 
        public mrState: MergeRequestsStateService,
        private spinnerSvc: ProgressSpinnerService,
        private toast: ToastService) {}
    
    ngOnInit(): void {
        this.catalogId = get(this.cm.localCatalog, '@id');
        this.config.sortOption = find(this.cm.sortOptions, { field: DCTERMS + 'title', asc: true });
        this.setInitialRecords();
    }
    selectRecord(mergeRequestRecord: MergeRequestRecord): void {
        this.mrState.requestConfig.recordId = get(mergeRequestRecord.jsonld, '@id');
        this.mrState.selectedRecord = mergeRequestRecord.jsonld;
    }
    setRecords(pageIndex: number): void {
        this.config.pageIndex = pageIndex;
        this.spinnerSvc.startLoadingForComponent(this.mrRecords);
        this.cm.getRecords(this.catalogId, this.config, true)
            .subscribe((response: HttpResponse<JSONLDObject[]>) => this._setPagination(response), error => {
                this.mergeRequestRecords = [];
                this.totalSize = 0;
                this.toast.createErrorToast(error);
                this.spinnerSvc.finishLoadingForComponent(this.mrRecords);
            });
    }
    getPage(pageEvent: PageEvent): void {
        this.setRecords(pageEvent.pageIndex);
    }
    setInitialRecords(): void {
        this.setRecords(0);
    }
    _mapToMergeRequestRecord(jsonldrecord: JSONLDObject): MergeRequestRecord {
        const recordType = find(Object.keys(this.versionedRDFRecordIriMapping), type => includes(get(jsonldrecord, '@type', []), type)) || CATALOG + 'Record';
        const iriMapping = this.versionedRDFRecordIriMapping['type' === CATALOG + 'Record' ? 'default' : recordType];
        const mergeRequestRecord: MergeRequestRecord = {
            jsonld: jsonldrecord,
            recordTypeIri: recordType,
            title: getDctermsValue(jsonldrecord, 'title'),
            displayIri: iriMapping === 'id' ?  jsonldrecord['@id'] : getPropertyId(jsonldrecord, iriMapping),
            description: getDctermsValue(jsonldrecord, 'description')
        };
        return mergeRequestRecord;
    }
    private _setPagination(response: HttpResponse<JSONLDObject[]>) {
        this.mergeRequestRecords = response.body.map((jsonldrecord: JSONLDObject) => this._mapToMergeRequestRecord(jsonldrecord));
        this.totalSize = Number(response.headers.get('x-total-count')) || 0;
        this.spinnerSvc.finishLoadingForComponent(this.mrRecords);
     }
}
