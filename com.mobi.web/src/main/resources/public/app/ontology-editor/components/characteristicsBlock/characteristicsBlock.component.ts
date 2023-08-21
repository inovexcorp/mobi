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
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { pull, includes, get, unset, find, isEqual, remove } from 'lodash';

import { OWL } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';

interface Characteristic {
    checked: boolean,
    typeIRI: string,
    displayText: string,
    objectOnly: boolean
}

/**
 * @class ontology-editor.CharacteristicsBlockComponent
 *
 * A component that creates a section that displays the appropriate characteristics based on the provided `types` array
 * for the entity identified by the provided `iri`. Characteristics are displayed as `mat-checkbox`.
 * 
 * @param {string} iri An IRI string for an entity in the current {@link shared.OntologyStateService}
 * @param {string[]} types An array of IRI strings
 */
@Component({
    selector: 'characteristics-block',
    templateUrl: './characteristicsBlock.component.html',
    styleUrls: ['./characteristicsBlock.component.scss']
})
export class CharacteristicsBlockComponent implements OnChanges {
    characteristics: Characteristic[] = [
        {
            checked: false,
            typeIRI: `${OWL}FunctionalProperty`,
            displayText: 'Functional Property',
            objectOnly: false
        },
        {
            checked: false,
            typeIRI: `${OWL}AsymmetricProperty`,
            displayText: 'Asymmetric Property',
            objectOnly: true
        },
        {
            checked: false,
            typeIRI: `${OWL}SymmetricProperty`,
            displayText: 'Symmetric Property',
            objectOnly: true
        },
        {
            checked: false,
            typeIRI: `${OWL}TransitiveProperty`,
            displayText: 'Transitive Property',
            objectOnly: true
        },
        {
            checked: false,
            typeIRI: `${OWL}ReflexiveProperty`,
            displayText: 'Reflexive Property',
            objectOnly: true
        },
        {
            checked: false,
            typeIRI: `${OWL}IrreflexiveProperty`,
            displayText: 'Irreflexive Property',
            objectOnly: true
        }
    ];
    filteredCharacteristics: Characteristic[] = [];

    @Input() iri: string;
    @Input() types: string[];

    @Output() typesChange = new EventEmitter<string[]>()

    constructor(public os: OntologyStateService, private om: OntologyManagerService) {}
    
    ngOnChanges(): void {
        this._setVariables();
    }
    filter(obj: Characteristic): boolean {
        return !obj.objectOnly || this.om.isObjectProperty({'@id': '', '@type': this.types || []});
    }
    onChange(characteristicObj: Characteristic, value: boolean): void {
        characteristicObj.checked = value;
        const types = this.types || [];
        if (characteristicObj.checked) {
            types.push(characteristicObj.typeIRI);
            this._handleCase(this.os.listItem.deletions, (str, obj) => this.os.addToAdditions(str, obj), characteristicObj.typeIRI);
        } else {
            pull(types, characteristicObj.typeIRI);
            this._handleCase(this.os.listItem.additions, (str, obj) => this.os.addToDeletions(str, obj), characteristicObj.typeIRI);
        }
        this.typesChange.emit(types);
        this.os.saveCurrentChanges(this.os.listItem, false).subscribe();
    }

    private _handleCase(array, method: (s: string, o: JSONLDObject) => void, typeIRI: string) {
        const match = find(array, item => includes(get(item, '@type', []), typeIRI));
        if (match) {
            this._removeTypeFrom(match, typeIRI);
            if (!get(match, '@type', []).length) {
                unset(match, '@type');
            }
            if (isEqual(Object.keys(match), ['@id'])) {
                remove(array, match);
            }
        } else {
            method(this.os.listItem.versionedRdfRecord.recordId, {
                '@id': this.iri,
                '@type': [typeIRI]
            })/* .bind(this.os) */;
        }
    }
    private _removeTypeFrom(object, typeToRemove) {
        pull(get(object, '@type', []), typeToRemove);
    }
    private _setVariables() {
        this.characteristics.forEach(obj => {
            obj.checked = includes(this.types, obj.typeIRI);
        });
        this.filteredCharacteristics = this.characteristics.filter(char => this.filter(char));
    }
}
