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
import { cloneDeep } from 'lodash';
import { MatDialogRef } from '@angular/material/dialog';
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { debounceTime, startWith, map } from 'rxjs/operators';

import { ObjectPropertyBlockComponent } from '../objectPropertyBlock/objectPropertyBlock.component';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { UtilService } from '../../../shared/services/util.service';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';

interface PropGrouping {
    namespace: string,
    options: PropOption[]
}

interface PropOption {
    item: string,
    name: string
}

/**
 * @class ontology-editor.ObjectPropertyOverlayComponent
 *
 * A component that creates content for a modal that adds an object property value to the
 * {@link shared.OntologyStateService#listItem selected individual}. The form in the modal contains a `mat-autocomplete`
 * of all the object properties in the ontology and an {@link ontology-editor.IriSelectOntologyComponent} of all the
 * valid individuals for the object property value based on the range of the selected property. 
 */
@Component({
    templateUrl: './objectPropertyOverlay.component.html',
    selector: 'object-property-overlay'
})
export class ObjectPropertyOverlayComponent implements OnInit {
    individuals: {[key: string]: string} = {};
    objectProperties: string[] = [];
    filteredIriList: Observable<PropGrouping[]>;
    propertyValue: string[] = []; // Array but only expect one value

    objectPropertyForm = this.fb.group({
        propertySelect: ['', [Validators.required]],
    });

    constructor(public os:OntologyStateService,
                private util: UtilService,
                private pm: PropertyManagerService,
                private fb: UntypedFormBuilder,
                private dialogRef: MatDialogRef<ObjectPropertyBlockComponent>) {}

    ngOnInit(): void {
        this.objectProperties = Object.keys(this.os.listItem.objectProperties.iris);
        this.filteredIriList = this.objectPropertyForm.controls.propertySelect.valueChanges
            .pipe(
                debounceTime(500),
                startWith(''),
                map(val => this.filter(val || ''))
            );
        this.individuals = cloneDeep(this.os.listItem.individuals.iris);
        delete this.individuals[this.os.getActiveEntityIRI()];
    }
    filter(val: string): PropGrouping[] {
        if (!this.objectProperties || !this.objectProperties.length) {
            return [];
        }
        return this.os.getGroupedSelectList(this.objectProperties, val, iri => this.os.getEntityNameByListItem(iri));
    }
    addProperty(): void {
        const select = this.objectPropertyForm.controls.propertySelect.value;
        const value = this.propertyValue[0];
        const valueObj = {'@id': value};
        const added = this.pm.addId(this.os.listItem.selected, select, value);

        if (added) {
            this.os.addToAdditions(
                this.os.listItem.versionedRdfRecord.recordId,
                this.util.createJson(
                    this.os.listItem.selected['@id'],
                    select,
                    valueObj
                )
            );
            this.os.saveCurrentChanges().subscribe();
        } else {
            this.util.createWarningToast('Duplicate property values not allowed');
        }
        const types = this.os.listItem.selected['@type'];
        if (this.os.containsDerivedConcept(types) || this.os.containsDerivedConceptScheme(types)) {
            this.os.updateVocabularyHierarchies(select, [valueObj]);
        }
        this.dialogRef.close();
    }
    getName(val: string): string {
        return val ? this.os.getEntityNameByListItem(val) : '';
    }
}
