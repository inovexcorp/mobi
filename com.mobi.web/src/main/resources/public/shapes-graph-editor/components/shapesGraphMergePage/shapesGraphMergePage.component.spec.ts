/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import { forEach, get } from 'lodash';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { cleanStylesFromDOM, mockUtil, mockCatalogManager, mockPrefixes } from '../../../../../../test/ts/Shared';
import { BranchSelectComponent } from '../../../shared/components/branchSelect/branchSelect.component';
import { CheckboxComponent } from '../../../shared/components/checkbox/checkbox.component';
import { CommitDifferenceTabsetComponent } from '../../../shared/components/commitDifferenceTabset/commitDifferenceTabset.component';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { ResolveConflictsBlock } from '../../../shared/components/resolveConflictsBlock/resolveConflictsBlock.component';
import { Difference } from '../../../shared/models/difference.class';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { ShapesGraphMergePageComponent } from '../shapesGraphMergePage/shapesGraphMergePage.component';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';

describe('Shapes Graph Changes Page component', function() {
    let component: ShapesGraphMergePageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ShapesGraphMergePageComponent>;
    let shapesGraphStateStub;
    let utilStub;
    let catalogManagerStub;
    let prefixesStub;

    const branch1Iri = 'branch1';
    const branch2Iri = 'branch2';
    const branch1Commit = 'branch1Commit';
    const branch2Commit = 'branch2Commit';
    const branch1Title = 'branch1Title';
    const branch2Title = 'branch2Title';
    let branch1;
    let branch2;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ ],
            declarations: [
                ShapesGraphMergePageComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(CommitDifferenceTabsetComponent),
                MockComponent(BranchSelectComponent),
                MockComponent(CheckboxComponent),
                MockComponent(ResolveConflictsBlock)
            ],
            providers: [
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'catalogManagerService', useClass: mockCatalogManager },
                { provide: 'prefixes', useClass: mockPrefixes },
                MockProvider(ShapesGraphStateService)
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ShapesGraphMergePageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        shapesGraphStateStub = TestBed.get(ShapesGraphStateService);
        catalogManagerStub = TestBed.get('catalogManagerService');
        utilStub = TestBed.get('utilService');
        prefixesStub = TestBed.get('prefixes');

        utilStub.getPropertyId.and.callFake((entity, propertyIRI) => {
            return get(entity, '[\'' + propertyIRI + '\'][0][\'@id\']', '');
        });
        utilStub.getDctermsValue.and.callFake((obj, prop) => {
            return get(obj, "['" + prefixesStub.dcterms + prop + "'][0]['@value']", '');
        });

        branch1 = {
            '@id': branch1Iri,
            '@type': [],
            [prefixesStub.catalog + 'head']: [{'@id': branch1Commit}],
            [prefixesStub.dcterms + 'title']: [{'@value': branch1Title}]
        };
        branch2 = {
            '@id': branch2Iri,
            '@type': [],
            [prefixesStub.catalog + 'head']: [{'@id': branch2Commit}],
            [prefixesStub.dcterms + 'title']: [{'@value': branch2Title}]
        };

        catalogManagerStub.getRecordBranches.and.returnValue(Promise.resolve({data: [branch1, branch2]}));
        shapesGraphStateStub.listItem = new ShapesGraphListItem();
        shapesGraphStateStub.listItem.versionedRdfRecord = {
            recordId: 'record1',
            branchId: 'branch1',
            commitId: 'commit1',
            title: 'title'
        };
    });
    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        fixture = null;
        element = null;
        utilStub = null;
        catalogManagerStub = null;
        prefixesStub = null;
        shapesGraphStateStub = null;
    });

    describe('controller methods', function() {
        describe('ngOnInit retrieves record branches',function() {
            it('successfully', fakeAsync(function() {
                component.ngOnInit();
                tick();
                expect(component.branches).toEqual([branch2]);
                expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith('record1', 'catalog');
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless an error occurs', fakeAsync(function() {
                catalogManagerStub.getRecordBranches.and.returnValue(Promise.reject('Error'));
                component.ngOnInit();
                tick();
                expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith('record1', 'catalog');
                expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error');
            }));
        });
        it('ngOnDestroy resets merge', function() {
            shapesGraphStateStub.listItem.merge.difference = new Difference();
            shapesGraphStateStub.listItem.merge.startIndex = 100;
            component.ngOnDestroy();
            expect(shapesGraphStateStub.listItem.merge.difference).toBeUndefined();
            expect(shapesGraphStateStub.listItem.merge.startIndex).toEqual(0);
        });
        describe('should change target', function() {
            it('unless an error occurs', fakeAsync(function() {
                catalogManagerStub.getRecordBranch.and.returnValue(Promise.resolve(branch2));
                shapesGraphStateStub.getMergeDifferences.and.returnValue(Promise.reject('Error'));
                component.changeTarget(branch2);
                tick();

                expect(shapesGraphStateStub.listItem.merge.target).toEqual(branch2);
                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalled();
                expect(shapesGraphStateStub.getMergeDifferences).toHaveBeenCalledWith('commit1', branch2Commit, catalogManagerStub.differencePageSize, 0);
                expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error');
                expect(shapesGraphStateStub.listItem.merge.difference).toBeUndefined();
            }));
            it('successfully', fakeAsync(function() {
                catalogManagerStub.getRecordBranch.and.returnValue(Promise.resolve(branch2));
                component.changeTarget(branch2);
                tick();
                expect(shapesGraphStateStub.listItem.merge.target).toEqual(branch2);
                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalled();
                expect(shapesGraphStateStub.getMergeDifferences).toHaveBeenCalledWith('commit1', branch2Commit, catalogManagerStub.differencePageSize, 0);
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
        });
        describe('should retrieve more results', function() {
            it('successfully', fakeAsync(function() {
                shapesGraphStateStub.getMergeDifferences.and.returnValue(Promise.resolve());
                component.targetHeadCommitId = 'targetCommitId';
                component.retrieveMoreResults(100, 100);
                tick();
                expect(shapesGraphStateStub.getMergeDifferences).toHaveBeenCalledWith('commit1', 'targetCommitId', 100, 100);
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless an error occurs', fakeAsync(function() {
                shapesGraphStateStub.getMergeDifferences.and.returnValue(Promise.reject('Error'));
                component.targetHeadCommitId = 'targetCommitId';
                component.retrieveMoreResults(100, 100);
                tick();
                expect(shapesGraphStateStub.getMergeDifferences).toHaveBeenCalledWith('commit1', 'targetCommitId', 100, 100);
                expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error');
            }));
        });
        describe('should submit the merge', function() {
            it('unless attemptMerge rejects', fakeAsync(function() {
                shapesGraphStateStub.attemptMerge.and.returnValue(Promise.reject('Error message'));
                component.submit();
                tick();
                expect(shapesGraphStateStub.attemptMerge).toHaveBeenCalled();
                expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
                expect(shapesGraphStateStub.cancelMerge).not.toHaveBeenCalled();
                expect(component.error).toEqual('Error message');
            }));
            it('if attemptMerge resolves', fakeAsync(function() {
                shapesGraphStateStub.attemptMerge.and.returnValue(Promise.resolve());
                component.submit();
                tick();
                expect(shapesGraphStateStub.attemptMerge).toHaveBeenCalled();
                expect(utilStub.createSuccessToast).toHaveBeenCalled();
                expect(shapesGraphStateStub.cancelMerge).toHaveBeenCalled();
                expect(component.error).toEqual('');
            }));
        });
    });

    describe('contains the correct html', function() {
        describe('when there is not a conflict', function() {
            beforeEach(async function() {
                shapesGraphStateStub.listItem.merge.conflicts = [];
                fixture.detectChanges();
                await fixture.whenStable();
            });
            it('for wrapping containers', function() {
                expect(element.queryAll(By.css('.shapes-graph-merge-page')).length).toEqual(1);
                expect(element.queryAll(By.css('.merge-block')).length).toEqual(1);
                expect(element.queryAll(By.css('resolve-conflicts-block')).length).toEqual(0);
            });
            forEach(['branch-select', 'checkbox'], item => {
                it('with a ' + item, function() {
                    expect(element.queryAll(By.css(item)).length).toEqual(1);
                });
            });
            it('with a .merge-message', function() {
                expect(element.queryAll(By.css('.merge-message')).length).toEqual(1);
            });
            it('with buttons to submit and cancel', function() {
                const buttons = element.queryAll(By.css('.btn-container .btn'));
                expect(buttons.length).toEqual(2);
                expect(['Cancel', 'Submit'].indexOf(buttons[0].nativeElement.textContent) >= 0).toEqual(true);
                expect(['Cancel', 'Submit'].indexOf(buttons[1].nativeElement.textContent) >= 0).toEqual(true);
            });
            it('depending on whether there is an error', async function() {
                expect(element.queryAll(By.css('error-display')).length).toEqual(0);
                component.error = 'Error';
                fixture.detectChanges();
                await fixture.whenStable();
                expect(element.queryAll(By.css('error-display')).length).toEqual(1);
            });
            it('depending on whether the branch is the master branch', async function() {
                expect(element.queryAll(By.css('checkbox')).length).toEqual(1);

                component.branchTitle = 'MASTER';
                fixture.detectChanges();
                await fixture.whenStable();
                expect(element.queryAll(By.css('checkbox')).length).toEqual(0);
            });
            it('depending on whether a target has been selected', async function() {
                expect(element.queryAll(By.css('commit-difference-tabset')).length).toEqual(0);

                shapesGraphStateStub.listItem.merge.target = branch2;
                fixture.detectChanges();
                await fixture.whenStable();
                expect(element.queryAll(By.css('commit-difference-tabset')).length).toEqual(1);
            });
        });
        it('when there is a conflict', async function() {
            shapesGraphStateStub.listItem.merge.conflicts = [{
                iri: 'id',
                left: new Difference(),
                right: new Difference(),
                resolved: false
            }];
            fixture.detectChanges();
            await fixture.whenStable();
            expect(element.queryAll(By.css('.shapes-graph-merge-page')).length).toEqual(1);
            expect(element.queryAll(By.css('.merge-block')).length).toEqual(0);
            expect(element.queryAll(By.css('resolve-conflicts-block')).length).toEqual(1);
        });
    });
});