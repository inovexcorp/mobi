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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule, FormBuilder } from '@angular/forms';

import { cloneDeep } from 'lodash';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { DCTERMS, RDFS, SH } from '../../../prefixes';
import { EXPLICIT_TARGETS, TARGET_CLASS } from '../../models/constants';
import { FormState, ShaclTargetComponent } from '../shacl-target/shacl-target.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { SettingManagerService } from '../../../shared/services/settingManager.service';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { StaticIriComponent } from '../../../shared/components/staticIri/staticIri.component';
import { VersionedRdfRecord } from '../../../shared/models/versionedRdfRecord.interface';
import { CreateNodeShapeModalComponent } from './create-node-shape-modal.component';

describe('CreateNodeShapeModalComponent', () => {
  let component: CreateNodeShapeModalComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<CreateNodeShapeModalComponent>;

  let camelCasePipe: CamelCasePipe;
  let matDialogRef: jasmine.SpyObj<MatDialogRef<CreateNodeShapeModalComponent>>;
  let stateServiceStub: jasmine.SpyObj<ShapesGraphStateService>;
  let settingManagerStub: jasmine.SpyObj<SettingManagerService>;

  const defaultPrefix = 'http://example.com/shapes#';
  const versionedRdfRecord: VersionedRdfRecord = {
    title: 'title',
    recordId: 'recordId',
    commitId: 'commitId',
    branchId: 'branchId',
    tagId: 'tagId'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        ReactiveFormsModule,
        FormsModule,
        MatInputModule,
        MatFormFieldModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule
      ],
      declarations: [
        CreateNodeShapeModalComponent,
        MockComponent(ShaclTargetComponent),
        MockComponent(StaticIriComponent)
      ],
      providers: [
        FormBuilder,
        CamelCasePipe,
        MockProvider(SettingManagerService),
        MockProvider(MatDialog),
        MockProvider(ShapesGraphStateService),
        { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close']) }
      ]
    }).compileComponents();

    matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<CreateNodeShapeModalComponent>>;
    stateServiceStub = TestBed.inject(ShapesGraphStateService) as jasmine.SpyObj<ShapesGraphStateService>;
    stateServiceStub.getDefaultPrefix.and.returnValue(defaultPrefix);
    stateServiceStub.getDuplicateValidator.and.returnValue(() => null);
    stateServiceStub.saveCurrentChanges.and.returnValue(of(null));
    stateServiceStub.listItem = new ShapesGraphListItem();
    stateServiceStub.listItem.versionedRdfRecord = versionedRdfRecord;
    camelCasePipe = TestBed.inject(CamelCasePipe);
    settingManagerStub = TestBed.inject(SettingManagerService) as jasmine.SpyObj<SettingManagerService>;
    settingManagerStub.getAnnotationPreference.and.returnValue(of('DC Terms'));

    fixture = TestBed.createComponent(CreateNodeShapeModalComponent);
    element = fixture.debugElement;
    component = fixture.componentInstance;
    component.canModify = true;
    component.isImported = false;
  });

  afterEach(function () {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    matDialogRef = null;
    stateServiceStub = null;
    settingManagerStub = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('component initialization', () => {
    it('should initialize the form with default values', () => {
      fixture.detectChanges();
      expect(component.createForm).toBeDefined();
      expect(component.createForm.controls.title.value).toBe('');
      expect(component.createForm.controls.description.value).toBe('');
      expect(component.createForm.controls.isTargetValid.value).toBe(false);
    });
    it('should set the default IRI on init', () => {
      fixture.detectChanges();
      expect(stateServiceStub.getDefaultPrefix).toHaveBeenCalledWith('', '');
      expect(component.createForm.controls.iri.value).toBe(defaultPrefix);
    });
    it('should initialize currentNodeShape on init', () => {
      fixture.detectChanges();
      expect(component.currentNodeShape).toEqual({
        '@id': defaultPrefix,
        '@type': [`${SH}NodeShape`],
        [`${DCTERMS}title`]: [{ '@value': '' }]
      });
    });
    it('should setup a subscription to title changes', fakeAsync(() => {
      fixture.detectChanges();
      const updateSpy = spyOn(component, 'updateIriBasedOnTitle');
      component.createForm.controls.title.setValue('New Title');
      tick(200); // over the debounceTime
      expect(updateSpy).toHaveBeenCalledWith('New Title');
    }));
    it('should initialize annotationType on init for DCTERMS', () => {
      fixture.detectChanges();
      expect(component.annotationType).toEqual(DCTERMS);
      expect(settingManagerStub.getAnnotationPreference).toHaveBeenCalledWith();
    });
    it('should initialize annotationType on init for RDFS', () => {
      settingManagerStub.getAnnotationPreference.and.returnValue(of('RDFS'));
      fixture.detectChanges();
      expect(component.annotationType).toEqual(RDFS);
      expect(settingManagerStub.getAnnotationPreference).toHaveBeenCalledWith();
    });
  });
  it('should complete the _destroySub$ subject on ngOnDestroy', () => {
    spyOn(component['_destroySub$'], 'next').and.callThrough();
    spyOn(component['_destroySub$'], 'complete').and.callThrough();

    component.ngOnDestroy();

    expect(component['_destroySub$'].next).toHaveBeenCalledWith();
    expect(component['_destroySub$'].complete).toHaveBeenCalledWith();
  });
  describe('controller method', () => {
    describe('generateNodeShape', () => {
      describe('when annotationType is DCTERMS', () => {
        it('should generate a basic Node Shape', () => {
          component.createForm.controls.iri.setValue('http://id.com#Shape1');
          component.createForm.controls.title.setValue('Shape 1');

          const nodeShape = component.generateNodeShape();
          expect(nodeShape).toEqual({
            '@id': 'http://id.com#Shape1',
            '@type': [`${SH}NodeShape`],
            [`${DCTERMS}title`]: [{ '@value': 'Shape 1' }]
          });
        });
        it('should include description if provided', () => {
          component.createForm.controls.iri.setValue('http://id.com#Shape1');
          component.createForm.controls.title.setValue('Shape 1');
          component.createForm.controls.description.setValue('A test description.');

          const nodeShape = component.generateNodeShape();

          expect(nodeShape).toEqual({
            '@id': 'http://id.com#Shape1',
            '@type': [`${SH}NodeShape`],
            [`${DCTERMS}title`]: [{ '@value': 'Shape 1' }],
            [`${DCTERMS}description`]: [{ '@value': 'A test description.' }]
          });
        });
        it('should merge with targetJsonLd if it exists', () => {
          component.createForm.controls.iri.setValue('http://id.com#Shape1');
          component.createForm.controls.title.setValue('Shape 1');
          component.targetJsonLd = {
            '@id': '', // Gets merged with value from form
            [TARGET_CLASS]: [{ '@id': 'ex:MyClass' }]
          };
          const nodeShape = component.generateNodeShape();

          expect(nodeShape).toEqual({
            '@id': 'http://id.com#Shape1',
            '@type': [`${SH}NodeShape`],
            [`${DCTERMS}title`]: [{ '@value': 'Shape 1' }],
            [TARGET_CLASS]: [{ '@id': 'ex:MyClass' }]
          });
        });
      });
      describe('when annotationType is RDFS', () => {
        beforeEach(() => {
          component.annotationType = RDFS;
        });
        it('should generate a basic Node Shape', () => {
          component.createForm.controls.iri.setValue('http://id.com#Shape1');
          component.createForm.controls.title.setValue('Shape 1');

          const nodeShape = component.generateNodeShape();
          expect(nodeShape).toEqual({
            '@id': 'http://id.com#Shape1',
            '@type': [`${SH}NodeShape`],
            [`${RDFS}label`]: [{ '@value': 'Shape 1' }]
          });
        });
        it('should include description if provided', () => {
          component.createForm.controls.iri.setValue('http://id.com#Shape1');
          component.createForm.controls.title.setValue('Shape 1');
          component.createForm.controls.description.setValue('A test description.');

          const nodeShape = component.generateNodeShape();

          expect(nodeShape).toEqual({
            '@id': 'http://id.com#Shape1',
            '@type': [`${SH}NodeShape`],
            [`${RDFS}label`]: [{ '@value': 'Shape 1' }],
            [`${RDFS}comment`]: [{ '@value': 'A test description.' }]
          });
        });
        it('should merge with targetJsonLd if it exists', () => {
          component.createForm.controls.iri.setValue('http://id.com#Shape1');
          component.createForm.controls.title.setValue('Shape 1');
          component.targetJsonLd = {
            '@id': '', // Gets merged with value from form
            [TARGET_CLASS]: [{ '@id': 'ex:MyClass' }]
          };
          const nodeShape = component.generateNodeShape();

          expect(nodeShape).toEqual({
            '@id': 'http://id.com#Shape1',
            '@type': [`${SH}NodeShape`],
            [`${RDFS}label`]: [{ '@value': 'Shape 1' }],
            [TARGET_CLASS]: [{ '@id': 'ex:MyClass' }]
          });
        });
      });
    });
    describe('save', () => {
      beforeEach(() => {
        component.createForm.controls.iri.setValue('http://example.com/shapes#ValidShape');
        component.createForm.controls.title.setValue('Valid Shape');
        component.createForm.controls.isTargetValid.setValue(true);
      });
      it('should not proceed if form is invalid', () => {
        component.createForm.controls.title.setValue(''); // make form invalid
        const markSpy = spyOn(component.createForm, 'markAllAsTouched');
        component.save();
        expect(markSpy).toHaveBeenCalledWith();
        expect(stateServiceStub.addEntity).not.toHaveBeenCalled();
      });
      it('should call state service methods on successful save', () => {
        const finalNodeShape = component.generateNodeShape();
        component.save();

        expect(stateServiceStub.addEntity).toHaveBeenCalledWith(finalNodeShape);
        expect(stateServiceStub.addToAdditions).toHaveBeenCalledWith(
          stateServiceStub.listItem.versionedRdfRecord.recordId,
          finalNodeShape
        );
        expect(stateServiceStub.saveCurrentChanges).toHaveBeenCalledWith();
      });
      it('should open snackbar and close dialog on successful save', () => {
        const finalNodeShape = component.generateNodeShape();
        component.save();

        expect(stateServiceStub.openSnackbar).toHaveBeenCalledWith(finalNodeShape['@id']);
        expect(matDialogRef.close).toHaveBeenCalledWith(finalNodeShape);
      });
    });
    describe('updateIriBasedOnTitle', () => {
      it('should update IRI based on title if user has not edited it', () => {
        fixture.detectChanges();
        component.iriHasChanged = false;
        const newTitle = 'My Test Shape';
        const expectedIri = defaultPrefix + camelCasePipe.transform(newTitle, 'class');

        component.updateIriBasedOnTitle(newTitle);

        expect(component.createForm.controls.iri.value).toBe(expectedIri);
      });
      it('should NOT update IRI based on title if user has edited it', () => {
        const initialIri = 'http://example.com/manual-iri';
        component.createForm.controls.iri.setValue(initialIri);
        component.iriHasChanged = true;

        component.updateIriBasedOnTitle('A New Title');

        expect(component.createForm.controls.iri.value).toBe(initialIri);
      });
      it('should handle onIriEdit correctly', () => {
        const iriBegin = 'http://new.com/';
        const iriThen = 'terms#';
        const iriEnd = 'ManualIri';

        component.onIriEdit(iriBegin, iriThen, iriEnd);

        expect(component.iriHasChanged).toBeTrue();
        expect(component.createForm.controls.iri.value).toBe('http://new.com/terms#ManualIri');
        expect(component.iriBegin).toBe(iriBegin);
        expect(component.iriThen).toBe(iriThen);
      });
    });
    describe('onTargetChanges (child component interaction)', () => {
      it('should update target state on onTargetChanges event', () => {
        const mockTargetValue: JSONLDObject = {
          '@id': '',
          [TARGET_CLASS]: [{ '@id': 'ex:MyClass' }]
        };
        const formState: FormState = {
          isValid: false,
          value: mockTargetValue
        };
        component.onTargetChanges(formState);

        expect(component.targetJsonLd).toEqual(mockTargetValue);
        expect(component.createForm.controls.isTargetValid.value).toBe(false);
      });
    });
    describe('mergeTargetJsonLd', () => {
      it('should merge each explicit target property from addition into a source that has no prior value for that property', () => {
        EXPLICIT_TARGETS.forEach(target => {
          const source: JSONLDObject = { '@id': 'shape1', '@type': ['sh:NodeShape'] };
          const addition: JSONLDObject = {
            '@id': 'ignore-this',
            [target]: [{ '@id': 'ex:Value1' }]
          };
          const result = component.mergeTargetJsonLd(source, addition);
          const expected: JSONLDObject = {
            '@id': 'shape1',
            '@type': ['sh:NodeShape'],
            [target]: [{ '@id': 'ex:Value1' }]
          };
          expect(result).withContext(`Failed for property: ${target}`).toEqual(expected);
        });
      });
      it('should create a union of target property arrays, removing duplicates by @id', () => {
        const source: JSONLDObject = {
          '@id': 'shape1',
          [TARGET_CLASS]: [{ '@id': 'ex:Class1' }, { '@id': 'ex:Class2' }]
        };
        const addition: JSONLDObject = {
          '@id': 'ignore',
          [TARGET_CLASS]: [{ '@id': 'ex:Class2' }, { '@id': 'ex:Class3', 'rdfs:label': 'A Label' }]
        };
        const result = component.mergeTargetJsonLd(source, addition);
        expect(result[TARGET_CLASS]).toEqual([
          { '@id': 'ex:Class1' },
          { '@id': 'ex:Class2' },
          { '@id': 'ex:Class3', 'rdfs:label': 'A Label' }
        ]);
      });
      it('should create a union of @type arrays, removing string duplicates', () => {
        const source: JSONLDObject = {
          '@id': 'shape1',
          '@type': ['sh:NodeShape', 'owl:Class']
        };
        const addition: JSONLDObject = {
          '@id': 'ignore',
          '@type': ['owl:Class', 'skos:Concept']
        };
        const result = component.mergeTargetJsonLd(source, addition);
        expect(result['@type']).toEqual(['sh:NodeShape', 'owl:Class', 'skos:Concept']);
      });
      it('should merge both @type and explicit target properties', () => {
        const source: JSONLDObject = {
          '@id': 'shape1',
          '@type': ['sh:NodeShape'],
          [TARGET_CLASS]: [{ '@id': 'ex:Class1' }]
        };
        const addition: JSONLDObject = {
          '@id': 'ignore',
          '@type': ['owl:Class'],
          [TARGET_CLASS]: [{ '@id': 'ex:Class2' }]
        };
        const result = component.mergeTargetJsonLd(source, addition);
        expect(result).toEqual({
          '@id': 'shape1',
          '@type': ['sh:NodeShape', 'owl:Class'],
          [TARGET_CLASS]: [{ '@id': 'ex:Class1' }, { '@id': 'ex:Class2' }]
        });
      });
      it('should not mutate the source object', () => {
        const source: JSONLDObject = {
          '@id': 'shape1',
          [TARGET_CLASS]: [{ '@id': 'ex:Class1' }]
        };
        const sourceCopy = cloneDeep(source);
        const addition: JSONLDObject = {
          '@id': 'ignore',
          [TARGET_CLASS]: [{ '@id': 'ex:Class2' }]
        };
        component.mergeTargetJsonLd(source, addition);
        expect(source).toEqual(sourceCopy);
      });
      it('should return a shallow copy of source if addition is empty', () => {
        const source: JSONLDObject = {
          '@id': 'shape1',
          '@type': ['sh:NodeShape'],
          [TARGET_CLASS]: [{ '@id': 'ex:Class1' }]
        };
        const addition: JSONLDObject = {
          '@id': 'ignore'
        };
        const result = component.mergeTargetJsonLd(source, addition);
        expect(result).toEqual(source);
      });
      it('should correctly build the object if source is empty', () => {
        const source: JSONLDObject = {
          '@id': 'shape1',
        };
        const addition: JSONLDObject = {
          '@id': 'ignore',
          '@type': ['sh:NodeShape'],
          [TARGET_CLASS]: [{ '@id': 'ex:Class1' }],
          'rdfs:comment': 'ignoreComment'
        };
        const result = component.mergeTargetJsonLd(source, addition);
        expect(result).toEqual({
          '@id': 'shape1',
          '@type': ['sh:NodeShape'],
          [TARGET_CLASS]: [{ '@id': 'ex:Class1' }]
        });
      });
      it('should ignore non-explicit properties in the addition object', () => {
        const source: JSONLDObject = { '@id': 'shape1' };
        const addition: JSONLDObject = {
          '@id': 'ignore',
          'sh:name': 'My Shape',
          'sh:description': 'A description',
          [TARGET_CLASS]: [{ '@id': 'ex:Class1' }]
        };
        const result = component.mergeTargetJsonLd(source, addition);
        expect(result).toEqual({
          '@id': 'shape1',
          [TARGET_CLASS]: [{ '@id': 'ex:Class1' }]
        });
        expect(result['sh:name']).toBeUndefined();
        expect(result['sh:description']).toBeUndefined();
      });
    });
  });
  describe('form validations', () => {
    it('should mark title as invalid if empty', () => {
      const titleControl = component.createForm.controls.title;
      titleControl.setValue('');
      expect(titleControl.hasError('required')).toBeTrue();
    });
    it('should mark iri as invalid if it does not match the pattern', () => {
      const iriControl = component.createForm.controls.iri;
      iriControl.setValue('not an iri');
      component.createForm.controls.iri.updateValueAndValidity();
      expect(iriControl.hasError('pattern')).toBeTrue();
    });
    it('should mark form as invalid if the child target component is invalid', () => {
      const targetControl = component.createForm.controls.isTargetValid;
      targetControl.setValue(false);
      fixture.detectChanges();
      expect(targetControl.hasError('required')).toBeTrue();
      expect(component.createForm.invalid).toBeTrue();
    });
    it('should be valid when all required fields are filled correctly', () => {
      component.createForm.controls.title.setValue('Valid Title');
      component.createForm.controls.iri.setValue('http://example.com/shapes#ValidTitle');
      component.createForm.controls.isTargetValid.setValue(true);
      expect(component.createForm.valid).toBeTrue();
    });
  });
  describe('contains the correct html and', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });
    it('should display the correct dialog title', () => {
      const titleElement = element.query(By.css('h1[mat-dialog-title]'));
      expect(titleElement.nativeElement.textContent).toBe('Create Node Shape');
    });
    it('should bind inputs correctly to the static-iri component', () => {
      component.isImported = false;
      component.canModify = true;
      fixture.detectChanges();

      const staticIriComponent = element.query(By.css('static-iri')).componentInstance;
      expect(staticIriComponent.stateService).toBe(component.stateService);
      expect(staticIriComponent.iri).toBe(component.currentNodeShape['@id']);
      expect(staticIriComponent.isImported).toBe(false);
      expect(staticIriComponent.canModify).toBe(true);
      expect(staticIriComponent.duplicateCheck).toBe(true);
    });
    it('should call onIriEdit when the static-iri component emits onEdit', () => {
      spyOn(component, 'onIriEdit');
      const staticIriElement = element.query(By.css('static-iri'));
      const eventPayload = {
        value: {
          iriBegin: 'http://example.com/',
          iriThen: 'shapes#',
          iriEnd: 'MyEditedShape'
        }
      };
      staticIriElement.triggerEventHandler('onEdit', eventPayload);

      expect(component.onIriEdit).toHaveBeenCalledWith(
        eventPayload.value.iriBegin,
        eventPayload.value.iriThen,
        eventPayload.value.iriEnd
      );
    });
    it('should bind the title input to the form control', () => {
      const titleInput = element.query(By.css('input[formControlName="title"]')).nativeElement;
      expect(titleInput).toBeTruthy();

      titleInput.value = 'A New Title';
      titleInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.createForm.controls.title.value).toBe('A New Title');
    });
    it('should show an error when title is required and touched', () => {
      const titleControl = component.createForm.controls.title;
      titleControl.markAsTouched();
      fixture.detectChanges();

      const errorElement = element.query(By.css('mat-error'));
      expect(errorElement.nativeElement.textContent.trim()).toBe('Title is required.');
    });
    it('should bind the description textarea to the form control', () => {
      const descTextarea = element.query(By.css('textarea[formControlName="description"]')).nativeElement;
      expect(descTextarea).toBeTruthy();

      descTextarea.value = 'A new description.';
      descTextarea.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.createForm.controls.description.value).toBe('A new description.');
    });
    it('should bind inputs correctly to the app-shacl-target component', () => {
      component.isImported = true;
      component.canModify = false;
      fixture.detectChanges();

      const shaclTargetComponent = element.query(By.css('app-shacl-target')).componentInstance;
      expect(shaclTargetComponent.versionedRdfRecord).toBe(component.stateService.listItem.versionedRdfRecord);
      expect(shaclTargetComponent.nodeShape).toBe(component.currentNodeShape);
      expect(shaclTargetComponent.isImported).toBe(true);
      expect(shaclTargetComponent.canModify).toBe(false);
    });
    it('should call onTargetChanges when app-shacl-target emits onValueChanges', () => {
      spyOn(component, 'onTargetChanges');
      const shaclTargetDE = element.query(By.css('app-shacl-target'));
      const formState: FormState = { isValid: true, value: { '@id': 'test' } };
      shaclTargetDE.triggerEventHandler('onValueChanges', formState);

      expect(component.onTargetChanges).toHaveBeenCalledWith(formState);
    });
    describe('dialog actions', () => {
      it('should call cancel when the button is clicked', function () {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', {});
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(false);
      });
      it('should have a submit button that is disabled when the form is invalid', () => {
        const submitButton = element.queryAll(By.css('button[type="submit"]'))[0];
        expect(submitButton.nativeElement.disabled).toBeTrue();
        component.createForm.controls.title.setValue('Valid Title');
        fixture.detectChanges();
        expect(submitButton.nativeElement.disabled).toBeTrue();
      });
      it('should call submit when the button is clicked', function () {
        spyOn(component, 'save');
        const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        submitButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.save).toHaveBeenCalledWith();
      });
    });
  });
});
