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
import { Component } from '@angular/core';

import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';

/**
 * @class ontology-editor.CharacteristicsRowComponent
 *
 * A component that creates a Bootstrap `.row` that displays the {@link ontology-editor.CharacteristicsBlockComponent}
 * depending on whether the {@link shared.OntologyStateServiceService selected entity} is a object or data property.
 */
@Component({
    selector: 'characteristics-row',
    templateUrl: './characteristicsRow.component.html',
    styleUrls: ['./characteristicsRow.component.scss']
})
export class CharacteristicsRowComponent {
    constructor(public om: OntologyManagerService, public os: OntologyStateService) {}
}
