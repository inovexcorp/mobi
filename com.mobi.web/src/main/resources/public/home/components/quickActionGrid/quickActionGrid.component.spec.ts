/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import { DebugElement } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { configureTestSuite } from "ng-bullet";
import { By } from "@angular/platform-browser";
import { StateService } from "@uirouter/core";

import {
    cleanStylesFromDOM,
    mockWindowRef,
    mockOntologyState,
    mockDiscoverState
} from '../../../../../../test/ts/Shared';
import { SharedModule } from "../../../shared/shared.module";
import { WindowRef } from '../../../shared/services/windowRef.service';
import { QuickActionGridComponent } from "./quickActionGrid.component";

// Mocks
class mockState {
    go = jasmine.createSpy('go');
}

// Test
describe('Quick Action Grid component', () => {
    let component: QuickActionGridComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<QuickActionGridComponent>;
    let ontologyStateStub;
    let discoverStateStub;
    let $stateStub;
    let windowRefStub;

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                QuickActionGridComponent
            ],
            providers: [
                { provide: 'ontologyStateService', useClass: mockOntologyState },
                { provide: 'discoverStateService', useClass: mockDiscoverState },
                { provide: WindowRef, useClass: mockWindowRef },
                { provide: StateService, useClass: mockState },
            ]
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(QuickActionGridComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.get('ontologyStateService');
        discoverStateStub = TestBed.get('discoverStateService');
        $stateStub = TestBed.get(StateService);
        windowRefStub = TestBed.get(WindowRef);
    });

    afterAll(() => {
        cleanStylesFromDOM();
    });

    it('should initialize with the correct action list', () => {
        component.ngOnInit();
        expect(component.actions.length).toEqual(2);
        expect(flatten(component.actions).length).toEqual(6);
    });
    describe('controller methods', () => {
        it('should search the catalog', () => {
            component.searchTheCatalog();
            expect($stateStub.go).toHaveBeenCalledWith('root.catalog', null, {reload: true});
        });
        describe('should open an ontology', () => {
            it('if one is selected', () => {
                let item = { active: true };
                ontologyStateStub.listItem = item;
                component.openAnOntology();
                expect($stateStub.go).toHaveBeenCalledWith('root.ontology-editor', null, {reload: true});
                expect(item.active).toEqual(false);
                expect(ontologyStateStub.listItem).toEqual({});
            });
            it('if one is not selected', () => {
                component.openAnOntology();
                expect($stateStub.go).toHaveBeenCalledWith('root.ontology-editor', null, {reload: true});
                expect(ontologyStateStub.listItem).toEqual({});
            });
        });
        it('should explore data', () => {
            component.exploreData();
            expect($stateStub.go).toHaveBeenCalledWith('root.discover', null, {reload: true});
            expect(discoverStateStub.explore.active).toEqual(true);
            expect(discoverStateStub.search.active).toEqual(false);
            expect(discoverStateStub.query.active).toEqual(false);
        });
        it('should query data', () => {
            component.queryData();
            expect($stateStub.go).toHaveBeenCalledWith('root.discover', null, {reload: true});
            expect(discoverStateStub.explore.active).toEqual(false);
            expect(discoverStateStub.search.active).toEqual(false);
            expect(discoverStateStub.query.active).toEqual(true);
        });
        it('should read the documentation', () => {
            component.readTheDocumentation();
            expect(windowRefStub.nativeWindow.open).toHaveBeenCalledWith(jasmine.any(String), '_blank');
        });
        it('should ingest data', () => {
            component.ingestData();
            expect($stateStub.go).toHaveBeenCalledWith('root.mapper', null, {reload: true});
        });
    });
    describe('contains the correct html', () => {
        it('for wrapping containers', () => {
            expect(element.queryAll(By.css('.quick-action-grid')).length).toEqual(1);
            expect(element.queryAll(By.css('.card')).length).toEqual(1);
            expect(element.queryAll(By.css('.card-body')).length).toEqual(1);
        });
        it('depending on how many actions there are', () => {
            let rows = element.queryAll(By.css('.card-body .row'));
            expect(rows.length).toEqual(component.actions.length);
            component.actions.forEach(arr => {
                expect(element.nativeElement(rows[0]).queryAll(By.css('.col')).length).toEqual(arr.length);
            });
        });
    });
});