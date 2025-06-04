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

//Third-Party imports
import { MockPipe } from 'ng-mocks';

//Mobi & Local imports
import { BeautifyPipe } from '../../../shared/pipes/beautify.pipe';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { NodeShapesItemComponent } from './node-shapes-item.component';

describe('NodeShapesItemComponent', () => {
  let component: NodeShapesItemComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<NodeShapesItemComponent>;
  
  const nodeItem = {
    'iri': 'http://www.example.com/TestName',
    'name': 'TestName',
    'targetType': 'http://www.example.com/type',
    'targetValue': 'http://www.example.com/value',
    'imported': true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        NodeShapesItemComponent,
        MockPipe(BeautifyPipe)
      ]
    });
    fixture = TestBed.createComponent(NodeShapesItemComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;

    component.nodeData = nodeItem;

    fixture.detectChanges();
  });

  afterEach(function() {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should create the correct html', () => {
    expect(element.queryAll(By.css('h4.node-title')).length).toEqual(1);
    expect(element.queryAll(By.css('small')).length).toEqual(4);
    expect(element.queryAll(By.css('p')).length).toEqual(4);

    const content = element.queryAll(By.css('div.node-content'));
    expect(content.length).toEqual(1);
    expect(content[0].nativeElement.innerHTML).toContain('IRI: ');
    expect(content[0].nativeElement.innerHTML).toContain('Target: ');
    expect(content[0].nativeElement.innerHTML).toContain('Target Type: ');
    expect(content[0].nativeElement.innerHTML).toContain('Imported: ');
    expect(content[0].nativeElement.innerHTML).toContain('http://www.example.com/TestName');
    expect(content[0].nativeElement.innerHTML).toContain('http://www.example.com/value');
    expect(content[0].nativeElement.innerHTML).toContain('http://www.example.com/type');
    expect(content[0].nativeElement.innerHTML).toContain('true');
  });
});
