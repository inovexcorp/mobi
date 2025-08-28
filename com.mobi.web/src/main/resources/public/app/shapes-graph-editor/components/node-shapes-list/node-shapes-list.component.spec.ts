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
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

//Mobi & Local imports
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { NodeShapesItemComponent } from '../node-shapes-item/node-shapes-item.component';
import { NodeShapeSummary } from '../../models/node-shape-summary.interface';
import { SearchBarComponent } from '../../../shared/components/searchBar/searchBar.component';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { ShapesGraphManagerService } from '../../../shared/services/shapesGraphManager.service';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { splitIRI } from '../../../shared/pipes/splitIRI.pipe';
import { ToastService } from '../../../shared/services/toast.service';
import { VersionedRdfRecord } from '../../../shared/models/versionedRdfRecord.interface';
import { NodeShapesListComponent } from './node-shapes-list.component';

describe('NodeShapesListComponent', () => {
  let component: NodeShapesListComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<NodeShapesListComponent>;
  let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;
  let shapesGraphManagerStub: jasmine.SpyObj<ShapesGraphManagerService>;
  let toastStub: jasmine.SpyObj<ToastService>;
  let changesObj: SimpleChanges;

  const versionedRdfRecord: VersionedRdfRecord = {
    title: 'Test Record',
    recordId: 'recordId',
    branchId: 'branchId',
    commitId: 'commitId',
    tagId: 'tagId'
  };
  const nodeList: NodeShapeSummary[] = [
    {
      iri: 'http://www.example.com/Test1',
      name: 'Test1',
      targetType: 'http://www.w3.org/ns/shacl#targetClass',
      targetTypeLabel: 'Target Class',
      targetValue: 'http://stardog.com/tutorial/test4',
      targetValueLabel: 'test4',
      imported: true,
      sourceOntologyIRI: 'https://mobi.solutions/shapes-graphs/example'
    },
    {
      iri: 'http://www.example.com/Test2',
      name: 'Test2',
      targetType: 'http://www.example.com#targetClass',
      targetTypeLabel: 'Target Class',
      targetValue: 'http://www.example.com/Test3',
      targetValueLabel: 'Test3',
      imported: false,
      sourceOntologyIRI: 'https://mobi.solutions/shapes-graphs/example'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ScrollingModule
      ],
      declarations: [
        NodeShapesListComponent,
        MockComponent(NodeShapesItemComponent),
        MockComponent(InfoMessageComponent),
        MockComponent(SearchBarComponent)
      ],
      providers: [
        MockProvider(ShapesGraphStateService),
        MockProvider(ShapesGraphManagerService),
        MockProvider(ToastService)
      ]
    }).compileComponents();
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    shapesGraphStateStub = TestBed.inject(ShapesGraphStateService) as jasmine.SpyObj<ShapesGraphStateService>;
    shapesGraphStateStub.listItem = new ShapesGraphListItem();
    shapesGraphStateStub.listItem.selected = {
      '@id': 'https://mobi.solutions/shapes-graphs/example',
      '@type': ['http://www.w3.org/2002/07/owl#Ontology']
    };
    shapesGraphStateStub.listItem.setSelectedNodeShapeIri('selectedEntityIRI');
    shapesGraphStateStub.listItem.editorTabStates.nodeShapes = {
      sourceIRI: 'sourceIRI',
      nodes: []
    };
    shapesGraphStateStub.getEntityName.and.callFake((entityId: string) => splitIRI(entityId).end);
    shapesGraphStateStub.setSelected.and.returnValue(of(null));
    shapesGraphManagerStub = TestBed.inject(ShapesGraphManagerService) as jasmine.SpyObj<ShapesGraphManagerService>;
    shapesGraphManagerStub.getNodeShapes.and.returnValue(of(nodeList));

    changesObj = {
      viewedRecord: {
        previousValue: undefined,
        currentValue: 'https://www.example.com/record1',
        firstChange: true,
        isFirstChange() {
          return this.firstChange;
        }
      },
      versionedRdfRecord: {
        previousValue: undefined,
        currentValue: versionedRdfRecord,
        firstChange: true,
        isFirstChange() {
          return this.firstChange;
        }
      },
      listItem: {
        previousValue: undefined,
        currentValue: shapesGraphStateStub.listItem,
        firstChange: true,
        isFirstChange() {
          return this.firstChange;
        }
      }
    };

    fixture = TestBed.createComponent(NodeShapesListComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;

    component.versionedRdfRecord = versionedRdfRecord;
    component.viewedRecord = 'https://mobi.solutions/shapes-graphs/example';
    component.listItem = shapesGraphStateStub.listItem;
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    shapesGraphStateStub = null;
    shapesGraphManagerStub = null;
    toastStub = null;
    changesObj = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('controller method', () => {
    it('onItemSelection should set listItem nodeTab', () => {
      spyOn(shapesGraphStateStub.listItem, 'setSelectedNodeShapeIri').and.callThrough();
      expect(shapesGraphStateStub.listItem.selectedNodeShapeIri).toEqual('selectedEntityIRI');
      expect(shapesGraphStateStub.listItem.editorTabStates.nodeShapes.sourceIRI).toEqual('sourceIRI');
      const nodeShapeInfo: NodeShapeSummary = {
        iri: 'iri',
        name: 'name',
        targetType: 'targetType',
        targetValue: 'targetValue',
        imported: false,
        sourceOntologyIRI: 'urn:newSourceOntologyIRI'
      };
      component.onItemSelection(nodeShapeInfo);
      expect(shapesGraphStateStub.listItem.setSelectedNodeShapeIri).toHaveBeenCalledWith('iri');
      expect(shapesGraphStateStub.listItem.selectedNodeShapeIri).toEqual('iri');
      expect(shapesGraphStateStub.setSelected).toHaveBeenCalledWith('iri', shapesGraphStateStub.listItem);
      expect(shapesGraphStateStub.listItem.editorTabStates.nodeShapes.sourceIRI).toEqual('urn:newSourceOntologyIRI');
    });
  });
  describe('should retrieve the correct node shapes upon component load or change', () => {
    it('unless there are errors.', () => {
      shapesGraphStateStub.listItem.editorTabStates.nodeShapes.nodes = [];
      shapesGraphManagerStub.getNodeShapes.and.returnValue(throwError({ errorMessage: 'Error Message' }));
      component.ngOnChanges(changesObj);
      fixture.detectChanges();
      expect(shapesGraphManagerStub.getNodeShapes).toHaveBeenCalledWith(
        'recordId',
        'branchId',
        'commitId',
        true,
        ''
      );
      expect(shapesGraphStateStub.listItem.editorTabStates.nodeShapes.nodes).toEqual([]);
      expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error Message');
    });
    it('if there are node shapes', () => {
      component.ngOnChanges(changesObj);
      fixture.detectChanges();
      expect(shapesGraphManagerStub.getNodeShapes).toHaveBeenCalledWith(
        'recordId',
        'branchId',
        'commitId',
        true,
        ''
      );
      expect(shapesGraphStateStub.listItem.editorTabStates.nodeShapes.nodes).toEqual(nodeList);
      expect(toastStub.createErrorToast).not.toHaveBeenCalled();
    });
  });
  describe('should retrieve the filtered list of node shapes upon search', () => {
    it('unless there are errors.', () => {
      component.searchText = 'test';
      shapesGraphManagerStub.getNodeShapes.and.returnValue(throwError({ errorMessage: 'Error Message' }));
      component.ngOnChanges(changesObj);
      fixture.detectChanges();
      expect(shapesGraphManagerStub.getNodeShapes).toHaveBeenCalledWith(
        'recordId',
        'branchId',
        'commitId',
        true,
        'test'
      );
      expect(shapesGraphStateStub.listItem.editorTabStates.nodeShapes.nodes).toEqual([]);
      expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error Message');
    });
    it('if there are node shapes', () => {
      component.searchText = 'test';
      component.ngOnChanges(changesObj);
      fixture.detectChanges();
      expect(shapesGraphManagerStub.getNodeShapes).toHaveBeenCalledWith(
        'recordId',
        'branchId',
        'commitId',
        true,
        'test'
      );
      expect(shapesGraphStateStub.listItem.editorTabStates.nodeShapes.nodes).toEqual(nodeList);
    });
  });
  describe('contains the correct html', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });
    it('if there are no node shapes.', () => {
      shapesGraphManagerStub.getNodeShapes.and.returnValue(of([]));
      const infoMessage = element.queryAll(By.css('.no-match'));
      expect(infoMessage.length).toEqual(1);
      expect(infoMessage[0].nativeElement.innerHTML).toContain(
        'No node shapes match your search criteria.'
      );
      expect(element.queryAll(By.css('app-node-shapes-item')).length).toEqual(0);
    });
    it('if there are node shapes.', async () => {
      component.listItem = shapesGraphStateStub.listItem;
      component.viewedRecord = 'https://mobi.solutions/shapes-graphs/example2';
      component.ngOnChanges(changesObj);
      
      fixture.detectChanges(); // Renders the component and the viewport shell
      await fixture.whenStable();
      fixture.detectChanges(); // Renders the items inside the viewport

      expect(shapesGraphStateStub.listItem.editorTabStates.nodeShapes.nodes).toEqual(nodeList);
      expect(component.nodeShapes).toEqual(nodeList);
      const infoMessage = element.queryAll(By.css('.no-match'));
      expect(infoMessage.length).toEqual(0);
      expect(element.queryAll(By.css('cdk-virtual-scroll-viewport')).length).toEqual(1);
      expect(element.queryAll(By.css('app-node-shapes-item')).length).toEqual(2);
    });
  });
});
