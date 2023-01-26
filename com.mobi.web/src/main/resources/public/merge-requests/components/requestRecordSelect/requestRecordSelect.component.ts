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
import { PageEvent } from '@angular/material';
import { get, find } from 'lodash';

import { DCTERMS, ONTOLOGYEDITOR } from '../../../prefixes';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PaginatedConfig } from '../../../shared/models/paginatedConfig.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { UtilService } from '../../../shared/services/util.service';

import './requestRecordSelect.component.scss';

/**
 * @class merge-requests.RequestRecordSelectComponent
 *
 * A component which creates a div containing a search form, a list of VersionedRDFRecords and a pagination controls to
 * select the VersionedRDFRecord for a new MergeRequest.
 */
@Component({
    selector: 'request-record-select',
    templateUrl: './requestRecordSelect.component.html'
})
export class RequestRecordSelectComponent implements OnInit {
    catalogId = '';
    ontologyEditorPrefix = ONTOLOGYEDITOR;
    records: JSONLDObject[] = [];
    totalSize = 0;
    config: PaginatedConfig = {
        type: '',
        limit: 20,
        searchText: '',
        sortOption: undefined,
        pageIndex: 0,
    };

    @ViewChild('mrRecords') mrRecords: ElementRef;

    constructor(public cm: CatalogManagerService, public state: MergeRequestsStateService,
        private spinnerSvc: ProgressSpinnerService, public util: UtilService) {}
    
    ngOnInit(): void {
        this.catalogId = get(this.cm.localCatalog, '@id');
        this.config.type = ONTOLOGYEDITOR + 'OntologyRecord';
        this.config.sortOption = find(this.cm.sortOptions, { field: DCTERMS + 'title', asc: true });
        this.setInitialRecords();
    }
    selectRecord(record: JSONLDObject): void {
        this.state.requestConfig.recordId = record['@id'];
        this.state.selectedRecord = record;
    }
    setRecords(pageIndex: number): void {
        this.config.pageIndex = pageIndex;
        this.spinnerSvc.startLoadingForComponent(this.mrRecords);
        this.cm.getRecords(this.catalogId, this.config, true)
            .subscribe((response: HttpResponse<JSONLDObject[]>) => this._setPagination(response), error => {
                this.records = [];
                this.totalSize = 0;
                this.util.createErrorToast(error);
                this.spinnerSvc.finishLoadingForComponent(this.mrRecords);
            });
    }
    getPage(pageEvent: PageEvent): void {
        this.setRecords(pageEvent.pageIndex);
    }
    setInitialRecords(): void {
        this.setRecords(0);
    }

    private _setPagination(response: HttpResponse<JSONLDObject[]>) {
        this.records = response.body;
        this.totalSize = Number(response.headers.get('x-total-count')) || 0;
        this.spinnerSvc.finishLoadingForComponent(this.mrRecords);
     }
}
