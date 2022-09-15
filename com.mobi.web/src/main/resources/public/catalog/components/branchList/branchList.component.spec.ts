/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { SharedModule } from '../../../shared/shared.module';
import { EntityPublisherComponent } from '../entityPublisher/entityPublisher.component';
import { CATALOG, DCTERMS } from '../../../prefixes';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { UtilService } from '../../../shared/services/util.service';
import { BranchListComponent } from './branchList.component';

describe('Branch List component', function() {
    let component: BranchListComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<BranchListComponent>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    const catalogId = 'catalogId';
    const recordId = 'recordId';
    const record: JSONLDObject = {'@id': recordId, '@type': []};
    const branches: JSONLDObject[] = [{'@id': '', '@type': []}];
    const totalSize = 10;
    const headers = {'x-total-count': '' + totalSize};

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                BranchListComponent,
                MockComponent(EntityPublisherComponent)
            ],
            providers: [
                MockProvider(CatalogManagerService),
                MockProvider(OntologyManagerService),
                // { provide: OntologyManagerService, useClass: mockOntologyManager },
                MockProvider(UtilService),
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(BranchListComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        catalogManagerStub = TestBed.get(CatalogManagerService);
        ontologyManagerStub = TestBed.get(OntologyManagerService);
        utilStub = TestBed.get(UtilService);

        utilStub.getPropertyId.and.callFake((obj, propId) => {
            if (propId === CATALOG + 'catalog') {
                return catalogId;
            }
            return '';
        });
        this.sortOption = {field: DCTERMS + 'modified', label: '', asc: false};

        catalogManagerStub.sortOptions = [this.sortOption];
        catalogManagerStub.isVersionedRDFRecord.and.returnValue(true);
        catalogManagerStub.getRecordBranches.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: branches, headers: new HttpHeaders(headers)})));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        ontologyManagerStub = null;
        utilStub = null;
    });

    describe('initializes correctly on record change', function() {
        beforeEach(function() {
            component.record = record;
        });
        it('with a catalogId', function() {
            expect(utilStub.getPropertyId).toHaveBeenCalledWith(record, CATALOG + 'catalog');
            expect(component.catalogId).toEqual(catalogId);
        });
        it('with branches', function() {
            expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId, jasmine.any(Object));
            expect(component.branches).toEqual(branches);
            expect(component.totalSize).toEqual(totalSize);
        });
    });
    describe('controller methods', function() {
        it('should load more branches', function() {
            spyOn(component, 'setBranches');
            component.loadMore();
            expect(component.limit).toEqual(20);
            expect(component.setBranches).toHaveBeenCalledWith();
        });
        describe('should set the branches', function() {
            beforeEach(function() {
                component.record = record;
                catalogManagerStub.getRecordBranches.calls.reset();
                component.branches = [];
                component.totalSize = 0;
            });
            describe('if the record is a VersionedRDFRecord', function() {
                it('successfully', fakeAsync(function() {
                    component.setBranches();
                    tick();
                    expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId, {pageIndex: 0, limit: component.limit, sortOption: this.sortOption});
                    expect(component.branches).toEqual(branches);
                    expect(component.totalSize).toEqual(totalSize);
                    expect(ontologyManagerStub.isOntologyRecord).toHaveBeenCalledWith(record);
                    expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                }));
                it('unless getRecordBranches rejects', fakeAsync(function() {
                    catalogManagerStub.getRecordBranches.and.returnValue(throwError('Error Message'));
                    component.setBranches();
                    tick();
                    expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId, {pageIndex: 0, limit: component.limit, sortOption: this.sortOption});
                    expect(component.branches).toEqual([]);
                    expect(component.totalSize).toEqual(0);
                    expect(ontologyManagerStub.isOntologyRecord).toHaveBeenCalledWith(record);
                    expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error Message');
                }));
            });
            it('unless the record is not a VersionedRDFRecord', fakeAsync(function() {
                catalogManagerStub.isVersionedRDFRecord.and.returnValue(false);
                component.setBranches();
                tick();
                expect(catalogManagerStub.getRecordBranches).not.toHaveBeenCalled();
                expect(component.branches).toEqual([]);
                expect(component.totalSize).toEqual(0);
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.branch-list')).length).toEqual(1);
        });
        it('depending on the number of branches', function() {
            expect(element.queryAll(By.css('.branches-list')).length).toEqual(0);
            expect(element.queryAll(By.css('.mat-expansion-panel')).length).toEqual(0);

            component.branches = branches;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.branches-list')).length).toEqual(1);
            expect(element.queryAll(By.css('.mat-expansion-panel')).length).toEqual(branches.length);
        });
        it('depending on whether there are more branches to load', function() {
            component.branches = [
                {'@id': '', '@type': []},
                {'@id': '', '@type': []},
            ];
            component.totalSize = 10;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.load-button')).length).toEqual(1);
            
            component.totalSize = component.branches.length;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.load-button')).length).toEqual(0);
        });
    });
    it('should load more branches when the button is clicked', function() {
        component.totalSize = 10;
        component.branches = branches;
        fixture.detectChanges();
        spyOn(component, 'loadMore');
        const button = element.queryAll(By.css('.load-button'))[0];
        button.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.loadMore).toHaveBeenCalledWith();
    });
});
