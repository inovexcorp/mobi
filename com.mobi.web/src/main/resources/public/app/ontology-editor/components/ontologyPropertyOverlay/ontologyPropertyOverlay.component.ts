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
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { some, union, get, groupBy, sortBy } from 'lodash';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { REGEX } from '../../../constants';
import { OWL, RDF, XSD } from '../../../prefixes';
import { PropertyOverlayDataOptions } from '../../../shared/models/propertyOverlayDataOptions.interface';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { datatype } from '../../../shared/validators/datatype.validator';
import { createJson, getIRINamespace } from '../../../shared/utility';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';

interface PropertyGroup {
    namespace: string,
    options: PropertyOption[]
}

interface PropertyOption {
    property: string,
    name: string
}

/**
 * @class ontology-editor.OntologyPropertyOverlayComponent
 *
 * A component that creates content for a modal that adds or edits an ontology property on the current
 * {@link shared.OntologyStateService#listItem selected ontology}. The form in the modal contains a `mat-autocomplete`
 * for the ontology property (or annotation). If an ontology property is selected, text input is provided for the value
 * (must be a valid IRI). If an annotation is selected, a `textarea` is provided for the annotation value with a
 * {@link shared.LanguageSelectComponent}, unless the annotation is owl:deprecated in which case the `textArea` and
 * `languageSelect` are replaced by `mat-radio-button` components for the boolean value. Meant to be used in conjunction
 * with the `MatDialog` service.
 *
 * @param {boolean} data.editing Whether a property is being edited or a new one is being added
 * @param {string} data.annotation The property being edited
 * @param {string} data.value The property value being edited
 * @param {string} data.type The type of the property value being edited
 * @param {number} data.index The index of the property value being edited within the property array
 * @param {string} data.language The language of the property value being edited
 * @param {string} data.isIRIProperty Whether a property is an IRI type
 */
@Component({
    selector: 'ontology-property-overlay',
    templateUrl: './ontologyPropertyOverlay.component.html'
})
export class OntologyPropertyOverlayComponent implements OnInit {
    dataPropertyRanges: {[key: string]: string} = {};
    deprecatedIri = `${OWL}deprecated`;
    iriPattern = REGEX.IRI;
    annotations = [];
    properties = [];
    isOntologyProperty = false;
    type = `${XSD}string`;

    propertyForm = this._fb.group({
        property: ['', [Validators.required]],
        value: ['', [Validators.required, datatype(() => this.type)]],
        type: [this.type],
        language: ['']
    });

    filteredProperties: Observable<PropertyGroup[]>;

    constructor(private _fb: UntypedFormBuilder, private _dialogRef: MatDialogRef<OntologyPropertyOverlayComponent>, 
        @Inject(MAT_DIALOG_DATA) public data: PropertyOverlayDataOptions,
        public os: OntologyStateService, private _pm: PropertyManagerService, private _toast: ToastService, 
        private _om: OntologyManagerService) {}
    
