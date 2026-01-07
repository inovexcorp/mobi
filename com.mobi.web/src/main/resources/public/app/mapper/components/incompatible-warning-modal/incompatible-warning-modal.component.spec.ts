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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MockComponent } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { DCTERMS, DELIM, RDFS } from '../../../prefixes';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { IncompatibleWarningModalComponent } from './incompatible-warning-modal.component';
import { Mapping } from '../../../shared/models/mapping.class';

describe('IncompatibleWarningModalComponent', () => {
  let element: DebugElement;
  let fixture: ComponentFixture<IncompatibleWarningModalComponent>;
  let matDialogRef: jasmine.SpyObj<MatDialogRef<IncompatibleWarningModalComponent>>;

  const incompatibleMappings: Mapping[] = [
    new Mapping([{
      '@id': 'http://mobi.com/mappings/UHTCTest/68e4e867-f899-4c48-85e9-263ed3342bfa',
      '@type': [`${DELIM}ClassMapping`],
      [`${DELIM}dataProperty`]: [
        {'@id': 'http://mobi.com/mappings/UHTCTest/bfedad28-c67f-47f1-8729-313bee8c783d'},
        {'@id': 'http://mobi.com/mappings/UHTCTest/23654137-54cb-4ffe-b11d-4de1c7ea3a22'},
        {'@id': 'http://mobi.com/mappings/UHTCTest/e417bbc6-efd0-4e2d-b1ab-b96dc772e0d4'}
      ],
      [`${DELIM}hasPrefix`]: [{'@value': 'http://mobi.com/data/uhtc/element/'}],
      [`${DELIM}localName`]: [{'@value': '${UUID}'}],
      [`${DELIM}mapsTo`]: [{'@id': 'http://matonto.org/ontologies/uhtc#Element'}],
      [`${DCTERMS}title`]: [{'@value': 'Element'}]
    }]),
    new Mapping([{
      '@id': 'http://mobi.com/mappings/UHTCTest/bfedad28-c67f-47f1-8729-313bee8c783d',
      '@type': [`${DELIM}PropertyMapping`, `${DELIM}DataMapping`],
      [`${DELIM}columnIndex`]: [{'@value': '1'}],
      [`${DELIM}datatypeSpec`]: [{'@id': 'http://www.w3.org/2001/XMLSchema#string'}],
      [`${DELIM}hasProperty`]: [{'@id': 'http://matonto.org/ontologies/uhtc#symbol'}],
      [`${DCTERMS}title`]: [{'@value': 'Symbol'}]
    }]),
    new Mapping([{
      '@id': 'http://mobi.com/mappings/UHTCTest/28ffeba5-e540-4d55-a477-0073ba8fbef5',
      '@type': [`${DELIM}PropertyMapping`, `${DELIM}ObjectMapping`],
      [`${DELIM}classMapping`]: [{ '@id': 'http://mobi.com/mappings/UHTCTest/68e4e867-f899-4c48-85e9-263ed3342bfa' }],
      [`${DELIM}hasProperty`]: [{'@id': 'http://matonto.org/ontologies/uhtc#element'}],
      [`${RDFS}label`]: [{'@value': 'Second Element'}]
    }])
  ];

  const mappingRecord = {
    '@id': 'https://mobi.com/records#73358dc3-6399-4ae2-8837-1782f91a70d0',
    'title': 'UHTC Test',
    'description': '',
    'keywords': [],
    'modified': '10/23/23, 10:34 AM',
    'branch': 'https://mobi.com/branches#f55dca80-9e4d-4024-9ea9-ce048cce5244'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatDialogModule,
        MatListModule,
        MatButtonModule
      ],
      declarations: [
        IncompatibleWarningModalComponent,
        MockComponent(InfoMessageComponent)
      ],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {'mappingRecord': mappingRecord, 'incompatibleMappings': incompatibleMappings}
        },
        {provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IncompatibleWarningModalComponent);
    element = fixture.debugElement;
    matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<IncompatibleWarningModalComponent>>;
  });

  afterEach(function () {
    cleanStylesFromDOM();
    element = null;
    fixture = null;
    matDialogRef = null;
  });

  describe('contains the correct html', () => {
    it('for wrapping containers', function () {
      expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
      expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
      expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
    });
    it('with buttons to cancel and submit', function () {
      const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
      expect(buttons.length).toEqual(2);
      expect(['Cancel', 'Continue']).toContain(buttons[0].nativeElement.textContent.trim());
      expect(['Cancel', 'Continue']).toContain(buttons[1].nativeElement.textContent.trim());
    });
    it('if there are  incompatible class & property mappings', () => {
      fixture.detectChanges();
      const mappings = element.queryAll(By.css('small'));
      expect(mappings.length).toEqual(3);
      expect(mappings[0].nativeElement.textContent.trim()).toContain('http://matonto.org/ontologies/uhtc#Element');
      expect(mappings[1].nativeElement.textContent.trim()).toContain('http://matonto.org/ontologies/uhtc#symbol');
      expect(mappings[2].nativeElement.textContent.trim()).toContain('http://matonto.org/ontologies/uhtc#element');
    });
  });
  it('should call cancel when the button is clicked', function () {
    const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
    cancelButton.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(matDialogRef.close).toHaveBeenCalledWith('closed');
  });
  it('should call confirm when the button is clicked', () => {
    const cancelButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
    cancelButton.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(matDialogRef.close).toHaveBeenCalledWith('edit');
  });
});
