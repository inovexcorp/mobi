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
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { UntypedFormBuilder, Validators } from '@angular/forms';

import { get, groupBy, has, sortBy, union } from 'lodash';
import { map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { createJson, entityNameProps, getIRINamespace } from '../../../shared/utility';
import { datatype } from '../../../shared/validators/datatype.validator';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OWL, RDF, XSD } from '../../../prefixes';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { PropertyOverlayDataOptions } from '../../../shared/models/propertyOverlayDataOptions.interface';
import { REGEX } from '../../../constants';
import { ToastService } from '../../../shared/services/toast.service';


interface AnnotationGroup {
  namespace: string,
  options: AnnotationOption[]
}

interface AnnotationOption {
  annotation: string,
  disabled: boolean,
  name: string
}

/**
 * @class AnnotationOverlayComponent
 *
 * A component that creates content for a modal that adds or edits an annotation on the
 * {@link OntologyStateService} selected entity. The form in the modal contains a `mat-autocomplete` for the
 * annotation property, a `text-area` for the annotation value, and a {@link LanguageSelectComponent}. If the
 * annotation is owl:deprecated, the `text-area` and `languageSelect` are replaced by `mat-radio-button` components for
 * the boolean value. Meant to be used in conjunction with the `MatDialog` service.
 *
 * @param {boolean} data.editing Whether an annotation is being edited or a new one is being added
 * @param {string} data.annotation The annotation being edited
 * @param {string} data.value The annotation value being edited
 * @param {string} data.type The type of the annotation value being edited
 * @param {number} data.index The index of the annotation value being edited within the annotation array
 * @param {string} data.language The language of the annotation value being edited
 * @param {string} data.isIRIProperty Whether an annotation is of the IRI type
 */
@Component({
  selector: 'annotation-overlay',
  templateUrl: './annotationOverlay.component.html',
})
export class AnnotationOverlayComponent implements OnInit {
  deprecatedIri = `${OWL}deprecated`;
  annotations: string[] = [];
  type = `${XSD}string`;
  annotationForm = this.fb.group({
    annotation: ['', [Validators.required]],
    value: ['', [Validators.required, datatype(() => this.type)]],
    type: [this.type],
    language: ['']
  });
  isIRIProperty = false;
  filteredAnnotations: Observable<AnnotationGroup[]>;
  dataPropertyRanges: { [key: string]: string } = {};

  constructor(private fb: UntypedFormBuilder,
              private dialogRef: MatDialogRef<AnnotationOverlayComponent>,
              @Inject(MAT_DIALOG_DATA) public data: PropertyOverlayDataOptions,
              public os: OntologyStateService,
              public pm: PropertyManagerService,
              private toast: ToastService) {
  }

  /**
   * Initializes the component by setting up form controls, validators, and default values based on the provided input data and state.
   * It handles conditional logic for editing mode, data initialization, and form field behavior.
   *
   * @return {void}
   */
  ngOnInit(): void {
    if (this.data.isIRIProperty) {
      this.isIRIProperty = this.data.isIRIProperty;
      this.annotationForm.controls.value.setValidators([Validators.required, Validators.pattern(REGEX.IRI)]);
    }
    if (this.os.listItem?.dataPropertyRange) {
      this.dataPropertyRanges = this.os.listItem.dataPropertyRange;
    }
    this.annotations = union(Object.keys(this.os.listItem.annotations.iris), this.pm.defaultAnnotations, this.pm.owlAnnotations);
    this.filteredAnnotations = this.annotationForm.controls.annotation.valueChanges.pipe(
      startWith(''),
      map(value => this.filter(value || '')),
    );
    if (this.data.editing) {
      this.annotationForm.controls.annotation.setValue(this.data.annotation);
      this.annotationForm.controls.annotation.disable();
      this.annotationForm.controls.value.setValue(this.data.value);
      if (this.data.type) {
        this.annotationForm.controls.type.setValue(this.data.type);
        this.type = this.data.type;
      }
      this.annotationForm.controls.language.setValue(this.data.language);
    } else {
      // Should already be enabled on startup, mostly here for test purposes
      this.annotationForm.controls.annotation.enable();
    }
  }

  /**
   * Filters annotations based on the provided value and groups them by their namespace.
   *
   * @param {string} val - The value to filter annotations by. Case-insensitive matching is applied.
   * @return {AnnotationGroup[]} Returns an array of grouped annotations, where each group contains a namespace and its corresponding options. Each option includes the annotation, its disabled state, and its name.
   */
  filter(val: string): AnnotationGroup[] {
    const filtered = this.annotations.filter(annotation => annotation.toLowerCase().includes(val.toLowerCase()));
    const grouped: { [key: string]: string[] } = groupBy(filtered, annotation => getIRINamespace(annotation));
    const rtn: AnnotationGroup[] = Object.keys(grouped).map(namespace => ({
      namespace,
      options: grouped[namespace].map(annotation => ({
        annotation,
        disabled: this.isPropDisabled(annotation),
        name: this.os.getEntityName(annotation)
      }))
    }));
    rtn.forEach(group => {
      group.options = sortBy(group.options, option => this.os.getEntityName(option.annotation));
    });
    return rtn;
  }

  /**
   * Determines if a property is disabled based on the provided annotation.
   *
   * @param {string} annotation - The annotation to evaluate for determining if the property is disabled.
   * @return {boolean} Returns true if the property is considered disabled, otherwise false.
   */
  isPropDisabled(annotation: string): boolean {
    return annotation === `${OWL}deprecated` && has(this.os.listItem.selected, `['${OWL}deprecated']`);
  }

