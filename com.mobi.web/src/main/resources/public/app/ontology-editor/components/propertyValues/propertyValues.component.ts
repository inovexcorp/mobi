/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { isBlankNodeId } from '../../../shared/utility';

/**
 * @class ontology-editor.PropertyValuesComponent
 *
 * A component that creates a display of the values of the provided `property` on the provided JSON-LD `entity`. Display
 * includes the property as a header and the individual values displayed using either a
 * {@link shared.BlankNodeValueDisplayComponent} or {@link shared.ValueDisplayComponent}. Each value can optionally have
 * an edit and remove button depending on whether functions for those actions are provided. The values can also
 * optionally be highlighted according to the provided `highlightText` and their property headers if included in the
 * provided `highlightIris` list.
 *
 * @param {string} property The ID of a property on the `entity`
 * @param {JSONLDObject} entity A JSON-LD object
 * @param {Function} edit An optional function for editing a property value. Expects an argument called iri for the
 * property ID and an argument called index for the value's index in the property array
 * @param {Function} remove An optional function for removing a property value. Expects an argument called iri for
 * the property ID and an argument called index for the value's index in the property array
 * @param {string[]} highlightIris An optional array of property IRIs that should be highlighted
 * @param {string} highlightText An optional string that should be highlighted in any value displays
 */
@Component({
    selector: 'property-values',
    templateUrl: './propertyValues.component.html',
    styleUrls: ['./propertyValues.component.scss']
})
export class PropertyValuesComponent implements OnInit, OnChanges {
    @Input() property: string;
    @Input() entity: JSONLDObject;
    @Input() highlightText: string;
    @Input() highlightIris: string[] = [];

    @Output() edit = new EventEmitter<{property: string, index: number}>();
    @Output() remove = new EventEmitter<{iri: string, index: number}>();

    readonly isBlankNodeId = isBlankNodeId;
    isHighlightedProp = false;
    isEditSet = false;
    isRemoveSet = false;

    constructor(public os: OntologyStateService, public om: OntologyManagerService) {}
    
    ngOnInit(): void {
        this.isEditSet = this.edit.observers.length > 0;
        this.isRemoveSet = this.remove.observers.length > 0;
    }
    ngOnChanges(changes: SimpleChanges): void {
        if (changes.highlightIris) {
            this.isHighlightedProp = changes.highlightIris.currentValue.includes(this.property);
        }
    }
    callEdit(index: number): void {
        this.edit.emit({ property: this.property, index });
    }
    callRemove(index: number): void {
        this.remove.emit({ iri: this.property, index });
    }
}
