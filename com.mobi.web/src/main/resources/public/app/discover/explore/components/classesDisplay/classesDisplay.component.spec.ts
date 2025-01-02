/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';

import { 
    cleanStylesFromDOM
 } from '../../../../../../public/test/ts/Shared';
import { DatasetSelectComponent } from '../../../../shared/components/datasetSelect/datasetSelect.component';
import { InfoMessageComponent } from '../../../../shared/components/infoMessage/infoMessage.component';
import { DatasetManagerService } from '../../../../shared/services/datasetManager.service';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { PolicyEnforcementService } from '../../../../shared/services/policyEnforcement.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { ExploreService } from '../../../services/explore.service';
import { ExploreUtilsService } from '../../services/exploreUtils.service';
import { ClassCardsComponent } from '../classCards/classCards.component';
import { InstanceFormComponent } from '../instanceForm/instanceForm.component';
import { ClassesDisplayComponent } from './classesDisplay.component';

describe('Classes Display component', function() {
    let component: ClassesDisplayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ClassesDisplayComponent>;
    let discoverStateStub: jasmine.SpyObj<DiscoverStateService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatDividerModule,
                MatButtonModule,
                MatIconModule
            ],
            declarations: [
                ClassesDisplayComponent,
                MockComponent(DatasetSelectComponent),
                MockComponent(InfoMessageComponent),
                MockComponent(InstanceFormComponent),
                MockComponent(ClassCardsComponent)
            ],
            providers: [
                MockProvider(DatasetManagerService),
                MockProvider(ExploreService),
                MockProvider(DiscoverStateService),
                MockProvider(ToastService),
                MockProvider(PolicyEnforcementService),
                MockProvider(ExploreUtilsService),
                MockProvider(MatDialog),
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ClassesDisplayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        discoverStateStub = TestBed.inject(DiscoverStateService) as jasmine.SpyObj<DiscoverStateService>;

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
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        discoverStateStub = null;
    });

    describe('controller methods', function() {
        it ('should handle selection of a dataset', function() {
            spyOn(component, 'refresh');
            component.onSelect({recordId: 'recordId', recordTitle: 'recordTitle'});
            expect(discoverStateStub.explore.recordId).toEqual('recordId');
            expect(discoverStateStub.explore.recordTitle).toEqual('recordTitle');
            expect(component.refresh).toHaveBeenCalledWith();
        });
        // TODO: Add tests for showCreate and refresh
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.classes-display')).length).toEqual(1);
        });
        ['.classes-display', 'form.classes-display-header', 'mat-divider'].forEach(test => {
            it(`with a ${test}`, function() {
                fixture.detectChanges();
                expect(element.queryAll(By.css(test)).length).toBe(1);
            });
        });
        it('with an info-message', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('info-message')).length).toBe(1);

            discoverStateStub.explore.recordId = 'recordId';
            discoverStateStub.explore.hasPermissionError = false;
            discoverStateStub.explore.classDetails = [
                {
                    classIRI: 'classIRI',
                    classTitle: 'classTitle',
                    classDescription: 'classDescription',
                    instancesCount: 1,
                    classExamples: ['1'],
                    ontologyRecordTitle: 'ontologyRecordTitle',
                    deprecated: false
            }];
            fixture.detectChanges();
            expect(element.queryAll(By.css('info-message')).length).withContext('info-message').toBe(0);
        });
        it('with a .text-warning and .fa-exclamation-circle', async () => {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.text-warning')).length).toBe(0);
            expect(element.queryAll(By.css('.fa-exclamation-circle')).length).toBe(0);
            discoverStateStub.explore.recordId = 'recordId';
            await fixture.whenStable();
            fixture.detectChanges();
            expect(element.queryAll(By.css('.text-warning')).length).toBe(1);
            expect(element.queryAll(By.css('.fa-exclamation-circle')).length).toBe(1);
        });
        it('with a .class-cards-container and class-cards', function() {
            expect(element.queryAll(By.css('.class-cards-container')).length).toBe(0);
            expect(element.queryAll(By.css('class-cards')).length).toBe(0);

            discoverStateStub.explore.recordId = 'recordId';
            discoverStateStub.explore.classDetails = [
                {
                    classIRI: 'classIRI',
                    classTitle: 'classTitle',
                    classDescription: 'classDescription',
                    instancesCount: 1,
                    classExamples: ['1'],
                    ontologyRecordTitle: 'ontologyRecordTitle',
                    deprecated: false
            }];

            fixture.detectChanges();

            expect(element.queryAll(By.css('.class-cards-container')).length).toBe(1);
            expect(element.queryAll(By.css('class-cards')).length).toBe(1);
        });
    });
});
