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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { CATALOG, DCTERMS } from '../../../prefixes';
import { CommitHistoryTableComponent } from '../../../shared/components/commitHistoryTable/commitHistoryTable.component';
import { Difference } from '../../../shared/models/difference.class';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { MappingCommitsTabComponent } from './mappingCommitsTab.component';

describe('Mapping Commits Tab component', function() {
    let component: MappingCommitsTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<MappingCommitsTabComponent>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let toastStub: jasmine.SpyObj<ToastService>;

    const error = 'Error Message';
    const commitId = 'commitId';
    const recordId = 'recordId';
    const branchTitle = 'branchTitle';
    const branch: JSONLDObject = {
      '@id': 'branchId',
      '@type': [`${CATALOG}Branch`],
      [`${DCTERMS}title`]: [{ '@value': branchTitle }],
      [`${CATALOG}head`]: [{ '@id': commitId }],
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                MappingCommitsTabComponent,
                MockComponent(CommitHistoryTableComponent),
                MockComponent(InfoMessageComponent)
            ],
            providers: [
                MockProvider(MapperStateService),
                MockProvider(ToastService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(MappingCommitsTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mapperStateStub = TestBed.inject(MapperStateService) as jasmine.SpyObj<MapperStateService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        mapperStateStub.newMapping = false;
        mapperStateStub.selected = {
            record: {
                id: recordId,
                title: 'recordTitle',
                modified: 'modified',
                description: 'description',
                keywords: ['keyword'],
                branch: branchTitle
            },
            mapping: undefined,
            difference: new Difference(),
            
        };
    });

    afterEach(function () {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        mapperStateStub = null;
    });

    describe('should initialize correctly', function() {
        it('if a new mapping is being created', function() {
            mapperStateStub.newMapping = true;
            component.ngOnInit();
            expect(mapperStateStub.setMasterBranch).not.toHaveBeenCalled();
            expect(component.commitId).toEqual('');
            expect(component.branchTitle).toEqual('');
            expect(toastStub.createErrorToast).not.toHaveBeenCalled();
        });
        describe('if the mapping master branch has not been set yet for an existing mapping', function() {
            beforeEach(function() {
                mapperStateStub.newMapping = false;
            });
            it('unless an error occurs', fakeAsync(function() {
                mapperStateStub.setMasterBranch.and.returnValue(throwError(error));
                component.ngOnInit();
                tick();
                expect(mapperStateStub.setMasterBranch).toHaveBeenCalledWith();
                expect(component.commitId).toEqual('');
                expect(component.branchTitle).toEqual('');
                expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
            }));
            it('successfully', fakeAsync(function() {
                mapperStateStub.setMasterBranch.and.callFake(() => {
                    mapperStateStub.selected.branch = branch;
                    return of(null);
                });
                component.ngOnInit();
                tick();
                expect(mapperStateStub.setMasterBranch).toHaveBeenCalledWith();
                expect(component.commitId).toEqual(commitId);
                expect(component.branchTitle).toEqual(branchTitle);
            }));
        });
        it('if the mapping master branch has been retrieved already', function() {
            mapperStateStub.selected.branch = branch;
            mapperStateStub.newMapping = false;
            component.ngOnInit();
            expect(mapperStateStub.setMasterBranch).not.toHaveBeenCalled();
            expect(component.commitId).toEqual(commitId);
            expect(component.branchTitle).toEqual(branchTitle);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.mapping-commits-tab')).length).toEqual(1);
            expect(element.queryAll(By.css('.row')).length).toEqual(1);
            expect(element.queryAll(By.css('.col-8')).length).toEqual(1);
        });
        it('with a commit-history-table and is new mapping', function() {
            mapperStateStub.newMapping = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('commit-history-table')).length).toEqual(0);
            expect(element.queryAll(By.css('info-message')).length).toEqual(1);
        });
        it('with a commit-history-table and is not new mapping', function() {
            mapperStateStub.newMapping = false;
            mapperStateStub.setMasterBranch.and.returnValue(of(null));
            mapperStateStub.selected.branch = {
                '@id': 'branchId',
                [`${CATALOG}head`]: { '@id': 'headId'},
                [`${DCTERMS}title`]: branchTitle
            };
            fixture.detectChanges();
            expect(element.queryAll(By.css('commit-history-table')).length).toEqual(1);
            expect(element.queryAll(By.css('info-message')).length).toEqual(0);
        });
    });
});
