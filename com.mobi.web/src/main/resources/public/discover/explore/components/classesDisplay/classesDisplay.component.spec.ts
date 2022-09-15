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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';

import { 
    cleanStylesFromDOM
 } from '../../../../../../../test/ts/Shared';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { PolicyEnforcementService } from '../../../../shared/services/policyEnforcement.service';
import { UtilService } from '../../../../shared/services/util.service';
import { SharedModule } from '../../../../shared/shared.module';
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

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                ClassesDisplayComponent,
                MockComponent(InstanceFormComponent),
                MockComponent(ClassCardsComponent)
            ],
            providers: [
                MockProvider(ExploreService),
                MockProvider(DiscoverStateService),
                MockProvider(UtilService),
                MockProvider(PolicyEnforcementService),
                MockProvider(ExploreUtilsService),
                MockProvider(MatDialog),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ClassesDisplayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        discoverStateStub = TestBed.get(DiscoverStateService);

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

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.classes-display')).length).toEqual(1);
        });
        ['.classes-display', 'form.classes-display-header', 'mat-divider'].forEach(test => {
            it('with a ' + test, function() {
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
        it('with a .text-warning and .fa-exclamation-circle', function() {
            expect(element.queryAll(By.css('.text-warning')).length).toBe(0);
            expect(element.queryAll(By.css('.fa-exclamation-circle')).length).toBe(0);

            discoverStateStub.explore.recordId = 'recordId';
            fixture.detectChanges(); // scope.$digest();

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
