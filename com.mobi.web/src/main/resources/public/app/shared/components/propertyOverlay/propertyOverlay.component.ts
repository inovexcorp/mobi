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

import { createJson, entityNameProps, getIRINamespace } from '../../utility';
import { datatype } from '../../validators/datatype.validator';
import { OWL, RDF, SH, XSD } from '../../../prefixes';
import { PropertyManagerService } from '../../services/propertyManager.service';
import { PropertyOverlayDataOptions } from '../../models/propertyOverlayDataOptions.interface';
import { REGEX } from '../../../constants';
import { ToastService } from '../../services/toast.service';
import { VersionedRdfListItem } from '../../models/versionedRdfListItem.class';
import { VersionedRdfState } from '../../services/versionedRdfState.service';

interface PropertyGroup {
  namespace: string,
  options: PropertyOption[]
}

interface PropertyOption {
  property: string,
  name: string
}

/**
 * @class shared.PropertyOverlayComponent
 *
 * A component that creates content for a modal that adds or edits an ontology property on the current
 * {@link shared.VersionedRdfState#listItem selected VersionedRDFRecord}. The form in the modal contains a `mat-autocomplete`
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
  selector: 'property-overlay',
  templateUrl: './propertyOverlay.component.html'
})
export class PropertyOverlayComponent implements OnInit {
  stateService: VersionedRdfState<VersionedRdfListItem>;
  dataPropertyRanges: { [key: string]: string } = {};
  booleanType = `${XSD}boolean`;
  iriPattern = REGEX.IRI;
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

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PropertyOverlayDataOptions,
    private _fb: UntypedFormBuilder,
    private _dialogRef: MatDialogRef<PropertyOverlayComponent>,
    private _pm: PropertyManagerService,
    private _toast: ToastService) {
      this.stateService = data.stateService;
    }

  ngOnInit(): void {
    this._determinePropertyList();
    this.filteredProperties = this.propertyForm.controls.property.valueChanges.pipe(
      startWith(''),
      map(value => this.filter(value || ''))
    );
    if (this.stateService.listItem?.dataPropertyRange) {
      this.dataPropertyRanges = this.stateService.listItem.dataPropertyRange;
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
    const grouped: { [key: string]: string[] } = groupBy(filtered, prop => getIRINamespace(prop));
    const rtn: PropertyGroup[] = Object.keys(grouped).map(namespace => ({
      namespace,
      options: grouped[namespace].map(property => ({
        property,
        name: this.stateService.getEntityName(property)
      }))
    }));
    rtn.forEach(group => {
      group.options = sortBy(group.options, option => this.stateService.getEntityName(option.property));
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
    if (selectedProperty === `${OWL}deprecated` || selectedProperty === `${SH}closed` || selectedProperty === `${SH}deactivated`) {
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
      added = this._pm.addId(this.data.entity, property, value);
    } else {
      added = this._pm.addValue(this.data.entity, property, value, type, language);
    }
    if (added) {
      this.stateService.addToAdditions(this.stateService.listItem.versionedRdfRecord.recordId, this._createJson(value, type, language));
      this.stateService.saveCurrentChanges().subscribe();
      if (entityNameProps.includes(property)) {
        this.stateService.updateLabel();
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
    const oldObj = Object.assign({}, get(this.data.entity, `['${property}']['${this.data.index}']`));
    let edited = false;

    if (this.isOntologyProperty) {
      edited = this._pm.editId(this.data.entity, property, this.data.index, value);
    } else {
      edited = this._pm.editValue(this.data.entity, property, this.data.index, value, type, language);
    }
    if (edited) {
      this.stateService.addToDeletions(this.stateService.listItem.versionedRdfRecord.recordId, this._createJson(get(oldObj, '@value', get(oldObj, '@id')), get(oldObj, '@type'), get(oldObj, '@language')));
      this.stateService.addToAdditions(this.stateService.listItem.versionedRdfRecord.recordId, this._createJson(value, type, language));
      this.stateService.saveCurrentChanges().subscribe();
      if (entityNameProps.includes(property)) {
        this.stateService.updateLabel();
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
    return `${RDF}langString` === (this.propertyForm.controls.type.value ? this.propertyForm.controls.type.value : '');
  }

  private _createJson(value, type, language) {
    const valueObj = this.isOntologyProperty ? { '@id': value } : this._pm.createValueObj(value, type, language);
    return createJson(this.data.entity['@id'], this.propertyForm.controls.property.value, valueObj);
  }
  private _determinePropertyList(): void {
    if (this.data.entity['@type'].includes(`${SH}NodeShape`)) {
      this.properties = union(this._pm.defaultAnnotations, this.data.annotationIRIs, this._pm.shaclProperties);
    } else {
      this.properties = union(this._pm.ontologyProperties, this._pm.defaultAnnotations, this._pm.owlAnnotations,
        this.data.annotationIRIs);
    }
  }
}
