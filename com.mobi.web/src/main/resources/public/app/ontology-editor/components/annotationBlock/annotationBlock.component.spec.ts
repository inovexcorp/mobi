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
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { AnnotationOverlayComponent } from '../annotationOverlay/annotationOverlay.component';
import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { PropertyValuesComponent } from '../../../shared/components/propertyValues/propertyValues.component';
import { AnnotationBlockComponent } from './annotationBlock.component';

describe('Annotation Block component', function () {
  let component: AnnotationBlockComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<AnnotationBlockComponent>;
  let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
  let matDialog: jasmine.SpyObj<MatDialog>;
  let propertyManagerStub: jasmine.SpyObj<PropertyManagerService>;

  const entityIRI = 'entity';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
      ],
      declarations: [
        AnnotationBlockComponent,
        MockComponent(PropertyValuesComponent),
        MockComponent(ConfirmModalComponent),
        MockComponent(AnnotationOverlayComponent),
      ],
      providers: [
        MockProvider(OntologyStateService),
        MockProvider(PropertyManagerService),
        {
          provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
            open: { afterClosed: () => of(true) }
          })
        }
      ]
    });
  });

  beforeEach(function () {
    fixture = TestBed.createComponent(AnnotationBlockComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
    propertyManagerStub = TestBed.inject(PropertyManagerService) as jasmine.SpyObj<PropertyManagerService>;
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    ontologyStateStub.listItem = new OntologyListItem();
    ontologyStateStub.listItem.selected = {
      '@id': entityIRI,
      'prop1': [{ '@id': 'value1' }],
      'prop2': [{ '@value': 'value2', '@type': 'type', '@language': 'language' }]
    };
  });

  afterEach(function () {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    ontologyStateStub = null;
    propertyManagerStub = null;
    matDialog = null;
  });

  it('handles changes correctly', function () {
    spyOn(component, 'updatePropertiesFiltered');
    component.ngOnChanges();
    expect(component.updatePropertiesFiltered).toHaveBeenCalledWith();
  });
  describe('contains the correct html', function () {
    it('for wrapping containers', function () {
      expect(element.queryAll(By.css('.annotation-block')).length).toEqual(1);
      expect(element.queryAll(By.css('.section-header')).length).toEqual(1);
    });
    it('depending on how many annotations there are', function () {
      fixture.detectChanges();
      expect(element.queryAll(By.css('property-values')).length).toEqual(0);

      component.annotationsFiltered = ['prop1', 'prop2'];
      fixture.detectChanges();
      expect(element.queryAll(By.css('property-values')).length).toEqual(2);
    });
    it('depending on whether the selected entity is imported', function () {
      ontologyStateStub.listItem.selected.mobi = { imported: true };
      fixture.detectChanges();
      expect(element.queryAll(By.css('.section-header a')).length).toEqual(0);
    });
    it('depending on whether something is selected when the user can modify branch', function () {
      ontologyStateStub.canModify.and.returnValue(true);
      fixture.detectChanges();
      expect(element.queryAll(By.css('.section-header a')).length).toEqual(1);
      ontologyStateStub.listItem.selected = undefined;
      fixture.detectChanges();
      expect(element.queryAll(By.css('a.fa-plus')).length).toEqual(0);
    });
    it('if the user cannot modify branch', function () {
      ontologyStateStub.canModify.and.returnValue(false);
      fixture.detectChanges();
      expect(element.queryAll(By.css('.section-header a')).length).toEqual(0);
    });
  });
  describe('controller methods', function () {
    it('should update the filtered properties', function () {
      ontologyStateStub.getEntityName.and.callFake(a => a);
      ontologyStateStub.listItem.annotations.iris = { 'annotation1': '', 'default2': '', 'owl2': '', 'prop2': '' };
      propertyManagerStub.defaultAnnotations = ['default1', 'default2', 'prop1'];
      propertyManagerStub.owlAnnotations = ['owl1', 'owl2'];
      component.updatePropertiesFiltered();
      expect(component.annotations).toEqual(['annotation1', 'default2', 'owl2', 'prop2', 'default1', 'prop1', 'owl1']);
      expect(component.annotationsFiltered).toEqual(['prop1', 'prop2']);
    });
    it('should set the correct manager values when opening the Add Annotation Overlay', fakeAsync(function () {
      spyOn(component, 'updatePropertiesFiltered');
      component.openAddOverlay();
      tick();
      expect(matDialog.open).toHaveBeenCalledWith(AnnotationOverlayComponent, {
        data: {
          editing: false,
        }
      });
      expect(component.updatePropertiesFiltered).toHaveBeenCalledWith();
    }));
    it('should set the correct manager values when opening the Remove Annotation Overlay', fakeAsync(function () {
      spyOn(component, 'updatePropertiesFiltered');
      ontologyStateStub.removeProperty.and.returnValue(of(null));
      ontologyStateStub.getRemovePropOverlayMessage.and.returnValue('REMOVE');
      component.openRemoveOverlay({ iri: 'key', index: 1 });
      tick();
      expect(ontologyStateStub.getRemovePropOverlayMessage).toHaveBeenCalledWith('key', 1);
      expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, { data: { content: 'REMOVE' } });
      expect(ontologyStateStub.removeProperty).toHaveBeenCalledWith('key', 1);
      expect(component.updatePropertiesFiltered).toHaveBeenCalledWith();
      expect(ontologyStateStub.annotationModified).toHaveBeenCalledWith(entityIRI, 'key', null);
    }));
    it('should set the correct manager values when editing an annotation', fakeAsync(function () {
      spyOn(component, 'updatePropertiesFiltered');
      const annotationIRI = 'prop2';
      component.editClicked({ property: annotationIRI, index: 0 });
      tick();
      expect(matDialog.open).toHaveBeenCalledWith(AnnotationOverlayComponent, {
        data: {
          editing: true,
          annotation: annotationIRI,
          value: 'value2',
          index: 0,
          type: 'type',
          language: 'language',
          isIRIProperty: false
        }
      });
      expect(component.updatePropertiesFiltered).toHaveBeenCalledWith();
    }));
  });
});
