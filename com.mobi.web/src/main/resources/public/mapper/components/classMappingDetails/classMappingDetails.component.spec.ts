/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatButtonModule, MatDialog, MatDividerModule, MatIconModule, MatListModule, MatMenuModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import {
    cleanStylesFromDOM,
    mockPropertyManager,
    mockUtil,
} from '../../../../../../test/ts/Shared';
import { DELIM, RDFS, XSD } from '../../../prefixes';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { Difference } from '../../../shared/models/difference.class';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { Mapping } from '../../../shared/models/mapping.class';
import { MappingInvalidProp } from '../../../shared/models/mappingInvalidProp.interface';
import { MappingProperty } from '../../../shared/models/mappingProperty.interface';
import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { MappingManagerService } from '../../../shared/services/mappingManager.service';
import { IriTemplateOverlayComponent } from '../iriTemplateOverlay/iriTemplateOverlay.component';
import { PropMappingOverlayComponent } from '../propMappingOverlay/propMappingOverlay.component';
import { ClassMappingDetailsComponent } from './classMappingDetails.component';

describe('Class Mapping Details component', function() {
    let component: ClassMappingDetailsComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ClassMappingDetailsComponent>;
    let mappingManagerStub: jasmine.SpyObj<MappingManagerService>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let delimitedManagerStub: jasmine.SpyObj<DelimitedManagerService>;
    let propertyManagerStub;
    let utilStub;
    let matDialog: jasmine.SpyObj<MatDialog>;

    const classMappingId = 'classMappingId';
    const propMappingId = 'propMappingId';
    const classMapping: JSONLDObject = {'@id': classMappingId};
    const propMapping: JSONLDObject = {'@id': propMappingId};
    const invalidProp: MappingInvalidProp = {
        id: propMapping['@id'],
        index: 0
    };
    const propertyPreview = {
        jsonld: propMapping,
        isInvalid: false,
        title: ''
    };
    let mappingStub: jasmine.SpyObj<Mapping>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatButtonModule,
                MatMenuModule,
                MatDividerModule,
                MatListModule,
                MatIconModule
            ],
            declarations: [
                ClassMappingDetailsComponent,
                MockComponent(IriTemplateOverlayComponent),
                MockComponent(PropMappingOverlayComponent),
                MockComponent(ConfirmModalComponent),
            ],
            providers: [
                MockProvider(MappingManagerService),
                MockProvider(MapperStateService),
                MockProvider(DelimitedManagerService),
                { provide: 'propertyManagerService', useClass: mockPropertyManager },
                { provide: 'utilService', useClass: mockUtil },
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                    open: { afterClosed: () => of(true)}
                }) }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ClassMappingDetailsComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mappingManagerStub = TestBed.get(MappingManagerService);
        mapperStateStub = TestBed.get(MapperStateService);
        delimitedManagerStub = TestBed.get(DelimitedManagerService);
        propertyManagerStub = TestBed.get('propertyManagerService');
        utilStub = TestBed.get('utilService');
        matDialog = TestBed.get(MatDialog);

        mappingStub = jasmine.createSpyObj('Mapping', [
            'getClassMapping',
            'getPropMappingsByClass'
        ]);
        mappingStub.getClassMapping.and.returnValue(classMapping);
        mapperStateStub.selected = {
            difference: new Difference(),
            mapping: mappingStub
        };
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        mappingManagerStub = null;
        mapperStateStub = null;
        delimitedManagerStub = null;
        utilStub = null;
        matDialog = null;
        mappingStub = null;
    });

    it('should handle a classMappingId change', function() {
        spyOn(component, 'setPropMappings');
        spyOn(component, 'setIriTemplate');
        mapperStateStub.hasPropsByClassMappingId.and.returnValue(true);
        component.classMappingId = classMappingId;
        expect(mapperStateStub.hasPropsByClassMappingId).toHaveBeenCalledWith(classMappingId);
        expect(component.hasPropsToMap).toEqual(true);
        expect(component.setPropMappings).toHaveBeenCalledWith();
        expect(component.setIriTemplate).toHaveBeenCalledWith();
    });
    describe('controller methods', function() {
        it('should open the iriTemplateOverlay', fakeAsync(function() {
            spyOn(component, 'setIriTemplate');
            component.editIriTemplate();
            expect(matDialog.open).toHaveBeenCalledWith(IriTemplateOverlayComponent);
            tick();
            expect(component.setIriTemplate).toHaveBeenCalledWith();
        }));
        it('should test whether or not a property mapping is invalid', function() {
            mapperStateStub.invalidProps = [invalidProp];
            expect(component.isInvalid(propMapping)).toEqual(true);
            expect(component.isInvalid({'@id': 'error'})).toEqual(false);
        });
        describe('should handle a single click of a property mapping', function() {
            beforeEach(function() {
                spyOn(component, 'clickProperty');
            });
            it('if it stays a single click', fakeAsync(function() {
                component.handleSingleClick(propMapping);
                expect(component.singleClick).toBeTrue();
                tick();
                expect(component.clickProperty).toHaveBeenCalledWith(propMapping);
            }));
            it('if it becomes a double click', fakeAsync(function() {
                component.handleSingleClick(propMapping);
                expect(component.singleClick).toBeTrue();
                component.singleClick = false;
                tick();
                expect(component.clickProperty).not.toHaveBeenCalled();
            }));
        });
        it('should handle a double click of a property mapping', function() {
            spyOn(component, 'switchClass');
            component.handleDoubleClick(propMapping);
            expect(component.singleClick).toBeFalse();
            expect(component.switchClass).toHaveBeenCalledWith(propMapping);
        });
        it('should handle clicking a property', function() {
            spyOn(component, 'getLinkedColumnIndex').and.returnValue('0');
            component.clickProperty(propMapping);
            expect(mapperStateStub.selectedPropMappingId).toEqual(propMappingId);
            expect(component.getLinkedColumnIndex).toHaveBeenCalledWith(propMapping);
            expect(mapperStateStub.highlightIndexes).toEqual(['0']);
        });
        it('should set the IRI template for the class mapping', function() {
            spyOn(component, 'setPropMappings');
            component.classMappingId = classMappingId;
            utilStub.getPropertyValue.and.callFake((obj, prop) => prop === DELIM + 'hasPrefix' ? 'prefix:' : 'localName');
            component.classMappingId = classMappingId;
            component.setIriTemplate();
            expect(mappingStub.getClassMapping).toHaveBeenCalledWith(classMappingId);
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(classMapping, DELIM + 'hasPrefix');
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(classMapping, DELIM + 'localName');
            expect(component.iriTemplate).toEqual('prefix:localName');
        });
        describe('should get the value of a property', function() {
            it('if it is a data property mapping', function() {
                const index = '0';
                spyOn(component, 'getLinkedColumnIndex').and.returnValue(index);
                mappingManagerStub.isDataMapping.and.returnValue(true);
                delimitedManagerStub.getHeader.and.returnValue('Header');
                expect(component.getPropValue(propMapping)).toEqual('Header');
                expect(component.getLinkedColumnIndex).toHaveBeenCalledWith(propMapping);
                expect(delimitedManagerStub.getHeader).toHaveBeenCalledWith(index);
            });
            it('if it is an object property mapping', function() {
                const className = 'class';
                spyOn(component, 'getLinkedClassId').and.returnValue(classMappingId);
                utilStub.getDctermsValue.and.returnValue(className);
                mappingManagerStub.isDataMapping.and.returnValue(false);
                expect(component.getPropValue(propMapping)).toEqual(className);
                expect(mappingStub.getClassMapping).toHaveBeenCalledWith(classMappingId);
                expect(component.getLinkedClassId).toHaveBeenCalledWith(propMapping);
                expect(utilStub.getDctermsValue).toHaveBeenCalledWith(classMapping, 'title');
            });
        });
        it('should retrieve a preview of a data property value', function() {
            delimitedManagerStub.dataRows = [['first'], ['second']];
            spyOn(component, 'getLinkedColumnIndex').and.returnValue('0');
            expect(component.getDataValuePreview(propMapping)).toEqual('first');
            expect(component.getLinkedColumnIndex).toHaveBeenCalledWith(propMapping);
            delimitedManagerStub.containsHeaders = true;
            expect(component.getDataValuePreview(propMapping)).toEqual('second');
            delimitedManagerStub.dataRows = [];
            expect(component.getDataValuePreview(propMapping)).toEqual('(None)');
        });
        describe('should get a preview of the datatype of a property mapping', function() {
            beforeEach(function() {
                utilStub.getBeautifulIRI.and.callFake(a => a);
            });
            it('if the datatype is not set', function() {
                const propIRI = 'propIRI';
                utilStub.getPropertyId.and.callFake((obj, prop) => {
                    if (prop === DELIM + 'datatypeSpec') {
                        return;
                    } else if (prop === DELIM + 'hasProperty') {
                        return propIRI;
                    } else {
                        return 'range';
                    }
                });
                const mappingProperty: MappingProperty = {
                    propObj: {'@id': propIRI},
                    isDeprecated: false,
                    isObjectProperty: false,
                    name: '',
                    ontologyId: ''
                };
                mapperStateStub.getPropsByClassMappingId.and.returnValue([mappingProperty]);
                expect(component.getDatatypePreview(propMapping)).toEqual('range');
                expect(utilStub.getPropertyId).toHaveBeenCalledWith(propMapping, DELIM + 'hasProperty');
                expect(utilStub.getPropertyId).toHaveBeenCalledWith(propMapping, DELIM + 'datatypeSpec');
                expect(utilStub.getPropertyId).toHaveBeenCalledWith({'@id': propIRI}, RDFS + 'range');
                expect(utilStub.getBeautifulIRI).toHaveBeenCalledWith('range');
            });
            it('if the datatype is set', function() {
                utilStub.getPropertyId.and.callFake((obj, prop) => {
                    if (prop === DELIM + 'datatypeSpec') {
                        return 'datatypeSpec';
                    } else {
                        return undefined;
                    }
                });
                mapperStateStub.getPropsByClassMappingId.and.returnValue([]);
                expect(component.getDatatypePreview(propMapping)).toEqual('datatypeSpec');
                expect(utilStub.getPropertyId).toHaveBeenCalledWith(propMapping, DELIM + 'hasProperty');
                expect(utilStub.getPropertyId).toHaveBeenCalledWith(propMapping, DELIM + 'datatypeSpec');
                expect(utilStub.getPropertyId).not.toHaveBeenCalledWith(undefined, RDFS + 'range');
                expect(utilStub.getBeautifulIRI).toHaveBeenCalledWith('datatypeSpec');
            });
            it('if the property has no range', function() {
                mapperStateStub.getPropsByClassMappingId.and.returnValue([]);
                expect(component.getDatatypePreview(propMapping)).toEqual(XSD + 'string');
                expect(utilStub.getPropertyId).toHaveBeenCalledWith(propMapping, DELIM + 'hasProperty');
                expect(utilStub.getPropertyId).toHaveBeenCalledWith(propMapping, DELIM + 'datatypeSpec');
                expect(utilStub.getPropertyId).toHaveBeenCalledWith(undefined, RDFS + 'range');
                expect(utilStub.getBeautifulIRI).toHaveBeenCalledWith(XSD + 'string');
            });
        });
        it('should get a preview of the language of a property mapping', function() {
            spyOn(component, 'getLanguageTag').and.returnValue('en');
            propertyManagerStub.languageList = [{label: 'English', value: 'en'}];
            expect(component.getLanguagePreview(propMapping)).toEqual('English');
            expect(component.getLanguageTag).toHaveBeenCalledWith(propMapping);

            propertyManagerStub.languageList = [];
            expect(component.getLanguagePreview(propMapping)).toEqual('');
        });
        it('should get the language tab of a property mapping', function() {
            utilStub.getPropertyValue.and.returnValue('en');
            expect(component.getLanguageTag(propMapping)).toEqual('en');
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(propMapping, DELIM + 'languageSpec');
        });
        it('should get the id of the linked class mapping of a property mapping', function() {
            utilStub.getPropertyId.and.returnValue('classId');
            expect(component.getLinkedClassId(propMapping)).toEqual('classId');
            expect(utilStub.getPropertyId).toHaveBeenCalledWith(propMapping, DELIM + 'classMapping');
        });
        it('should get the linked column index of a property mapping', function() {
            utilStub.getPropertyValue.and.returnValue('0');
            expect(component.getLinkedColumnIndex(propMapping)).toEqual('0');
            expect(utilStub.getPropertyValue).toHaveBeenCalledWith(propMapping, DELIM + 'columnIndex');
        });
        describe('should switch the selected class mapping', function() {
            beforeEach(function() {
                mapperStateStub.selectedPropMappingId = propMappingId;
                spyOn(component, 'getLinkedClassId').and.returnValue(classMappingId);
                spyOn(component.classMappingIdChange, 'emit');
            });
            it('if the property mapping is for an object property', function() {
                mappingManagerStub.isObjectMapping.and.returnValue(true);
                component.switchClass(propMapping);
                expect(component.getLinkedClassId).toHaveBeenCalledWith(propMapping);
                expect(component.classMappingIdChange.emit).toHaveBeenCalledWith(classMappingId);
                expect(mapperStateStub.selectedPropMappingId).toEqual('');
            });
            it('unless the property mapping is not for an object property', function() {
                mappingManagerStub.isObjectMapping.and.returnValue(false);
                component.switchClass(propMapping);
                expect(component.getLinkedClassId).not.toHaveBeenCalled();
                expect(component.classMappingIdChange.emit).not.toHaveBeenCalled();
                expect(mapperStateStub.selectedPropMappingId).toEqual(propMappingId);
            });
        });
        it('should set the proper state for adding a property mapping', fakeAsync(function() {
            spyOn(component, 'setPropMappings');
            spyOn(component.updateClassMappings, 'emit');
            component.addProp();
            tick();
            expect(mapperStateStub.newProp).toEqual(true);
            expect(matDialog.open).toHaveBeenCalledWith(PropMappingOverlayComponent);
            expect(component.setPropMappings).toHaveBeenCalledWith();
            expect(component.updateClassMappings.emit).toHaveBeenCalledWith();
        }));
        it('should set the proper state for editing a property mapping', fakeAsync(function() {
            spyOn(component, 'setPropMappings');
            component.editProp(propertyPreview);
            tick();
            expect(mapperStateStub.selectedPropMappingId).toEqual(propMappingId);
            expect(mapperStateStub.newProp).toEqual(false);
            expect(matDialog.open).toHaveBeenCalledWith(PropMappingOverlayComponent);
            expect(component.setPropMappings).toHaveBeenCalledWith();
        }));
        it('should confirm deleting a property mapping', fakeAsync(function() {
            spyOn(component, 'deleteProp');
            component.confirmDeleteProp(propertyPreview);
            tick();
            expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: jasmine.stringMatching('Are you sure you want to delete')}});
            expect(component.deleteProp).toHaveBeenCalledWith(propMappingId);
        }));
        it('should delete a property mapping from the mapping', function() {
            mapperStateStub.selectedPropMappingId = propMappingId;
            spyOn(component, 'setPropMappings');
            component.classMappingId = classMappingId;
            component.deleteProp(propMappingId);
            expect(mapperStateStub.deleteProp).toHaveBeenCalledWith(propMappingId, classMappingId);
            expect(mapperStateStub.selectedPropMappingId).toEqual('');
            expect(mapperStateStub.highlightIndexes).toEqual([]);
            expect(component.setPropMappings).toHaveBeenCalledWith();
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            spyOn(component, 'setPropMappings');
            spyOn(component, 'setIriTemplate');
        });
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.class-mapping-details')).length).toEqual(1);
            expect(element.queryAll(By.css('.iri-template')).length).toEqual(1);
            expect(element.queryAll(By.css('.class-mapping-props')).length).toEqual(1);
            expect(element.queryAll(By.css('.properties-field-name')).length).toEqual(1);
        });
        it('depending on whether a class mapping is selected', function() {
            fixture.detectChanges();
            const button = element.queryAll(By.css('.iri-template button'))[0];
            expect(button.properties['disabled']).toBeTruthy();
            
            component.classMappingId = classMappingId;
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
        });
        it('depending on whether the selected class mapping has properties to map', function() {
            fixture.detectChanges();
            const button = element.queryAll(By.css('.class-mapping-props button.add-prop-mapping-button'))[0];
            expect(button.properties['disabled']).toBeTruthy();
            
            component.hasPropsToMap = true;
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
        });
        it('depending on the number of mapped properties', function() {
            component.propMappings = [propertyPreview];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.prop-list mat-list-item')).length).toEqual(component.propMappings.length);
        });
        it('depending on whether a property is a data or object property', function() {
            let propMappingPreview: any = {
                jsonld: propMapping,
                isInvalid: false,
                title: '',
                dataMappingInfo: {
                    value: 'value',
                    datatype: 'datatype',
                    preview: 'preview',
                },
                language: {
                    preview: 'preview',
                    tag: 'en'
                }
            }; 
            component.propMappings = [propMappingPreview];
            fixture.detectChanges();
            const details = element.queryAll(By.css('.prop-list .prop-mapping-details'))[0];
            expect(details.nativeElement.innerHTML).toContain('Column:');
            expect(details.nativeElement.innerHTML).toContain('Preview:');
            expect(details.nativeElement.innerHTML).toContain('Datatype:');
            expect(details.nativeElement.innerHTML).toContain('Language:');
            expect(details.nativeElement.innerHTML).not.toContain('Class:');
            delete propMappingPreview.dataMappingInfo;
            delete propMappingPreview.language;
            propMappingPreview.objectMappingInfo = {
                value: 'value'
            };
            fixture.detectChanges();
            expect(details.nativeElement.innerHTML).not.toContain('Column:');
            expect(details.nativeElement.innerHTML).not.toContain('Preview:');
            expect(details.nativeElement.innerHTML).not.toContain('Datatype:');
            expect(details.nativeElement.innerHTML).not.toContain('Language:');
            expect(details.nativeElement.innerHTML).toContain('Class:');
        });
        it('depending on whether a property is selected', function() {
            const propertyPreview = {
                jsonld: propMapping,
                isInvalid: false,
                title: ''
            };
            component.propMappings = [propertyPreview];
            fixture.detectChanges();
            const propButton = element.queryAll(By.css('.prop-list mat-list-item'))[0];
            expect(propButton.classes['selected-prop']).toBeFalsy();

            mapperStateStub.selectedPropMappingId = propMappingId;
            fixture.detectChanges();
            expect(propButton.classes['selected-prop']).toBeTruthy();
        });
        it('depending on whether a property is invalid', function() {
            const copyPreview = Object.assign({}, propertyPreview);
            component.propMappings = [copyPreview];
            fixture.detectChanges();
            const propButton = element.queryAll(By.css('.prop-list mat-list-item'))[0];
            expect(propButton.classes['invalid']).toBeFalsy();

            copyPreview.isInvalid = true;
            fixture.detectChanges();
            expect(propButton.classes['invalid']).toBeTruthy();
        });
    });
    it('should call editIriTemplate when the link is clicked', function() {
        spyOn(component, 'editIriTemplate');
        const button = element.queryAll(By.css('.iri-template button'))[0];
        button.triggerEventHandler('click', null);
        expect(component.editIriTemplate).toHaveBeenCalledWith();
    });
    it('should call addProp when the Add Property link is clicked', function() {
        spyOn(component, 'addProp');
        const button = element.queryAll(By.css('.class-mapping-props button.add-prop-mapping-button'))[0];
        button.triggerEventHandler('click', null);
        expect(component.addProp).toHaveBeenCalledWith();
    });
    it('should handle when a property is single clicked', function() {
        component.propMappings = [propertyPreview];
        spyOn(component, 'handleSingleClick');
        fixture.detectChanges();
        const listDiv = element.queryAll(By.css('.prop-list mat-list-item'))[0];
        listDiv.triggerEventHandler('click', null);
        expect(component.handleSingleClick).toHaveBeenCalledWith(propMapping);
    });
    it('should handle when a property is double clicked', function() {
        component.propMappings = [propertyPreview];
        spyOn(component, 'handleDoubleClick');
        fixture.detectChanges();
        const listDiv = element.queryAll(By.css('.prop-list mat-list-item'))[0];
        listDiv.triggerEventHandler('dblclick', null);
        expect(component.handleDoubleClick).toHaveBeenCalledWith(propMapping);
    });
    describe('menu button', function() {
        beforeEach(function() {
            component.propMappings = [propertyPreview];
            fixture.detectChanges();
            const menuButton = element.queryAll(By.css('button.menu-button'))[0];
            menuButton.triggerEventHandler('click', null);
        });
        it('should call editProp when an edit property link is clicked', function() {
            spyOn(component, 'editProp');
            const button = element.queryAll(By.css('.mat-menu-panel button.edit'))[0];
            button.triggerEventHandler('click', null);
            expect(component.editProp).toHaveBeenCalledWith(propertyPreview);
        });
        it('should call deleteProp when a delete property link is clicked', function() {
            spyOn(component, 'confirmDeleteProp');
            const button = element.queryAll(By.css('.mat-menu-panel button.delete'))[0];
            button.triggerEventHandler('click', null);
            expect(component.confirmDeleteProp).toHaveBeenCalledWith(propertyPreview);
        });
    });
});
