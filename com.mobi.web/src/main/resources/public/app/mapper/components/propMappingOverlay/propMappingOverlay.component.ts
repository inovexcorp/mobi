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

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialogRef } from '@angular/material/dialog';
import { get, remove, find, has, invertBy, pick } from 'lodash';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { DELIM, RDF, RDFS } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { Mapping } from '../../../shared/models/mapping.class';
import { MappingClass } from '../../../shared/models/mappingClass.interface';
import { MappingProperty } from '../../../shared/models/mappingProperty.interface';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { MappingManagerService } from '../../../shared/services/mappingManager.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { UtilService } from '../../../shared/services/util.service';
import {datatypeValidator} from './datatypeValidator.function';

interface RangeClassOption {
    classMapping: JSONLDObject,
    title: string,
    new: boolean
}
interface DatatypeGroup {
    ontologyId: string,
    options: DatatypeOption[]
}
interface DatatypeOption {
    iri: string,
    display: string
}

/**
 * @class mapper.PropMappingOverlayComponent
 *
 * A component that creates content an overlay that creates or edits a PropertyMapping in the current
 * {@link shared.MapperStateService#selected mapping}. If the selected property in the {@link mapper.PropSelectComponent}
 * is a data property, a {@link mapper.ColumnSelectComponent} will appear to select the linked column index for the
 * DataMapping being created/edited. If the selected property is an object property, a select for ClassMappings of the
 * type the property links to will be displayed. Meant to be used in conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'prop-mapping-overlay',
    templateUrl: './propMappingOverlay.component.html',
    styleUrls: ['./propMappingOverlay.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PropMappingOverlayComponent implements OnInit {
    selectedPropMapping: JSONLDObject = undefined;
    selectedProp: MappingProperty = undefined;
    availableProps: MappingProperty[] = [];
    rangeClassOptions: RangeClassOption[] = [];
    rangeClass: MappingClass = undefined;
    showDatatypeSelect = false;
    datatypeMap: {[key: string]: string} = {};
    langString = false;
    emptyRangeValidator = (): ValidationErrors | null => !this.rangeClass ? {empty: true} : null; 

    propMappingForm = this.fb.group({
        prop: [{ value: '', disabled: false},  Validators.required],
        rangeClass: [''],
        column: [''],
        datatype: [''],
        language: ['']
    })

    filteredDatatypes: Observable<DatatypeGroup[]>;

    constructor(private dialogRef: MatDialogRef<PropMappingOverlayComponent>, private fb: UntypedFormBuilder,
        public state: MapperStateService, private mm: MappingManagerService,
        public om: OntologyManagerService, private pm: PropertyManagerService,
        private util: UtilService) {}

    ngOnInit(): void {
        this.datatypeMap = this.pm.getDatatypeMap();
        this.availableProps = this.state.getPropsByClassMappingId(this.state.selectedClassMappingId);
        this.filteredDatatypes = this.propMappingForm.controls.datatype.valueChanges
                .pipe(
                    startWith(''),
                    map(val => {
                        let filtered = Object.keys(this.datatypeMap);
                        if (val) {
                            filtered = filtered.filter(datatype => datatype.toLowerCase().includes(val.toLowerCase()));
                        }
                        return this._getDatatypeGroups(filtered);
                    })
                );
        if (!this.state.newProp && this.state.selectedPropMappingId) {
            this.setupEditProperty();
        }
    }
    setRangeClass(): void {
        const rangeClassId = this.util.getPropertyId(this.selectedProp.propObj, RDFS + 'range');
        if (rangeClassId) { // If property has range set
            this.rangeClass = find(this.state.availableClasses, {classObj: {'@id': rangeClassId}});
            if (this.rangeClass.isDeprecated) {
                this.propMappingForm.controls.rangeClass.disable();
            } else {
                this.propMappingForm.controls.rangeClass.enable();
            }
            const newOption = {
                new: true,
                title: '[New ' + this.om.getEntityName(this.rangeClass.classObj).trim() + ']',
                classMapping: undefined
            };
            this.rangeClassOptions = [newOption].concat(
                this.state.selected.mapping.getClassMappingsByClassId(rangeClassId).map(classMapping => ({
                    new: false,
                    title: this.util.getDctermsValue(classMapping, 'title'),
                    classMapping
                }))
            );
            const classMappingId = this.util.getPropertyId(this.selectedPropMapping, DELIM + 'classMapping');
            if (classMappingId) {
                this.propMappingForm.controls.rangeClass.setValue(this.rangeClassOptions.find(option => get(option.classMapping, '@id') === classMappingId));
            } else {
                this.propMappingForm.controls.rangeClass.setValue('');
            }
        } else { // If property does not have a range set
            this.rangeClass = undefined;
            this.rangeClassOptions = [];
            this.propMappingForm.controls.rangeClass.setValue('');
            this.propMappingForm.controls.rangeClass.disable();
        }
    }
    selectProp(property: MappingProperty): void {
        this.selectedProp = property;
        this.updateRange();
    }
    updateRange(): void {
        this.propMappingForm.controls.column.setValue('');
        if (this.selectedProp.isObjectProperty) {
            this.propMappingForm.controls.rangeClass.setValidators([this.emptyRangeValidator, Validators.required]);
            this.propMappingForm.controls.column.clearValidators();
            this.setRangeClass();
        } else {
            this.propMappingForm.controls.rangeClass.clearValidators();
            this.propMappingForm.controls.column.setValidators([Validators.required]);
            this.rangeClassOptions = [];
            this.propMappingForm.controls.rangeClass.setValue(undefined);
            this.rangeClass = undefined;
            this.propMappingForm.controls.datatype.setValue('');
            this.propMappingForm.controls.language.setValue('');
            this.showDatatypeSelect = false;
        }
    }
    getDatatypeText(iri: string): string {
        return this.util.getBeautifulIRI(iri) || '';
    }
    selectDatatype(event: MatAutocompleteSelectedEvent): void {
        this.langString = RDF + 'langString' === event.option?.value;
        if (this.langString) {
            this.propMappingForm.controls.language.setValidators([Validators.required]);
        } else {
            this.propMappingForm.controls.language.clearValidators();
            this.propMappingForm.controls.language.setValue('');
        }
    }
    showDatatype(): void {
        this.showDatatypeSelect = !this.showDatatypeSelect;
        if (this.showDatatypeSelect) {
            this.propMappingForm.controls.datatype.setValidators([Validators.required, datatypeValidator(Object.keys(this.datatypeMap))]);
        } else {
            this.clearDatatype();
        }
    }
    clearDatatype(): void {
        this.showDatatypeSelect = false;
        this.langString = false;
        this.propMappingForm.controls.datatype.clearValidators();
        this.propMappingForm.controls.language.clearValidators();
        this.propMappingForm.controls.datatype.setValue('');
        this.propMappingForm.controls.language.setValue('');
        this.propMappingForm.updateValueAndValidity();
    }
    addProp(): void {
        if (this.state.newProp) { // If creating a new property mapping
            const additionsObj = find(this.state.selected.difference.additions as JSONLDObject[], {'@id': this.state.selectedClassMappingId});
            let propMap;
            let prop;
            if (this.selectedProp.isObjectProperty) {
                // Add range ClassMapping first
                const classMappingId = this._getRangeClassMappingId();

                // Add ObjectMapping pointing to new range class mapping
                propMap = this.state.addObjectMapping(this.selectedProp, this.state.selectedClassMappingId, classMappingId);
                prop = DELIM + 'objectProperty';
            } else {
                // Add the DataMapping pointing to the selectedColumn
                const selectedColumn = this.propMappingForm.controls.column.value;
                const datatype = this.propMappingForm.controls.datatype.value;
                const language = this.propMappingForm.controls.language.value;
                propMap = this.state.addDataMapping(this.selectedProp, this.state.selectedClassMappingId, selectedColumn, datatype, language);
                prop = DELIM + 'dataProperty';
            }

            if (additionsObj) {
                // If the additionsObj for the parent ClassMapping exists, add the triple for the new PropertyMapping
                if (!has(additionsObj, '[\'' + prop + '\']')) {
                    additionsObj[prop] = [];
                }
                additionsObj[prop].push({'@id': propMap['@id']});
            } else {
                // If the additionsObj for the parent ClassMapping does not exist, add it with the triple for the new PropertyMapping
                (this.state.selected.difference.additions as JSONLDObject[]).push({'@id': this.state.selectedClassMappingId, [prop]: [{'@id': propMap['@id']}]});
            }
            this.state.newProp = false;
        } else { // If editing an existing property
            if (this.mm.isDataMapping(this.selectedPropMapping)) {
                // Update the selected column
                const originalIndex = this.util.getPropertyValue(this.selectedPropMapping, DELIM + 'columnIndex');
                const selectedColumn = this.propMappingForm.controls.column.value;
                this.selectedPropMapping[DELIM + 'columnIndex'][0]['@value'] = '' + selectedColumn;
                this.state.changeProp(this.selectedPropMapping['@id'], DELIM + 'columnIndex', '' + selectedColumn, originalIndex);

                const originalDatatype = this.util.getPropertyId(this.selectedPropMapping, DELIM + 'datatypeSpec');
                if (this.propMappingForm.controls.datatype.value) { // Set the datatype override if present
                    const datatype = this.propMappingForm.controls.datatype.value;
                    this.selectedPropMapping[DELIM + 'datatypeSpec'] = [{'@id': datatype}];
                    this.state.changeProp(this.selectedPropMapping['@id'], DELIM + 'datatypeSpec', datatype, originalDatatype);
                } else { // Clear the datatype override if the input is cleared
                    this.util.removePropertyId(this.selectedPropMapping, DELIM + 'datatypeSpec', originalDatatype);
                }

                const originalLanguage = this.util.getPropertyValue(this.selectedPropMapping, DELIM + 'languageSpec');
                if (this.propMappingForm.controls.language.value) { // Set the language tag if present
                    const language = this.propMappingForm.controls.language.value;
                    this.selectedPropMapping[DELIM + 'languageSpec'] = [{'@value': language}];
                    this.state.changeProp(this.selectedPropMapping['@id'], DELIM + 'languageSpec', language, originalLanguage);
                }
                if (!this.langString) {
                    this.util.removePropertyValue(this.selectedPropMapping, DELIM + 'languageSpec', originalLanguage);
                }
                remove(this.state.invalidProps, {id: this.state.selectedPropMappingId});
            } else {
                // Update range class mapping for object property mapping
                const classMappingId = this._getRangeClassMappingId();
                const originalClassMappingId = this.util.getPropertyId(this.selectedPropMapping, DELIM + 'classMapping');
                this.selectedPropMapping[DELIM + 'classMapping'][0]['@id'] = classMappingId;
                this.state.changeProp(this.selectedPropMapping['@id'], DELIM + 'classMapping', classMappingId, originalClassMappingId);
            }
        }

        const selectedClassMappingId = this.state.selectedClassMappingId;
        this.state.resetEdit();
        this.state.selectedClassMappingId = selectedClassMappingId;
        this.dialogRef.close();
    }
    setupEditProperty(): void {
        this.propMappingForm.controls.prop.disable();
        this.selectedPropMapping = this.state.selected.mapping.getPropMapping(this.state.selectedPropMappingId);
        const propId = Mapping.getPropIdByMapping(this.selectedPropMapping);
        this.selectedProp = this.availableProps.find(mappingProperty => mappingProperty.propObj['@id'] === propId);
        this.propMappingForm.controls.prop.setValue(this.selectedProp);
        if (this.selectedProp.isObjectProperty) {
            this.setRangeClass();
        } else {
            this.propMappingForm.controls.column.setValue(parseInt(this.util.getPropertyValue(this.selectedPropMapping, DELIM + 'columnIndex'), 10));
            const datatype = this.util.getPropertyId(this.selectedPropMapping, DELIM + 'datatypeSpec');
            this.propMappingForm.controls.datatype.setValue(datatype);
            if (datatype) {
                this.showDatatypeSelect = true;
                this.langString = RDF + 'langString' === datatype;
                if (this.langString) {
                    this.propMappingForm.controls.language.setValue(this.util.getPropertyValue(this.selectedPropMapping, DELIM + 'languageSpec'));
                }
            }
        }
    }
    cancel(): void {
        this.state.newProp = false;
        this.dialogRef.close();
    }

    private _getRangeClassMappingId() {
        if (this.propMappingForm.controls.rangeClass.value.new) {
            const classMappingId = this.state.addClassMapping(this.rangeClass)['@id'];
            if (!this.state.hasPropsSet(this.rangeClass.classObj['@id'])) {
                this.state.setProps(this.rangeClass.classObj['@id']);
            }
            return classMappingId;
        } else {
            return this.propMappingForm.controls.rangeClass.value.classMapping['@id'];
        }
    }
    private _getDatatypeGroups(keys: string[]): DatatypeGroup[] {
        const namespaceToDatatypes: {[key: string]: string[]} = invertBy(pick(this.datatypeMap, keys));
        return Object.keys(namespaceToDatatypes).map(namespace => {
            const options = namespaceToDatatypes[namespace].map(datatype => ({
                iri: datatype,
                display: this.util.getBeautifulIRI(datatype)
            }));
            options.sort((datatype1, datatype2) => datatype1.display.toLowerCase().localeCompare(datatype2.display.toLowerCase()));
            return {
                ontologyId: namespace,
                options: options
            };
        });
    }
}
