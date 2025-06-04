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

//angular imports
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';

//Mobi & Local imports
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { NodeShapesDisplayComponent } from './node-shapes-display.component';

describe('NodeShapesDisplayComponent', () => {
  let component: NodeShapesDisplayComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<NodeShapesDisplayComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NodeShapesDisplayComponent]
    });
    fixture = TestBed.createComponent(NodeShapesDisplayComponent);
    element = fixture.debugElement;
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should have the correct html', () => {
    const content = element.queryAll(By.css('p'));
    expect(content.length).toEqual(1);
    expect(content[0].nativeElement.innerHTML).toContain('Display of Node Shapes Coming Soon!');
  });
});
