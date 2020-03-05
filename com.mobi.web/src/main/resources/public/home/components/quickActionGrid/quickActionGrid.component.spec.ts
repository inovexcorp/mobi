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
import {
    mockOntologyState,
    mockDiscoverState
} from '../../../../../../test/js/Shared';
import { flatten } from 'lodash';
import {DebugElement} from "@angular/core";
import {ComponentFixture, TestBed} from "@angular/core/testing";
import {configureTestSuite} from "ng-bullet";
import {SharedModule} from "../../../shared/shared.module";
import {HomeModule} from "../../home.module";
import ontologyStateService from "../../../shared/services/ontologyState.service";
import discoverStateService from "../../../shared/services/discoverState.service";
import {WindowRef} from "../../../shared/services/windowRef.service";
import {QuickActionGridComponent} from "./quickActionGrid.component";
import {By} from "@angular/platform-browser";

describe('Quick Action Grid component', () => {
    class mockState {
        go = jasmine.createSpy('go');
    }
    class mockWindow {
        getNativeWindow = {
            open: jasmine.createSpy('open')
        }
    }
    let component: QuickActionGridComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<QuickActionGridComponent>;
    let ontologyStateSvc;
    let discoverStateSvc;
    let $state;
    let windowRef;

    configureTestSuite(() => {
        TestBed.configureTestingModule({
            imports: [SharedModule, HomeModule],
            declarations: [
            ],
            providers: [
                {provide: ontologyStateService, useValue: mockOntologyState},
                {provide: discoverStateService, useValue: mockDiscoverState},
                {provide: WindowRef, useValue: mockWindow},
                {provide: '$state', useValue: mockState},

            ]
        });
        ontologyStateSvc = TestBed.get(ontologyStateService);
        discoverStateSvc = TestBed.get(discoverStateService);
        $state = TestBed.get('$state');
        windowRef = TestBed.get(WindowRef);
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(QuickActionGridComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
    });

    it('should initialize with the correct action list', () => {
        expect(component.actions.length).toEqual(2);
        expect(flatten(component.actions).length).toEqual(6);
    });
    describe('controller methods', () => {
        it('should search the catalog', () => {
            component.searchTheCatalog();
            expect($state.go).toHaveBeenCalledWith('root.catalog');
        });
        describe('should open an ontology', () => {
            it('if one is selected', () => {
                let item = {active: true};
                ontologyStateSvc.listItem = item;
                component.openAnOntology();
                expect($state.go).toHaveBeenCalledWith('root.ontology-editor');
                expect(item.active).toEqual(false);
                expect(ontologyStateSvc.listItem).toEqual({});
            });
            it('if one is not selected', () => {
                component.openAnOntology();
                expect($state.go).toHaveBeenCalledWith('root.ontology-editor');
                expect(ontologyStateSvc.listItem).toEqual({});
            });
        });
        it('should explore data', () => {
            component.exploreData();
            expect($state.go).toHaveBeenCalledWith('root.discover');
            expect(discoverStateSvc.explore.active).toEqual(true);
            expect(discoverStateSvc.search.active).toEqual(false);
            expect(discoverStateSvc.query.active).toEqual(false);
        });
        it('should query data', () => {
            component.queryData();
            expect($state.go).toHaveBeenCalledWith('root.discover');
            expect(discoverStateSvc.explore.active).toEqual(false);
            expect(discoverStateSvc.search.active).toEqual(false);
            expect(discoverStateSvc.query.active).toEqual(true);
        });
        it('should read the documentation', () => {
            component.readTheDocumentation();
            expect(windowRef.getNativeWindow.open).toHaveBeenCalledWith(jasmine.any(String), '_blank');
        });
        it('should ingest data', () => {
            component.ingestData();
            expect($state.go).toHaveBeenCalledWith('root.mapper');
        });
    });
    describe('contains the correct html', () => {
        it('for wrapping containers', () => {
            expect(element.queryAll(By.css('.quick-action-grid')).length).toEqual(1);
            expect(element.queryAll(By.css('.card')).length).toEqual(1);
            expect(element.queryAll(By.css('.card-body')).length).toEqual(1);
        });
        it('depending on how many actions there are', () => {
            let rows = this.element.querySelectorAll('.card-body .row');
            expect(rows.length).toEqual(component.actions.length);
            component.actions.forEach(arr => {
                expect(element.nativeElement(rows[0]).queryAll(By.css('.col')).length).toEqual(arr.length);
            });
        });
    });
});