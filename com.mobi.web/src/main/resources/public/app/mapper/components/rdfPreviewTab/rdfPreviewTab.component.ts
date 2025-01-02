/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { toString } from 'lodash';

import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';

/**
 * @class mapper.RdfPreviewTabComponent
 *
 * A component that creates a Bootstrap `row` with two columns to preview the data generated by the current
 * {@link shared.MapperStateService#selected mapping}. The right column has a form with a
 * {@link mapper.MapperSerializationSelect} and a `code-mirror`. The right column has a
 * {@link mapper.PreviewDataGridComponent}.
 */
@Component({
    selector: 'rdf-preview-tab',
    templateUrl: './rdfPreviewTab.component.html',
    styleUrls: ['./rdfPreviewTab.component.scss']
})
export class RdfPreviewTabComponent implements OnInit {
    errorMessage = '';
    editorOptions = {
        mode: '',
        readOnly: true,
        indentUnit: 2,
        lineWrapping: true
    };
    previewForm = this.fb.group( {
        serialization: [this.dm.serializeFormat],
        preview: [this.dm.preview]
    });
    
    constructor(private fb: UntypedFormBuilder, public dm: DelimitedManagerService, public state: MapperStateService) {}
    
    ngOnInit(): void {
        this._setMode();
    }
    generatePreview(): void {
        const serializeFormat = this.previewForm.controls.serialization.value;
        this.dm.previewMap(this.state.selected.mapping.getJsonld(), serializeFormat)
            .subscribe(preview => {
                this._setMode();
                this.dm.preview = (serializeFormat === 'jsonld') ? JSON.stringify(preview, null, 4) : toString(preview);
                this.previewForm.controls.preview.setValue(this.dm.preview);
                this.dm.serializeFormat = serializeFormat;
            }, errorMessage => {
                this.errorMessage = errorMessage;
                this.dm.preview = '';
                this.previewForm.controls.preview.setValue(this.dm.preview);
            });
    }

    private _setMode() {
        if (this.previewForm.controls.serialization.value === 'turtle') {
            this.editorOptions.mode = 'text/turtle';
        } else if (this.previewForm.controls.serialization.value === 'jsonld') {
            this.editorOptions.mode = 'application/ld+json';
        } else if (this.previewForm.controls.serialization.value === 'rdf/xml') {
            this.editorOptions.mode = 'application/xml';
        }
    }
}
