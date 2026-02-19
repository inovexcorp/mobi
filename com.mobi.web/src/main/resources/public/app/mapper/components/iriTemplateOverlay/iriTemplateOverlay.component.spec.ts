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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { MockComponent, MockProvider } from 'ng-mocks';
import { cloneDeep } from 'lodash';

import {
  cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { DELIM } from '../../../prefixes';
import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { Difference } from '../../../shared/models/difference.class';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { Mapping } from '../../../shared/models/mapping.class';
import { MappingManagerService } from '../../../shared/services/mappingManager.service';
import { TriggerMentionInputComponent } from '../../../shared/components/triggerMentionInput/triggerMentionInput.component';
import { IriTemplateOverlayComponent } from './iriTemplateOverlay.component';

describe('IRI Template Overlay component', () => {
  let component: IriTemplateOverlayComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<IriTemplateOverlayComponent>;
  let matDialogRef: jasmine.SpyObj<MatDialogRef<IriTemplateOverlayComponent>>;
  let mapperStateStub: jasmine.SpyObj<MapperStateService>;
  let mappingManagerStub: jasmine.SpyObj<MappingManagerService>;
  let delimitedManagerStub: jasmine.SpyObj<DelimitedManagerService>;

  const begin = 'http://test';
  const then = '/';
  const localName = '${0}';
  const iriTemplate = begin + then + localName;
  const classMappingId = 'classMappingId';
  const classMapping: JSONLDObject = {
    '@id': classMappingId,
    [`${DELIM}iriTemplate`]: [{ '@value': iriTemplate }],
  };
  let mappingStub: jasmine.SpyObj<Mapping>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogModule
      ],
      declarations: [
        IriTemplateOverlayComponent,
        MockComponent(TriggerMentionInputComponent)
      ],
      providers: [
        MockProvider(MapperStateService),
        MockProvider(MappingManagerService),
        MockProvider(DelimitedManagerService),
        { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
      ]
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IriTemplateOverlayComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    mapperStateStub = TestBed.inject(MapperStateService) as jasmine.SpyObj<MapperStateService>;
    mappingManagerStub = TestBed.inject(MappingManagerService) as jasmine.SpyObj<MappingManagerService>;
    delimitedManagerStub = TestBed.inject(DelimitedManagerService) as jasmine.SpyObj<DelimitedManagerService>;
    matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<IriTemplateOverlayComponent>>;

    mapperStateStub.selectedClassMappingId = 'classMapping';
    mappingStub = jasmine.createSpyObj('Mapping', [
      'getClassMapping'
    ]);
    mappingStub.getClassMapping.and.returnValue(classMapping);
    mapperStateStub.selectedClassMappingId = classMappingId;
    mapperStateStub.selected = {
      difference: new Difference(),
      mapping: mappingStub
    };
    delimitedManagerStub.dataRows = [['Header'], ['Value1']];
    delimitedManagerStub.containsHeaders = true;
    delimitedManagerStub.getHeader.and.callFake((idx: number) => idx === 0 ? 'Header' : `Column ${idx}`);
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    matDialogRef = null;
    mapperStateStub = null;
    mappingManagerStub = null;
    delimitedManagerStub = null;
    mappingStub = null;
  });

  describe('should initialize with the correct values', () => {
    it('populating things properly', () => {
      spyOn(component, 'fillTemplate').and.callThrough();
      spyOn(component, 'buildColumnSuggestions').and.callThrough();
      component.ngOnInit();
      expect(mappingStub.getClassMapping).toHaveBeenCalledWith(classMappingId);
      expect(component.classMapping).toEqual(classMapping);
      expect(component.buildColumnSuggestions).toHaveBeenCalledWith();
      expect(component.fillTemplate).toHaveBeenCalledWith();
      expect(component.columnSuggestions.length).toEqual(2); // UUID + Header column
      expect(component.columnSuggestions[0].displayText).toEqual('UUID');
      expect(component.columnSuggestions[1].displayText).toEqual('Header');
    });
  });
  describe('controller methods', () => {
    describe('buildColumnSuggestions', () => {
      it('should build suggestions from delimited data', () => {
        component.buildColumnSuggestions();
        expect(component.columnSuggestions.length).toBe(2);
        expect(component.columnSuggestions[0]).toEqual({
          displayText: 'UUID',
          insertValue: 'UUID',
          category: 'Special',
          metadata: { preview: '(Auto-generated)' }
        });
        expect(component.columnSuggestions[1].displayText).toBe('Header');
        expect(component.columnSuggestions[1].insertValue).toBe('Header');
        expect(component.columnSuggestions[1].metadata.preview).toBe('Value1');
      });
    });
    describe('fillTemplate', () => {
      beforeEach(() => {
        component.buildColumnSuggestions();
      });
      it('should fill template from iriTemplate property with column name', () => {
        component.classMapping = classMapping;
        component.fillTemplate();
        // ${0} should be converted to ${Header}
        expect(component.templateControl.value).toEqual('http://test/${Header}');
      });
      it('should handle legacy hasPrefix and localName properties', () => {
        const legacyClassMapping = cloneDeep(classMapping);
        delete legacyClassMapping[`${DELIM}iriTemplate`];
        legacyClassMapping[`${DELIM}hasPrefix`] = [{ '@value': begin + then }];
        legacyClassMapping[`${DELIM}localName`] = [{ '@value': localName }];
        component.classMapping = legacyClassMapping;
        component.fillTemplate();
        expect(component.templateControl.value).toEqual('http://test/${Header}');
      });
      it('should handle missing column reference gracefully', () => {
        const classMappingClone = cloneDeep(classMapping);
        classMappingClone[`${DELIM}iriTemplate`] = [{ '@value': begin + then + '${5}' }];
        component.classMapping = classMappingClone;
        component.fillTemplate();
        // Non-existent column index should remain as-is
        expect(component.templateControl.value).toEqual('http://test/${5}');
      });
    });
    describe('validatePattern', () => {
      beforeEach(() => {
        component.buildColumnSuggestions();
      });
      it('should validate UUID pattern', () => {
        const result = component.validatePattern('UUID');
        expect(result.isValid).toBeTrue();
        expect(result.resolvedName).toBe('UUID');
      });
      it('should validate numeric column index', () => {
        const result = component.validatePattern('0');
        expect(result.isValid).toBeTrue();
        expect(result.resolvedName).toBe('Header');
        expect(result.resolvedValue).toBe('Value1');
      });
      it('should validate column name', () => {
        const result = component.validatePattern('Header');
        expect(result.isValid).toBeTrue();
        expect(result.resolvedName).toBe('Header');
      });
      it('should invalidate non-existent column index', () => {
        const result = component.validatePattern('99');
        expect(result.isValid).toBeFalse();
      });
      it('should invalidate non-existent column name', () => {
        const result = component.validatePattern('NonExistent');
        expect(result.isValid).toBeFalse();
      });
    });
    describe('convertIndicesToNames', () => {
      beforeEach(() => {
        component.buildColumnSuggestions();
      });
      it('should convert column indices to names', () => {
        const result = component.convertIndicesToNames('http://test/${0}/${UUID}');
        expect(result).toBe('http://test/${Header}/${UUID}');
      });
      it('should not modify UUID patterns', () => {
        const result = component.convertIndicesToNames('http://test/${UUID}');
        expect(result).toBe('http://test/${UUID}');
      });
    });
    describe('convertNamesToIndices', () => {
      beforeEach(() => {
        component.buildColumnSuggestions();
      });
      it('should convert column names to indices', () => {
        const result = component.convertNamesToIndices('http://test/${Header}/${UUID}');
        expect(result).toBe('http://test/${0}/${UUID}');
      });
      it('should not modify UUID patterns', () => {
        const result = component.convertNamesToIndices('http://test/${UUID}');
        expect(result).toBe('http://test/${UUID}');
      });
      it('should not modify numeric indices', () => {
        const result = component.convertNamesToIndices('http://test/${0}');
        expect(result).toBe('http://test/${0}');
      });
    });
    describe('updateExampleIri', () => {
      beforeEach(() => {
        component.buildColumnSuggestions();
      });
      it('should resolve template with actual values', () => {
        component.templateControl.setValue('http://test/${Header}');
        component.updateExampleIri();
        expect(component.exampleIri).toBe('http://test/Value1');
      });
      it('should resolve UUID with placeholder', () => {
        component.templateControl.setValue('http://test/${UUID}');
        component.updateExampleIri();
        expect(component.exampleIri).toBe('http://test/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
      });
    });
    describe('updateValidity', () => {
      beforeEach(() => {
        component.buildColumnSuggestions();
      });
      it('should be valid for proper IRI with valid pattern', () => {
        component.templateControl.setValue('http://test/${Header}');
        component.updateValidity();
        expect(component.isValid).toBeTrue();
      });
      it('should be invalid for unclosed pattern', () => {
        component.templateControl.setValue('http://test/${Header');
        component.updateValidity();
        expect(component.isValid).toBeFalse();
      });
      it('should be invalid for non-existent column', () => {
        component.templateControl.setValue('http://test/${NonExistent}');
        component.updateValidity();
        expect(component.isValid).toBeFalse();
      });
      it('should be invalid for malformed IRI', () => {
        component.templateControl.setValue('not-a-valid-iri/${Header}');
        component.updateValidity();
        expect(component.isValid).toBeFalse();
      });
      it('should be invalid for empty template', () => {
        component.templateControl.setValue('');
        component.updateValidity();
        expect(component.isValid).toBeFalse();
      });
    });
    describe('set', () => {
      beforeEach(() => {
        component.buildColumnSuggestions();
        component.templateControl.setValue('http://new/${Header}/${UUID}');
      });
      it('should convert names to indices and save', () => {
        component.classMapping = classMapping;
        component.set();
        expect(mappingManagerStub.editIriTemplate).toHaveBeenCalledWith(
          mappingStub,
          classMappingId,
          'http://new/${0}/${UUID}',
        );
        expect(mapperStateStub.changeProp).toHaveBeenCalledWith(
          classMappingId,
          `${DELIM}iriTemplate`,
          'http://new/${0}/${UUID}',
          iriTemplate
        );
        expect(mapperStateStub.changeProp).toHaveBeenCalledWith(
          classMappingId,
          `${DELIM}hasPrefix`,
          '',
          ''
        );
        expect(mapperStateStub.changeProp).toHaveBeenCalledWith(
          classMappingId,
          `${DELIM}localName`,
          '',
          ''
        );
        expect(matDialogRef.close).toHaveBeenCalledWith();
      });
      it('should clear legacy properties when saving', () => {
        const legacyClassMapping = cloneDeep(classMapping);
        delete legacyClassMapping[`${DELIM}iriTemplate`];
        legacyClassMapping[`${DELIM}hasPrefix`] = [{ '@value': 'http://old/' }];
        legacyClassMapping[`${DELIM}localName`] = [{ '@value': '${0}' }];
        component.classMapping = legacyClassMapping;
        component.set();
        expect(mapperStateStub.changeProp).toHaveBeenCalledWith(
          classMappingId,
          `${DELIM}hasPrefix`,
          '',
          'http://old/'
        );
        expect(mapperStateStub.changeProp).toHaveBeenCalledWith(
          classMappingId,
          `${DELIM}localName`,
          '',
          '${0}'
        );
      });
    });
  });
  describe('contains the correct html', () => {
    beforeEach(() => {
      component.ngOnInit();
      fixture.detectChanges();
    });
    it('for wrapping containers', () => {
      expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
      expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
      expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
    });
    it('with the trigger mention input component', () => {
      expect(element.queryAll(By.css('app-trigger-mention-input')).length).toEqual(1);
    });
    it('with help text', () => {
      expect(element.queryAll(By.css('.help-text')).length).toEqual(1);
    });
    it('with example IRI display when template is set', () => {
      component.exampleIri = 'http://test/Value1';
      fixture.detectChanges();
      expect(element.queryAll(By.css('.example-iri')).length).toEqual(1);
    });
    it('depending on the validity of the form', () => {
      const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
      expect(button).not.toBeNull();

      component.isValid = true;
      fixture.detectChanges();
      expect(button.properties['disabled']).toBeFalsy();

      component.isValid = false;
      fixture.detectChanges();
      expect(button.properties['disabled']).toBeTruthy();
    });
    it('with buttons to cancel and submit', () => {
      const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
      expect(buttons.length).toEqual(2);
      expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
      expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
    });
  });
  it('should call cancel when the button is clicked', () => {
    component.ngOnInit();
    fixture.detectChanges();
    const button = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
    button.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
  });
  it('should call set when the button is clicked', () => {
    component.ngOnInit();
    fixture.detectChanges();
    spyOn(component, 'set');
    const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
    button.triggerEventHandler('click', null);
    fixture.detectChanges();
    expect(component.set).toHaveBeenCalledWith();
  });
});
