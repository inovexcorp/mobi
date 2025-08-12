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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatRadioModule } from '@angular/material/radio';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';

import { of } from 'rxjs';
import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { 
  IMPLICIT_REFERENCE,
  TARGET_CLASS,
  TARGET_NODE,
  TARGET_OBJECTS_OF,
  TARGET_SUBJECTS_OF
} from '../../models/constants';
import { OWL, RDFS, SH } from '../../../prefixes';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { ShaclTargetChipInputComponent } from '../shacl-target-chip-input/shacl-target-chip-input.component';
import { ShaclTargetClassInputComponent } from '../shacl-target-class-input/shacl-target-class-input.component';
import { ShaclTargetNodeInputComponent } from '../shacl-target-node-input/shacl-target-node-input.component';
import { ShaclTargetSelectorComponent, TargetOption } from '../shacl-target-selector/shacl-target-selector.component';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { TARGET_SHAPES } from '../../models/shacl-test-data';
import { ToastService } from '../../../shared/services/toast.service';
import { VersionedRdfRecord } from '../../../shared/models/versionedRdfRecord.interface';
import { ShaclTargetComponent } from './shacl-target.component';

interface TargetChangeTestCase {
  description: string;
  initialShape: JSONLDObject;
  newOption: TargetOption;
  newNodeShape: JSONLDObject | undefined;
  expectedDiff: {
    deletionJson: JSONLDObject | null;
    additionJson: JSONLDObject | null;
  } | null;
}

