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
import { FormBuilder, FormGroup } from '@angular/forms';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';

/**
 * @class ontology-editor.PreviewBlockComponent
 *
 * A component that creates a `mat-card` that displays a `codemirror` with the current
 * {@link shared.OntologyStateService#listItem selected ontology} in a specified RDF format. The card contains a
 * {@link ontology-editor.SerializationSelectComponent}, button to refresh the preview, and a button for downloading
 * the ontology in the selected format.
 */
@Component({
    selector: 'preview-block',
    templateUrl: './previewBlock.component.html',
    styleUrls: [ './previewBlock.component.scss']
})
export class PreviewBlockComponent implements OnInit, OnChanges {
    previewQuery = 'CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o . } LIMIT 5000'
    options = {
        mode: '',
        lineNumbers: true,
        lineWrapping: true,
        readOnly: true
    }

    @Input() activePage: any;
    @Output() activePageChange = new EventEmitter<any>();

    previewForm: FormGroup = this.fb.group({
        serialization: ['']
    });

    constructor(private fb: FormBuilder, public os: OntologyStateService, private om: OntologyManagerService) {}

    ngOnInit(): void {
        this.previewForm.controls.serialization.setValue(this.activePage.serialization);
        this.previewForm.controls.serialization.valueChanges.subscribe(value => {
            this.activePage.serialization = value;
            this.activePageChange.emit(this.activePage);
        });
    }
    ngOnChanges(): void {
        this.options.mode = this.activePage.mode;
    }
    setPreview(): void {
        this._setMode(this.activePage.serialization);
        this.om.getQueryResults(this.os.listItem.versionedRdfRecord.recordId, this.os.listItem.versionedRdfRecord.branchId, this.os.listItem.versionedRdfRecord.commitId, this.previewQuery, this.activePage.serialization, false, true)
            .subscribe(ontology => {
                this.activePage.preview = ontology;
                this.activePageChange.emit(this.activePage);
            }, response => {
                this.activePage.preview = response;
                this.activePageChange.emit(this.activePage);
            });
    }
    download(): void {
        const fileName = this.os.listItem.versionedRdfRecord.title.replace(/[ &\/\\#,+()$~%.'":*?<>{}]/g, '');
        this.om.downloadOntology(this.os.listItem.versionedRdfRecord.recordId, this.os.listItem.versionedRdfRecord.branchId, this.os.listItem.versionedRdfRecord.commitId, this.activePage.serialization, fileName);
    }

    private _setMode(serialization) {
        if (serialization === 'turtle') {
            this.options.mode = 'text/turtle';
        } else if (serialization === 'jsonld') {
            this.options.mode = 'application/ld+json';
        } else {
            this.options.mode = 'application/xml';
        }
        this.activePage.mode = this.options.mode;
        this.activePageChange.emit(this.activePage);
    }
}
