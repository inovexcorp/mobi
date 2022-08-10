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
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';
import { StateService } from '@uirouter/core';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
    mockOntologyState,
    mockPolicyEnforcement,
    mockPolicyManager,
    mockUtil,
} from '../../../../../../test/ts/Shared';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { SharedModule } from '../../../shared/shared.module';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { CATALOG, DATASET, DELIM, ONTOLOGYEDITOR, SHAPESGRAPHEDITOR } from '../../../prefixes';
import { OpenRecordButtonComponent } from './openRecordButton.component';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';

// Mocks
class mockState {
    go = jasmine.createSpy('go');
}

describe('Open Record Button component', function() {
    let component: OpenRecordButtonComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<OpenRecordButtonComponent>;
    let catalogStateStub: jasmine.SpyObj<CatalogStateService>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let ontologyStateStub;
    let policyEnforcementStub;
    let policyManagerStub;
    let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;
    let utilStub;
    let $stateStub;

    const recordId = 'recordId';

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                OpenRecordButtonComponent,
            ],
            providers: [
                MockProvider(CatalogStateService),
                MockProvider(ShapesGraphStateService),
                MockProvider(MapperStateService),
                { provide: OntologyStateService, useClass: mockOntologyState },
                { provide: 'policyEnforcementService', useClass: mockPolicyEnforcement },
                { provide: 'policyManagerService', useClass: mockPolicyManager },
                { provide: 'utilService', useClass: mockUtil },
                { provide: StateService, useClass: mockState },
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(OpenRecordButtonComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        catalogStateStub = TestBed.get(CatalogStateService);
        ontologyStateStub = TestBed.get(OntologyStateService);
        mapperStateStub = TestBed.get(MapperStateService);
        policyEnforcementStub = TestBed.get('policyEnforcementService');
        policyManagerStub = TestBed.get('policyManagerService');
        shapesGraphStateStub = TestBed.get(ShapesGraphStateService);
        utilStub = TestBed.get('utilService');
        $stateStub = TestBed.get(StateService);

        this.record = {
            '@id': recordId,
            '@type': [CATALOG + 'Record']
        };
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
    });

    it('should initialize correctly on record change', function() {
        spyOn(component, 'update');
        component.record = this.record;
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
                component.record = this.record;
            });
            it('if it is already open', function() {
                ontologyStateStub.list = [{versionedRdfRecord: {recordId: recordId}}];
                component.openOntology();
                expect(ontologyStateStub.openOntology).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                expect(ontologyStateStub.listItem).toEqual({versionedRdfRecord: {recordId: recordId}, active: true});
                expect($stateStub.go).toHaveBeenCalledWith('root.ontology-editor', null, { reload: true });
            });
            describe('if it is not already open', function() {
                it('successfully', fakeAsync(function() {
                    const ontologyId = 'ontologyId';
                    ontologyStateStub.openOntology.and.returnValue(of(ontologyId));
                    component.openOntology();
                    tick();
                    expect(utilStub.getDctermsValue).toHaveBeenCalledWith(this.record, 'title');
                    expect(ontologyStateStub.openOntology).toHaveBeenCalledWith(recordId, 'title');
                    expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                    expect($stateStub.go).toHaveBeenCalledWith('root.ontology-editor', null, { reload: true });
                }));
                it('unless an error occurs', fakeAsync(function() {
                    ontologyStateStub.openOntology.and.returnValue(throwError('Error message'));
                    component.openOntology();
                    tick();
                    expect(utilStub.getDctermsValue).toHaveBeenCalledWith(this.record, 'title');
                    expect(ontologyStateStub.openOntology).toHaveBeenCalledWith(recordId, 'title');
                    expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error message');
                    expect($stateStub.go).toHaveBeenCalledWith('root.ontology-editor', null, { reload: true });
                }));
            });
        });
        it('openMapping should navigate to the mapping module and select the mapping', function() {
            utilStub.getDctermsValue.and.returnValue('title');
            component.record = this.record;
            mapperStateStub.paginationConfig = {
                searchText: ''
            };
            component.openMapping();
            expect(mapperStateStub.paginationConfig.searchText).toEqual('title');
            expect($stateStub.go).toHaveBeenCalledWith('root.mapper', null, { reload: true });
        });
        it('openDataset navigates to the dataset module', function() {
            component.openDataset();
            expect($stateStub.go).toHaveBeenCalledWith('root.datasets', null, { reload: true });
        });
        it('openShapesGraphRecord navigates to the shapes graph module', function() {
            component.record = this.record;
            const recordSelect = {
                recordId: 'recordId',
                title: '',
                description: ''
            };
            shapesGraphStateStub.openShapesGraph.and.resolveTo();
            component.openShapesGraph();
            expect($stateStub.go).toHaveBeenCalledWith('root.shapes-graph-editor', null, { reload: true });
            expect(shapesGraphStateStub.openShapesGraph).toHaveBeenCalledWith(recordSelect);
        });
        describe('update set the appropriate variables', function() {
            beforeEach(function() {
                component.record = this.record;
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
                    policyEnforcementStub.evaluateRequest.and.resolveTo(policyEnforcementStub.permit);
                    component.update();
                    tick();
                    expect(component.recordType).toEqual(ONTOLOGYEDITOR + 'OntologyRecord');
                    expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: recordId, actionId: policyManagerStub.actionRead});
                    expect(component.showButton).toEqual(true);
                }));
                it('the user cannot view', fakeAsync(function() {
                    policyEnforcementStub.evaluateRequest.and.resolveTo(policyEnforcementStub.deny);
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