describe('ShaclTargetComponent', () => {
  let component: ShaclTargetComponent;
  let fixture: ComponentFixture<ShaclTargetComponent>;
  let element: DebugElement;
  let stateService: jasmine.SpyObj<ShapesGraphStateService>;
  let toastStub: jasmine.SpyObj<ToastService>;

  const recordId = 'recordId';
  const branchId = 'branchId';
  const commitId = 'commitId';
  const versionedRdfRecord: VersionedRdfRecord = {
    title: 'title',
    recordId: recordId,
    commitId: commitId,
    branchId: branchId
  };
  const targetNodeOption: TargetOption = {
    iri: TARGET_NODE,
    label: 'targetNodeLabel',
    description: 'targetNodeDescription',
    valueLabel: 'targetNodeValueLabel'
  };
  const targetClassOption: TargetOption = {
    iri: TARGET_CLASS,
    label: 'targetClassLabel',
    description: 'targetClassDescription',
    valueLabel: 'targetClassValueLabel'
  };
  const targetObjectsOfOption: TargetOption = {
    iri: TARGET_OBJECTS_OF,
    label: 'targetObjectsOfLabel',
    description: 'targetObjectsOfDescription',
    valueLabel: 'targetObjectsOfValueLabel'
  };
  const targetSubjectOfOption: TargetOption = {
    iri: TARGET_SUBJECTS_OF,
    label: 'targetSubjectOfLabel',
    description: 'targetSubjectOfeDescription',
    valueLabel: 'targetSubjectOfValueLabel'
  };
  const targetImpicitOption: TargetOption = {
    iri: IMPLICIT_REFERENCE,
    label: 'targetImpicitLabel',
    description: 'targetImpicitDescription',
    valueLabel: 'targetImpicitValueLabel'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatRadioModule,
        MatFormFieldModule,
        MatInputModule,
        NoopAnimationsModule,
        MatIconModule,
        MatMenuModule
      ],
      declarations: [
        ShaclTargetComponent,
        MockComponent(ShaclTargetChipInputComponent),
        MockComponent(ShaclTargetNodeInputComponent),
        MockComponent(ShaclTargetSelectorComponent),
        MockComponent(ShaclTargetClassInputComponent)
      ],
      providers: [
        MockProvider(ShapesGraphStateService),
        PropertyManagerService,
        MockProvider(ToastService)
      ]
    }).compileComponents();

    stateService = TestBed.inject(ShapesGraphStateService) as jasmine.SpyObj<ShapesGraphStateService>;
    stateService.saveCurrentChanges.and.returnValue(of(null));
    stateService.listItem = new ShapesGraphListItem();
    stateService.listItem.selected = {
      '@id': 'newIri'
    };

    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

    fixture = TestBed.createComponent(ShaclTargetComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;

    component.versionedRdfRecord = versionedRdfRecord;
    component.nodeShape = TARGET_SHAPES.edgeCases.NO_TARGET;
    component.canModify = true;
    component.isImported = false;
    component.targetOption = undefined;

    fixture.detectChanges();
  });

  afterEach(function() {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    stateService = null;
    toastStub = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should complete the _destroySub$ subject on ngOnDestroy', () => {
    spyOn(component['_destroySub$'], 'next').and.callThrough();
    spyOn(component['_destroySub$'], 'complete').and.callThrough();
    component.ngOnDestroy();
    expect(component['_destroySub$'].next).toHaveBeenCalledWith();
    expect(component['_destroySub$'].complete).toHaveBeenCalledWith();
  });
  describe('controller methods', () => {
    describe('onEdit and onSave', () => {
      beforeEach(() => {
        component.ngOnChanges({
          nodeShape: {
            currentValue: TARGET_SHAPES.edgeCases.NO_TARGET,
            firstChange: true,
            isFirstChange: () => true,
            previousValue: null
          }
        });
        fixture.detectChanges();
      });
      it('should enter edit mode and enable form', () => {
        component.editMode = 'DISABLED';
        component.onEdit();
        expect(component.editMode).toEqual('ENABLED');
        expect(component.targetForm.enabled).toBeTrue();
      });
      it('should warn on invalid save', () => {
        component.onEdit();
        component.onSave(); // Form invalid by default without target and targetValue
        expect(toastStub.createWarningToast).toHaveBeenCalledWith('Can not save an invalid form.');
        expect(stateService.saveCurrentChanges).not.toHaveBeenCalled();
      });
      it('should save changes and disable form on valid save', () => {
        component.onEdit();
        fixture.detectChanges();

        component.targetOption = targetNodeOption;
        component.targetForm.controls['target'].setValue(TARGET_NODE);
        component.targetForm.controls['targetValue'].setValue('http://example.org/SomeNode');

        component.onSave();

        expect(stateService.saveCurrentChanges).toHaveBeenCalledWith();
        expect(component.editMode).toEqual('DISABLED');
        expect(component.targetForm.disabled).toBeTrue();
      });
    });
    describe('updateInProgressCommit', () => {
      const testCases: TargetChangeTestCase[] = [
        {
          description: 'when starting with NO target, change to targetNode',
          initialShape: TARGET_SHAPES.edgeCases.NO_TARGET,
          newOption: targetNodeOption,
          newNodeShape: TARGET_SHAPES.targetNode.IRI,
          expectedDiff: {
            deletionJson: null,
            additionJson: {
              '@id': 'ex:NodeShape_NoTarget',
              [TARGET_NODE]: [{ '@id': 'ex:SpecificNode' }]
            }
          }
        },
        {
          description: 'when starting with NO target, change to targetClass',
          initialShape: TARGET_SHAPES.edgeCases.NO_TARGET,
          newOption: targetClassOption,
          newNodeShape: TARGET_SHAPES.targetClass.IRI,
          expectedDiff: {
            deletionJson: null,
            additionJson: {
              '@id': 'ex:NodeShape_NoTarget',
              [TARGET_CLASS]: [{ '@id': 'ex:MyClass' }]
            }
          }
        },
        {
          description: 'when starting with NO target, change to targetObjectsOf',
          initialShape: TARGET_SHAPES.edgeCases.NO_TARGET,
          newOption: targetObjectsOfOption,
          newNodeShape: TARGET_SHAPES.targetObjectsOf.SINGLE_VALUE,
          expectedDiff: {
            deletionJson: null,
            additionJson: {
              '@id': 'ex:NodeShape_NoTarget',
              [TARGET_OBJECTS_OF]: [{ '@id': 'ex:prop1' }]
            }
          }
        },
        {
          description: 'when starting with NO target, change to targetSubjectsOf',
          initialShape: TARGET_SHAPES.edgeCases.NO_TARGET,
          newOption: targetSubjectOfOption,
          newNodeShape: TARGET_SHAPES.targetSubjectsOf.SINGLE_VALUE,
          expectedDiff: {
            deletionJson: null,
            additionJson: {
              '@id': 'ex:NodeShape_NoTarget',
              [TARGET_SUBJECTS_OF]: [{ '@id': 'ex:propA' }]
            }
          }
        },
        {
          description: 'when starting with NO target, change to implicit',
          initialShape: TARGET_SHAPES.edgeCases.NO_TARGET,
          newOption: targetImpicitOption,
          newNodeShape: TARGET_SHAPES.implicit.RDFS_CLASS_REFERENCE,
          expectedDiff: {
            deletionJson: null,
            additionJson: {
              '@id': 'ex:NodeShape_NoTarget',
              '@type': [
                'some:OtherType',
                `${OWL}Class`,
                `${RDFS}Class`
              ]
            }
          }
        },
        {
          description: 'when starting with NO target (NO Type), change to implicit',
          initialShape: TARGET_SHAPES.edgeCases.NO_TARGET_WITHOUT_TYPE,
          newOption: targetImpicitOption,
          newNodeShape: TARGET_SHAPES.implicit.RDFS_OWL_CLASS_REFERENCE,
          expectedDiff: {
            deletionJson: null,
            additionJson: {
              '@id': 'ex:NodeShape_NoTarget',
              '@type': [
                'some:OtherType',
                `${SH}NodeShape`,
                `${OWL}Class`,
                `${RDFS}Class`
              ]
            }
          }
        },
        {
          description: 'when starting with NO target, change to none (no target)',
          initialShape: TARGET_SHAPES.edgeCases.NO_TARGET,
          newOption: undefined,
          newNodeShape: undefined,
          expectedDiff: null
        },
        {
          description: 'when starting with targetNode, change to targetClass',
          initialShape: TARGET_SHAPES.targetNode.IRI,
          newOption: targetClassOption,
          newNodeShape: TARGET_SHAPES.targetClass.IRI,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:NodeShape_TargetNodeIRI',
              [TARGET_NODE]: [{ '@id': 'ex:SpecificNode' }]
            },
            additionJson: {
              '@id': 'ex:NodeShape_TargetNodeIRI',
              [TARGET_CLASS]: [{ '@id': 'ex:MyClass' }]
            }
          }
        },
        {
          description: 'when starting with targetNode, change to targetObjectsOf',
          initialShape: TARGET_SHAPES.targetNode.IRI,
          newOption: targetObjectsOfOption,
          newNodeShape: TARGET_SHAPES.targetObjectsOf.SINGLE_VALUE,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:NodeShape_TargetNodeIRI',
              [TARGET_NODE]: [{ '@id': 'ex:SpecificNode' }]
            },
            additionJson: {
              '@id': 'ex:NodeShape_TargetNodeIRI',
              [TARGET_OBJECTS_OF]: [{ '@id': 'ex:prop1' }]
            }
          }
        },
        {
          description: 'when starting with targetNode, change to targetSubjectsOf',
          initialShape: TARGET_SHAPES.targetNode.IRI,
          newOption: targetSubjectOfOption,
          newNodeShape: TARGET_SHAPES.targetSubjectsOf.SINGLE_VALUE,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:NodeShape_TargetNodeIRI',
              [TARGET_NODE]: [{ '@id': 'ex:SpecificNode' }]
            },
            additionJson: {
              '@id': 'ex:NodeShape_TargetNodeIRI',
              [TARGET_SUBJECTS_OF]: [{ '@id': 'ex:propA' }]
            }
          }
        },
        {
          description: 'when starting with targetNode, change to implicit',
          initialShape: TARGET_SHAPES.targetNode.IRI,
          newOption: targetImpicitOption,
          newNodeShape: TARGET_SHAPES.implicit.RDFS_CLASS_REFERENCE,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:NodeShape_TargetNodeIRI',
              [TARGET_NODE]: [{ '@id': 'ex:SpecificNode' }]
            },
            additionJson: {
              '@id': 'ex:NodeShape_TargetNodeIRI',
              '@type': [
                `${OWL}Class`,
                `${RDFS}Class`
              ]
            }
          }
        },
        {
          description: 'when starting with targetNode, change to a different targetNode',
          initialShape: TARGET_SHAPES.targetNode.IRI,
          newOption: targetNodeOption,
          newNodeShape: TARGET_SHAPES.targetNode.IRI,
          expectedDiff: null
        },
        {
          description: 'when starting with targetNode, remove the target',
          initialShape: TARGET_SHAPES.targetNode.IRI,
          newOption: undefined,
          newNodeShape: undefined,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:NodeShape_TargetNodeIRI',
              [TARGET_NODE]: [{ '@id': 'ex:SpecificNode' }]
            },
            additionJson: null
          }
        },
        {
          description: 'when starting with targetClass, change to targetNode',
          initialShape: TARGET_SHAPES.targetClass.IRI,
          newOption: targetNodeOption,
          newNodeShape: TARGET_SHAPES.targetNode.IRI,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:NodeShape_TargetClassIRI',
              [TARGET_CLASS]: [{ '@id': 'ex:MyClass' }]
            },
            additionJson: {
              '@id': 'ex:NodeShape_TargetClassIRI',
              [TARGET_NODE]: [{ '@id': 'ex:SpecificNode' }]
            }
          }
        },
        {
          description: 'when starting with targetClass, change to a different targetClass',
          initialShape: TARGET_SHAPES.targetClass.IRI,
          newOption: targetClassOption,
          newNodeShape: TARGET_SHAPES.targetClass.IRI,
          expectedDiff: null
        },
        {
          description: 'when starting with targetClass, change to targetObjectsOf',
          initialShape: TARGET_SHAPES.targetClass.IRI,
          newOption: targetObjectsOfOption,
          newNodeShape: TARGET_SHAPES.targetObjectsOf.SINGLE_VALUE,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:NodeShape_TargetClassIRI',
              [TARGET_CLASS]: [{ '@id': 'ex:MyClass' }]
            },
            additionJson: {
              '@id': 'ex:NodeShape_TargetClassIRI',
              [TARGET_OBJECTS_OF]: [{ '@id': 'ex:prop1' }]
            }
          }
        },
        {
          description: 'when starting with targetClass, change to targetSubjectsOf',
          initialShape: TARGET_SHAPES.targetClass.IRI,
          newOption: targetSubjectOfOption,
          newNodeShape: TARGET_SHAPES.targetSubjectsOf.SINGLE_VALUE,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:NodeShape_TargetClassIRI',
              [TARGET_CLASS]: [{ '@id': 'ex:MyClass' }]
            },
            additionJson: {
              '@id': 'ex:NodeShape_TargetClassIRI',
              [TARGET_SUBJECTS_OF]: [{ '@id': 'ex:propA' }]
            }
          }
        },
        {
          description: 'when starting with targetClass, change to implicit',
          initialShape: TARGET_SHAPES.targetClass.IRI,
          newOption: targetImpicitOption,
          newNodeShape: TARGET_SHAPES.implicit.RDFS_CLASS_REFERENCE,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:NodeShape_TargetClassIRI',
              [TARGET_CLASS]: [{ '@id': 'ex:MyClass' }]
            },
            additionJson: {
              '@id': 'ex:NodeShape_TargetClassIRI',
              '@type': [
                `${OWL}Class`,
                `${RDFS}Class`
              ]
            }
          }
        },
        {
          description: 'when starting with targetClass, remove the target',
          initialShape: TARGET_SHAPES.targetClass.IRI,
          newOption: undefined,
          newNodeShape: undefined,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:NodeShape_TargetClassIRI',
              [TARGET_CLASS]: [{ '@id': 'ex:MyClass' }]
            },
            additionJson: null
          }
        },
        {
          description: 'when starting with targetSubjectsOf, change to targetNode',
          initialShape: TARGET_SHAPES.targetSubjectsOf.SINGLE_VALUE,
          newOption: targetNodeOption,
          newNodeShape: TARGET_SHAPES.targetNode.IRI,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:NodeShape_TargetSubjectsOfSingle',
              [TARGET_SUBJECTS_OF]: [{ '@id': 'ex:propA' }]
            },
            additionJson: {
              '@id': 'ex:NodeShape_TargetSubjectsOfSingle',
              [TARGET_NODE]: [{ '@id': 'ex:SpecificNode' }]
            }
          }
        },
        {
          description: 'when starting with targetSubjectsOf, change to targetClass',
          initialShape: TARGET_SHAPES.targetSubjectsOf.SINGLE_VALUE,
          newOption: targetClassOption,
          newNodeShape: TARGET_SHAPES.targetClass.IRI,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:NodeShape_TargetSubjectsOfSingle',
              [TARGET_SUBJECTS_OF]: [{ '@id': 'ex:propA' }]
            },
            additionJson: {
              '@id': 'ex:NodeShape_TargetSubjectsOfSingle',
              [TARGET_CLASS]: [{ '@id': 'ex:MyClass' }]
            }
          }
        },
        {
          description: 'when starting with targetSubjectsOf, change to targetObjectsOf',
          initialShape: TARGET_SHAPES.targetSubjectsOf.SINGLE_VALUE,
          newOption: targetObjectsOfOption,
          newNodeShape: TARGET_SHAPES.targetObjectsOf.SINGLE_VALUE,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:NodeShape_TargetSubjectsOfSingle',
              [TARGET_SUBJECTS_OF]: [{ '@id': 'ex:propA' }]
            },
            additionJson: {
              '@id': 'ex:NodeShape_TargetSubjectsOfSingle',
              [TARGET_OBJECTS_OF]: [{ '@id': 'ex:prop1' }]
            }
          }
        },
        {
          description: 'when starting with targetSubjectsOf, change to a different targetSubjectsOf',
          initialShape: TARGET_SHAPES.targetSubjectsOf.SINGLE_VALUE,
          newOption: targetSubjectOfOption,
          newNodeShape: TARGET_SHAPES.targetSubjectsOf.MULTIPLE_VALUES,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:NodeShape_TargetSubjectsOfSingle',
              [TARGET_SUBJECTS_OF]: [{ '@id': 'ex:propA' }]
            },
            additionJson: {
              '@id': 'ex:NodeShape_TargetSubjectsOfSingle',
              [TARGET_SUBJECTS_OF]: [
                { '@id': 'ex:propA' },
                { '@id': 'ex:propB' },
              ]
            }
          }
        },
        {
          description: 'when starting with targetSubjectsOf, change to implicit',
          initialShape: TARGET_SHAPES.targetSubjectsOf.SINGLE_VALUE,
          newOption: targetImpicitOption,
          newNodeShape: TARGET_SHAPES.implicit.RDFS_CLASS_REFERENCE,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:NodeShape_TargetSubjectsOfSingle',
              [TARGET_SUBJECTS_OF]: [{ '@id': 'ex:propA' }]
            },
            additionJson: {
              '@id': 'ex:NodeShape_TargetSubjectsOfSingle',
              '@type': [ `${OWL}Class`, `${RDFS}Class`]
            }
          }
        },
        {
          description: 'when starting with targetSubjectsOf, remove the target',
          initialShape: TARGET_SHAPES.targetSubjectsOf.SINGLE_VALUE,
          newOption: undefined,
          newNodeShape: undefined,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:NodeShape_TargetSubjectsOfSingle',
              [TARGET_SUBJECTS_OF]: [{ '@id': 'ex:propA' }]
            },
            additionJson: null
          }
        },
        {
          description: 'when starting with targetObjectsOf, change to targetNode',
          initialShape: TARGET_SHAPES.targetObjectsOf.SINGLE_VALUE,
          newOption: targetNodeOption,
          newNodeShape: TARGET_SHAPES.targetNode.IRI,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:NodeShape_TargetObjectsOfSingle',
              [TARGET_OBJECTS_OF]: [{ '@id': 'ex:prop1' }]
            },
            additionJson: {
              '@id': 'ex:NodeShape_TargetObjectsOfSingle',
              [TARGET_NODE]: [{ '@id': 'ex:SpecificNode' }]
            }
          }
        },
        {
          description: 'when starting with targetObjectsOf, change to targetClass',
          initialShape: TARGET_SHAPES.targetObjectsOf.SINGLE_VALUE,
          newOption: targetClassOption,
          newNodeShape: TARGET_SHAPES.targetClass.IRI,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:NodeShape_TargetObjectsOfSingle',
              [TARGET_OBJECTS_OF]: [{ '@id': 'ex:prop1' }]
            },
            additionJson: {
              '@id': 'ex:NodeShape_TargetObjectsOfSingle',
              [TARGET_CLASS]: [{ '@id': 'ex:MyClass' }]
            }
          }
        },
        {
          description: 'when starting with targetObjectsOf, change to a different targetObjectsOf',
          initialShape: TARGET_SHAPES.targetObjectsOf.SINGLE_VALUE,
          newOption: targetObjectsOfOption,
          newNodeShape: TARGET_SHAPES.targetObjectsOf.SINGLE_VALUE,
          expectedDiff: null
        },
        {
          description: 'when starting with targetObjectsOf, change to targetSubjectsOf',
          initialShape: TARGET_SHAPES.targetObjectsOf.SINGLE_VALUE,
          newOption: targetSubjectOfOption,
          newNodeShape: TARGET_SHAPES.targetSubjectsOf.SINGLE_VALUE,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:NodeShape_TargetObjectsOfSingle',
              [TARGET_OBJECTS_OF]: [{ '@id': 'ex:prop1' }]
            },
            additionJson: {
              '@id': 'ex:NodeShape_TargetObjectsOfSingle',
              [TARGET_SUBJECTS_OF]: [{ '@id': 'ex:propA' }]
            }
          }
        },
        {
          description: 'when starting with targetObjectsOf, change to implicit',
          initialShape: TARGET_SHAPES.targetObjectsOf.SINGLE_VALUE,
          newOption: targetImpicitOption,
          newNodeShape: TARGET_SHAPES.implicit.RDFS_CLASS_REFERENCE,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:NodeShape_TargetObjectsOfSingle',
              [TARGET_OBJECTS_OF]: [{ '@id': 'ex:prop1' }]
            },
            additionJson: {
              '@id': 'ex:NodeShape_TargetObjectsOfSingle',
              '@type': [
                `${OWL}Class`,
                `${RDFS}Class`
              ]
            }
          }
        },
        {
          description: 'when starting with targetObjectsOf, remove the target',
          initialShape: TARGET_SHAPES.targetObjectsOf.SINGLE_VALUE,
          newOption: undefined,
          newNodeShape: undefined,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:NodeShape_TargetObjectsOfSingle',
              [TARGET_OBJECTS_OF]: [{ '@id': 'ex:prop1' }]
            },
            additionJson: null
          }
        },
        {
          description: 'when starting with implicit, change to targetNode',
          initialShape: TARGET_SHAPES.implicit.RDFS_CLASS_REFERENCE,
          newOption: targetNodeOption,
          newNodeShape: TARGET_SHAPES.targetNode.IRI,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:MyRDFSClass',
              '@type': [`${RDFS}Class`]
            },
            additionJson: {
              '@id': 'ex:MyRDFSClass',
              [TARGET_NODE]: [{ '@id': 'ex:SpecificNode' }]
            }
          }
        },
        {
          description: 'when starting with implicit, change to targetClass',
          initialShape: TARGET_SHAPES.implicit.RDFS_CLASS_REFERENCE,
          newOption: targetClassOption,
          newNodeShape: TARGET_SHAPES.targetClass.IRI,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:MyRDFSClass',
              '@type': [`${RDFS}Class`]
            },
            additionJson: {
              '@id': 'ex:MyRDFSClass',
              [TARGET_CLASS]: [{ '@id': 'ex:MyClass' }]
            }
          }
        },
        {
          description: 'when starting with implicit, change to targetObjectsOf',
          initialShape: TARGET_SHAPES.implicit.RDFS_CLASS_REFERENCE,
          newOption: targetObjectsOfOption,
          newNodeShape: TARGET_SHAPES.targetObjectsOf.SINGLE_VALUE,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:MyRDFSClass',
              '@type': [`${RDFS}Class`]
            },
            additionJson: {
              '@id': 'ex:MyRDFSClass',
              [TARGET_OBJECTS_OF]: [{ '@id': 'ex:prop1' }]
            }
          }
        },
        {
          description: 'when starting with implicit, change to targetSubjectsOf',
          initialShape: TARGET_SHAPES.implicit.RDFS_CLASS_REFERENCE,
          newOption: targetSubjectOfOption,
          newNodeShape: TARGET_SHAPES.targetSubjectsOf.SINGLE_VALUE,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:MyRDFSClass',
              '@type': [`${RDFS}Class`]
            },
            additionJson: {
              '@id': 'ex:MyRDFSClass',
              [TARGET_SUBJECTS_OF]: [{ '@id': 'ex:propA' }]
            }
          }
        },
        {
          description: 'when starting with implicit, change to a different implicit form',
          initialShape: TARGET_SHAPES.implicit.RDFS_CLASS_REFERENCE,
          newOption: targetImpicitOption,
          newNodeShape: TARGET_SHAPES.implicit.RDFS_CLASS_REFERENCE,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:MyRDFSClass',
              '@type': [`${RDFS}Class`]
            },
            additionJson: {
              '@id': 'ex:MyRDFSClass',
              '@type': [
                `${RDFS}Class`,
                `${OWL}Class`
              ]
            }
          }
        },
        {
          description: 'when starting with implicit, remove the target',
          initialShape: TARGET_SHAPES.implicit.RDFS_CLASS_REFERENCE,
          newOption: undefined,
          newNodeShape: undefined,
          expectedDiff: {
            deletionJson: {
              '@id': 'ex:MyRDFSClass',
              '@type': [`${RDFS}Class`]
            },
            additionJson: null
          }
        }
      ];
      it('should have exactly 37 test cases', () => {
        expect(testCases.length).toEqual(37);
      });
      testCases.forEach((testCase: TargetChangeTestCase) => {
        it(testCase.description, () => {
          // Setup
          component.nodeShape = testCase.initialShape;
          component.targetOption = testCase.newOption;
          if (testCase.newNodeShape) {
            component['_updateForm'](testCase.newNodeShape);
          } else {
            component.clearFormValues();
          }
          component.updateInProgressCommit();
          // Assert
          if (testCase.expectedDiff) {
            if (testCase.expectedDiff.additionJson) {
              expect(stateService.addToAdditions).toHaveBeenCalledWith(versionedRdfRecord.recordId, testCase.expectedDiff.additionJson);
            } else {
              expect(stateService.addToAdditions).not.toHaveBeenCalled();
            }
            if (testCase.expectedDiff.deletionJson) {
              expect(stateService.addToDeletions).toHaveBeenCalledWith(versionedRdfRecord.recordId, testCase.expectedDiff.deletionJson);
            } else {
              expect(stateService.addToDeletions).not.toHaveBeenCalled();
            }
            expect(stateService.saveCurrentChanges).toHaveBeenCalledWith();
            if (testCase.expectedDiff.additionJson) {
              expect(stateService.updateNodeShapeSummaries).toHaveBeenCalledWith(testCase.initialShape, testCase.expectedDiff.additionJson);
            }
          } else {
            expect(stateService.saveCurrentChanges).not.toHaveBeenCalled();
          }
        });
      });
    });
    describe('createAdditionJsonLdObject', () => {
      it('should create an addition object for a single value target (targetNode)', () => {
        component.nodeShape = { '@id': 'node1' };
        component.targetOption = {
          ...targetNodeOption,
          isUserSelection: true
        };
        component.targetForm.controls['targetValue'].setValue('valueIRI');

        const additionJson = component.createAdditionJsonLdObject(component.nodeShape);
        expect(additionJson).toBeTruthy();
        expect(additionJson).toEqual({
          '@id': 'node1',
          '@type': [
            `${SH}NodeShape`,
          ],
          [TARGET_NODE]: [{ '@id': 'valueIRI' }]
        });
      });
      it('should create an addition object for a single value target (IMPLICIT_REFERENCE)', () => {
        component.nodeShape = { '@id': 'node1' };
        component.targetOption = {
          ...targetImpicitOption,
          isUserSelection: true
        };
        component.targetForm.controls['targetValue'].setValue('valueIRI');

        const additionJson = component.createAdditionJsonLdObject(component.nodeShape);
        expect(additionJson).toBeTruthy();
        expect(additionJson).toEqual({
          '@id': 'node1',
          '@type': [
            `${SH}NodeShape`,
            `${OWL}Class`,
            `${RDFS}Class`
          ]
        });
      });
    });
    describe('createDeletionJsonLdObject', () => {
      it('should create a deletion object for an IMPLICIT target', () => {
        component.nodeShape = TARGET_SHAPES.implicit.OWL_CLASS_REFERENCE;
        const deletion = component.createDeletionJsonLdObject(component.nodeShape);
        expect(deletion).toBeTruthy();
        expect(deletion['@id']).toBe('ex:MyOWLClass');
        expect(deletion['@type']).toEqual([`${OWL}Class`]);
      });
      it('should return null deletion when no nodeShape is provided', () => {
        expect(component.createDeletionJsonLdObject(null)).toBeNull();
      });
    });
    describe('handleTargetChange', () => {
      it('should not update if the same target option is selected', () => {
        component.targetOption = targetNodeOption;
        component['_updateControlStatesForTarget'] = jasmine.createSpy('_updateControlStatesForTarget');

        component.handleTargetChange(targetNodeOption);

        expect((component as any)._updateControlStatesForTarget).not.toHaveBeenCalled();
      });
      it('should update targetOption and control states when target changes', () => {
        const newTargetOption: TargetOption = {
          ...targetClassOption,
          isUserSelection: true
        };
        component['_updateControlStatesForTarget'] = jasmine.createSpy('_updateControlStatesForTarget');

        component.handleTargetChange(newTargetOption);

        expect(component.targetOption).toEqual(newTargetOption);
        expect((component as any)._updateControlStatesForTarget).toHaveBeenCalledWith(newTargetOption.iri);
      });
      it('should clear targetValue and targetValues if isUserSelection is true', () => {
        component.targetOption = {
          ...targetNodeOption,
          isUserSelection: true
        };
        component.targetForm.controls['targetValue'].setValue('oldValue');
        component.targetForm.controls['targetValues'].setValue(['oldValues']);

        const newTargetOption: TargetOption = {
          ...targetClassOption,
          isUserSelection: true
        };
        component['_updateControlStatesForTarget'] = jasmine.createSpy('_updateControlStatesForTarget');

        component.handleTargetChange(newTargetOption);

        expect(component.targetForm.value.targetValue).toBe('');
        expect(component.targetForm.value.targetValues).toEqual([]);
      });
    });
    describe('_updateControlStatesForTarget', () => {
      it('should enable targetValue and disable targetValues for TARGET_NODE', () => {
        component.editMode = 'ENABLED';
        component['_updateControlStatesForTarget'](TARGET_NODE);
        expect(component.targetForm.controls.targetValue.enabled).toBeTrue();
        expect(component.targetForm.controls.targetValues.disabled).toBeTrue();
      });

      it('should enable targetValues and disable targetValue for TARGET_OBJECTS_OF', () => {
        component.editMode = 'ENABLED';
        component['_updateControlStatesForTarget']('http://www.w3.org/ns/shacl#targetObjectsOf');
        expect(component.targetForm.controls.targetValue.disabled).toBeTrue();
        expect(component.targetForm.controls.targetValues.enabled).toBeTrue();
      });

      it('should disable both targetValue and targetValues for IMPLICIT_REFERENCE', () => {
        component.editMode = 'ENABLED';
        component['_updateControlStatesForTarget'](IMPLICIT_REFERENCE);
        expect(component.targetForm.controls.targetValue.disabled).toBeTrue();
        expect(component.targetForm.controls.targetValues.disabled).toBeTrue();
      });

      it('should disable all target controls when in DISABLED edit mode', () => {
        component.editMode = 'DISABLED';
        component['_updateControlStatesForTarget'](TARGET_NODE);
        expect(component.targetForm.controls.targetValue.disabled).toBeTrue();
        expect(component.targetForm.controls.targetValues.disabled).toBeTrue();
      });
    });
  });
  describe('contains the correct html', () => {
    it('should render the section header with info icon', () => {
      const header = element.query(By.css('.section-header'));
      expect(header).toBeTruthy();

      const infoIcon = header.query(By.css('mat-icon'));
      expect(infoIcon).toBeTruthy();
    });
    it('should show the edit button when not in edit mode and user can modify', () => {
      component.canModify = true;
      component.isImported = false;
      component.editMode = 'DISABLED';

      fixture.detectChanges();

      const editBtn = element.query(By.css('button.edit-button'));
      expect(editBtn).toBeTruthy();
    });
    it('should hide the edit button and show save button in edit mode', () => {
      component.editMode = 'ENABLED';
      fixture.detectChanges();

      const editBtn = element.query(By.css('button.edit-button'));
      const saveBtn = element.query(By.css('button.save-button'));

      expect(editBtn).toBeFalsy();
      expect(saveBtn).toBeTruthy();
    });
    it('should disable save button when form is invalid (target control is required and empty)', () => {
      component.onEdit();
      fixture.detectChanges();

      const saveBtn = element.query(By.css('button.save-button'));
      expect(saveBtn.nativeElement.disabled).toBeTrue();
    });
    it('should enable save button when form is valid', () => {
      component.editMode = 'ENABLED';
      component.targetForm.controls['target'].setValue(component.TARGET_NODE);
      component.targetForm.controls['targetValue'].setValue('http://example.org/SomeNode');
      fixture.detectChanges();

      const saveBtn = element.query(By.css('button.save-button'));
      expect(saveBtn.nativeElement.disabled).toBeFalse();
    });
    it('should render the <app-shacl-target-selector> component', () => {
      const selector = element.query(By.directive(ShaclTargetSelectorComponent));
      expect(selector).toBeTruthy();
    });
    describe('should conditionally render target value field for', () => {
      it('TARGET_NODE', () => {
        component.targetOption = targetNodeOption;
        fixture.detectChanges();

        const nodeInput = element.query(By.directive(ShaclTargetNodeInputComponent));
        expect(nodeInput).toBeTruthy();
      });
      it('TARGET_CLASS', () => {
        component.targetOption = targetClassOption;
        fixture.detectChanges();

        const classInput = element.query(By.directive(ShaclTargetClassInputComponent));
        expect(classInput).toBeTruthy();
      });
      it('TARGET_OBJECTS_OF', () => {
        component.targetOption = targetObjectsOfOption;
        fixture.detectChanges();

        const chipInput = element.query(By.directive(ShaclTargetChipInputComponent));
        expect(chipInput).toBeTruthy();
      });
      it('TARGET_SUBJECTS_OF', () => {
        component.targetOption = targetSubjectOfOption;
        fixture.detectChanges();

        const chipInput = element.query(By.directive(ShaclTargetChipInputComponent));
        expect(chipInput).toBeTruthy();
      });
      it('IMPLICIT', () => {
        component.targetOption = targetImpicitOption;
        fixture.detectChanges();
        const classInput = element.query(By.directive(ShaclTargetClassInputComponent));
        expect(classInput).toBeFalsy();
      });
    });
    it('should render the target info <mat-menu>', () => {
      const menuTriggerEl = element.query(By.directive(MatMenuTrigger));
      expect(menuTriggerEl).toBeTruthy();
      menuTriggerEl.nativeElement.click();
      fixture.detectChanges();

      const menuContent = document.querySelector('.mat-menu-content');
      expect(menuContent).toBeTruthy();
      expect(menuContent.textContent).toEqual(' See the Specification for more details about the Target options. ');
    });
    it('should disable form controls and hide edit/save buttons if isImported or !canModify', () => {
      component.isImported = true;
      component.canModify = false;
      component.ngOnChanges({
        nodeShape: {
          currentValue: TARGET_SHAPES.edgeCases.NO_TARGET,
          firstChange: false,
          isFirstChange: () => false,
          previousValue: null
        }
      });
      fixture.detectChanges();
      expect(component.editMode).toBe('DISABLED');
      const editBtn = element.query(By.css('button.edit-button'));
      const saveBtn = element.query(By.css('button.save-button'));
      expect(editBtn).toBeFalsy();
      expect(saveBtn).toBeFalsy();
    });
  });
});
