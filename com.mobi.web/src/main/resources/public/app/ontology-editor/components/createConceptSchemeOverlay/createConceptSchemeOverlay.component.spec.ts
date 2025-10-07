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
import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import {
  AdvancedLanguageSelectComponent
} from '../../../shared/components/advancedLanguageSelect/advancedLanguageSelect.component';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { CreateConceptSchemeOverlayComponent } from './createConceptSchemeOverlay.component';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { HierarchyNode } from '../../../shared/models/hierarchyNode.interface';
import { IriSelectOntologyComponent } from '../iriSelectOntology/iriSelectOntology.component';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { DCTERMS, OWL, RDFS, SKOS } from '../../../prefixes';
import { StaticIriComponent } from '../../../shared/components/staticIri/staticIri.component';
import { SettingManagerService } from '../../../shared/services/settingManager.service';

describe('Create Concept Scheme Overlay component', function () {
  let component: CreateConceptSchemeOverlayComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<CreateConceptSchemeOverlayComponent>;
  let matDialogRef: jasmine.SpyObj<MatDialogRef<CreateConceptSchemeOverlayComponent>>;
  let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
  let settingManagerStub: jasmine.SpyObj<SettingManagerService>;
  let camelCaseStub: jasmine.SpyObj<CamelCasePipe>;

  const namespace = 'http://test.com#';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        ReactiveFormsModule,
        FormsModule,
        MatInputModule,
        MatFormFieldModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatAutocompleteModule,
        MatOptionModule
      ],
      declarations: [
        CreateConceptSchemeOverlayComponent,
        MockComponent(ErrorDisplayComponent),
        MockComponent(StaticIriComponent),
        MockComponent(AdvancedLanguageSelectComponent),
        MockComponent(IriSelectOntologyComponent),
      ],
      providers: [
        MockProvider(OntologyStateService),
        MockProvider(SettingManagerService),
        {provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
        {provide: CamelCasePipe, useClass: MockPipe(CamelCasePipe)},
      ]
    });
  });

  beforeEach(function () {
    ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
    ontologyStateStub.getDuplicateValidator.and.returnValue(() => null);
    ontologyStateStub.getDefaultPrefix.and.returnValue(namespace);
    ontologyStateStub.saveCurrentChanges.and.returnValue(of(null));
    ontologyStateStub.listItem = new OntologyListItem();
    ontologyStateStub.listItem.concepts.iris = {'concept1': 'test'};

    settingManagerStub = TestBed.inject(SettingManagerService) as jasmine.SpyObj<SettingManagerService>;
    settingManagerStub.getAnnotationPreference.and.returnValue(of('DC Terms'));

    fixture = TestBed.createComponent(CreateConceptSchemeOverlayComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<CreateConceptSchemeOverlayComponent>>;
    camelCaseStub = TestBed.inject(CamelCasePipe) as jasmine.SpyObj<CamelCasePipe>;
  });

  afterEach(function () {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    matDialogRef = null;
    ontologyStateStub = null;
    settingManagerStub = null;
    camelCaseStub = null;
  });

  describe('initializes with the correct values', function () {
    it('when the default annotation preference is DC Terms', function () {
      component.ngOnInit();
      expect(ontologyStateStub.getDefaultPrefix).toHaveBeenCalledWith();
      expect(component.scheme['@id']).toEqual(namespace);
      expect(component.scheme['@type']).toEqual([`${OWL}NamedIndividual`, `${SKOS}ConceptScheme`]);
      expect(component.scheme[`${DCTERMS}title`]).toEqual([{'@value': ''}]);
      expect(component.scheme[`${SKOS}hasTopConcept`]).toBeUndefined();
      expect(component.hasConcepts).toBeTrue();

      component.createForm.controls.title.setValue('test1');
      fixture.detectChanges();
      expect(component.scheme[`${DCTERMS}title`]).toEqual([{'@value': 'test1'}]);
    });
    it('when the default annotation preference is RDFS', function () {
      settingManagerStub.getAnnotationPreference.and.returnValue(of('RDFS'));
      component.ngOnInit();
      expect(ontologyStateStub.getDefaultPrefix).toHaveBeenCalledWith();
      expect(component.scheme['@id']).toEqual(namespace);
      expect(component.scheme['@type']).toEqual([`${OWL}NamedIndividual`, `${SKOS}ConceptScheme`]);
      expect(component.scheme[`${RDFS}label`]).toEqual([{'@value': ''}]);
      expect(component.scheme[`${SKOS}hasTopConcept`]).toBeUndefined();
      expect(component.hasConcepts).toBeTrue();

      component.createForm.controls.title.setValue('test1');
      fixture.detectChanges();
      expect(component.scheme[`${RDFS}label`]).toEqual([{'@value': 'test1'}]);
    });

  });
  describe('contains the correct html', function () {
    it('for wrapping containers', function () {
      expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
      expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
      expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
    });
    ['static-iri', 'input[name="name"]', 'advanced-language-select'].forEach(test => {
      it('with a ' + test, function () {
        expect(element.queryAll(By.css(test)).length).toEqual(1);
      });
    });
    it('depending on whether there are concepts', function () {
      expect(element.queryAll(By.css('iri-select-ontology')).length).toEqual(0);

      component.hasConcepts = true;
      fixture.detectChanges();
      expect(element.queryAll(By.css('iri-select-ontology')).length).toEqual(1);
    });
    it('depending on the validity of the form', function () {
      const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
      expect(button).not.toBeNull();
      expect(button.properties['disabled']).toBeFalsy();

      component.createForm.controls.title.setValue(null);
      fixture.detectChanges();
      expect(button.properties['disabled']).toBeTruthy();

      component.createForm.controls.title.setValue('test');
      fixture.detectChanges();
      expect(button.properties['disabled']).toBeFalsy();
    });
    it('with buttons to cancel and submit', function () {
      const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
      expect(buttons.length).toEqual(2);
      expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
      expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
    });
  });
  describe('controller methods', function () {
    describe('should handle a iri change', function () {
      beforeEach(function () {
        component.createForm.controls.iri.setValue(namespace);
        camelCaseStub.transform.and.callFake(a => a);
      });
      it('if the iri has not been manually changed', function () {
        component.nameChanged('new');
        expect(component.createForm.controls.iri.value).toEqual(`${namespace}new`);
        expect(camelCaseStub.transform).toHaveBeenCalledWith('new', 'class');
      });
      it('unless the iri has been manually changed', function () {
        component.iriHasChanged = true;
        component.nameChanged('new');
        expect(component.createForm.controls.iri.value).toEqual(namespace);
        expect(camelCaseStub.transform).not.toHaveBeenCalled();
      });
    });
    it('should change the iri based on the params', function () {
      component.onEdit('begin', 'then', 'end');
      expect(component.scheme['@id']).toEqual('beginthenend');
      expect(component.iriHasChanged).toEqual(true);
      expect(ontologyStateStub.setCommonIriParts).toHaveBeenCalledWith('begin', 'then');
    });
    it('should create a concept scheme', fakeAsync(function () {
      const schemeIri = 'scheme-iri';
      spyOn(component, 'nameChanged');
      component.ngOnInit();
      const hierarchyNode: HierarchyNode = {
        entityIRI: schemeIri,
        hasChildren: false,
        indent: 1,
        path: ['path1', 'path2'],
        entityInfo: {label: 'label', names: ['name']},
        joinedPath: 'path1path2',
      };
      ontologyStateStub.flattenHierarchy.and.returnValue([hierarchyNode]);
      component.createForm.controls.iri.setValue(schemeIri);
      component.createForm.controls.title.setValue('label');
      component.createForm.controls.language.setValue('en');
      component.selectedConcepts = ['concept1', 'concept2'];
      component.create();
      component.selectedConcepts.forEach(concept => {
        expect(ontologyStateStub.addEntityToHierarchy).toHaveBeenCalledWith(ontologyStateStub.listItem.conceptSchemes, concept, schemeIri);
      });
      expect(ontologyStateStub.addEntity).toHaveBeenCalledWith(component.scheme);
      expect(ontologyStateStub.listItem.conceptSchemes.iris).toEqual({[schemeIri]: ontologyStateStub.listItem.ontologyId});
      expect(ontologyStateStub.listItem.conceptSchemes.flat).toEqual([hierarchyNode]);
      expect(ontologyStateStub.addIndividual).toHaveBeenCalledWith(component.scheme);
      expect(ontologyStateStub.saveCurrentChanges).toHaveBeenCalledWith();
      expect(matDialogRef.close).toHaveBeenCalledWith();
      expect(ontologyStateStub.openSnackbar).toHaveBeenCalledWith(schemeIri);
    }));
  });
  it('should call cancel when the button is clicked', function () {
    const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
    cancelButton.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
  });
  it('should call create when the button is clicked', function () {
    spyOn(component, 'create');
    const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
    submitButton.triggerEventHandler('click', null);
    fixture.detectChanges();
    expect(component.create).toHaveBeenCalledWith();
  });
});
