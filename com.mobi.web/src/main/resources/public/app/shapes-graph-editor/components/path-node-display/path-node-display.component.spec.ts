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
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { MockComponent } from 'ng-mocks';

import { AddPathNodeHoverButtonComponent } from '../add-path-node-hover-button/add-path-node-hover-button.component';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { PathNode } from '../../models/property-shape.interface';
import { pathTestCases } from '../../models/shacl-test-data';
import { PathNodeDisplayComponent } from './path-node-display.component';

describe('PathNodeDisplayComponent', () => {
  let component: PathNodeDisplayComponent;
  let fixture: ComponentFixture<PathNodeDisplayComponent>;
  let element: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatCardModule,
        MatIconModule,
      ],
      declarations: [
        PathNodeDisplayComponent,
        MockComponent(AddPathNodeHoverButtonComponent)
      ]
    });
    fixture = TestBed.createComponent(PathNodeDisplayComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
  });

  afterEach(() => {
    cleanStylesFromDOM();
    fixture = null;
    component = null;
    element = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('controller method', () => {
    it('clickAdd should handle a button click', () => {
      const node: PathNode = { type: 'Sequence', items: [{ type: 'IRI', iri: 'urn:prop', label: 'Prop' }]};
      component.pathNode = node;
      fixture.detectChanges();
      spyOn(component.addNodeToParent, 'emit');
      component.clickAdd(node, 1, undefined, true);
      expect(component.addNodeToParent.emit).toHaveBeenCalledWith({
        parentNode: node, 
        seqIdx: 1, 
        sibling: undefined, 
        isSeq: true
      });
    });
  });
  describe('contains the correct html', () => {
    pathTestCases.forEach(test => {
      it(`for ${test.testName}`, () => {
        component.pathNode = test.structure;
        fixture.detectChanges();
        Object.keys(test.htmlCounts).forEach(selector => {
          expect(element.queryAll(By.css(selector)).length).withContext(selector).toEqual(test.htmlCounts[selector]);
        });
      });
    });
  });
});
