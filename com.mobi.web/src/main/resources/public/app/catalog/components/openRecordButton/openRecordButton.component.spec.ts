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
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import {
    cleanStylesFromDOM,
} from '../../../../test/ts/Shared';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { SharedModule } from '../../../shared/shared.module';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { CATALOG, DATASET, DELIM, ONTOLOGYEDITOR, SHAPESGRAPHEDITOR } from '../../../prefixes';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { UtilService } from '../../../shared/services/util.service';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { PolicyManagerService } from '../../../shared/services/policyManager.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { OpenRecordButtonComponent } from './openRecordButton.component';

describe('Open Record Button component', function() {
    let component: OpenRecordButtonComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<OpenRecordButtonComponent>;
    let catalogStateStub: jasmine.SpyObj<CatalogStateService>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;
    let policyManagerStub: jasmine.SpyObj<PolicyManagerService>;
    let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;
    let utilStub: jasmine.SpyObj<UtilService>;
    let router: Router;

    const recordId = 'recordId';
    const record: JSONLDObject = {
        '@id': recordId,
        '@type': [CATALOG + 'Record']
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ SharedModule, RouterTestingModule.withRoutes([]) ],
            declarations: [
                OpenRecordButtonComponent,
            ],
            providers: [
                MockProvider(CatalogStateService),
                MockProvider(ShapesGraphStateService),
                MockProvider(MapperStateService),
                MockProvider(OntologyStateService),
                MockProvider(PolicyEnforcementService),
                MockProvider(PolicyManagerService),
                MockProvider(UtilService),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(OpenRecordButtonComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        catalogStateStub = TestBed.inject(CatalogStateService) as jasmine.SpyObj<CatalogStateService>;
        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        mapperStateStub = TestBed.inject(MapperStateService) as jasmine.SpyObj<MapperStateService>;
        policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;
        policyManagerStub = TestBed.inject(PolicyManagerService) as jasmine.SpyObj<PolicyManagerService>;
        shapesGraphStateStub = TestBed.inject(ShapesGraphStateService) as jasmine.SpyObj<ShapesGraphStateService>;
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        spyOn(router, 'navigate');

        policyEnforcementStub.permit = 'Permit';
        policyEnforcementStub.deny = 'Deny';
        utilStub.getDctermsValue.and.returnValue('');
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        catalogStateStub = null;
        mapperStateStub = null;
        ontologyStateStub = null;
        policyEnforcementStub = null;
        utilStub = null;
        router = null;
    });

    it('should initialize correctly on record change', function() {
        spyOn(component, 'update');
        component.record = record;
        expect(component.update).toHaveBeenCalledWith();
    });
    describe('controller methods', function() {
        describe('openRecord calls the correct method when record is a', function() {
            beforeEach(function() {
                component.stopProp = true;
                this.event = new MouseEvent('click');
                spyOn(this.event, 'stopPropagation');
            });
            it('OntologyRecord', function() {
                component.recordType = ONTOLOGYEDITOR + 'OntologyRecord';
                spyOn(component, 'openOntology');
                component.openRecord(this.event);
                expect(component.openOntology).toHaveBeenCalledWith();
                expect(this.event.stopPropagation).toHaveBeenCalledWith();
            });
            it('MappingRecord', function() {
                component.recordType = DELIM + 'MappingRecord';
                spyOn(component, 'openMapping');
                component.openRecord(this.event);
                expect(component.openMapping).toHaveBeenCalledWith();
            });
            it('DatasetRecord', function() {
                component.recordType = DATASET + 'DatasetRecord';
                spyOn(component, 'openDataset');
                component.openRecord(this.event);
                expect(component.openDataset).toHaveBeenCalledWith();
            });
            it('ShapesGraphRecord', function() {
                component.recordType = SHAPESGRAPHEDITOR + 'ShapesGraphRecord';
                spyOn(component, 'openShapesGraph');
                component.openRecord(this.event);
                expect(component.openShapesGraph).toHaveBeenCalledWith();
            });
        });
        describe('openOntology should navigate to the ontology editor module and open the ontology', function() {
            beforeEach(function() {
                utilStub.getDctermsValue.and.returnValue('title');
                component.record = record;
            });
            it('if it is already open', function() {
                const listItem = new OntologyListItem();
                listItem.versionedRdfRecord.recordId = recordId;
                ontologyStateStub.list = [listItem];
                component.openOntology();
                expect(ontologyStateStub.openOntology).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                expect(listItem.active).toBeTrue();
                expect(router.navigate).toHaveBeenCalledWith(['/ontology-editor']);
            });
            describe('if it is not already open', function() {
                it('successfully', async function() {
                    ontologyStateStub.openOntology.and.returnValue(of(null));
                    await component.openOntology();
                    expect(utilStub.getDctermsValue).toHaveBeenCalledWith(record, 'title');
                    expect(ontologyStateStub.openOntology).toHaveBeenCalledWith(recordId, 'title');
                    expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                    expect(router.navigate).toHaveBeenCalledWith(['/ontology-editor']);
                });
                it('unless an error occurs', fakeAsync(function() {
                    ontologyStateStub.openOntology.and.returnValue(throwError('Error message'));
                    component.openOntology();
                    tick();
                    expect(utilStub.getDctermsValue).toHaveBeenCalledWith(record, 'title');
                    expect(ontologyStateStub.openOntology).toHaveBeenCalledWith(recordId, 'title');
                    expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error message');
                    expect(router.navigate).toHaveBeenCalledWith(['/ontology-editor']);
                }));
            });
        });
        it('openMapping should navigate to the mapping module and select the mapping', function() {
            utilStub.getDctermsValue.and.returnValue('title');
            component.record = record;
            mapperStateStub.paginationConfig = {
                searchText: ''
            };
            component.openMapping();
            expect(mapperStateStub.paginationConfig.searchText).toEqual('title');
            expect(router.navigate).toHaveBeenCalledWith(['/mapper']);
        });
        it('openDataset navigates to the dataset module', function() {
            component.openDataset();
            expect(router.navigate).toHaveBeenCalledWith(['/datasets']);
        });
        it('openShapesGraphRecord navigates to the shapes graph module', function() {
            component.record = record;
            const recordSelect = {
                recordId: 'recordId',
                title: '',
                description: ''
            };
            shapesGraphStateStub.openShapesGraph.and.resolveTo();
            component.openShapesGraph();
            expect(router.navigate).toHaveBeenCalledWith(['/shapes-graph-editor']);
            expect(shapesGraphStateStub.openShapesGraph).toHaveBeenCalledWith(recordSelect);
        });
        describe('update set the appropriate variables', function() {
            beforeEach(function() {
                component.record = record;
            });
            it('when it is not an ontology record', function() {
                catalogStateStub.getRecordType.and.returnValue('Test');
                component.update();
                expect(component.recordType).toEqual('Test');
                expect(component.showButton).toEqual(true);
                expect(policyEnforcementStub.evaluateRequest).not.toHaveBeenCalled();
            });
            describe('when it is an ontology record and', function() {
                beforeEach(function() {
                    catalogStateStub.getRecordType.and.returnValue(ONTOLOGYEDITOR + 'OntologyRecord');
                });
                it('the user can view', fakeAsync(function() {
                    policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));
                    component.update();
                    tick();
                    expect(component.recordType).toEqual(ONTOLOGYEDITOR + 'OntologyRecord');
                    expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: recordId, actionId: policyManagerStub.actionRead});
                    expect(component.showButton).toEqual(true);
                }));
                it('the user cannot view', fakeAsync(function() {
                    policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
                    component.update();
                    tick();
                    expect(component.recordType).toEqual(ONTOLOGYEDITOR + 'OntologyRecord');
                    expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: recordId, actionId: policyManagerStub.actionRead});
                    expect(component.showButton).toEqual(false);
                }));
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.open-record-button')).length).toEqual(1);
        });
        it('button type depending on whether flat is set', function() {
            component.showButton = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.mat-button')).length).toEqual(0);
            expect(element.queryAll(By.css('.mat-raised-button')).length).toEqual(1);
            
            component.flat = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.mat-button')).length).toEqual(1);
            expect(element.queryAll(By.css('.mat-raised-button')).length).toEqual(0);
        });
        it('depending on showButton being true or false', function() {
            component.showButton = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('button')).length).toEqual(1);

            component.showButton = false;
            fixture.detectChanges();
            expect(element.queryAll(By.css('button')).length).toEqual(0);
        });
        it('should call openRecord when clicked', function() {
            spyOn(component, 'openRecord');
            component.showButton = true;
            fixture.detectChanges();

            const event = new MouseEvent('click');
            const button = element.queryAll(By.css('button'))[0];
            button.triggerEventHandler('click', event);
            expect(component.openRecord).toHaveBeenCalledWith(event);
        });
    });
});
