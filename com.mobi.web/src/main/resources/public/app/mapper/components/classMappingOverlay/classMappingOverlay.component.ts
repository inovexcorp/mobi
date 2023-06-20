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

import { Component } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { MappingClass } from '../../../shared/models/mappingClass.interface';
import { MapperStateService } from '../../../shared/services/mapperState.service';

/**
 * @class mapper.ClassMappingOverlayComponent
 *
 * A component that creates content for a modal with a {@link mapper.ClassSelectComponent} and a
 * {@link mapper.ClassPreviewComponent} to create a ClassMapping in the current
 * {@link shared.MapperStateService#selected mapping}. Meant to be used in conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'class-mapping-overlay',
    templateUrl: './classMappingOverlay.component.html',
    styleUrls: ['./classMappingOverlay.component.scss']
})
export class ClassMappingOverlayComponent {
    selectedClass: MappingClass;
    classMappingForm = this.fb.group({
        class: [{value: '', disabled: !this.state.availableClasses.length}]
    });
    
    constructor(private dialogRef: MatDialogRef<ClassMappingOverlayComponent>, private fb: UntypedFormBuilder,
        public state: MapperStateService) {}

    addClass(): void {
        const classMapping = this.state.addClassMapping(this.selectedClass);
        if (!this.state.hasPropsSet(this.selectedClass.classObj['@id'])) {
            this.state.setProps(this.selectedClass.classObj['@id']);
        }
        this.state.resetEdit();
        this.dialogRef.close(classMapping);
    }
}
