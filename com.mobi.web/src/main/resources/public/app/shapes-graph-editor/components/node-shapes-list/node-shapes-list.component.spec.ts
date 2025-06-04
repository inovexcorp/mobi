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
import { DebugElement, SimpleChanges } from '@angular/core';
import { ScrollingModule } from '@angular/cdk/scrolling';

//Third-Party imports
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

//Mobi & Local imports
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { ShapesGraphManagerService } from '../../../shared/services/shapesGraphManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { NodeShapesListComponent } from './node-shapes-list.component';

describe('NodeShapesListComponent', () => {
  let component: NodeShapesListComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<NodeShapesListComponent>;
  let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;
  let shapesGraphManagerStub: jasmine.SpyObj<ShapesGraphManagerService>;
  let toastStub: jasmine.SpyObj<ToastService>;

  const nodeList = [
    {
      'iri': 'http://www.example.com/Test1',
      'name': 'Test1',
      'targetType': 'http://www.w3.org/ns/shacl#targetClass',
      'targetValue': 'http://stardog.com/tutorial/test4',
      'imported': true
    },
    {
      'iri': 'http://www.example.com/Test2',
      'name': 'Test2',
      'targetType': 'http://www.example.com#targetClass',
      'targetValue': 'http://www.example.com/Test3',
      'imported': false
    }
  ];

  const changesObj: SimpleChanges = {
    viewedRecord: {
      previousValue: undefined,
      currentValue: 'https://www.example.com/record1',
      firstChange: true,
      isFirstChange() {
        return this.firstChange;
      }
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ScrollingModule],
      declarations: [NodeShapesListComponent],
      providers: [
        MockProvider(ShapesGraphStateService),
        MockProvider(ShapesGraphManagerService),
        MockProvider(ToastService),
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(NodeShapesListComponent);
    component = fixture.componentInstance;
    component.nodeShapes = [];
    element = fixture.debugElement;

    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

    shapesGraphStateStub = TestBed.inject(ShapesGraphStateService) as jasmine.SpyObj<ShapesGraphStateService>;
    shapesGraphStateStub.listItem = new ShapesGraphListItem();
    shapesGraphStateStub.listItem.versionedRdfRecord = {
      title: 'Test Record',
      recordId: 'recordId',
      branchId: 'branchId',
      commitId: 'commitId',
    };
    component.viewedRecord = 'https://mobi.solutions/shapes-graphs/example';

    shapesGraphManagerStub = TestBed.inject(ShapesGraphManagerService) as jasmine.SpyObj<ShapesGraphManagerService>;
    shapesGraphManagerStub.getNodeShapes.and.returnValue(of(nodeList));

    fixture.detectChanges();
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    shapesGraphStateStub = null;
    shapesGraphManagerStub = null;
    toastStub = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('should create the correct html', () => {
    it('if there are no node shapes.', () => {
      shapesGraphManagerStub.getNodeShapes.and.returnValue(of([]));
      const infoMessage = element.queryAll(By.css('.no-match'));
      expect(infoMessage.length).toEqual(1);
      expect(infoMessage[0].nativeElement.innerHTML).toContain('No node shapes match your search criteria.');
      expect(element.queryAll(By.css('app-node-shapes-item')).length).toEqual(0);
    });
    it('if there are node shapes.', async () => {
      component.viewedRecord = 'https://mobi.solutions/shapes-graphs/example2';
      component.ngOnChanges(changesObj);
      await fixture.whenStable();
      fixture.detectChanges();
      const infoMessage = element.queryAll(By.css('.no-match'));
      expect(infoMessage.length).toEqual(0);
      expect(element.queryAll(By.css('cdk-virtual-scroll-viewport')).length).toEqual(1);
      expect(element.queryAll(By.css('.nodeWrapper')).length).toEqual(2);
      expect(element.queryAll(By.css('app-node-shapes-item')).length).toEqual(2);
    });
  });
  describe('should retrieve the correct node shapes upon component load or change', () => {
    it('unless there are errors.', () => {
      component.nodeShapes = [];
      shapesGraphManagerStub.getNodeShapes.and.returnValue(throwError('Error Message'));
      component.ngOnChanges(changesObj);
      fixture.detectChanges();
      expect(shapesGraphManagerStub.getNodeShapes).toHaveBeenCalledWith('recordId', 'branchId', 'commitId', true, '');
      expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error Message');
      expect(component.nodeShapes).toEqual([]);
    });
    it('if there are node shapes', () => {
      component.ngOnChanges(changesObj);
      fixture.detectChanges();
      expect(shapesGraphManagerStub.getNodeShapes).toHaveBeenCalledWith('recordId', 'branchId', 'commitId', true, '');
      expect(component.nodeShapes).toEqual(nodeList);
    });
  });
  describe('should retrieve the filtered list of node shapes upon search', () => {
    it('unless there are errors.', () => {
      component.searchText = 'test';
      shapesGraphManagerStub.getNodeShapes.and.returnValue(throwError('Error Message'));
      component.ngOnChanges(changesObj);
      fixture.detectChanges();
      expect(shapesGraphManagerStub.getNodeShapes).toHaveBeenCalledWith('recordId', 'branchId', 'commitId', true, 'test');
      expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error Message');
      expect(component.nodeShapes).toEqual([]);
    });
    it('if there are node shapes', () => {
      component.searchText = 'test';
      component.ngOnChanges(changesObj);
      fixture.detectChanges();
      expect(shapesGraphManagerStub.getNodeShapes).toHaveBeenCalledWith('recordId', 'branchId', 'commitId', true, 'test');
      expect(component.nodeShapes).toEqual(nodeList);
    });
  });
});
