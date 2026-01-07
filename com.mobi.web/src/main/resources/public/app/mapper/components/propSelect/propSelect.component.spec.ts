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
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { MockProvider } from 'ng-mocks';

import {
    cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { MappingProperty } from '../../../shared/models/mappingProperty.interface';
import { DCTERMS, OWL, RDFS } from '../../../prefixes';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { MappingOntologyInfo } from '../../../shared/models/mappingOntologyInfo.interface';
import { Mapping } from '../../../shared/models/mapping.class';
import { Difference } from '../../../shared/models/difference.class';
import { PropSelectComponent } from './propSelect.component';

describe('Prop Select component', function() {
    let component: PropSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<PropSelectComponent>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let spinnerStub: jasmine.SpyObj<ProgressSpinnerService>;

    const error = 'Error';
    const classId = 'classId';
    const propId = 'propId';
    const mappingProperty: MappingProperty = {
        iri: propId,
        type: `${OWL}DatatypeProperty`,
        name: 'Name',
        deprecated: false,
        description: '',
        ranges: []
    };
    const mappingPropertyA: MappingProperty = {
        iri: 'A',
        type: `${OWL}AnnotationProperty`,
        name: 'A',
        deprecated: false,
        description: '',
        ranges: []
    };
    const mappingPropertyB: MappingProperty = {
        iri: 'B',
        type: `${OWL}ObjectProperty`,
        name: 'B',
        deprecated: false,
        description: '',
        ranges: []
    };
    const ontInfo: MappingOntologyInfo = {
        recordId: 'recordId',
        branchId: 'branchId',
        commitId: 'commitId'
    };
    let mappingStub: jasmine.SpyObj<Mapping>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatAutocompleteModule,
            ],
            declarations: [
                PropSelectComponent,
            ],
            providers: [
                MockProvider(MapperStateService),
                MockProvider(ProgressSpinnerService),
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PropSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        spinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        mapperStateStub = TestBed.inject(MapperStateService) as jasmine.SpyObj<MapperStateService>;
        mapperStateStub.iriMap = {
          classes: {},
          dataProperties: { [mappingProperty.iri]: 'ontologyA' },
          objectProperties: { [mappingPropertyB.iri]: 'ontologyB' },
          annotationProperties: { [mappingPropertyA.iri]: 'ontologyA' }
        };
        mapperStateStub.supportedAnnotations = [
            { iri: `${RDFS}label`, name: 'Label', description: '', type: `${OWL}AnnotationProperty`, deprecated: false, ranges: [] },
            { iri: `${RDFS}comment`, name: 'Comment', description: '', type: `${OWL}AnnotationProperty`, deprecated: false, ranges: [] },
            { iri: `${DCTERMS}title`, name: 'Title', description: '', type: `${OWL}AnnotationProperty`, deprecated: false, ranges: [] },
            { iri: `${DCTERMS}description`, name: 'Description', description: '', type: `${OWL}AnnotationProperty`, deprecated: false, ranges: [] },
        ];
        mappingStub = jasmine.createSpyObj('Mapping', [
            'getSourceOntologyInfo',
        ]);
        mappingStub.getSourceOntologyInfo.and.returnValue(ontInfo);
        mapperStateStub.selected = {
            mapping: mappingStub,
            difference: new Difference()
        };

        component.parentClass = classId;
        component.parentForm = new UntypedFormGroup({
            class: new UntypedFormControl('')
        });
        spyOn(component.selectedPropChange, 'emit');
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        spinnerStub = null;
        mapperStateStub = null;
        mappingStub = null;
    });

    describe('controller methods', function() {
        it('should get the display text for a property', function() {
            expect(component.getDisplayText(mappingProperty)).toEqual(mappingProperty.name);
            expect(component.getDisplayText(undefined)).toEqual('');
        });
        it('should select a class', function() {
            const event: MatAutocompleteSelectedEvent = {
                option: {
                    value: mappingProperty
                }
            } as MatAutocompleteSelectedEvent;
            component.selectProp(event);
            expect(component.getSelectedProp()).toEqual(mappingProperty);
            expect(component.selectedPropChange.emit).toHaveBeenCalledWith(mappingProperty);
        });
        describe('should correctly filter the property list based on the input', function() {
            it('unless an error occurs', async function() {
                mapperStateStub.retrieveProps.and.returnValue(throwError(error));
                await component.filter('').subscribe(results => {
                    expect(results).toEqual([]);
                    expect(component.error).toEqual(error);
                    expect(component.noResults).toBeTrue();
                  }, () => fail('Observable should have succeeded'));
                expect(mapperStateStub.retrieveProps).toHaveBeenCalledWith(ontInfo, classId, '', 100, true);
                expect(spinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.propSelectSpinner, 15);
                expect(spinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.propSelectSpinner);
            });
            it('with no value', async function() {
                mapperStateStub.retrieveProps.and.returnValue(of([mappingProperty, mappingPropertyA, mappingPropertyB]));
                await component.filter('').subscribe(results => {
                    expect(results).toEqual([
                        { ontologyId: DCTERMS.slice(0, -1), properties: [jasmine.objectContaining({ iri: `${DCTERMS}description` }), jasmine.objectContaining({ iri: `${DCTERMS}title` })] },
                        { ontologyId: RDFS.slice(0, -1), properties: [jasmine.objectContaining({ iri: `${RDFS}comment` }), jasmine.objectContaining({ iri: `${RDFS}label` })] },
                        { ontologyId: 'ontologyA', properties: [mappingPropertyA, mappingProperty] },
                        { ontologyId: 'ontologyB', properties: [mappingPropertyB] },
                    ]);
                    expect(component.error).toEqual('');
                    expect(component.noResults).toBeFalse();
                }, () => fail('Observable should have succeeded'));
                expect(mapperStateStub.retrieveProps).toHaveBeenCalledWith(ontInfo, classId, '', 100, true);
                expect(spinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.propSelectSpinner, 15);
                expect(spinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.propSelectSpinner);
            });
            it('if there are no results', async function() {
                mapperStateStub.retrieveProps.and.returnValue(of([]));
                await component.filter('THISWILLNOTRESTURNRESULTS').subscribe(results => {
                    expect(results).toEqual([]);
                    expect(component.error).toEqual('');
                    expect(component.noResults).toBeTrue();
                  }, () => fail('Observable should have succeeded'));
                expect(mapperStateStub.retrieveProps).toHaveBeenCalledWith(ontInfo, classId, 'THISWILLNOTRESTURNRESULTS', 100, true);
                expect(spinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.propSelectSpinner, 15);
                expect(spinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.propSelectSpinner);
            });
            it('if there are no properties', async function() {
                mapperStateStub.retrieveProps.and.returnValue(of([]));
                await component.filter('').subscribe(results => {
                    expect(results).toEqual([
                        { ontologyId: DCTERMS.slice(0, -1), properties: [jasmine.objectContaining({ iri: `${DCTERMS}description` }), jasmine.objectContaining({ iri: `${DCTERMS}title` })] },
                        { ontologyId: RDFS.slice(0, -1), properties: [jasmine.objectContaining({ iri: `${RDFS}comment` }), jasmine.objectContaining({ iri: `${RDFS}label` })] },
                    ]);
                    expect(component.error).toEqual('');
                    expect(component.noResults).toBeFalse();
                  }, () => fail('Observable should have succeeded'));
                expect(mapperStateStub.retrieveProps).toHaveBeenCalledWith(ontInfo, classId, '', 100, true);
                expect(spinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.propSelectSpinner, 15);
                expect(spinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.propSelectSpinner);
            });
            it('with a text value with one result', async function() {
                mapperStateStub.retrieveProps.and.returnValue(of([mappingProperty]));
                await component.filter(mappingProperty.name).subscribe(results => {
                    expect(results).toEqual([
                        { ontologyId: 'ontologyA', properties: [mappingProperty] },
                    ]);
                    expect(component.error).toEqual('');
                    expect(component.noResults).toBeFalse();
                }, () => fail('Observable should have succeeded'));
                expect(mapperStateStub.retrieveProps).toHaveBeenCalledWith(ontInfo, classId, mappingProperty.name, 100, true);
                expect(spinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.propSelectSpinner, 15);
                expect(spinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.propSelectSpinner);
            });
            it('with a text value with multiple results', async function() {
                mapperStateStub.retrieveProps.and.returnValue(of([mappingProperty, mappingPropertyA]));
                await component.filter('a').subscribe(results => {
                    expect(results).toEqual([
                        { ontologyId: RDFS.slice(0, -1), properties: [jasmine.objectContaining({ iri: `${RDFS}label` })] },
                        { ontologyId: 'ontologyA', properties: [mappingPropertyA, mappingProperty] },
                    ]);
                    expect(component.error).toEqual('');
                    expect(component.noResults).toBeFalse();
                }, () => fail('Observable should have succeeded'));
                expect(mapperStateStub.retrieveProps).toHaveBeenCalledWith(ontInfo, classId, 'a', 100, true);
                expect(spinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.propSelectSpinner, 15);
                expect(spinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.propSelectSpinner);
            });
            it('with an object value', async function() {
                await component.filter(mappingProperty).subscribe(results => {
                    expect(results).toEqual([
                        { ontologyId: 'ontologyA', properties: [mappingProperty] },
                    ]);
                    expect(component.error).toEqual('');
                    expect(component.noResults).toBeFalse();
                }, () => fail('Observable should have succeeded'));
                expect(mapperStateStub.retrieveProps).not.toHaveBeenCalled();
                expect(spinnerStub.startLoadingForComponent).not.toHaveBeenCalled();
                expect(spinnerStub.finishLoadingForComponent).not.toHaveBeenCalled();
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.prop-select')).length).toEqual(1);
        });
        ['mat-form-field', 'input[aria-label="Property"]', 'mat-autocomplete'].forEach(test => {
            it(`with a ${test}`, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
    });
});
