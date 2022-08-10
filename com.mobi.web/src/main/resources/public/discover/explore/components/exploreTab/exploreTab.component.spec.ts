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
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';

import { 
    cleanStylesFromDOM
 } from '../../../../../../../test/ts/Shared';
import { DiscoverStateService } from '../../../../shared/services/discoverState.service';
import { SharedModule } from '../../../../shared/shared.module';
import { ClassesDisplayComponent } from '../classesDisplay/classesDisplay.component';
import { InstanceCreatorComponent } from '../instanceCreator/instanceCreator.component';
import { InstanceEditorComponent } from '../instanceEditor/instanceEditor.component';
import { InstanceFormComponent } from '../instanceForm/instanceForm.component';
import { InstancesDisplayComponent } from '../instancesDisplay/instancesDisplay.component';
import { InstanceViewComponent } from '../instanceView/instanceView.component';
import { ExploreTabComponent } from './exploreTab.component';


describe('Explore Tab component', function() {
    let component: ExploreTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ExploreTabComponent>;
    let discoverStateStub: jasmine.SpyObj<DiscoverStateService>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                ExploreTabComponent,
                MockComponent(ClassesDisplayComponent),
                MockComponent(InstanceFormComponent),
                MockComponent(InstancesDisplayComponent),
                MockComponent(InstanceViewComponent),
                MockComponent(InstanceEditorComponent),
                MockComponent(InstanceCreatorComponent)
            ],
            providers: [
                MockProvider(DiscoverStateService)
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ExploreTabComponent);
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
            expect(element.queryAll(By.css('.explore-tab')).length).toEqual(1);
        });
        it('with a classes-display', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('classes-display')).length).toBe(1);
            
            discoverStateStub.explore.breadcrumbs = ['', ''];
            fixture.detectChanges();

            expect(element.queryAll(By.css('classes-display')).length).toBe(0);
        });
        it('with a instances-display', function() {
            expect(element.queryAll(By.css('instances-display')).length).toBe(0);

            discoverStateStub.explore.breadcrumbs = ['', ''];
            fixture.detectChanges();

            expect(element.queryAll(By.css('instances-display')).length).toBe(1);
        });
        it('with a instance-view', function() {
            expect(element.queryAll(By.css('instance-view')).length).toBe(0);

            discoverStateStub.explore.breadcrumbs = ['', '', ''];
            fixture.detectChanges();

            expect(element.queryAll(By.css('instance-view')).length).toBe(1);
        });
        it('with a instance-editor', function() {
            expect(element.queryAll(By.css('instance-editor')).length).toBe(0);

            discoverStateStub.explore.breadcrumbs = ['', '', ''];
            discoverStateStub.explore.editing = true;
            fixture.detectChanges();

            expect(element.queryAll(By.css('instance-editor')).length).toBe(1);
        });
        it('with a instance-creator', function() {
            expect(element.queryAll(By.css('instance-creator')).length).toBe(0);

            discoverStateStub.explore.breadcrumbs = ['', '', ''];
            discoverStateStub.explore.creating = true;
            fixture.detectChanges();

            expect(element.queryAll(By.css('instance-creator')).length).toBe(1);
        });
    });
});
