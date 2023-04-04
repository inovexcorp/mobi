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
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { union, has, get, groupBy, sortBy } from 'lodash';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { OWL, RDF, XSD } from '../../../prefixes';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { UtilService } from '../../../shared/services/util.service';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { datatype } from "../../../shared/validators/datatype.validator";

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
 * @class ontology-editor.AnnotationOverlayComponent
 *
 * A component that creates content for a modal that adds or edits an annotation on the
 * {@link shared.OntologyStateService selected entity}. The form in the modal contains a `mat-autocomplete` for the
 * annotation property, a `text-area` for the annotation value, and a {@link shared.LanguageSelectComponent}. If the
 * annotation is owl:deprecated, the `text-area` and `languageSelect` are replaced by `mat-radio-button` components for
 * the boolean value. Meant to be used in conjunction with the `MatDialog` service.
 *
 * @param {boolean} data.editing Whether an annotation is being edited or a new one is being added
 * @param {string} data.annotation The annotation being edited
 * @param {string} data.value The annotation value being edited
 * @param {string} data.type The type of the annotation value being edited
 * @param {number} data.index The index of the annotation value being edited within the annotation array
 * @param {string} data.language The language of the annotation value being edited
 */
@Component({
    selector: 'annotation-overlay',
    templateUrl: './annotationOverlay.component.html',
})
export class AnnotationOverlayComponent implements OnInit {
    deprecatedIri = OWL + 'deprecated';
    annotations: string[] = [];
    type: string = XSD + 'string';
    annotationForm = this.fb.group({
        annotation: ['', [Validators.required]],
        value: ['', [Validators.required, datatype(() => this.type)]],
        type: [this.type],
        language: ['']
    });

    filteredAnnotations: Observable<AnnotationGroup[]>;

    constructor(private fb: FormBuilder, private dialogRef: MatDialogRef<AnnotationOverlayComponent>, 
        @Inject(MAT_DIALOG_DATA) public data: { editing: boolean, annotation?: string, value?: string, type?: string, index?: number, language?: string},
        private om: OntologyManagerService, public os: OntologyStateService,
        public pm: PropertyManagerService, public util: UtilService) {}
    
    ngOnInit(): void {
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
    filter(val: string): AnnotationGroup[] {
        const filtered = this.annotations.filter(annotation => annotation.toLowerCase().includes(val.toLowerCase()));
        const grouped: {[key: string]: string[]} = groupBy(filtered, annotation => this.util.getIRINamespace(annotation));
        const rtn: AnnotationGroup[] = Object.keys(grouped).map(namespace => ({
            namespace,
            options: grouped[namespace].map(annotation => ({
                annotation,
                disabled: this.isPropDisabled(annotation),
                name: this.os.getEntityNameByListItem(annotation)
            }))
        }));
        rtn.forEach(group => {
            group.options = sortBy(group.options, option => this.os.getEntityNameByListItem(option.annotation));
        });
        return rtn;
    }
    isPropDisabled(annotation: string): boolean {
        return annotation === OWL + 'deprecated' && has(this.os.listItem.selected, `['${OWL + 'deprecated'}']`);
    }
    selectProp(event: MatAutocompleteSelectedEvent): void {
        const selectedAnnotation: string = event.option.value;
        this.annotationForm.controls.value.setValue('');
        if (selectedAnnotation === OWL + 'deprecated') {
            this.annotationForm.controls.type.setValue(XSD + 'boolean');
            this.annotationForm.controls.language.setValue('');
        } else {
            this.annotationForm.controls.type.setValue(XSD + 'string');
            this.annotationForm.controls.language.setValue('');
        }
    }
    submit(): void {
        if (this.data.editing) {
            this.editAnnotation();
        } else {
            this.addAnnotation();
        }
    }
    addAnnotation(): void {
        const annotation = this.annotationForm.controls.annotation.value;
        const value = this.annotationForm.controls.value.value;
        const language = this.annotationForm.controls.language.value;
        const type = language ? '' : this.annotationForm.controls.type.value;
        
        const added = this.pm.addValue(this.os.listItem.selected, annotation, value, type, language);
        
        if (added) {
            this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, this._createJson(value, type, language));
            this.os.saveCurrentChanges().subscribe();
            if (this.om.entityNameProps.includes(annotation)) {
                this.os.updateLabel();
            }
            this.os.annotationModified(this.os.listItem.selected['@id'], annotation, value);
        } else {
            this.util.createWarningToast('Duplicate property values not allowed');
        }
        this.dialogRef.close(added);
    }
    editAnnotation(): void {
        const annotation = this.annotationForm.controls.annotation.value;
        const value = this.annotationForm.controls.value.value;
        const language = this.annotationForm.controls.language.value;
        const type = language ? '' : this.annotationForm.controls.type.value;
        const oldObj = Object.assign({}, get(this.os.listItem.selected, `['${annotation}']['${this.data.index}']`));
        const edited = this.pm.editValue(this.os.listItem.selected, annotation, this.data.index, value, type, language);
        
        if (edited) {
            this.os.addToDeletions(this.os.listItem.versionedRdfRecord.recordId, this._createJson(get(oldObj, '@value'), get(oldObj, '@type'), get(oldObj, '@language')));
            this.os.addToAdditions(this.os.listItem.versionedRdfRecord.recordId, this._createJson(value, type, language));
            this.os.saveCurrentChanges().subscribe();
            if (this.om.entityNameProps.includes(annotation)) {
                this.os.updateLabel();
            }
            this.os.annotationModified(this.os.listItem.selected['@id'], annotation, value);
        } else {
            this.util.createWarningToast('Duplicate property values not allowed');
        }
        this.dialogRef.close(edited);
    }
    getName(iri: string): string {
        return this.os.getEntityNameByListItem(iri);
    }

    validateValue(newValue: string[]): void {
        this.type = newValue[0];
        this.annotationForm.controls.type.setValue(this.type);
        this.annotationForm.controls.value.updateValueAndValidity();

        if (!this.isLangString()) {
            this.annotationForm.controls.language.setValue('');
        }
    }

    isLangString(): boolean {
        return RDF + 'langString' === (this.annotationForm.controls.type.value ? this.annotationForm.controls.type.value: '');
    }

    private _createJson(value, type, language): JSONLDObject {
        const valueObj = this.pm.createValueObj(value, type, language);
        return this.util.createJson(this.os.listItem.selected['@id'], this.annotationForm.controls.annotation.value, valueObj);
    }
}
