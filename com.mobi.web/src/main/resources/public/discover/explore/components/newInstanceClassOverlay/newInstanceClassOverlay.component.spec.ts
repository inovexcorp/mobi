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
import * as uuid from 'uuid';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

import { 
    cleanStylesFromDOM
 } from '../../../../../../../test/ts/Shared';
import { SplitIRIPipe } from '../../../../shared/pipes/splitIRI.pipe';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { SharedModule } from '../../../../shared/shared.module';
import { ExploreService } from '../../../services/explore.service';
import { ExploreUtilsService } from '../../services/exploreUtils.service';
import { NewInstancePropertyOverlayComponent } from '../newInstancePropertyOverlay/newInstancePropertyOverlay.component';
import { InstanceDetails } from '../../../models/instanceDetails.interface';
import { PolicyEnforcementService } from '../../../../shared/services/policyEnforcement.service';
import { UtilService } from '../../../../shared/services/util.service';
import { NewInstanceClassOverlayComponent } from './newInstanceClassOverlay.component';

describe('New Instance Class Overlay component', function() {
    let component: NewInstanceClassOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<NewInstanceClassOverlayComponent>;
    let discoverStateStub: jasmine.SpyObj<DiscoverStateService>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<NewInstancePropertyOverlayComponent>>;
    let exploreServiceStub: jasmine.SpyObj<ExploreService>;
    let splitIriStub: jasmine.SpyObj<SplitIRIPipe>;
    let utilStub: jasmine.SpyObj<UtilService>;
    const data = {
        classes: [{id: 'test'}, {id: 'blah'}]
    };

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                NewInstanceClassOverlayComponent,
            ],
            providers: [
                MockProvider(UtilService),
                MockProvider(PolicyEnforcementService),
                { provide: MAT_DIALOG_DATA, useValue: data },
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
                { provide: uuid, useFactory: () => jasmine.createSpyObj('uuid', ['v4'])},
                MockProvider(ExploreService),
                MockProvider(DiscoverStateService),
                MockProvider(ExploreUtilsService),
                MockProvider(MatDialog),
                MockProvider(SplitIRIPipe),
                MockProvider('prefixes', 'prefixes'),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(NewInstanceClassOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        matDialogRef = TestBed.get(MatDialogRef);
        discoverStateStub = TestBed.get(DiscoverStateService);
        exploreServiceStub = TestBed.get(ExploreService);
        splitIriStub = TestBed.get (SplitIRIPipe);
        utilStub = TestBed.get(UtilService);

        discoverStateStub.explore = {
            breadcrumbs: ['Classes'],
            classDeprecated: false,
            classDetails: [],
            classId: '',
            creating: false,
            editing: false,
            instance: {
                // changed: [],
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
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        discoverStateStub = null;
        matDialogRef = null;
        utilStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1.mat-dialog-title')).length).withContext('title').toEqual(1);
            expect(element.queryAll(By.css('div.mat-dialog-content')).length).withContext('content').toEqual(1);
            expect(element.queryAll(By.css('div.mat-dialog-actions')).length).withContext('actions').toEqual(1);
        });
        ['h1', 'mat-form-field', 'input', 'mat-autocomplete'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
        it('depending on whether the selected class is deprecated', function() {
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);
            expect(button.properties['disabled']).toBeFalsy();

            component.selectedClass = {
                id: 'class',
                title: 'Class',
                deprecated: true};
            fixture.detectChanges(); // scope.$digest();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
            expect(button.properties['disabled']).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        describe('should create an instance of a class', function() {
            beforeEach(function() {
                component.selectedClass = {
                    id: 'class',
                    title: 'Class',
                    deprecated: true
                };
                discoverStateStub.explore.recordId = 'www.test.com';
                discoverStateStub.explore.instanceDetails.limit = 99;
            });
            it('unless getClassInstanceDetails rejects', function() {
                exploreServiceStub.getClassInstanceDetails.and.returnValue(throwError('Error message'));
                component.submit();
                fixture.detectChanges();
                expect(exploreServiceStub.getClassInstanceDetails).toHaveBeenCalledWith('www.test.com', 'class', {pageIndex: 0, limit: 99});
                expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error message');
                expect(matDialogRef.close).not.toHaveBeenCalled();
            });
            describe('when getClassInstanceDetails resolves', function() {
                beforeEach(function() {
                    exploreServiceStub.getClassInstanceDetails.and.returnValue(of(new HttpResponse<InstanceDetails[]>({body: []})));
                    splitIriStub.transform.and.returnValue({begin: 'begin/', then: 'then/', end: 'end'});
                });
                it('if instances already exist', fakeAsync( function() {
                    exploreServiceStub.createPagedResultsObject.and.returnValue({data: [{instanceIRI: 'instance', title: 'test', description: 'desc'}], total: 1});
                    component.submit();
                    fixture.detectChanges();
                    tick();
                    expect(exploreServiceStub.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateStub.explore.recordId, component.selectedClass.id, {pageIndex: 0, limit: discoverStateStub.explore.instanceDetails.limit});
                    exploreServiceStub.getClassInstanceDetails(discoverStateStub.explore.recordId, component.selectedClass.id, {pageIndex: 0, limit: discoverStateStub.explore.instanceDetails.limit}).subscribe(() => {
                        expect(discoverStateStub.explore.creating).toEqual(true);
                        expect(discoverStateStub.explore.classId).toEqual(component.selectedClass.id);
                        expect(discoverStateStub.explore.classDeprecated).toEqual(component.selectedClass.deprecated);
                        expect(discoverStateStub.resetPagedInstanceDetails).toHaveBeenCalledWith();
                        expect(discoverStateStub.explore.instanceDetails.data).toEqual([{instanceIRI: 'instance', title: 'test', description: 'desc'}]);
                        expect(splitIriStub.transform).toHaveBeenCalledWith('instance');
                        expect(discoverStateStub.explore.instance.entity[0]['@type']).toEqual([component.selectedClass.id]);
                        expect(discoverStateStub.explore.instance.entity[0]['@id'].startsWith('begin/then/')).toBeTruthy();
                        expect(discoverStateStub.explore.instance.metadata.instanceIRI.startsWith('begin/then/')).toBeTruthy();
                        expect(discoverStateStub.explore.breadcrumbs).toEqual(['Classes', component.selectedClass.title, 'New Instance']);
                        expect(matDialogRef.close).toHaveBeenCalledWith();
                    });
                }));
                it('if there are no instances', fakeAsync( function() {
                    exploreServiceStub.createPagedResultsObject.and.returnValue({data: [], total: 0});
                    component.submit();
                    fixture.detectChanges();
                    tick();
                    expect(exploreServiceStub.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateStub.explore.recordId, component.selectedClass.id, {pageIndex: 0, limit: discoverStateStub.explore.instanceDetails.limit});
                    exploreServiceStub.getClassInstanceDetails(discoverStateStub.explore.recordId, component.selectedClass.id, {pageIndex: 0, limit: discoverStateStub.explore.instanceDetails.limit}).subscribe(() => {
                        expect(discoverStateStub.explore.creating).toEqual(true);
                        expect(discoverStateStub.explore.classId).toEqual(component.selectedClass.id);
                        expect(discoverStateStub.explore.classDeprecated).toEqual(component.selectedClass.deprecated);
                        expect(discoverStateStub.resetPagedInstanceDetails).toHaveBeenCalledWith();
                        expect(discoverStateStub.explore.instanceDetails.data).toEqual([]);
                        expect(splitIriStub.transform).toHaveBeenCalledWith(component.selectedClass.id);
                        expect(discoverStateStub.explore.instance.entity[0]['@type']).toEqual([component.selectedClass.id]);
                        expect(discoverStateStub.explore.instance.entity[0]['@id'].startsWith('http://mobi.com/data/end/')).toBeTruthy();
                        expect(discoverStateStub.explore.instance.metadata.instanceIRI.startsWith('http://mobi.com/data/end/')).toBeTruthy();
                        expect(discoverStateStub.explore.breadcrumbs).toEqual(['Classes', component.selectedClass.title, 'New Instance']);
                        expect(matDialogRef.close).toHaveBeenCalledWith();
                    });
                }));
            });
        });
    });
    it('should call submit when the button is clicked', function() {
        spyOn(component, 'submit');
        const continueButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        continueButton.triggerEventHandler('click', null);
        expect(component.submit).toHaveBeenCalledWith();
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
});
