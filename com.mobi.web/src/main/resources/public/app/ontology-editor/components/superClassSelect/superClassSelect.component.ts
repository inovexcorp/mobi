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
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { map } from 'lodash';

import { JSONLDId } from '../../../shared/models/JSONLDId.interface';

/**
 * @class ontology-editor.SuperClassSelectComponent
 *
 * A component that creates a collapsible {@link ontology-editor.OntologyClassSelectComponent} for selecting the super
 * classes of a class. When collapsed and then reopened, all previous values are cleared. The value of the select is
 * bound to `selected` as an array of {@link JSONLDId}.
 *
 * @param {JSONLDId[]} selected The variable to bind the selected classes to in the form of `{'@id': propIRI}`
 */
@Component({
    selector: 'super-class-select',
    templateUrl: './superClassSelect.component.html'
})
export class SuperClassSelectComponent implements OnChanges {
    @Input() selected: JSONLDId[] = [];
    
    @Output() selectedChange = new EventEmitter<JSONLDId[]>();

    isShown = false;
    iris: string[] = [];

    constructor() {}

    ngOnChanges(): void {
        this.iris = map(this.selected, '@id');
    }
    show(): void {
        this.isShown = true;
    }
    hide(): void {
        this.isShown = false;
        this.iris = [];
        this.selected = [];
        this.selectedChange.emit([]);
    }
    onChange(newIris: string[]): void {
        this.iris = newIris;
        this.selected = newIris.map(iri => ({'@id': iri}));
        this.selectedChange.emit(this.selected);
    }
}
