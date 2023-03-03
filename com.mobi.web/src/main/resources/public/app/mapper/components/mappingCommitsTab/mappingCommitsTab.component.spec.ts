/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { CATALOG } from '../../../prefixes';
import { CommitHistoryTableComponent } from '../../../shared/components/commitHistoryTable/commitHistoryTable.component';
import { Difference } from '../../../shared/models/difference.class';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { UtilService } from '../../../shared/services/util.service';
import { MappingCommitsTabComponent } from './mappingCommitsTab.component';

describe('Mapping Commits Tab component', function() {
    let component: MappingCommitsTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<MappingCommitsTabComponent>;
    let mapperStateStub: jasmine.SpyObj<MapperStateService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    const error = 'Error Message';
    const commitId = 'commitId';
    const branchTitle = 'branchTitle';
    const branch = { '@id': 'branchId' };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                MappingCommitsTabComponent,
                MockComponent(CommitHistoryTableComponent)
            ],
            providers: [
                MockProvider(MapperStateService),
                MockProvider(UtilService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(MappingCommitsTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mapperStateStub = TestBed.inject(MapperStateService) as jasmine.SpyObj<MapperStateService>;
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;

        mapperStateStub.selected = {
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
        beforeEach(function() {
            utilStub.getPropertyId.and.returnValue(commitId);
            utilStub.getDctermsValue.and.returnValue(branchTitle);
        });
        it('if a new mapping is being created', function() {
            mapperStateStub.newMapping = true;
            component.ngOnInit();
            expect(mapperStateStub.setMasterBranch).not.toHaveBeenCalled();
            expect(utilStub.getPropertyId).not.toHaveBeenCalled();
            expect(utilStub.getDctermsValue).not.toHaveBeenCalled();
            expect(component.commitId).toEqual('');
            expect(component.branchTitle).toEqual('');
            expect(utilStub.createErrorToast).not.toHaveBeenCalled();
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
                expect(utilStub.getPropertyId).not.toHaveBeenCalled();
                expect(utilStub.getDctermsValue).not.toHaveBeenCalled();
                expect(component.commitId).toEqual('');
                expect(component.branchTitle).toEqual('');
                expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
            }));
            it('successfully', fakeAsync(function() {
                mapperStateStub.setMasterBranch.and.callFake(() => {
                    mapperStateStub.selected.branch = branch;
                    return of(null);
                });
                component.ngOnInit();
                tick();
                expect(mapperStateStub.setMasterBranch).toHaveBeenCalledWith();
                expect(utilStub.getPropertyId).toHaveBeenCalledWith(branch, CATALOG + 'head');
                expect(utilStub.getDctermsValue).toHaveBeenCalledWith(branch, 'title');
                expect(component.commitId).toEqual(commitId);
                expect(component.branchTitle).toEqual(branchTitle);
            }));
        });
        it('if the mapping master branch has been retrieved already', function() {
            mapperStateStub.selected.branch = {'@id': 'branchId'};
            mapperStateStub.newMapping = false;
            component.ngOnInit();
            expect(mapperStateStub.setMasterBranch).not.toHaveBeenCalled();
            expect(utilStub.getPropertyId).toHaveBeenCalledWith(branch, CATALOG + 'head');
            expect(utilStub.getDctermsValue).toHaveBeenCalledWith(branch, 'title');
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
        it('with a commit-history-table', function() {
            expect(element.queryAll(By.css('commit-history-table')).length).toEqual(1);
        });
    });
});
