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
import { ChangeDetectionStrategy, DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { MockComponent, MockDirective, MockProvider } from 'ng-mocks';
import { of, throwError} from 'rxjs';
import { MatDialogModule, MatDialogRef}  from '@angular/material/dialog';
import { HttpHeaders, HttpResponse} from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { 
    cleanStylesFromDOM
} from '../../../../../../public/test/ts/Shared';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { ExploreService } from '../../../services/explore.service';
import { ExploreUtilsService } from '../../services/exploreUtils.service';
import { EditIriOverlayComponent } from '../../../../shared/components/editIriOverlay/editIriOverlay.component';
import { OWL } from '../../../../prefixes';
import { NewInstancePropertyOverlayComponent } from '../newInstancePropertyOverlay/newInstancePropertyOverlay.component';
import { ConfirmModalComponent } from '../../../../shared/components/confirmModal/confirmModal.component';
import { CopyClipboardDirective } from '../../../../shared/directives/copyClipboard/copyClipboard.directive';
import { ToastService } from '../../../../shared/services/toast.service';
import { ErrorDisplayComponent } from '../../../../shared/components/errorDisplay/errorDisplay.component';
import { InstanceFormComponent } from './instanceForm.component';
import { REGEX } from '../../../../constants';

describe('Instance Form component', function() {
    let component: InstanceFormComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<InstanceFormComponent>;
    let exploreServiceStub: jasmine.SpyObj<ExploreService>;
    let discoverStateStub: jasmine.SpyObj<DiscoverStateService>;
    let dialogStub : jasmine.SpyObj<MatDialog>;
    let exploreUtilsServiceStub: jasmine.SpyObj<ExploreUtilsService>;
    let toastStub: jasmine.SpyObj<ToastService>;
    const iriObj =   {
        'begin': 'http://mobi.com/data/TestOntology',
        'then': '/',
        'end': 'e45471f1-371d-4f77-88c4-a301d00fe07a'
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ 
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatTooltipModule,
                MatCheckboxModule,
                MatChipsModule,
                MatInputModule,
                MatAutocompleteModule,
                MatIconModule,
                MatButtonModule,
                MatDialogModule
             ],
            declarations: [
                InstanceFormComponent,
                MockDirective(CopyClipboardDirective),
                MockComponent(ErrorDisplayComponent)
            ],
            providers: [
                MockProvider(ExploreService),
                MockProvider(DiscoverStateService),
                MockProvider(ExploreUtilsService),
                MockProvider(MatDialog),
                MockProvider(ToastService),
            ]
            
        }).overrideComponent(InstanceFormComponent, {
            set: { changeDetection: ChangeDetectionStrategy.Default } // needed due to https://github.com/angular/angular/issues/12313
        }).compileComponents();

        fixture = TestBed.createComponent(InstanceFormComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        dialogStub = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        exploreServiceStub = TestBed.inject(ExploreService) as jasmine.SpyObj<ExploreService>;
        discoverStateStub = TestBed.inject(DiscoverStateService) as jasmine.SpyObj<DiscoverStateService>;
        exploreUtilsServiceStub = TestBed.inject(ExploreUtilsService) as jasmine.SpyObj<ExploreUtilsService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        discoverStateStub.explore = {
            breadcrumbs: ['Classes'],
            classDeprecated: false,
            classDetails: [],
            classId: '',
            creating: false,
            editing: false,
            instance: {
                entity: [],
                metadata: undefined,
                objectMap: {},
                original: []
            },
            instanceDetails: {
                currentPage: 0,
                data: [],
                limit: 99,
                total: 0,
                links: {
                    next: '',
                    prev: ''
                },
            },
            recordId: '',
            recordTitle: '',
            hasPermissionError: false
        };
        component.instance = {
            '@id': 'http://mobi.com/data/TestOntology/e45471f1-371d-4f77-88c4-a301d00fe07a',
            '@type': ['http://matonto.org/ontologies/Ontologu#Test'],
            'prop1': [{
                '@id': 'http://mobi.com/id'
            }],
            'prop2': [{
                '@value': 'value1'
            }, {
                '@value': 'value2'
            }]
        };
        discoverStateStub.getInstance.and.returnValue(component.instance);
        component.header = 'header'; // scope
        component.isValid = false;
        dialogStub.open.and.returnValue({
            afterClosed: () => {
                const res = { value: {...iriObj}};
                return of(res);
            }
        } as MatDialogRef<typeof dialogStub>);
        component.propertyDetailsMap = {
            propertyId: {
                propertyIRI: 'propertyId',
                type: 'Data',
                range: [],
                restrictions: [ {
                    cardinality: 0,
                    cardinalityType: ''
                }]
            }, 
            propertyId2: {
                propertyIRI: 'propertyId2',
                type: 'Data',
                range: [],
                restrictions: [{
                    cardinality: 0,
                    cardinalityType: ''
                }]
            }, 
            propertyId3: {
                propertyIRI: 'propertyId3',
                type: 'Data',
                range: [],
                restrictions: [ {
                    cardinality: 0,
                    cardinalityType: ''
                }]
            }, 
            propertyId4: {
                propertyIRI: 'propertyId4',
                type: 'Data',
                range: [],
                restrictions: [ {
                    cardinality: 0,
                    cardinalityType: ''
                }]
            }
        };
        component.changed = ['iri'];
        component.missingProperties = [];
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        discoverStateStub = null;
        exploreServiceStub = null;
        dialogStub = null;
        exploreUtilsServiceStub = null;
    });

    describe('controller bound variables', function() {
        it('header should be one way bound', fakeAsync (function() {
            component.header = 'new';
            fixture.detectChanges();
            tick();
            expect(fixture.nativeElement.querySelector('div.col-8.offset-2 h2').innerText).toBe('new');
        }));
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.instance-form')).length).toEqual(1);
        });
        it('with a .col-8.offset-2', function() {
            expect(element.queryAll(By.css('.col-8.offset-2')).length).toBe(1);
        });
        it('with a h2', function() {
            expect(element.queryAll(By.css('h2')).length).toBe(1);
        });
        it('with a .instance-iri', function() {
            expect(element.queryAll(By.css('.instance-iri')).length).toBe(1);
        });
        it('with a .form-group', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.form-group')).length).toBe(4);
        });
        it('with a .field-label', function() {
            expect(element.queryAll(By.css('.field-label')).length).toBe(0);
        });
        it('with a .boolean-property', async () => {
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();
            expect(element.queryAll(By.css('.boolean-property')).length).toBe(0);
            exploreUtilsServiceStub.isBoolean.and.returnValue(false);
            fixture.detectChanges();
            expect(element.queryAll(By.css('.boolean-property')).length).toBe(0);
        });
        describe('with a .data-property', function() {
            it('when value is valid', async () => {
                exploreUtilsServiceStub.isPropertyOfType.and.returnValue(true);
                exploreUtilsServiceStub.isBoolean.and.returnValue(false);
                exploreServiceStub.getClassPropertyDetails.and.returnValue(of([]));
                component.ngOnInit();
                fixture.detectChanges();
                await fixture.whenStable();
                component.form.get(['prop1']).setValue('urn:test');
                fixture.detectChanges();
                await fixture.whenStable();
                expect(element.queryAll(By.css('.data-property')).length).toBe(2);
                exploreUtilsServiceStub.isPropertyOfType.and.returnValue(false);
                expect(element.queryAll(By.css('mat-error')).length).toEqual(0);
                fixture.detectChanges();
                expect(element.queryAll(By.css('.data-property')).length).toBe(0);
            });
            it('when value is invalid', async () => {
                exploreUtilsServiceStub.isPropertyOfType.and.returnValue(true);
                exploreUtilsServiceStub.isBoolean.and.returnValue(false);
                exploreServiceStub.getClassPropertyDetails.and.returnValue(of([]));
                exploreUtilsServiceStub.getPattern.and.returnValue(REGEX.IRI);
                component.ngOnInit();
                fixture.detectChanges();
                await fixture.whenStable();
                component.form.get(['prop1']).setValue('asd');
                fixture.detectChanges();
                await fixture.whenStable();
                expect(element.queryAll(By.css('.data-property')).length).toBe(2);
                expect(element.queryAll(By.css('mat-error')).length).toEqual(1);
                exploreUtilsServiceStub.isPropertyOfType.and.returnValue(false);
                fixture.detectChanges();
                expect(element.queryAll(By.css('.data-property')).length).toBe(0); 
            });
        });
        it('with a .object-property', function() {
            exploreUtilsServiceStub.isPropertyOfType.and.returnValue(true);
            exploreServiceStub.getClassPropertyDetails.and.returnValue(of([]));
            fixture.detectChanges();
            expect(element.queryAll(By.css('.object-property')).length).toBe(2);
            exploreUtilsServiceStub.isPropertyOfType.and.returnValue(false);
            fixture.detectChanges();
            expect(element.queryAll(By.css('.object-property')).length).toBe(0);
        });
        it('with a .btn-container.clearfix', function() {
            expect(element.queryAll(By.css('.btn-container.clearfix')).length).toBe(1);
        });
        it('with a button.mat-button', function() {
            expect(element.queryAll(By.css('button.mat-button')).length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('getOptions should result in the correct list when the propertyIRI', function () {
            describe('has a range and getClassInstanceDetails is', function () {
                beforeEach(function () {
                    const tempData = {
                        body: [
                            {
                                instanceIRI: 'propertyId',
                                title: 'title',
                                description: 'description'
                            },
                            {
                                instanceIRI: 'propertyId2',
                                title: 'title',
                                description: 'description'
                            },
                            {
                                instanceIRI: 'propertyId3',
                                title: 'title',
                                description: 'description'
                            }
                        ],
                        headers: new HttpHeaders({'x-total-count': ''})
                    };
                    exploreServiceStub.getClassInstanceDetails.and.returnValue(of(new HttpResponse(tempData)));
                    component.instance = {
                        '@id': 'https://mobi.com/data/TestOntology/1234-4535',
                        '@type': ['http://matonto.org/ontologies/Ontologu#Test']
                    };
                    component.setIRI = jasmine.createSpy();
                    exploreUtilsServiceStub.getRange.and.returnValue('string');
                });
                describe('resolved', function () {
                    it('without filtering', function () {
                        component.getOptions('propertyId');
                        fixture.detectChanges();
                        expect(exploreServiceStub.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateStub.explore.recordId, 'string', {
                            offset: 0,
                            infer: true
                        }, true);
                    });
                    it('with filtering', function () {
                        exploreUtilsServiceStub.contains.and.callFake(function (string, part) {
                            return string.toLowerCase().includes(part.toLowerCase());
                        });
                        component.searchText = {propertyId: '3'};
                        component.getOptions('propertyId');
                        fixture.detectChanges();
                        expect(exploreServiceStub.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateStub.explore.recordId, 'string', {
                            offset: 0,
                            infer: true
                        }, true);
                    });
                });
                it('rejected', function () {
                    exploreServiceStub.getClassInstanceDetails.and.returnValue(throwError('error'));
                    component.getOptions('propertyId');
                    fixture.detectChanges();
                    expect(exploreServiceStub.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateStub.explore.recordId, 'string', {
                        offset: 0,
                        infer: true
                    }, true);
                    expect(toastStub.createErrorToast).toHaveBeenCalledWith('error');
                });
            });
            it('does not have a range', function () {
                dialogStub.open.and.returnValue({
                    afterClosed: (res) => {
                        expect(res).toEqual([]);
                    }
                } as MatDialogRef<typeof dialogStub>);
                component.getOptions('propertyId2');
                fixture.detectChanges();
                expect(exploreServiceStub.getClassInstanceDetails).not.toHaveBeenCalled();
            });
        });
        it('newInstanceProperty should show the newInstancePropertyOverlay', function () {
            dialogStub.open.and.returnValue({
                afterClosed: () => of({
                    propertyIRI: 'http://purl.org/dc/terms/title',
                    range: [],
                    restrictions: [{cardinality: 0, cardinalityType: ''}],
                    type: 'Data'
                })
            } as MatDialogRef<typeof dialogStub>);
            fixture.detectChanges();
            component.newInstanceProperty();
            expect(dialogStub.open).toHaveBeenCalledWith(NewInstancePropertyOverlayComponent, {
                data: {
                    properties: Object.values(component.propertyDetailsMap),
                    instance: component.instance
                }
            });
        });
        it('showIriConfirm should open a confirm modal for editing the IRI', function () {
            component.showIriConfirm();
            expect(dialogStub.open).toHaveBeenCalledWith(ConfirmModalComponent, {
                data: {
                    content: '<p>Changing this IRI might break relationships within the dataset. Are you sure you want to continue?</p>'
                }
            });
        });
        it('showIriOverlay should open the editIriOverlay', async () => {
            dialogStub.open.and.returnValue({
                afterClosed: () => {
                    const res = {
                        'value': {
                            'iriBegin': 'http://mobi.com/data/TestOntology',
                            'iriThen': '/',
                            'iriEnd': 'e45471f1-371d-4f77-88c4-a301d00fe07a'
                        }
                    };
                    return of(res);
                }
            } as MatDialogRef<typeof dialogStub>);
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();
            component.showIriOverlay();

            fixture.detectChanges();
            expect(dialogStub.open).toHaveBeenCalledWith( EditIriOverlayComponent, {
                data: {
                    iriBegin: 'http://mobi.com/data/TestOntology',
                    iriThen: '/',
                    iriEnd: 'e45471f1-371d-4f77-88c4-a301d00fe07a'
                }
            });
        });
        describe('addToChanged adds the provided iri to the changed array', function () {
            beforeEach(() => {
                spyOn(component, 'getMissingProperties').and.returnValue(['missing property']);
            });
            it('when it is new', function () {
                component.addToChanged('new');
                expect(component.changed).toEqual(['iri', 'new']);
                expect(component.getMissingProperties).toHaveBeenCalledWith();
                expect(component.missingProperties).toEqual(['missing property']);
            });
            it('when it is not new', function () {
                component.addToChanged('iri');
                expect(component.changed).toEqual(['iri']);
                expect(component.getMissingProperties).toHaveBeenCalledWith();
                expect(component.missingProperties).toEqual(['missing property']);
            });
        });
        it('isChanged should return the proper value', function () {
            expect(component.isChanged('iri')).toBe(true);
            expect(component.isChanged('new')).toBe(false);
        });
        it('setIRI should set the proper value', function () {
            component.setIRI({value: {iriBegin: 'begin', iriThen: '#', iriEnd: 'end'}});
            expect(component.instance['@id']).toBe('begin#end');
        });
        it('getMissingProperties retrieves the proper list of messages', function () {
            component.instance = {
                '@id': 'id',
                propertyId4: [{'@value': 'just the one'}],
                propertyId3: [{'@value': 'one'}, {'@value': 'two'}],
            };
            component.propertyDetailsMap = {
                propertyId: {
                    propertyIRI: 'propertyId',
                    restrictions: [{
                        cardinality: 1,
                        cardinalityType: `${OWL}cardinality`
                    }],
                    type: 'Data',
                    range: [],
                }, 
                propertyId2: {
                    propertyIRI: 'propertyId2',
                    restrictions: [{
                        cardinality: 1,
                        cardinalityType: `${OWL}minCardinality`
                    }],
                    type: 'Data',
                    range: [],
                }, 
                propertyId3: {
                    propertyIRI: 'propertyId3',
                    restrictions: [{
                        cardinality: 1,
                        cardinalityType: `${OWL}maxCardinality`
                    }],
                    type: 'Data',
                    range: [],
                }, 
                propertyId4: {
                    propertyIRI: 'propertyId4',
                    restrictions: [{
                        cardinality: 1,
                        cardinalityType: `${OWL}cardinality`
                    }],
                    type: 'Data',
                    range: [],
                }
            };
            const expected = [
                'Must have exactly 1 value(s) for Property Id',
                'Must have at least 1 value(s) for Property Id 2',
                'Must have at most 1 value(s) for Property Id 3',
            ];
            expect(component.getMissingProperties()).toEqual(expected);
            fixture.detectChanges();
            expect(component.isValid).toBe(false);
        });
        describe('getRestrictionText should return the correct value for', function () {
            beforeEach(function () {
                component.propertyDetailsMap = {
                    propertyId: {
                        propertyIRI: 'propertyId',
                        restrictions: [{
                            cardinality: 1,
                            cardinalityType: `${OWL}cardinality`
                        }],
                        type: 'Data',
                        range: [],
                    }, 
                    propertyId2: {
                        propertyIRI: 'propertyId2',
                        restrictions: [{
                            cardinality: 1,
                            cardinalityType: `${OWL}minCardinality`
                        }],
                        type: 'Data',
                        range: [],
                    }, 
                    propertyId3: {
                        propertyIRI: 'propertyId3',
                        restrictions: [{
                            cardinality: 1,
                            cardinalityType: `${OWL}maxCardinality`
                        }],
                        type: 'Data',
                        range: [],
                    }, 
                    propertyId4: {
                        propertyIRI: 'propertyId4',
                        restrictions: [],
                        type: '',
                        range: [],
                    }
                };
            });
            it('exact restriction', function () {
                expect(component.getRestrictionText('propertyId')).toBe('[exactly 1]');
            });
            it('min restriction', function () {
                expect(component.getRestrictionText('propertyId2')).toBe('[at least 1]');
            });
            it('max restriction', function () {
                expect(component.getRestrictionText('propertyId3')).toBe('[at most 1]');
            });
            it('no restriction', function () {
                expect(component.getRestrictionText('propertyId4')).toBe('');
            });
        });
        it('should call showIriConfirm when the IRI edit link is clicked', function () {
            spyOn(component, 'showIriConfirm');
            const link = element.nativeElement.querySelectorAll('.instance-iri a')[0] as HTMLElement;
            link.click();
            expect(component.showIriConfirm).toHaveBeenCalledWith();
        });
    });
});
