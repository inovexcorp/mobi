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
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { MappingState } from '../../../shared/models/mappingState.interface';
import { getDctermsValue } from '../../../shared/utility';

@Component({
    selector: 'view-mapping-modal',
    templateUrl: './viewMappingModal.component.html'
})
export class ViewMappingModalComponent implements OnInit {
    ontologyTitle: string;

    constructor(@Inject(MAT_DIALOG_DATA) public data: {state: MappingState}) {}
    
    ngOnInit(): void {
        if (this.data.state?.ontology) {
            this.ontologyTitle = getDctermsValue(this.data.state.ontology, 'title');
        } else {
            this.ontologyTitle = ''
        }
    }
}
