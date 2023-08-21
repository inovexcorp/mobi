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

import { DebugElement, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { cloneDeep } from 'lodash';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { DCTERMS, DELIM, RDF, RDFS, XSD } from '../../../prefixes';
import { Difference } from '../../../shared/models/difference.class';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { MappingClass } from '../../../shared/models/mappingClass.interface';
import { MappingProperty } from '../../../shared/models/mappingProperty.interface';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { MappingManagerService } from '../../../shared/services/mappingManager.service';
import { ColumnSelectComponent } from '../columnSelect/columnSelect.component';
import { PropPreviewComponent } from '../propPreview/propPreview.component';
import { PropSelectComponent } from '../propSelect/propSelect.component';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { LanguageSelectComponent } from '../../../shared/components/languageSelect/languageSelect.component';
import { PropMappingOverlayComponent } from './propMappingOverlay.component';

describe('Prop Mapping Overlay component', function() {
    let component: PropMappingOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<PropMappingOverlayComponent>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<PropMappingOverlayComponent>>;
    let mappingManagerStub: jasmine.SpyObj<MappingManagerService>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let propertyManagerStub: jasmine.SpyObj<PropertyManagerService>;

    const datatypeMap = {
        'boolean': XSD
    };
    const propMappingId = 'propMappingId';
    const classMappingId = 'classMappingId';
    const classId = 'classId';
    const propId = 'propId';
    const classMapping: JSONLDObject = {
      '@id': classMappingId,
      [`${DCTERMS}title`]: [{ '@value': 'title' }]
    };
    const propMapping: JSONLDObject = {
        '@id': propMappingId,
        [`${DELIM}hasProperty`]: [{ '@id': propId }],
        [`${DELIM}classMapping`]: [{ '@id': classMappingId }]
    };
    const mappingClass: MappingClass = {
        classObj: {'@id': classId},
        name: '',
        isDeprecated: false,
        ontologyId: ''
    };
    const mappingProperty: MappingProperty = {
        propObj: {
          '@id': propId,
          [`${RDFS}range`]: [{ '@id': classId }]
        },
        name: '',
        isDeprecated: false,
        isObjectProperty: false,
        ontologyId: ''
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatDialogModule,
                MatButtonModule,
                MatFormFieldModule,
                MatInputModule,
                MatAutocompleteModule,
                MatSelectModule
            ],
            declarations: [
                PropMappingOverlayComponent,
                MockComponent(PropSelectComponent),
                MockComponent(PropPreviewComponent),
                MockComponent(ColumnSelectComponent),
                MockComponent(LanguageSelectComponent)
            ],
            providers: [
                MockProvider(MappingManagerService),
                MockProvider(MapperStateService),
                MockProvider(OntologyManagerService),
                MockProvider(PropertyManagerService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        }).overrideComponent(PropMappingOverlayComponent, {
            set: { changeDetection: ChangeDetectionStrategy.Default }
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(PropMappingOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mapperStateStub = TestBed.inject(MapperStateService) as jasmine.SpyObj<MapperStateService>;
        mappingManagerStub = TestBed.inject(MappingManagerService) as jasmine.SpyObj<MappingManagerService>;
        ontologyManagerStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;
        propertyManagerStub = TestBed.inject(PropertyManagerService) as jasmine.SpyObj<PropertyManagerService>;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<PropMappingOverlayComponent>>;

        propertyManagerStub.getDatatypeMap.and.returnValue(datatypeMap);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        matDialogRef = null;
        mapperStateStub = null;
        mappingManagerStub = null;
        ontologyManagerStub = null;
        propertyManagerStub = null;
    });

    describe('should initialize with the correct values', function() {
        beforeEach(() => {
            spyOn(component, 'setupEditProperty');
            mapperStateStub.getPropsByClassMappingId.and.returnValue([]);
        });
        it('if a new property mapping is being created', function() {
            mapperStateStub.newProp = true;
            component.ngOnInit();
            expect(component.datatypeMap).toEqual(datatypeMap);
            expect(component.availableProps).toEqual([]);
            expect(component.setupEditProperty).not.toHaveBeenCalled();
        });
        it('if a property mapping is being edited', function() {
            mapperStateStub.newProp = false;
            mapperStateStub.selectedPropMappingId = propMappingId;
            component.ngOnInit();
            expect(component.datatypeMap).toEqual(datatypeMap);
            expect(component.availableProps).toEqual([]);
            expect(component.setupEditProperty).toHaveBeenCalledWith();
        });
    });
    describe('controller methods', function() {
        describe('should set the range class mapping of the selected property', function() {
            beforeEach(function() {
                component.selectedPropMapping = propMapping;
            });
            it('unless the range is not set', function() {
                const mappingPropertyClone = cloneDeep(mappingProperty);
                delete mappingPropertyClone.propObj[`${RDFS}range`];
                component.selectedProp = mappingPropertyClone;
                component.setRangeClass();
                expect(component.rangeClass).toBeUndefined();
                expect(component.rangeClassOptions).toEqual([]);
                expect(component.propMappingForm.controls.rangeClass.value).toEqual('');
                expect(component.propMappingForm.controls.rangeClass.disabled).toBeTrue();
            });
            describe('if the range is set', function() {
                beforeEach(function() {
                    component.selectedProp = mappingProperty;
                    this.mappingStub = jasmine.createSpyObj('Mapping', ['getClassMappingsByClassId']);
                    this.mappingStub.getClassMappingsByClassId.and.returnValue([classMapping]);
                    mapperStateStub.selected = {
                        mapping: this.mappingStub,
                        difference: new Difference()
                    };
                    mapperStateStub.availableClasses = [mappingClass];
                    ontologyManagerStub.getEntityName.and.returnValue('Name');
                });
                it('and the property mapping already has a range class mapping set', function() {
                    component.setRangeClass();
                    expect(component.rangeClass).toEqual(mappingClass);
                    expect(component.rangeClassOptions).toEqual([
                        { new: true, title: '[New Name]', classMapping: undefined },
                        { new: false, title: 'title', classMapping }
                    ]);
                    expect(component.propMappingForm.controls.rangeClass.value).toEqual({ new: false, title: 'title', classMapping });
                    expect(component.propMappingForm.controls.rangeClass.disabled).toBeFalse();
                });
                it('and the property mapping does not have a range class mapping set', function() {
                    component.selectedPropMapping = cloneDeep(propMapping);
                    delete component.selectedPropMapping[`${DELIM}classMapping`];
                    component.setRangeClass();
                    expect(component.rangeClass).toEqual(mappingClass);
                    expect(component.rangeClassOptions).toEqual([
                        { new: true, title: '[New Name]', classMapping: undefined },
                        { new: false, title: 'title', classMapping }
                    ]);
                    expect(component.propMappingForm.controls.rangeClass.value).toEqual('');
                    expect(component.propMappingForm.controls.rangeClass.disabled).toBeFalse();
                });
            });
        });
        it('should handle setting the property', function() {
            spyOn(component, 'updateRange');
            component.selectProp(mappingProperty);
            expect(component.selectedProp).toEqual(mappingProperty);
            expect(component.updateRange).toHaveBeenCalledWith();
        });
        describe('should update the range of the selected property', function() {
            beforeEach(function() {
                spyOn(component, 'setRangeClass');
                component.selectedProp = cloneDeep(mappingProperty);
            });
            it('if it is a object property', function() {
                component.selectedProp.isObjectProperty = true;
                component.updateRange();
                expect(component.propMappingForm.controls.rangeClass.validator).toBeDefined();
                expect(component.propMappingForm.controls.column.validator).toBeNull();
                expect(component.setRangeClass).toHaveBeenCalledWith();
            });
            it('if it is a data property', function() {
                component.updateRange();
                expect(component.propMappingForm.controls.rangeClass.validator).toBeNull();
                expect(component.propMappingForm.controls.column.validator).toBeDefined();
                expect(component.propMappingForm.controls.rangeClass.value).toBeUndefined();
                expect(component.propMappingForm.controls.datatype.value).toEqual('');
                expect(component.propMappingForm.controls.language.value).toEqual('');
                expect(component.setRangeClass).not.toHaveBeenCalled();
                expect(component.rangeClassOptions).toEqual([]);
                expect(component.rangeClass).toBeUndefined();
                expect(component.showDatatypeSelect).toBeFalse();
            });
        });
        it('should get text for a datatype', function() {
            expect(component.getDatatypeText('iri')).toEqual('Iri');
            expect(component.getDatatypeText(undefined)).toEqual('');
        });
        describe('should handle selecting a datatype', function() {
            it('if it a lang string', function() {
                const event = {
                    option: {
                        value: `${RDF}langString`
                    }
                } as MatAutocompleteSelectedEvent;
                component.selectDatatype(event);
                expect(component.langString).toBeTrue();
            });
            it('if it not a lang string', function() {
                const event = {
                    option: {
                        value: `${XSD}string`
                    }
                } as MatAutocompleteSelectedEvent;
                component.selectDatatype(event);
                expect(component.langString).toBeFalse();
            });
        });
        describe('should handle toggling the datatype select', function() {
            beforeEach(function() {
                spyOn(component, 'clearDatatype');
            });
            it('when it should be shown', function() {
                component.showDatatype();
                expect(component.showDatatypeSelect).toBeTrue();
                expect(component.clearDatatype).not.toHaveBeenCalledWith();
            });
            it('when it should be hidden', function() {
                component.showDatatypeSelect = true;
                component.showDatatype();
                expect(component.showDatatypeSelect).toBeFalse();
                expect(component.clearDatatype).toHaveBeenCalledWith();
            });
        });
        it('should clear the datatype', function() {
            component.showDatatypeSelect = true;
            component.clearDatatype();
            expect(component.showDatatypeSelect).toBeFalse();
            expect(component.langString).toBeFalse();
            expect(component.propMappingForm.controls.datatype.value).toEqual('');
            expect(component.propMappingForm.controls.language.value).toEqual('');
            expect(component.propMappingForm.controls.datatype.validator).toBeNull();
            expect(component.propMappingForm.controls.language.validator).toBeNull();
            expect(component.propMappingForm.controls.datatype.valid).toBeTrue();
            expect(component.propMappingForm.controls.language.valid).toBeTrue();
        });
        describe('should add the property mapping', function() {
            beforeEach(function() {
                mapperStateStub.selectedClassMappingId = classMappingId;
            });
            describe('if a new property mapping is being created', function() {
                beforeEach(function() {
                    mapperStateStub.newProp = true;
                    mapperStateStub.selected = {
                        mapping: undefined,
                        difference: new Difference()
                    };
                });
                describe('for an object property', function() {
                    beforeEach(function() {
                        this.objectMappingProperty = cloneDeep(mappingProperty);
                        this.objectMappingProperty.isObjectProperty = true;
                        component.selectedProp = this.objectMappingProperty;
                        mapperStateStub.addClassMapping.and.returnValue(classMapping);
                        mapperStateStub.addObjectMapping.and.returnValue(propMapping);
                    });
                    it('and a class mapping was selected and the parent class mapping does not exist in the additions', function() {
                        component.propMappingForm.controls.rangeClass.setValue({
                            classMapping,
                            title: '',
                            new: false
                        });
                        component.addProp();
                        expect(mapperStateStub.addClassMapping).not.toHaveBeenCalled();
                        expect(mapperStateStub.setProps).not.toHaveBeenCalled();
                        expect(mapperStateStub.addObjectMapping).toHaveBeenCalledWith(this.objectMappingProperty, classMappingId, classMappingId);
                        expect(mapperStateStub.addDataMapping).not.toHaveBeenCalled();
                        expect((mapperStateStub.selected.difference.additions as JSONLDObject[])).toContain({'@id': classMappingId, [`${DELIM}objectProperty`]: [{'@id': propMappingId}]});
                        expect(mapperStateStub.newProp).toBe(false);
                        expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                        expect(mapperStateStub.selectedClassMappingId).toEqual(classMappingId);
                        expect(matDialogRef.close).toHaveBeenCalledWith();
                    });
                    it('and a new class mapping should be created and the parent class mapping already exists in the additions', function() {
                        const additionsObj = cloneDeep(classMapping);
                        mapperStateStub.selected.difference.additions = [additionsObj];
                        component.propMappingForm.controls.rangeClass.setValue({
                            classMapping,
                            title: '',
                            new: true
                        });
                        component.rangeClass = mappingClass;
                        component.addProp();
                        expect(mapperStateStub.addClassMapping).toHaveBeenCalledWith(mappingClass);
                        expect(mapperStateStub.setProps).toHaveBeenCalledWith(mappingClass.classObj['@id']);
                        expect(mapperStateStub.addObjectMapping).toHaveBeenCalledWith(this.objectMappingProperty, classMappingId, classMappingId);
                        expect(mapperStateStub.addDataMapping).not.toHaveBeenCalled();
                        expect(additionsObj[`${DELIM}objectProperty`]).toEqual([{'@id': propMappingId}]);
                        expect((mapperStateStub.selected.difference.additions as JSONLDObject[])).toContain(additionsObj);
                        expect(mapperStateStub.newProp).toBe(false);
                        expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                        expect(mapperStateStub.selectedClassMappingId).toEqual(classMappingId);
                        expect(matDialogRef.close).toHaveBeenCalledWith();
                    });
                });
                describe('for a data property', function() {
                    beforeEach(function() {
                        component.selectedProp = mappingProperty;
                        mapperStateStub.addDataMapping.and.returnValue(propMapping);
                        component.propMappingForm.controls.column.setValue(0);
                        component.propMappingForm.controls.datatype.setValue(`${XSD}string`);
                    });
                    it('if the parent class mapping does not exist in the additions', function() {
                        component.addProp();
                        expect(mapperStateStub.addObjectMapping).not.toHaveBeenCalled();
                        expect(mapperStateStub.addDataMapping).toHaveBeenCalledWith(mappingProperty, classMappingId, 0, `${XSD}string`, '');
                        expect((mapperStateStub.selected.difference.additions as JSONLDObject[])).toContain({'@id': classMappingId, [`${DELIM}dataProperty`]: [{'@id': propMappingId}]});
                        expect(mapperStateStub.newProp).toBe(false);
                        expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                        expect(mapperStateStub.selectedClassMappingId).toEqual(classMappingId);
                        expect(matDialogRef.close).toHaveBeenCalledWith();
                    });
                    it('if the parent class mapping already exists in the additions', function() {
                        const additionsObj = cloneDeep(classMapping);
                        mapperStateStub.selected.difference.additions = [additionsObj];
                        component.addProp();
                        expect(mapperStateStub.addObjectMapping).not.toHaveBeenCalled();
                        expect(mapperStateStub.addDataMapping).toHaveBeenCalledWith(mappingProperty, classMappingId, 0, `${XSD}string`, '');
                        expect(additionsObj[`${DELIM}dataProperty`]).toEqual([{'@id': propMappingId}]);
                        expect((mapperStateStub.selected.difference.additions as JSONLDObject[])).toContain(additionsObj);
                        expect(mapperStateStub.newProp).toBe(false);
                        expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                        expect(mapperStateStub.selectedClassMappingId).toEqual(classMappingId);
                        expect(matDialogRef.close).toHaveBeenCalledWith();
                    });
                });
            });
            describe('if a property mapping is being edited', function() {
                beforeEach(function() {
                    component.selectedPropMapping = cloneDeep(propMapping);
                    mapperStateStub.selectedPropMappingId = propMapping['@id'];
                    mapperStateStub.newProp = false;
                });
                describe('and it is for an object property', function() {
                    const originalClassMappingId = 'original';
                    beforeEach(function() {
                        mapperStateStub.addClassMapping.and.returnValue(classMapping);
                        mappingManagerStub.isDataMapping.and.returnValue(false);
                        // toastStub.getPropertyId.and.returnValue(originalClassMappingId);
                        component.selectedPropMapping[`${DELIM}classMapping`] = [{'@id': originalClassMappingId}];
                    });
                    it('and a class mapping was selected', function() {
                        component.propMappingForm.controls.rangeClass.setValue({
                            classMapping,
                            title: '',
                            new: false
                        });
                        component.addProp();
                        expect(mapperStateStub.addClassMapping).not.toHaveBeenCalled();
                        expect(component.selectedPropMapping[`${DELIM}classMapping`]).toEqual([{'@id': classMappingId}]);
                        expect(mapperStateStub.changeProp).toHaveBeenCalledWith(propMappingId, `${DELIM}classMapping`, classMappingId, originalClassMappingId);
                        expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                        expect(mapperStateStub.selectedClassMappingId).toBe(classMappingId);
                        expect(matDialogRef.close).toHaveBeenCalledWith();
                    });
                    it('and a new class mapping should be created', function() {
                        component.propMappingForm.controls.rangeClass.setValue({
                            classMapping,
                            title: '',
                            new: true
                        });
                        component.rangeClass = mappingClass;
                        component.addProp();
                        expect(mapperStateStub.addClassMapping).toHaveBeenCalledWith(mappingClass);
                        expect(component.selectedPropMapping[`${DELIM}classMapping`]).toEqual([{'@id': classMappingId}]);
                        expect(mapperStateStub.changeProp).toHaveBeenCalledWith(propMappingId, `${DELIM}classMapping`, classMappingId, originalClassMappingId);
                        expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                        expect(mapperStateStub.selectedClassMappingId).toBe(classMappingId);
                        expect(matDialogRef.close).toHaveBeenCalledWith();
                    });
                });
                describe('and it is for a data property', function() {
                    beforeEach(function() {
                        mappingManagerStub.isDataMapping.and.returnValue(true);
                        component.propMappingForm.controls.column.setValue(0);
                        component.selectedPropMapping[`${DELIM}columnIndex`] = [{'@value': '10'}];
                        mapperStateStub.invalidProps = [{id: propMappingId, index: 0}];
                    });
                    it('with the column index updated', function() {
                        component.addProp();
                        expect(component.selectedPropMapping[`${DELIM}columnIndex`]).toEqual([{'@value': '0'}]);
                        expect(mapperStateStub.changeProp).toHaveBeenCalledWith(propMappingId, `${DELIM}columnIndex`, '0', '10');
                        expect(mapperStateStub.changeProp).not.toHaveBeenCalledWith(propMappingId, `${DELIM}datatypeSpec`, jasmine.anything(), jasmine.anything());
                        expect(mapperStateStub.changeProp).not.toHaveBeenCalledWith(propMappingId, `${DELIM}languageSpec`, jasmine.anything(), jasmine.anything());
                        expect(mapperStateStub.invalidProps).toEqual([]);
                        expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                        expect(mapperStateStub.selectedClassMappingId).toBe(classMappingId);
                        expect(matDialogRef.close).toHaveBeenCalledWith();
                    });
                    it('with the datatypeSpec updated', function() {
                        component.propMappingForm.controls.datatype.setValue(`${XSD}string`);
                        component.selectedPropMapping[`${DELIM}datatypeSpec`] = [{'@id': `${XSD}boolean`}];
                        component.addProp();
                        expect(component.selectedPropMapping[`${DELIM}columnIndex`]).toEqual([{'@value': '0'}]);
                        expect(mapperStateStub.changeProp).toHaveBeenCalledWith(propMappingId, `${DELIM}columnIndex`, '0', '10');
                        expect(component.selectedPropMapping[`${DELIM}datatypeSpec`]).toEqual([{'@id': `${XSD}string`}]);
                        expect(mapperStateStub.changeProp).toHaveBeenCalledWith(propMappingId, `${DELIM}datatypeSpec`, `${XSD}string`, `${XSD}boolean`);
                        expect(mapperStateStub.changeProp).not.toHaveBeenCalledWith(propMappingId, `${DELIM}languageSpec`, jasmine.anything(), jasmine.anything());
                        expect(mapperStateStub.invalidProps).toEqual([]);
                        expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                        expect(mapperStateStub.selectedClassMappingId).toBe(classMappingId);
                        expect(matDialogRef.close).toHaveBeenCalledWith();
                    });
                    it('with the languageSpec updated', function() {
                        component.propMappingForm.controls.language.setValue('en');
                        component.selectedPropMapping[`${DELIM}languageSpec`] = [{'@value': 'ja'}];
                        component.langString = true;
                        component.addProp();
                        expect(component.selectedPropMapping[`${DELIM}columnIndex`]).toEqual([{'@value': '0'}]);
                        expect(mapperStateStub.changeProp).toHaveBeenCalledWith(propMappingId, `${DELIM}columnIndex`, '0', '10');
                        expect(mapperStateStub.changeProp).not.toHaveBeenCalledWith(propMappingId, `${DELIM}datatypeSpec`, jasmine.anything(), jasmine.anything());
                        expect(component.selectedPropMapping[`${DELIM}languageSpec`]).toEqual([{'@value': 'en'}]);
                        expect(mapperStateStub.changeProp).toHaveBeenCalledWith(propMappingId, `${DELIM}languageSpec`, 'en', 'ja');
                        expect(mapperStateStub.invalidProps).toEqual([]);
                        expect(mapperStateStub.resetEdit).toHaveBeenCalledWith();
                        expect(mapperStateStub.selectedClassMappingId).toBe(classMappingId);
                        expect(matDialogRef.close).toHaveBeenCalledWith();
                    });
                });
            });
        });
        describe('should setup a property mapping being edited', function() {
            beforeEach(function() {
                this.mappingStub = jasmine.createSpyObj('Mapping', [
                    'getPropMapping'
                ]);
                this.propMappingClone = cloneDeep(propMapping);
                this.mappingStub.getPropMapping.and.returnValue(this.propMappingClone);
                mapperStateStub.selected = {
                    mapping: this.mappingStub,
                    difference: new Difference()
                };
                mapperStateStub.selectedPropMappingId = propMappingId;
                component.availableProps = [mappingProperty];
                spyOn(component, 'setRangeClass');
            });
            describe('and it is a data property', function() {
                beforeEach(function() {
                    this.propMappingClone[`${DELIM}columnIndex`] = [{ '@value': '0' }];
                    this.propMappingClone[`${DELIM}languageSpec`] = [{ '@value': 'language' }];
                });
                describe('and a datatype is set', function() {
                    it('and it is lang string', function() {
                        this.propMappingClone[`${DELIM}datatypeSpec`] = [{ '@id': `${RDF}langString` }];
                        component.setupEditProperty();
                        expect(this.mappingStub.getPropMapping).toHaveBeenCalledWith(propMappingId);
                        expect(component.selectedPropMapping).toEqual(this.propMappingClone);
                        expect(component.selectedProp).toEqual(mappingProperty);
                        expect(component.propMappingForm.controls.prop.value).toEqual(mappingProperty);
                        expect(component.setRangeClass).not.toHaveBeenCalled();
                        expect(component.propMappingForm.controls.column.value).toEqual(0);
                        expect(component.propMappingForm.controls.datatype.value).toEqual(`${RDF}langString`);
                        expect(component.showDatatypeSelect).toBeTrue();
                        expect(component.langString).toBeTrue();
                        expect(component.propMappingForm.controls.language.value).toEqual('language');
                    });
                    it('and it is not lang string', function() {
                        this.propMappingClone[`${DELIM}datatypeSpec`] = [{ '@id': `${XSD}string` }];
                        component.setupEditProperty();
                        expect(this.mappingStub.getPropMapping).toHaveBeenCalledWith(propMappingId);
                        expect(component.selectedPropMapping).toEqual(this.propMappingClone);
                        expect(component.selectedProp).toEqual(mappingProperty);
                        expect(component.propMappingForm.controls.prop.value).toEqual(mappingProperty);
                        expect(component.setRangeClass).not.toHaveBeenCalled();
                        expect(component.propMappingForm.controls.column.value).toEqual(0);
                        expect(component.propMappingForm.controls.datatype.value).toEqual(`${XSD}string`);
                        expect(component.showDatatypeSelect).toBeTrue();
                        expect(component.langString).toBeFalse();
                        expect(component.propMappingForm.controls.language.value).toEqual('');
                    });
                });
                it('and it does not have a datatype set', function() {
                    component.setupEditProperty();
                    expect(this.mappingStub.getPropMapping).toHaveBeenCalledWith(propMappingId);
                    expect(component.selectedPropMapping).toEqual(this.propMappingClone);
                    expect(component.selectedProp).toEqual(mappingProperty);
                    expect(component.propMappingForm.controls.prop.value).toEqual(mappingProperty);
                    expect(component.setRangeClass).not.toHaveBeenCalled();
                    expect(component.propMappingForm.controls.column.value).toEqual(0);
                    expect(component.propMappingForm.controls.datatype.value).toEqual('');
                    expect(component.showDatatypeSelect).toBeFalse();
                    expect(component.langString).toBeFalse();
                    expect(component.propMappingForm.controls.datatype.value).toEqual('');
                    expect(component.propMappingForm.controls.language.value).toEqual('');
                });
            });
            it('and it is a object property', function() {
                const objectMappingProperty: MappingProperty = cloneDeep(mappingProperty);
                objectMappingProperty.isObjectProperty = true;
                component.availableProps = [objectMappingProperty];
                component.setupEditProperty();
                expect(this.mappingStub.getPropMapping).toHaveBeenCalledWith(propMappingId);
                expect(component.selectedPropMapping).toEqual(propMapping);
                expect(component.selectedProp).toEqual(objectMappingProperty);
                expect(component.propMappingForm.controls.prop.value).toEqual(objectMappingProperty);
                expect(component.setRangeClass).toHaveBeenCalledWith();
                expect(component.propMappingForm.controls.column.value).toEqual('');
                expect(component.propMappingForm.controls.datatype.value).toEqual('');
                expect(component.showDatatypeSelect).toBeFalse();
                expect(component.langString).toBeFalse();
                expect(component.propMappingForm.controls.language.value).toEqual('');
            });
        });
        it('should set the correct state for canceling', function() {
            component.cancel();
            expect(mapperStateStub.newProp).toBe(false);
            expect(matDialogRef.close).toHaveBeenCalledWith();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        it('with a prop select', function() {
            expect(element.queryAll(By.css('prop-select')).length).toBe(1);
        });
        it('depending on whether a new property mapping is being created', function() {
            fixture.detectChanges();
            const title = element.queryAll(By.css('h1'))[0];
            expect(title).toBeDefined();
            expect(title.nativeElement.innerHTML).toContain('Edit');

            mapperStateStub.newProp = true;
            fixture.detectChanges();
            expect(title.nativeElement.innerHTML).toContain('Add');
        });
        describe('depending on whether the selected property is', function() {
            describe('a data or annotation property', function() {
                beforeEach(function() {
                    component.selectedProp = mappingProperty;
                });
                it('not expanded', function() {
                    component.showDatatypeSelect = false;
                    fixture.detectChanges();
                    expect(element.queryAll(By.css('.data-property-container')).length).toBe(1);
                    expect(element.queryAll(By.css('column-select')).length).toBe(1);
                    expect(element.queryAll(By.css('.datatype-select-container')).length).toBe(1);
                    expect(element.queryAll(By.css('.datatype-select-container button')).length).toBe(1);
                    expect(element.queryAll(By.css('.data-property-container .datatype-select')).length).toBe(0);
                });
                describe('expanded', function() {
                    beforeEach(function() {
                        component.showDatatypeSelect = true;
                    });
                    it('and is not a lang string', function () {
                        fixture.detectChanges();
                        expect(element.queryAll(By.css('.data-property-container')).length).toBe(1);
                        expect(element.queryAll(By.css('column-select')).length).toBe(1);
                        expect(element.queryAll(By.css('.datatype-select-container')).length).toBe(1);
                        expect(element.queryAll(By.css('.datatype-select-container button')).length).toBe(1);
                        expect(element.queryAll(By.css('.data-property-container .datatype-select')).length).toBe(1);
                        expect(element.queryAll(By.css('language-select')).length).toBe(0);
                    });
                    it('and is a lang string', function () {
                        component.langString = true;
                        fixture.detectChanges();
                        expect(element.queryAll(By.css('.data-property-container')).length).toBe(1);
                        expect(element.queryAll(By.css('column-select')).length).toBe(1);
                        expect(element.queryAll(By.css('.datatype-select-container')).length).toBe(1);
                        expect(element.queryAll(By.css('.datatype-select-container button')).length).toBe(1);
                        expect(element.queryAll(By.css('.data-property-container .datatype-select')).length).toBe(1);
                        expect(element.queryAll(By.css('language-select')).length).toBe(1);
                    });
                });
            });
            it('an object property', function() {
                const newProp = cloneDeep(mappingProperty);
                newProp.isObjectProperty = true;
                component.selectedProp = newProp;
                mapperStateStub.newProp = true;
                fixture.detectChanges();
                expect(element.queryAll(By.css('.range-class-select-container')).length).toBe(1);
            });
        });
        it('depending on the validity of the form', function() {
            component.selectedProp = mappingProperty;
            component.propMappingForm.controls.prop.setValue(mappingProperty);
            fixture.detectChanges();
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button.properties['disabled']).toBeTruthy();
            
            component.propMappingForm.markAsDirty();
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
            
            component.propMappingForm.controls.prop.setValue('');
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();

            component.propMappingForm.controls.datatype.setValue('notValid');
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(component, 'cancel');
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', {});
        fixture.detectChanges();
        expect(component.cancel).toHaveBeenCalledWith();
    });
    it('should call addProp when the button is clicked', function() {
        spyOn(component, 'addProp');
        const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        submitButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.addProp).toHaveBeenCalledWith();
    });
});
