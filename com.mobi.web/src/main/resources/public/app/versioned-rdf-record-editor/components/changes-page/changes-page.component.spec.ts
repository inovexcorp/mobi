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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';
import { range, map } from 'lodash';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { HttpResponse } from '@angular/common/http';

import { cleanStylesFromDOM, MockVersionedRdfState } from '../../../../test/ts/Shared';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { Difference } from '../../../shared/models/difference.class';
import { CommitHistoryTableComponent } from '../../../shared/components/commitHistoryTable/commitHistoryTable.component';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CATALOG } from '../../../prefixes';
import { ToastService } from '../../../shared/services/toast.service';
import { CommitCompiledResourceComponent } from '../../../shared/components/commitCompiledResource/commitCompiledResource.component';
import { Commit } from '../../../shared/models/commit.interface';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { stateServiceToken } from '../../injection-token';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CommitChangesDisplayComponent } from '../../../shared/components/commitChangesDisplay/commitChangesDisplay.component';
import { ChangesPageComponent } from './changes-page.component';

describe('Changes Page component', function() {
  let component: ChangesPageComponent<VersionedRdfListItem>;
  let element: DebugElement;
  let fixture: ComponentFixture<ChangesPageComponent<VersionedRdfListItem>>;
  let stateStub: jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
  let toastStub: jasmine.SpyObj<ToastService>;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;

  const commitId = 'http://test.com#1234567890';
  const commit: Commit = {
    id: commitId,
    creator: undefined,
    date: '',
    auxiliary: '',
    base: '',
    branch: '',
    message: ''
  };
  const branch: JSONLDObject = {
    '@id': 'branchId',
    '@type': [`${CATALOG}Branch`]
  };
  const tag: JSONLDObject = {
    '@id': 'tagId',
    '@type': [`${CATALOG}Tag`]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FormsModule,
        MatExpansionModule,
        MatTooltipModule,
        MatSlideToggleModule
      ],
      declarations: [
        MockComponent(InfoMessageComponent),
        MockComponent(CommitHistoryTableComponent),
        MockComponent(CommitCompiledResourceComponent),
        MockComponent(CommitChangesDisplayComponent),
        ChangesPageComponent
      ],
      providers: [
        MockProvider(ToastService),
        MockProvider(CatalogManagerService),
        { provide: stateServiceToken, useClass: MockVersionedRdfState }
      ]
    }).compileComponents();

    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    catalogManagerStub.localCatalog = {'@id': 'catalog', '@type': []};
    catalogManagerStub.deleteInProgressCommit.and.returnValue(of(null));
    catalogManagerStub.getRecordBranches.and.returnValue(of(new HttpResponse<JSONLDObject[]>({ body: [branch]})));
    catalogManagerStub.getRecordVersions.and.returnValue(of(new HttpResponse<JSONLDObject[]>({ body: [tag]})));
    stateStub = TestBed.inject(stateServiceToken) as jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
    stateStub.type = 'type';
    stateStub.listItem = new VersionedRdfListItem();
    stateStub.listItem.versionedRdfRecord.recordId = 'record';
    stateStub.listItem.inProgressCommit = new Difference();
    stateStub.isCommittable.and.returnValue(false);
    stateStub.changeVersion.and.returnValue(of(null));
    fixture = TestBed.createComponent<ChangesPageComponent<VersionedRdfListItem>>(ChangesPageComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
  });

  afterEach(function() {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    stateStub = null;
    toastStub = null;
    catalogManagerStub = null;
  });

  describe('should update on changes correctly', function() {
    it('with the latest branches and tags', fakeAsync(function() {
      component.additions = [];
      component.deletions = [];
      component.ngOnChanges();
      tick();
      expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(stateStub.listItem.versionedRdfRecord.recordId, 'catalog', undefined, undefined, true);
      expect(catalogManagerStub.getRecordVersions).toHaveBeenCalledWith(stateStub.listItem.versionedRdfRecord.recordId, 'catalog', undefined, true);
      expect(component.branches).toEqual([branch]);
      expect(component.tags).toEqual([tag]);
    }));
    describe('when additions/deletions change', function() {
      it('if there are less than 100 changes', function() {
        component.additions = [{'@id': 'http://test.com#1', 'value': ['stuff']}];
        component.deletions = [{'@id': 'http://test.com#1', 'value': ['otherstuff']}, {'@id': 'http://test.com#2'}];
        component.ngOnChanges();
        expect(component.displayAdditions).toEqual(component.additions);
        expect(component.displayDeletions).toEqual(component.deletions);
      });
      it('if there are more than 100 changes', function() {
        const ids = range(102);
        component.additions = map(ids, id => ({'@id': '' + id}));
        component.deletions = [];
        component.ngOnChanges();
        expect(component.displayAdditions.length).toEqual(100);
        expect(component.displayDeletions).toEqual([]);
      });
    });
  });
  describe('controller methods', function() {
    describe('should remove in progress changes', function() {
      it('successfully', fakeAsync(function() {
        stateStub.removeChanges.and.returnValue(of(null));
        component.index = 100;
        component.removeChanges();
        tick();

        expect(stateStub.removeChanges).toHaveBeenCalledWith();
        expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
        expect(component.index).toEqual(0);
      }));
      it('unless an error occurs', fakeAsync(function() {
        stateStub.removeChanges.and.returnValue(throwError('Error'));
        component.index = 100;
        component.removeChanges();
        tick();

        expect(stateStub.removeChanges).toHaveBeenCalledWith();
        expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
        expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error removing changes: Error');
        expect(component.index).toEqual(100);
      }));
    });
    it('should set the display results', function() {
      component.totalIds = ['id1', 'id2', 'id3'];
      component.additions = [{'@id': 'id1'}, {'@id': 'id2'}];
      component.deletions = [{'@id': 'id2'}, {'@id': 'id3'}];
      expect(component.index).toEqual(0);
      expect(component.hasMoreResults).toBeFalse();
      expect(component.displayAdditions).toEqual([]);
      expect(component.displayDeletions).toEqual([]);

      component.setResults(1, 0);
      expect(component.index).toEqual(0);
      expect(component.hasMoreResults).toBeTrue();
      expect(component.displayAdditions).toEqual([{'@id': 'id1'}]);
      expect(component.displayDeletions).toEqual([]);

      component.setResults(1, 1);
      expect(component.index).toEqual(1);
      expect(component.hasMoreResults).toBeTrue();
      expect(component.displayAdditions).toEqual([{'@id': 'id1'}, {'@id': 'id2'}]);
      expect(component.displayDeletions).toEqual([{'@id': 'id2'}]);
    });
    it('should return the commit id', function() {
      expect(component.getCommitId(commit)).toEqual(commitId);
    });
    describe('should open a selected commit', function() {
      it('successfully', fakeAsync(function() {
        stateStub.changeVersion.and.returnValue(of(null));

        component.openCommit(commit);
        tick();
        expect(stateStub.changeVersion).toHaveBeenCalledWith('record', null, commitId, null, '1234567890', true, false, false);
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
      }));
      it('unless an error occurs', fakeAsync(function() {
        stateStub.changeVersion.and.returnValue(throwError('Error'));

        component.openCommit(commit);
        tick();
        expect(stateStub.changeVersion).toHaveBeenCalledWith('record', null, commitId, null, '1234567890', true, false, false);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error');
      }));
    });
  });
  describe('contains the correct html', function() {
    it('for wrapping containers', function() {
      expect(element.queryAll(By.css('div.changes-page')).length).toEqual(1);
    });
    it('when there are no changes', async function() {
      let infoMessage = element.queryAll(By.css('info-message'));
      expect(infoMessage.length).toEqual(0);

      stateStub.isCommittable.and.returnValue(false);
      fixture.detectChanges();
      await fixture.whenStable();
      infoMessage = element.queryAll(By.css('info-message'));

      expect(infoMessage.length).toBe(1);
      expect(infoMessage[0].nativeElement.innerText).toEqual('No Changes to Display');
      const buttons = element.queryAll(By.css('button'));
      expect(buttons.length).toEqual(0);

    });
    it('when there are changes', async function() {
      let infoMessage = element.queryAll(By.css('info-message'));
      expect(infoMessage.length).toEqual(0);

      stateStub.isCommittable.and.returnValue(true);
      fixture.detectChanges();
      await fixture.whenStable();
      infoMessage = element.queryAll(By.css('info-message'));

      expect(infoMessage.length).toBe(0);
      const buttons = element.queryAll(By.css('button'));
      expect(buttons.length).toEqual(1);
      expect(['Remove All Changes']).toContain(buttons[0].nativeElement.textContent.trim());
    });
  });
  it('should call removeChanges when the button is clicked', async function() {
    stateStub.isCommittable.and.returnValue(true);
    fixture.detectChanges();
    await fixture.whenStable();

    spyOn(component, 'removeChanges');
    const setButton = element.queryAll(By.css('button'))[0];
    setButton.triggerEventHandler('click', null);
    fixture.detectChanges();
    expect(component.removeChanges).toHaveBeenCalledWith();
  });
});
