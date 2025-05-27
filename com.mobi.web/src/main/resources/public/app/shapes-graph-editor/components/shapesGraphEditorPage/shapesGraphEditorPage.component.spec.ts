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
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MockComponent, MockProvider } from 'ng-mocks';

import { ChangesPageComponent } from '../../../versioned-rdf-record-editor/components/changes-page/changes-page.component';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { EditorTopBarComponent } from '../../../versioned-rdf-record-editor/components/editor-top-bar/editor-top-bar.component';
import { MergePageComponent } from '../../../versioned-rdf-record-editor/components/merge-page/merge-page.component';
import { ShapesGraphDetailsComponent } from '../shapesGraphDetails/shapesGraphDetails.component';
import { ShapesGraphEditorPageComponent } from './shapesGraphEditorPage.component';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { ShapesGraphPropertiesBlockComponent } from '../shapesGraphPropertiesBlock/shapesGraphPropertiesBlock.component';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ShapesTabsHolderComponent } from '../shapes-tabs-holder/shapes-tabs-holder.component';
import { ShapesPreviewComponent } from '../shapes-preview/shapes-preview.component';

describe('Shapes Graph Editor Page component', function() {
    let element: DebugElement;
    let fixture: ComponentFixture<ShapesGraphEditorPageComponent>;
    let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ 
                MatExpansionModule
            ],
            declarations: [
                ShapesGraphEditorPageComponent,
                MockComponent(ChangesPageComponent),
                MockComponent(EditorTopBarComponent),
                MockComponent(MergePageComponent),
                MockComponent(ShapesGraphDetailsComponent),
                MockComponent(ShapesGraphPropertiesBlockComponent),
                MockComponent(ShapesPreviewComponent),
                MockComponent(ShapesTabsHolderComponent)
            ],
            providers: [
                MockProvider(ShapesGraphStateService),
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ShapesGraphEditorPageComponent);
        element = fixture.debugElement;
        shapesGraphStateStub = TestBed.inject(ShapesGraphStateService) as jasmine.SpyObj<ShapesGraphStateService>;
        shapesGraphStateStub.listItem = new ShapesGraphListItem();
    });

    afterAll(function() {
        cleanStylesFromDOM();
        element = null;
        fixture = null;
        shapesGraphStateStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('div.shapes-graph-editor-page')).length).toEqual(1);
        });
        describe('with editor top bar', function() {
            it('when no active merge', async function() {
                fixture.detectChanges();
                await fixture.whenStable();
                expect(element.queryAll(By.css('app-editor-top-bar')).length).toEqual(1);
            });
            it('with an active merge', async function() {
                shapesGraphStateStub.listItem.merge.active = true;
                fixture.detectChanges();
                await fixture.whenStable();
                expect(element.queryAll(By.css('app-editor-top-bar')).length).toEqual(0);
            });
        });
        describe('with shapes graph merge page', function() {
            it('when no active merge', async function() {
                fixture.detectChanges();
                await fixture.whenStable();
                expect(element.queryAll(By.css('app-merge-page')).length).toEqual(0);
            });
            it('with an active merge', async function() {
                shapesGraphStateStub.listItem.merge.active = true;
                fixture.detectChanges();
                await fixture.whenStable();
                expect(element.queryAll(By.css('app-merge-page')).length).toEqual(1);
            });
        });
        describe('with shapes graph changes page', function() {
            it('when no active merge', async function() {
                fixture.detectChanges();
                await fixture.whenStable();
                expect(element.queryAll(By.css('app-changes-page')).length).toEqual(0);
            });
            it('with an active merge', async function() {
                shapesGraphStateStub.listItem.changesPageOpen = true;
                fixture.detectChanges();
                await fixture.whenStable();
                expect(element.queryAll(By.css('app-changes-page')).length).toEqual(1);
            });
        });
    });
});
