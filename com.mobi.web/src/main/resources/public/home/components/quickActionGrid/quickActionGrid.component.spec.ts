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

import { flatten } from 'lodash';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { By } from '@angular/platform-browser';
import { StateService } from '@uirouter/core';

import {
    cleanStylesFromDOM,
    mockWindowRef,
    mockOntologyState,
} from '../../../../../../test/ts/Shared';
import { SharedModule } from '../../../shared/shared.module';
import { WindowRef } from '../../../shared/services/windowRef.service';
import { QuickActionGridComponent } from './quickActionGrid.component';
import { MockProvider } from 'ng-mocks';
import { DiscoverStateService } from '../../../shared/services/discoverState.service';

// Mocks
class mockState {
    go = jasmine.createSpy('go');
}

describe('Quick Action Grid component', function() {
    let component: QuickActionGridComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<QuickActionGridComponent>;
    let ontologyStateStub;
    let discoverStateStub;
    let $stateStub;
    let windowRefStub;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                QuickActionGridComponent
            ],
            providers: [
                MockProvider(DiscoverStateService),
                { provide: 'ontologyStateService', useClass: mockOntologyState },
                { provide: WindowRef, useClass: mockWindowRef },
                { provide: StateService, useClass: mockState },
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(QuickActionGridComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.get('ontologyStateService');
        discoverStateStub = TestBed.get(DiscoverStateService);
        $stateStub = TestBed.get(StateService);
        windowRefStub = TestBed.get(WindowRef);
    });

    afterAll(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
        discoverStateStub = null;
        $stateStub = null;
        windowRefStub = null;
    });

    it('should initialize with the correct action list', function() {
        component.ngOnInit();
        expect(component.actions.length).toEqual(2);
        expect(flatten(component.actions).length).toEqual(6);
    });
    describe('controller methods', function() {
        it('should search the catalog', function() {
            component.searchTheCatalog();
            expect($stateStub.go).toHaveBeenCalledWith('root.catalog', null, {reload: true});
        });
        describe('should open an ontology', function() {
            it('if one is selected', function() {
                const item = { active: true };
                ontologyStateStub.listItem = item;
                component.openAnOntology();
                expect($stateStub.go).toHaveBeenCalledWith('root.ontology-editor', null, {reload: true});
                expect(item.active).toEqual(false);
                expect(ontologyStateStub.listItem).toEqual({});
            });
            it('if one is not selected', function() {
                component.openAnOntology();
                expect($stateStub.go).toHaveBeenCalledWith('root.ontology-editor', null, {reload: true});
                expect(ontologyStateStub.listItem).toEqual({});
            });
        });
        it('should explore data', function() {
            component.exploreData();
            expect($stateStub.go).toHaveBeenCalledWith('root.discover', null, {reload: true});
            expect(discoverStateStub.tabIndex).toEqual(0);
        });
        it('should query data', function() {
            component.queryData();
            expect($stateStub.go).toHaveBeenCalledWith('root.discover', null, {reload: true});
            expect(discoverStateStub.tabIndex).toEqual(2);
        });
        it('should read the documentation', function() {
            component.readTheDocumentation();
            expect(windowRefStub.nativeWindow.open).toHaveBeenCalledWith(jasmine.any(String), '_blank');
        });
        it('should ingest data', function() {
            component.ingestData();
            expect($stateStub.go).toHaveBeenCalledWith('root.mapper', null, {reload: true});
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.quick-action-grid')).length).toEqual(1);
            expect(element.queryAll(By.css('.card')).length).toEqual(1);
            expect(element.queryAll(By.css('.card-body')).length).toEqual(1);
        });
        it('depending on how many actions there are', function() {
            const rows = element.queryAll(By.css('.card-body .row'));
            expect(rows.length).toEqual(component.actions.length);
            component.actions.forEach(arr => {
                expect(element.nativeElement(rows[0]).queryAll(By.css('.col')).length).toEqual(arr.length);
            });
        });
    });
});