  /**
   * Handles the selection of an option in a MatAutocomplete control and updates the form controls accordingly.
   *
   * @param {MatAutocompleteSelectedEvent} event - The event triggered when an option is selected in the autocomplete.
   * @return {void}
   */
  selectProp(event: MatAutocompleteSelectedEvent): void {
    const selectedAnnotation: string = event.option.value;
    this.annotationForm.controls.value.setValue('');
    if (selectedAnnotation === `${OWL}deprecated`) {
      this.type = `${XSD}boolean`;
      this.annotationForm.controls.type.setValue(`${XSD}boolean`);
      this.annotationForm.controls.language.setValue('');
    } else {
      this.type = `${XSD}string`;
      this.annotationForm.controls.type.setValue(`${XSD}string`);
      this.annotationForm.controls.language.setValue('');
    }
  }

  /**
   * Submits the current data for processing. The method determines whether to edit an existing
   * annotation or add a new annotation based on the `editing` state of the data.
   *
   * @return {void}
   */
  submit(): void {
    if (this.data.editing) {
      this.editAnnotation();
    } else {
      this.addAnnotation();
    }
  }

  /**
   * Adds an annotation to the current entity based on the form inputs.
   * Depending on whether the property is an IRI, it invokes different methods on the property manager.
   * Handles duplicate annotations by displaying a warning toast if necessary.
   * Saves the changes and updates the UI accordingly.
   *
   * @return {void}
   */
  addAnnotation(): void {
    const annotation = this.annotationForm.controls.annotation.value;
    const value = this.annotationForm.controls.value.value;
    const language = this.annotationForm.controls.language.value;
    const type = language ? '' : this.annotationForm.controls.type.value;
    let added: boolean;
    if (this.isIRIProperty) {
      added = this.pm.addId(this.os.listItem.selected, annotation, value);
    } else {
      added = this.pm.addValue(this.os.listItem.selected, annotation, value, type, language);
    }
    if (added) {
      this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, this._createJson(value, type, language));
      this.os.saveCurrentChanges().subscribe();
      if (entityNameProps.includes(annotation)) {
        this.os.updateLabel();
      }
      this.os.annotationModified(this.os.listItem.selected['@id'], annotation, value);
    } else {
      this.toast.createWarningToast('Duplicate property values not allowed');
    }
    this.dialogRef.close(added);
  }

  /**
   * Edits an annotation associated with a specific list item, updating its value, type, or language
   * based on the user-provided input. The method manages both deletion of the old annotation data
   * and addition of the new one, ensuring the changes are saved and the appropriate updates are triggered
   * across the system. Displays a warning toast if duplicate property values are encountered.
   *
   * @return {void} Returns no value but performs updates, manages changes, and closes the dialog, indicating whether
   * the edit was successful.
   */
  editAnnotation(): void {
    const annotation = this.annotationForm.controls.annotation.value;
    const value = this.annotationForm.controls.value.value;
    const language = this.annotationForm.controls.language.value;
    const type = language ? '' : this.annotationForm.controls.type.value;
    const oldObj = Object.assign({}, get(this.os.listItem.selected, `['${annotation}']['${this.data.index}']`));
    let edited: boolean;
    if (this.isIRIProperty) {
      edited = this.pm.editId(this.os.listItem.selected, annotation, this.data.index, value);
    } else {
      edited = this.pm.editValue(this.os.listItem.selected, annotation, this.data.index, value, type, language);
    }
    if (edited) {
      this.os.addToDeletions(this.os.listItem.versionedRdfRecord.recordId, this._createJson(get(oldObj, '@value', get(oldObj, '@id')), get(oldObj, '@type'), get(oldObj, '@language')));
      this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, this._createJson(value, type, language));
      this.os.saveCurrentChanges().subscribe();
      if (entityNameProps.includes(annotation)) {
        this.os.updateLabel();
      }
      this.os.annotationModified(this.os.listItem.selected['@id'], annotation, value);
    } else {
      this.toast.createWarningToast('Duplicate property values not allowed');
    }
    this.dialogRef.close(edited);
  }

  /**
   * Retrieves the name of an entity associated with the given IRI (Internationalized Resource Identifier).
   *
   * @param iri The IRI of the entity whose name is to be retrieved.
   * @return {string} The name of the entity as a string.
   */
  getName(iri: string): string {
    return this.os.getEntityName(iri);
  }

  /**
   * Validates and updates the provided value for the annotation form.
   *
   * @param {string[]} newValue - An array of strings where the first element represents the type to be set.
   * @return {void}
   */
  validateValue(newValue: string[]): void {
    this.type = newValue[0];
    this.annotationForm.controls.type.setValue(this.type);
    this.annotationForm.controls.value.updateValueAndValidity();

    if (!this.isLangString()) {
      this.annotationForm.controls.language.setValue('');
    }
  }

  /**
   * Checks if the current value of the annotation form's type control matches the string "RDFlangString".
   *
   * The method evaluates whether the type control's value from the annotation form
   * corresponds to the language string identifier by comparing it to the expected string.
   *
   * @return {boolean} Returns true if the type value matches "RDFlangString", false otherwise.
   */
  isLangString(): boolean {
    return `${RDF}langString` === (this.annotationForm.controls.type.value ? this.annotationForm.controls.type.value : '');
  }

  private _createJson(value, type, language): JSONLDObject {
    const valueObj = this.isIRIProperty ? { '@id': value } : this.pm.createValueObj(value, type, language);
    return createJson(this.os.listItem.selected['@id'], this.annotationForm.controls.annotation.value, valueObj);
  }
}
