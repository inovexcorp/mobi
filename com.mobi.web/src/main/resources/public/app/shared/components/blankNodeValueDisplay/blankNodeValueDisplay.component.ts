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
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { OntologyStateService } from '../../services/ontologyState.service';

/**
 * @name shared.BlankNodeValueDisplayComponent
 *
 * A component that creates a ui-codemirror container for displaying a blank node with
 * provided `nodeId`. The codemirror syntax is Manchester syntax and is non-editable.
 *
 * @param {string} nodeId The ID of a blank node in the current {@link shared.OntologyStateService#listItem ontology}
 */
@Component({
    selector: 'blank-node-value-display',
    templateUrl: './blankNodeValueDisplay.component.html',
    styleUrls: ['./blankNodeValueDisplay.component.scss']
})
export class BlankNodeValueDisplayComponent implements OnChanges {
    @Input() nodeId: string;

    editorOptions = {
        mode: 'text/omn',
        indentUnit: 4,
        lineWrapping: true,
        readOnly: true,
        cursorBlinkRate: -1,
        height: 'dynamic',
        scrollbarStyle: 'null',
        viewportMargin: Infinity
    };
    value = '';

    constructor(public os: OntologyStateService) {}

    ngOnChanges(changes: SimpleChanges): void {
        this.value = this.os.getBlankNodeValue(changes.nodeId.currentValue);
    }
}
