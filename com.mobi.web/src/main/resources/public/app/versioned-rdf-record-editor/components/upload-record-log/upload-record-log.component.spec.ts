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
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';

import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { stateServiceToken } from '../../../shared/injection-token';
import { MockVersionedRdfState, cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { UploadItem } from '../../models/upload-item.interface';
import { UploadErrorsModalComponent } from '../upload-errors-modal/upload-errors-modal.component';
import { UploadRecordLogComponent } from './upload-record-log.component';

describe('UploadRecordLogComponent', () => {
  let component: UploadRecordLogComponent<VersionedRdfListItem>;
  let element: DebugElement;
  let fixture: ComponentFixture<UploadRecordLogComponent<VersionedRdfListItem>>;
  let stateStub: jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
  let matDialog: jasmine.SpyObj<MatDialog>;

  const completeStatusSubject = new BehaviorSubject<string>('complete');
  const errorStatusSubject = new BehaviorSubject<string>('error');
  const processingStatusSubject = new BehaviorSubject<string>('processing');
  const completeItem: UploadItem = {
    title: 'Complete Item',
    id: 'completeItem',
    status: completeStatusSubject.asObservable(),
    sub: undefined,
    error: undefined
  };
  const errorItem: UploadItem = {
    title: 'Error Item',
    id: 'errorItem',
    status: errorStatusSubject.asObservable(),
    sub: undefined,
    error: {
      error: 'Error',
      errorMessage: 'Error Message',
      errorDetails: []
    }
  };
  const errorDetailsItem: UploadItem = {
    title: 'Error Details Item',
    id: 'errorDetailsItem',
    status: errorStatusSubject.asObservable(),
    sub: undefined,
    error: {
      error: 'Error',
      errorMessage: 'Error Message',
      errorDetails: ['Details']
    }
  };
  const processingItem: UploadItem = {
    title: 'In Progress Item',
    id: 'inProgressItem',
    status: processingStatusSubject.asObservable(),
    sub: undefined,
    error: undefined
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatBadgeModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatProgressSpinnerModule,
      ],
      declarations: [ UploadRecordLogComponent ],
      providers: [
        { provide: stateServiceToken, useClass: MockVersionedRdfState },
        { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
            open: { afterClosed: () => of(true)}
          })
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UploadRecordLogComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    stateStub = TestBed.inject(stateServiceToken) as jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    stateStub.uploadList = [completeItem, errorItem, errorDetailsItem, processingItem];
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    matDialog = null;
    stateStub = null;
  });

  describe('controller methods', () => {
    it('should open the error modal', () => {
      component.showUploadErrorsOverlay(errorItem);
      expect(matDialog.open).toHaveBeenCalledWith(UploadErrorsModalComponent, { data: { item: errorItem } });
    });
    it('should calculate the number of errors', () => {
      expect(component.getNumErrors()).toEqual(2);
      stateStub.uploadList = [];
      expect(component.getNumErrors()).toEqual(0);
    });
  });
  describe('contains the correct html', () => {
    it('with a button', () => {
      expect(element.queryAll(By.css('button')).length).toEqual(1);
    });
    it('depending on whether there are any errors', () => {
      fixture.detectChanges();
      expect(element.queryAll(By.css('.mat-badge')).length).toEqual(1);
    });
    it('after clicking the button', () => {
      fixture.detectChanges();
      expect(element.queryAll(By.css('.mat-menu-panel')).length).toEqual(0);
      const button = element.query(By.css('button'));
      button.triggerEventHandler('click', null);
      fixture.detectChanges();
      expect(element.queryAll(By.css('.mat-menu-panel')).length).toEqual(1);
    });
    it('depending on the contents of the upload list', () => {
      fixture.detectChanges();
      const button = element.query(By.css('button'));
      button.triggerEventHandler('click', null);
      fixture.detectChanges();
      expect(element.queryAll(By.css('.uploaded-record')).length).toEqual(4);
      expect(element.queryAll(By.css('mat-spinner')).length).toEqual(1);
      expect(element.queryAll(By.css('.item-completed .text-success')).length).toEqual(1);
      expect(element.queryAll(By.css('.item-completed .text-danger')).length).toEqual(2);
      expect(element.queryAll(By.css('.item-details h4')).length).toEqual(4);
      expect(element.queryAll(By.css('.item-details p')).length).toEqual(2);
      expect(element.queryAll(By.css('.item-details a')).length).toEqual(1);
    });
  });
});
