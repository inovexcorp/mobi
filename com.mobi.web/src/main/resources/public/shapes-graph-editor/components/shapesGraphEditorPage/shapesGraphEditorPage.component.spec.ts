/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { EditorTopBarComponent } from '../editorTopBar/editorTopBar.component';
import { ShapesGraphEditorPageComponent } from './shapesGraphEditorPage.component';
import { ShapesGraphChangesPageComponent } from '../shapesGraphChangesPage/shapesGraphChangesPage.component';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';

describe('Shapes Graph Editor Page component', function() {
    let component: ShapesGraphEditorPageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ShapesGraphEditorPageComponent>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ ],
            declarations: [
                ShapesGraphEditorPageComponent,
                MockComponent(EditorTopBarComponent),
                MockComponent(ShapesGraphChangesPageComponent)
            ],
            providers: [
                MockProvider(ShapesGraphStateService)
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ShapesGraphEditorPageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
    });

    afterAll(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('div.shapes-graph-editor-page')).length).toEqual(1);
        });
        it('with editor top bar', function() {
            expect(element.queryAll(By.css('editor-top-bar')).length).toEqual(1);
        });
    });
});