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
import { configureTestSuite } from 'ng-bullet';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { StaticIriLimitedComponent } from '../staticIriLimited/staticIriLimited.component';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { PrefixationPipe } from '../../../shared/pipes/prefixation.pipe';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { ShapesGraphDetailsComponent } from './shapesGraphDetails.component';

describe('Shapes Graph Details component', function() {
    let component: ShapesGraphDetailsComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ShapesGraphDetailsComponent>;
    let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [],
            declarations: [
                ShapesGraphDetailsComponent,
                MockComponent(StaticIriLimitedComponent),
                MockPipe(PrefixationPipe)
            ],
            providers: [
                PrefixationPipe,
                MockProvider(ShapesGraphStateService),
                MockProvider(OntologyManagerService),
                // { provide: OntologyManagerService, useClass: mockOntologyManager }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ShapesGraphDetailsComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        shapesGraphStateStub = TestBed.get(ShapesGraphStateService);
        shapesGraphStateStub.listItem = new ShapesGraphListItem();
        shapesGraphStateStub.listItem.metadata = {'@id': ''};
    });

    afterAll(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        shapesGraphStateStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.shapes-graph-details')).length).toEqual(1);
        });
        it('depending on whether the selected entity has types', function() {
            expect(element.queryAll(By.css('.type-wrapper')).length).toEqual(0);
            shapesGraphStateStub.listItem.metadata['@type'] = ['test'];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.type-wrapper')).length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        describe('getTypes functions properly', function() {
            it('when @type is empty', function() {
                shapesGraphStateStub.listItem.metadata = {'@id': ''};
                expect(component.getTypes()).toEqual('');
            });
            it('when @type has items', function() {
                const expected = 'test, test2';
                shapesGraphStateStub.listItem.metadata = {'@id': '', '@type': ['test', 'test2']};
                expect(component.getTypes()).toEqual(expected);
            });
        });
    });
});