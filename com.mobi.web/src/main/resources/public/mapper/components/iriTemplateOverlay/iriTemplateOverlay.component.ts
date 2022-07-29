/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { MatDialogRef } from '@angular/material';

import { DELIM } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { MappingManagerService } from '../../../shared/services/mappingManager.service';

/**
 * @class mapper.IriTemplateOverlayComponent
 *
 * A component that creates content for a modal that changes the IRI template of the
 * {@link shared.MapperStateService#selectedClassMappingId selected class mapping}. The modal splits the IRI template
 * into the beginning of the namespace, the delimiter between the namespace and local name, and the dynamically created
 * local name. The local name can either be a UUID or a column header. Meant to be used in conjunction with the
 * `MatDialog` service.
 */
@Component({
    selector: 'iri-template-overlay',
    templateUrl: './iriTemplateOverlay.component.html'
})
export class IriTemplateOverlayComponent implements OnInit {
    classMapping: JSONLDObject;
    uuidOption = {text: 'UUID', value: '${UUID}'};
    localNameOptions: {text: string, value: string}[] = [this.uuidOption];
    pattern = /^[a-zA-Z0-9._-]+[:]+[a-zA-Z0-9._\-/]+[a-zA-Z0-9._-]$/;
    iriTemplateForm = this.fb.group({
        beginsWith: ['', [Validators.required, Validators.pattern(this.pattern)]],
        then: ['', Validators.required],
        endsWith: ['', Validators.required]
    })

    constructor(private dialogRef: MatDialogRef<IriTemplateOverlayComponent>, private fb: FormBuilder, 
        public state: MapperStateService, public mm: MappingManagerService, public dm: DelimitedManagerService, 
        @Inject('utilService') private util) {}

    ngOnInit(): void {
        this.classMapping = this.state.selected.mapping.getClassMapping(this.state.selectedClassMappingId);
        const prefix = this.util.getPropertyValue(this.classMapping, DELIM + 'hasPrefix');
        this.iriTemplateForm.controls.beginsWith.setValue(prefix.slice(0, -1));
        this.iriTemplateForm.controls.then.setValue(prefix[prefix.length - 1]);
        for (let idx = 0; idx < this.dm.dataRows[0].length; idx++) {
            this.localNameOptions.push({text: this.dm.getHeader(idx), value: '${' + idx + '}'});
        }
        const setLocalName = this.util.getPropertyValue(this.classMapping, DELIM + 'localName');
        const selectedEnds = this.localNameOptions.find(option => option.value === setLocalName) || this.uuidOption;
        this.iriTemplateForm.controls.endsWith.setValue(selectedEnds.value);
    }
    set(): void {
        const originalPrefix = this.util.getPropertyValue(this.classMapping, DELIM + 'hasPrefix');
        const originalLocalName = this.util.getPropertyValue(this.classMapping, DELIM + 'localName');
        const beginsWith = this.iriTemplateForm.controls.beginsWith.value;
        const then = this.iriTemplateForm.controls.then.value;
        const endsWith = this.iriTemplateForm.controls.endsWith.value;
        this.mm.editIriTemplate(this.state.selected.mapping, this.state.selectedClassMappingId, beginsWith + then, endsWith);
        this.state.changeProp(this.state.selectedClassMappingId, DELIM + 'hasPrefix', beginsWith + then, originalPrefix);
        this.state.changeProp(this.state.selectedClassMappingId, DELIM + 'localName', endsWith, originalLocalName);
        this.dialogRef.close();
    }
}