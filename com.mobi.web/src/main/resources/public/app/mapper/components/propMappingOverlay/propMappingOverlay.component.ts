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

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialogRef } from '@angular/material/dialog';
import { get, remove, find, has, invertBy, pick } from 'lodash';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { DELIM, OWL, RDF, XSD } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { Mapping } from '../../../shared/models/mapping.class';
import { MappingProperty } from '../../../shared/models/mappingProperty.interface';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { MappingManagerService } from '../../../shared/services/mappingManager.service';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { datatypeValidator } from './datatypeValidator.function';
import { getBeautifulIRI, getDctermsValue, getPropertyId, getPropertyValue, removePropertyId, removePropertyValue, updatePropertyId, updatePropertyValue } from '../../../shared/utility';
import { MappingClass } from '../../../shared/models/mappingClass.interface';

interface RangeClassOption {
    classMapping: JSONLDObject,
    title: string,
    mappingClass: MappingClass,
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
    error = '';
    parentClassId = '';
    selectedPropMapping: JSONLDObject = undefined;
    selectedProp: MappingProperty = undefined;
    showRangeClass = false;
    rangeClassOptions: RangeClassOption[] = [];
    rangeClasses: MappingClass[] = undefined;
    showDatatypeSelect = false;
    datatypeMap: {[key: string]: string} = {};
    langString = false;
    emptyRangeValidator = (): ValidationErrors | null => !this.selectedProp?.ranges.length ? {empty: true} : null; 

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
        private pm: PropertyManagerService) {}

    ngOnInit(): void {
        this.datatypeMap = this.pm.getDatatypeMap();
        this.parentClassId = this.state.selected.mapping.getClassIdByMappingId(this.state.selectedClassMappingId);
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
        let ob: Observable<MappingClass[]>;
        if (this.selectedProp.ranges.length) {
            ob = this.state.retrieveSpecificClasses(this.state.selected.mapping.getSourceOntologyInfo(), 
                this.selectedProp.ranges);
        } else {
            ob = of(undefined);
        }
        ob.subscribe((result: MappingClass[] | undefined) => {
            if (result && result.length) { // Found range classes in imports closure
                this.rangeClasses = result;
                this.rangeClassOptions = [];
                result.forEach(mappingClass => { // For each possible range class
                    // Prepend a "New" option
                    this.rangeClassOptions = [{
                        new: true,
                        title: `[New ${mappingClass.name.trim()}]`,
                        classMapping: undefined,
                        mappingClass
                    }].concat(this.rangeClassOptions);
                    // Append all existing class mappings
                    this.rangeClassOptions = this.rangeClassOptions.concat(
                        this.state.selected.mapping.getClassMappingsByClassId(mappingClass.iri).map(classMapping => ({
                            new: false,
                            title: getDctermsValue(classMapping, 'title'),
                            classMapping,
                            mappingClass
                        }))
                    );
                });
                // Set the range class select value to any existing range class mapping
                const classMappingId = getPropertyId(this.selectedPropMapping, `${DELIM}classMapping`);
                if (classMappingId) {
                    this.propMappingForm.controls.rangeClass.setValue(this.rangeClassOptions
                        .find(option => get(option.classMapping, '@id') === classMappingId));
                } else {
                    this.propMappingForm.controls.rangeClass.setValue('');
                }
                this.propMappingForm.controls.rangeClass.enable();
            } else { // No range classes set or they couldn't be found in imports closure
                this.rangeClasses = undefined;
                this.rangeClassOptions = [];
                this.propMappingForm.controls.rangeClass.setValue('');
                this.propMappingForm.controls.rangeClass.setValidators([this.emptyRangeValidator, Validators.required]);
            }
            this.showRangeClass = true;
        });
    }
    selectProp(property: MappingProperty): void {
        this.selectedProp = property;
        this.updateRange();
    }
    updateRange(): void {
        this.propMappingForm.controls.column.setValue('');
        if (this.selectedProp.type === `${OWL}ObjectProperty`) {
            this.propMappingForm.controls.rangeClass.reset();
            this.propMappingForm.controls.rangeClass.setValidators([this.emptyRangeValidator, Validators.required]);
            this.propMappingForm.controls.column.clearValidators();
            this.propMappingForm.controls.column.setValue('');
            this.propMappingForm.controls.column.updateValueAndValidity();
            this.setRangeClass();
        } else {
            this.propMappingForm.controls.rangeClass.clearValidators();
            this.propMappingForm.controls.column.setValidators([Validators.required]);
            this.rangeClassOptions = [];
            this.propMappingForm.controls.rangeClass.setValue(undefined);
            this.rangeClasses = undefined;
            this.showRangeClass = false;
            this.propMappingForm.controls.datatype.setValue(this.selectedProp.ranges[0] || `${XSD}string`);
            this.propMappingForm.controls.language.setValue('');
            this.showDatatypeSelect = false;
            if (this.selectedProp.ranges.length > 1 || this.state.supportedAnnotations.includes(this.selectedProp)) {
                this.showDatatype();
            }
        }
    }
    getDatatypeText(iri: string): string {
        return getBeautifulIRI(iri) || '';
    }
    selectDatatype(event: MatAutocompleteSelectedEvent): void {
        this.langString = `${RDF}langString` === event.option?.value;
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
        this.propMappingForm.controls.datatype.setValue(this.selectedProp.ranges[0] || `${XSD}string`);
        this.propMappingForm.controls.language.setValue('');
        this.propMappingForm.updateValueAndValidity();
    }
    addProp(): void {
        if (this.state.newProp) { // If creating a new property mapping
            const additionsObj = find(this.state.selected.difference.additions as JSONLDObject[], {'@id': this.state.selectedClassMappingId});
            let propMap;
            let prop;
            if (this.selectedProp.type === `${OWL}ObjectProperty`) {
                // Add range ClassMapping first
                const classMappingId = this._getRangeClassMappingId();
                if (!classMappingId) {
                    this.error = 'Error creating range class mapping';
                    return;
                }

                // Add ObjectMapping pointing to new range class mapping
                propMap = this.state.addObjectMapping(this.selectedProp, this.state.selectedClassMappingId, classMappingId);
                prop = `${DELIM}objectProperty`;
            } else {
                // Add the DataMapping pointing to the selectedColumn
                const selectedColumn = this.propMappingForm.controls.column.value;
                const datatype = this.propMappingForm.controls.datatype.value || this.selectedProp.ranges[0] || `${XSD}string`;
                const language = this.propMappingForm.controls.language.value;
                propMap = this.state.addDataMapping(this.selectedProp, this.state.selectedClassMappingId, selectedColumn, datatype, language);
                prop = `${DELIM}dataProperty`;
            }

            if (additionsObj) {
                // If the additionsObj for the parent ClassMapping exists, add the triple for the new PropertyMapping
                if (!has(additionsObj, `['${prop}']`)) {
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
                const originalIndex = getPropertyValue(this.selectedPropMapping, `${DELIM}columnIndex`);
                const selectedColumn = this.propMappingForm.controls.column.value;
                updatePropertyValue(this.selectedPropMapping, `${DELIM}columnIndex`, `${selectedColumn}`);
                this.state.changeProp(this.selectedPropMapping['@id'], `${DELIM}columnIndex`, `${selectedColumn}`, originalIndex);

                const originalDatatype = getPropertyId(this.selectedPropMapping, `${DELIM}datatypeSpec`);
                if (this.propMappingForm.controls.datatype.value) { // Set the datatype override if present
                    const datatype = this.propMappingForm.controls.datatype.value;
                    updatePropertyId(this.selectedPropMapping, `${DELIM}datatypeSpec`, datatype);
                    this.state.changeProp(this.selectedPropMapping['@id'], `${DELIM}datatypeSpec`, datatype, originalDatatype);
                } else { // Clear the datatype override if the input is cleared
                    removePropertyId(this.selectedPropMapping, `${DELIM}datatypeSpec`, originalDatatype);
                }

                const originalLanguage = getPropertyValue(this.selectedPropMapping, `${DELIM}languageSpec`);
                if (this.propMappingForm.controls.language.value) { // Set the language tag if present
                    const language = this.propMappingForm.controls.language.value;
                    this.selectedPropMapping[`${DELIM}languageSpec`] = [{'@value': language}];
                    this.state.changeProp(this.selectedPropMapping['@id'], `${DELIM}languageSpec`, language, originalLanguage);
                }
                if (!this.langString) {
                    removePropertyValue(this.selectedPropMapping, `${DELIM}languageSpec`, originalLanguage);
                }
                remove(this.state.invalidProps, {id: this.state.selectedPropMappingId});
            } else {
                // Update range class mapping for object property mapping
                const classMappingId = this._getRangeClassMappingId();
                const originalClassMappingId = getPropertyId(this.selectedPropMapping, `${DELIM}classMapping`);
                updatePropertyId(this.selectedPropMapping, `${DELIM}classMapping`, classMappingId);
                this.state.changeProp(this.selectedPropMapping['@id'], `${DELIM}classMapping`, classMappingId, originalClassMappingId);
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
        const annotationProp = this.state.supportedAnnotations.find(prop => prop.iri === propId);
        let ob: Observable<MappingProperty>;
        if (annotationProp) {
            ob = of(annotationProp);
        } else {
            const iriObjs = this.mm.isObjectMapping(this.selectedPropMapping) ? [{ iri: propId, type: `${OWL}ObjectProperty` }] 
                : [{ iri: propId, type: `${OWL}DatatypeProperty` }, { iri: propId, type: `${OWL}AnnotationProperty` }];
            ob = this.state.retrieveSpecificProps(this.state.selected.mapping.getSourceOntologyInfo(), iriObjs)
                .pipe(map(results => results[0]));
        }
        ob.subscribe(result => {
            this.error = '';
            this.selectedProp = result;
            this.propMappingForm.controls.prop.setValue(this.selectedProp);
            if (this.selectedProp) {
                if (this.selectedProp.type === `${OWL}ObjectProperty`) {
                    this.setRangeClass();
                } else {
                    this.propMappingForm.controls.column.setValue(parseInt(getPropertyValue(this.selectedPropMapping, `${DELIM}columnIndex`), 10));
                    const datatype = getPropertyId(this.selectedPropMapping, `${DELIM}datatypeSpec`) || this.selectedProp.ranges[0];
                    this.propMappingForm.controls.datatype.setValue(datatype);
                    if (!this.selectedProp.ranges.includes(datatype) || this.selectedProp.ranges.length > 1) {
                        this.showDatatype();
                    }
                    this.langString = `${RDF}langString` === datatype;
                    if (this.langString) {
                        this.propMappingForm.controls.language.setValue(getPropertyValue(this.selectedPropMapping, `${DELIM}languageSpec`));
                    }
                }
            } else {
                this.error = 'Could not find property';
            }
        }, error => this.error = error);
    }
    cancel(): void {
        this.state.newProp = false;
        this.dialogRef.close();
    }

    private _getRangeClassMappingId() {
        if (this.propMappingForm.controls.rangeClass.value.new) {
            const classMapping = this.state.addClassMapping(this.propMappingForm.controls.rangeClass.value.mappingClass);
            return classMapping ? classMapping['@id'] : '';
        } else {
            return this.propMappingForm.controls.rangeClass.value.classMapping['@id'];
        }
    }
    private _getDatatypeGroups(keys: string[]): DatatypeGroup[] {
        const namespaceToDatatypes: {[key: string]: string[]} = invertBy(pick(this.datatypeMap, keys));
        return Object.keys(namespaceToDatatypes).map(namespace => {
            const options = namespaceToDatatypes[namespace].map(datatype => ({
                iri: datatype,
                display: getBeautifulIRI(datatype)
            }));
            options.sort((datatype1, datatype2) => datatype1.display.toLowerCase().localeCompare(datatype2.display.toLowerCase()));
            return {
                ontologyId: namespace,
                options: options
            };
        });
    }
}
