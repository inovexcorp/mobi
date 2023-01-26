/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { DebugElement, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { OntologyStateService } from '../../services/ontologyState.service';
import { BlankNodeValueDisplayComponent } from './blankNodeValueDisplay.component';

describe('Blank Node Value Display component', function() {
    let component: BlankNodeValueDisplayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<BlankNodeValueDisplayComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;

    const bnode = 'bnode';

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ 
                NoopAnimationsModule,
                MatButtonModule,
                FormsModule,
                ReactiveFormsModule
             ],
            declarations: [
                BlankNodeValueDisplayComponent,
                MockComponent(CodemirrorComponent),
            ],
            providers: [
                MockProvider(OntologyStateService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(BlankNodeValueDisplayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        ontologyStateStub = TestBed.get(OntologyStateService);

        ontologyStateStub.getBlankNodeValue.and.returnValue(bnode);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyStateStub = null;
    });

    it('initializes value correctly', function() {
        const change = new SimpleChange('', 'id', true);
        component.ngOnChanges({nodeId: change});
        expect(component.value).toEqual(bnode);
        expect(ontologyStateStub.getBlankNodeValue).toHaveBeenCalledWith('id');
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.blank-node-value-display')).length).toEqual(1);
        });
        it('with a ngx-codemirror', function() {
            expect(element.queryAll(By.css('ngx-codemirror')).length).toEqual(1);
        });
    });
});
