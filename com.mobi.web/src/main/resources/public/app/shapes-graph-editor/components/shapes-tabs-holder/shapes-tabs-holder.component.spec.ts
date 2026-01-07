/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
//Angular imports
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';

//Third-arty imports
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

//Mobi && Local imports
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { NodeShapesTabComponent } from '../node-shapes-tab/node-shapes-tab.component';
import { ShapeButtonStackComponent } from '../shape-button-stack/shape-button-stack.component';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ShapesProjectTabComponent } from '../shapes-project-tab/shapes-project-tab.component';
import { ShapesTabsHolderComponent } from './shapes-tabs-holder.component';

describe('ShapesTabsHolderComponent', () => {
  let component: ShapesTabsHolderComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<ShapesTabsHolderComponent>;
  let stateSvcStub: jasmine.SpyObj<ShapesGraphStateService>;

  const recordId = 'recordId';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatTabsModule,
        BrowserAnimationsModule,
      ],
      declarations: [
        ShapesTabsHolderComponent,
        MockComponent(ShapesProjectTabComponent),
        MockComponent(NodeShapesTabComponent),
        MockComponent(ShapeButtonStackComponent)
      ],
      providers: [
        MockProvider(ShapesGraphStateService)
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ShapesTabsHolderComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;

    stateSvcStub = TestBed.inject(ShapesGraphStateService) as jasmine.SpyObj<ShapesGraphStateService>;
    stateSvcStub.listItem = new ShapesGraphListItem();
    stateSvcStub.listItem.versionedRdfRecord.recordId = recordId;
    stateSvcStub.listItem.shapesGraphId = 'shapesGraphId';
    stateSvcStub.listItem.setSelectedNodeShapeIri('selectedEntityIRI');
    stateSvcStub.setSelected.and.returnValue(of(null));
    fixture.detectChanges();
  });

  afterAll(() => {
    cleanStylesFromDOM();
    element = null;
    fixture = null;
    stateSvcStub = null;
  });

  describe('controller method', function () {
    it('onTabChanged handles a tab change', function () {
      [
        { index: 0, key: 'PROJECT_TAB', value: 'shapesGraphId' },
        { index: 1, key: 'NODE_SHAPES_TAB', value: 'selectedEntityIRI' },
        { index: 8 },
      ].forEach(test => {
        stateSvcStub.setSelected.calls.reset();
        const event = new MatTabChangeEvent();
        event.index = test.index;
        component.onTabChanged(event);
        if (test.key) {
          expect(stateSvcStub.setSelected).toHaveBeenCalledWith(test.value, stateSvcStub.listItem);
        } else {
          expect(stateSvcStub.setSelected).not.toHaveBeenCalled();
        }
      });
    });
  });
  describe('should initialize', () => {
    describe('with the correct html', () => {
      it('when on the Project tab ', () => {
        expect(element.queryAll(By.css('mat-tab-group')).length).toEqual(1);
        expect(element.queryAll(By.css('mat-tab-body')).length).toEqual(2);
        expect(element.queryAll(By.css('app-shapes-project-tab')).length).toEqual(1);
      });
      it('when on the Node Shapes tab ', async () => {
        stateSvcStub.listItem.tabIndex = 1; // Ensures the right tab is active
        fixture.detectChanges();
        await fixture.isStable();

        expect(element.queryAll(By.css('mat-tab-group')).length).toEqual(1);
        expect(element.queryAll(By.css('mat-tab-body')).length).toEqual(2);
        expect(element.queryAll(By.css('app-node-shapes-tab')).length).toEqual(1);
      });
    });
  });
});
