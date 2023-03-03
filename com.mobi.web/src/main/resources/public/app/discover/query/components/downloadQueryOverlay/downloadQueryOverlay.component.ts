
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

import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { SparqlManagerService } from '../../../../shared/services/sparqlManager.service';

interface FormatOption {
    id: string,
    name: string,
    queryType: string
}
/**
 * @class query.DownloadQueryOverlayComponent
 *
 * A component that creates content for a modal with a form to download the results of a SPARQL query. The form includes
 * a selector for the file type and the file name. Meant to be used in conjunction with the `MatDialog`
 * service.
 */
@Component({
    selector: 'download-query-overlay',
    templateUrl: './downloadQueryOverlay.component.html'
})
export class DownloadQueryOverlayComponent implements OnInit {
    queryType = '';
    options: FormatOption[] = [
        {id: 'csv', name: 'CSV', queryType: 'select'},
        {id: 'tsv', name: 'TSV', queryType: 'select'},
        {id: 'xlsx', name: 'Excel (2007)', queryType: 'select' },
        {id: 'xls', name: 'Excel (97-2003)', queryType: 'select'},
        {id: 'ttl', name: 'Turtle', queryType: 'construct'},
        {id: 'rdf', name: 'RDF/XML', queryType: 'construct'},
        {id: 'jsonld', name: 'JSON-LD', queryType: 'construct'}
    ];
    availableOptions: FormatOption[] = [];
    downloadResultsForm = this.fb.group({
        fileName: ['results', Validators.required],
        fileType: ['', Validators.required]
    })

    constructor(private dialogRef: MatDialogRef<DownloadQueryOverlayComponent>, private fb: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: {query: string, queryType?: string, datasetRecordIRI?: string}, 
        private sm: SparqlManagerService) {}
    
    ngOnInit(): void {
        this.queryType = this.data.queryType || 'select';
        this.downloadResultsForm.controls.fileType.setValue(this.queryType === 'select' ? 'csv' : 'ttl');
        this.availableOptions = this.options.filter( item => item.queryType === this.queryType );
    }
    download(): void {
        const fileType = this.downloadResultsForm.controls.fileType.value;
        const fileName = this.downloadResultsForm.controls.fileName.value;
        this.sm.downloadResultsPost(this.data.query, fileType, fileName, this.data.datasetRecordIRI)
            .subscribe(() => {
                this.dialogRef.close();
            }, error => {
                this.dialogRef.close(error);
            });
    }
}