    ngOnInit(): void {
        this.annotations = union(this._pm.defaultAnnotations, this._pm.owlAnnotations, Object.keys(this.os.listItem.annotations.iris));
        this.properties = union(this._pm.ontologyProperties, this.annotations);
        this.filteredProperties = this.propertyForm.controls.property.valueChanges.pipe(
            startWith(''),
            map(value => this.filter(value || ''))
        );
        if (this.os.listItem?.dataPropertyRange) {
            this.dataPropertyRanges = this.os.listItem.dataPropertyRange;
        }
        if (this.data.editing) {
            this.propertyForm.controls.property.setValue(this.data.property);
            this.propertyForm.controls.property.disable();
            this.propertyForm.controls.value.setValue(this.data.value);
            if (this.data.type) {
                this.propertyForm.controls.type.setValue(this.data.type);
                this.type = this.data.type;
            }
            this.propertyForm.controls.language.setValue(this.data.language);
        } else {
            // Should already be enabled on startup, mostly here for test purposes
            this.propertyForm.controls.property.enable();
        }
    }
    filter(val: string): PropertyGroup[] {
        const filtered = this.properties.filter(prop => prop.toLowerCase().includes(val.toLowerCase()));
        const grouped: {[key: string]: string[]} = groupBy(filtered, prop => getIRINamespace(prop));
        const rtn: PropertyGroup[] = Object.keys(grouped).map(namespace => ({
            namespace,
            options: grouped[namespace].map(property => ({
                property,
                name: this.os.getEntityName(property)
            }))
        }));
        rtn.forEach(group => {
            group.options = sortBy(group.options, option => this.os.getEntityName(option.property));
        });
        return rtn;
    }
    submit(): void {
        if (this.data.editing) {
            this.editProperty();
        } else {
            this.addProperty();
        }
    }
    selectProp(event: MatAutocompleteSelectedEvent): void {
        const selectedProperty: string = event.option.value;
        this.isOntologyProperty = !!selectedProperty && some(this._pm.ontologyProperties, property => selectedProperty === property);
        if (this.isOntologyProperty) {
            this.type = `${XSD}anyURI`;
            this.propertyForm.controls.type.setValue(this.type);
            this.propertyForm.controls.value.setValidators([Validators.required, Validators.pattern(this.iriPattern), datatype(() => this.type)]);
        } else {
            this.propertyForm.controls.value.setValidators([Validators.required, datatype(() => this.type)]);
            this.propertyForm.controls.type.setValue(`${XSD}string`);
            this.propertyForm.controls.language.setValue('');
        }
        this.propertyForm.controls.value.setValue('');
        if (selectedProperty === `${OWL}deprecated`) {
            this.propertyForm.controls.type.setValue(`${XSD}boolean`);
            this.propertyForm.controls.language.setValue('');
        }
    }
    addProperty(): void {
        const property = this.propertyForm.controls.property.value;
        const value = this.propertyForm.controls.value.value;
        const language = this.propertyForm.controls.language.value;
        const type = language ? '' : this.propertyForm.controls.type.value;
        let added = false;
        
        if (this.isOntologyProperty) {
            added = this._pm.addId(this.os.listItem.selected, property, value);
        } else {
            added = this._pm.addValue(this.os.listItem.selected, property, value, type, language);
        }
        if (added) {
            this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, this._createJson(value, type, language));
            this.os.saveCurrentChanges().subscribe();
            if (this._om.entityNameProps.includes(property)) {
                this.os.updateLabel();
            }
        } else {
            this._toast.createWarningToast('Duplicate property values not allowed');
        }
        this._dialogRef.close(added);
    }
    editProperty(): void {
        const property = this.propertyForm.controls.property.value;
        const value = this.propertyForm.controls.value.value;
        const language = this.propertyForm.controls.language.value;
        const type = language ? '' : this.propertyForm.controls.type.value;
        const oldObj = Object.assign({}, get(this.os.listItem.selected, `['${property}']['${this.data.index}']`));
        let edited = false;
        
        if (this.isOntologyProperty) {
            edited = this._pm.editId(this.os.listItem.selected, property, this.data.index, value);
        } else {
            edited = this._pm.editValue(this.os.listItem.selected, property, this.data.index, value, type, language);
        }
        if (edited) {
            this.os.addToDeletions(this.os.listItem.versionedRdfRecord.recordId, this._createJson(get(oldObj, '@value', get(oldObj, '@id')), get(oldObj, '@type'), get(oldObj, '@language')));
            this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId,this._createJson(value, type, language));
            this.os.saveCurrentChanges().subscribe();
            if (this._om.entityNameProps.includes(property)) {
                this.os.updateLabel();
            }
        } else {
            this._toast.createWarningToast('Duplicate property values not allowed');
        }
        this._dialogRef.close(edited);
    }

    validateValue(newValue: string[]): void {
        this.type = newValue[0];
        this.propertyForm.controls.type.setValue(this.type);
        this.propertyForm.controls.value.updateValueAndValidity();

        if (!this.isLangString()) {
            this.propertyForm.controls.language.setValue('');
        }
    }

    isLangString(): boolean {
        return `${RDF}langString` === (this.propertyForm.controls.type.value ? this.propertyForm.controls.type.value: '');
    }

    private _createJson(value, type, language) {
        const valueObj = this.isOntologyProperty ? {'@id': value} : this._pm.createValueObj(value, type, language);
        return createJson(this.os.listItem.selected['@id'], this.propertyForm.controls.property.value, valueObj);
    }
}
