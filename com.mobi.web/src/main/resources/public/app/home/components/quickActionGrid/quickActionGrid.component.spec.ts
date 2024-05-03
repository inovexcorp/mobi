/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { MockProvider } from 'ng-mocks';

import {
    cleanStylesFromDOM,
    mockWindowRef
} from '../../../../../public/test/ts/Shared';
import { SharedModule } from '../../../shared/shared.module';
import { WindowRef } from '../../../shared/services/windowRef.service';
import { DiscoverStateService } from '../../../shared/services/discoverState.service';
import { QuickActionGridComponent } from './quickActionGrid.component';

describe('Quick Action Grid component', function() {
    let component: QuickActionGridComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<QuickActionGridComponent>;
    let discoverStateStub: jasmine.SpyObj<DiscoverStateService>;
    let windowRefStub;
    let router: Router;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ SharedModule, RouterTestingModule.withRoutes([]) ],
            declarations: [
                QuickActionGridComponent
            ],
            providers: [
                MockProvider(DiscoverStateService),
                { provide: WindowRef, useClass: mockWindowRef },
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(QuickActionGridComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        discoverStateStub = TestBed.inject(DiscoverStateService) as jasmine.SpyObj<DiscoverStateService>;
        windowRefStub = TestBed.inject(WindowRef) as jasmine.SpyObj<WindowRef>;
        router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
        spyOn(router, 'navigate');
    });

    afterAll(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        discoverStateStub = null;
        windowRefStub = null;
        router = null;
    });

    it('should initialize with the correct action list', function() {
        component.ngOnInit();
        expect(component.actions.length).toEqual(2);
        expect(flatten(component.actions).length).toEqual(6);
    });
    describe('controller methods', function() {
        it('should search the catalog', function() {
            component.searchTheCatalog();
            expect(router.navigate).toHaveBeenCalledWith(['/catalog']);
        });
        it('should open an ontology', function() {
            component.openAnOntology();
            expect(router.navigate).toHaveBeenCalledWith(['/ontology-editor']);
        });
        it('should explore data', function() {
            component.exploreData();
            expect(router.navigate).toHaveBeenCalledWith(['/discover']);
            expect(discoverStateStub.tabIndex).toEqual(0);
        });
        it('should query data', function() {
            component.queryData();
            expect(router.navigate).toHaveBeenCalledWith(['/discover']);
            expect(discoverStateStub.tabIndex).toEqual(2);
        });
        it('should read the documentation', function() {
            component.readTheDocumentation();
            expect(windowRefStub.nativeWindow.open).toHaveBeenCalledWith(jasmine.any(String), '_blank');
        });
        it('should ingest data', function() {
            component.ingestData();
            expect(router.navigate).toHaveBeenCalledWith(['/mapper']);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.quick-action-grid')).length).toEqual(1);
            expect(element.queryAll(By.css('mat-card')).length).toEqual(1);
        });
        it('depending on how many actions there are', function() {
            const rows = element.queryAll(By.css('mat-card-content .row'));
            expect(rows.length).toEqual(component.actions.length);
            component.actions.forEach(arr => {
                expect(element.nativeElement(rows[0]).queryAll(By.css('.col')).length).toEqual(arr.length);
            });
        });
    });
});
