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
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { find, get } from 'lodash';
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';

import {
    cleanStylesFromDOM,
    mockCatalogManager,
    mockModal,
    mockPrefixes,
    mockUtil
} from '../../../../../../test/ts/Shared';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { EditorBranchSelectComponent } from './editorBranchSelect.component';

interface Option {
    title: string,
    branchIri?: string,
    tagIri?: string,
    commitIri?: string,
    description?: string
}

describe('Editor Branch Select component', function() {
    let component: EditorBranchSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<EditorBranchSelectComponent>;
    let shapesGraphStateStub;
    let catalogManagerStub;
    let modalStub;
    let prefixesStub;
    let utilStub;

    let branch1Rdf: JSONLDObject;
    let branch2Rdf: JSONLDObject;
    let tag1Rdf: JSONLDObject;

    const branch1: Option = {
        branchIri: 'urn:branch1',
        commitIri: 'urn:branch1Commit',
        title: 'Branch with a description',
        description: 'This is a description'
    };
    const branch2: Option = {
        branchIri: 'urn:branch2',
        commitIri: 'urn:branch2Commit',
        title: 'Totally new branch',
        description: ''
    };
    const tag1: Option = {
        tagIri: 'urn:tag1',
        commitIri: 'urn:branch2Commit',
        title: 'Totally Cool Tag',
        description: ''
    };
    const commit1: Option = {
        tagIri: '',
        commitIri: 'urn:commit',
        title: 'Commit',
        description: ''
    };
    const branchEvent = {
        option: {
            value: branch1
        }
    } as MatAutocompleteSelectedEvent;
    const tagEvent = {
        option: {
            value: tag1
        }
    } as MatAutocompleteSelectedEvent;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatSelectModule,
                MatButtonModule,
                MatIconModule,
                MatAutocompleteModule
            ],
            declarations: [
                EditorBranchSelectComponent
            ],
            providers: [
                MockProvider(ShapesGraphStateService),
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'prefixes', useClass: mockPrefixes },
                { provide: 'catalogManagerService', useClass: mockCatalogManager },
                { provide: 'modalService', useClass: mockModal }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(EditorBranchSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        modalStub = TestBed.get('modalService');
        shapesGraphStateStub = TestBed.get(ShapesGraphStateService);
        shapesGraphStateStub.listItem = new ShapesGraphListItem();

        prefixesStub = TestBed.get('prefixes');
        branch1Rdf = {
            '@id': branch1.branchIri,
            '@type': [],
            [prefixesStub.catalog + 'head']: [{'@id': branch1.commitIri}],
            [prefixesStub.dcterms + 'title']: [{'@value': branch1.title}],
            [prefixesStub.dcterms + 'description']: [{'@value': branch1.description}]
        };
        branch2Rdf = {
            '@id': branch2.branchIri,
            '@type': [],
            [prefixesStub.catalog + 'head']: [{'@id': branch2.commitIri}],
            [prefixesStub.dcterms + 'title']: [{'@value': branch2.title}]
        };
        tag1Rdf = {
            '@id': tag1.tagIri,
            '@type': [],
            [prefixesStub.catalog + 'commit']: [{'@id': tag1.commitIri}],
            [prefixesStub.dcterms + 'title']: [{'@value': tag1.title}],
            [prefixesStub.dcterms + 'description']: [{'@value': tag1.description}]
        };

        catalogManagerStub = TestBed.get('catalogManagerService');
        catalogManagerStub.localCatalog = {'@id': 'catalog'};
        catalogManagerStub.getRecordBranches.and.returnValue(Promise.resolve({data: [branch1Rdf, branch2Rdf]}));
        catalogManagerStub.getRecordVersions.and.returnValue(Promise.resolve({data: [tag1Rdf]}));
        catalogManagerStub.getRecordBranch.and.returnValue(Promise.resolve({
            '@id': branch1.branchIri,
            [prefixesStub.catalog + 'head']: [{'@id': branch1.commitIri}]
        }));
        catalogManagerStub.getCommit.and.returnValue(Promise.resolve({
            '@id': tag1.commitIri
        }));

        utilStub = TestBed.get('utilService');
        utilStub.getPropertyValue.and.callFake((entity, propertyIRI) => {
            return get(entity, '[\'' + propertyIRI + '\'][0][\'@value\']', '');
        });
        utilStub.getPropertyId.and.callFake((entity, propertyIRI) => {
            return get(entity, '[\'' + propertyIRI + '\'][0][\'@id\']', '');
        });
        utilStub.getDctermsValue.and.callFake((obj, prop) => {
            return get(obj, "['" + prefixesStub.dcterms + prop + "'][0]['@value']", '');
        });
        utilStub.condenseCommitId.and.returnValue(commit1.title);

        component.recordIri = 'recordId';
        component.branchTitle = 'MASTER';
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        modalStub = null;
        shapesGraphStateStub = null;
        catalogManagerStub = null;
        prefixesStub = null;

    });

    describe('should initialize with the correct data for', function() {
        it('recordIri', function() {
            expect(component.recordIri).toEqual('recordId');
        });
        it('branchTitle', function() {
            expect(component.branchTitle).toEqual('MASTER');
        });
    });
    describe('controller methods', function() {
        it('should initialize by calling the correct methods', function() {
            spyOn<any>(component, 'setFilteredOptions');
            spyOn<any>(component, 'updateDisabled');
            component.ngOnInit();

            expect(component['setFilteredOptions']).toHaveBeenCalled();
            expect(component['updateDisabled']).toHaveBeenCalled();
        });
        it('should blur the input and call reset search on close', function() {
            spyOn(component, 'resetSearch');
            spyOn(component.textInput.nativeElement, 'blur');
            component.close();
            expect(component.textInput.nativeElement.blur).toHaveBeenCalled();
            expect(component.resetSearch).toHaveBeenCalled();
        });
        describe('should enable and reset the search', function() {
            describe('if the record has changed', function() {
                it('and it is not the first change', function() {
                    spyOn(component.branchSearchControl, 'enable');
                    spyOn(component, 'retrieveBranchesAndTags');
                    component.ngOnChanges({
                        recordIri: {
                            currentValue: 'newRecordId',
                            previousValue: 'recordId',
                            firstChange: false,
                            isFirstChange(): boolean {
                                return false;
                            }
                        }
                    });
                    expect(component.retrieveBranchesAndTags).toHaveBeenCalled();
                    expect(component.branchSearchControl.enable).toHaveBeenCalled();
                });
                it('unless it is the first change', function() {
                    spyOn(component.branchSearchControl, 'enable');
                    spyOn(component, 'retrieveBranchesAndTags');
                    component.ngOnChanges({
                        recordIri: {
                            currentValue: 'newRecordId',
                            previousValue: 'recordId',
                            firstChange: true,
                            isFirstChange(): boolean {
                                return true;
                            }
                        }
                    });
                    expect(component.retrieveBranchesAndTags).not.toHaveBeenCalled();
                    expect(component.branchSearchControl.enable).not.toHaveBeenCalled();
                });
                it('and the recordIri is empty', function() {
                    spyOn(component.branchSearchControl, 'enable');
                    spyOn(component.branchSearchControl, 'disable');
                    spyOn(component, 'retrieveBranchesAndTags');
                    spyOn(component, 'resetSearch');
                    component.ngOnChanges({
                        recordIri: {
                            currentValue: '',
                            previousValue: 'recordId',
                            firstChange: false,
                            isFirstChange(): boolean {
                                return false;
                            }
                        }
                    });
                    expect(component.retrieveBranchesAndTags).not.toHaveBeenCalled();
                    expect(component.branchSearchControl.enable).not.toHaveBeenCalled();
                    expect(component.branchSearchControl.disable).toHaveBeenCalled();
                    expect(component.resetSearch).toHaveBeenCalled();
                });
            });
            describe('when the branch title has changed', function() {
                it('for the first time', function() {
                    spyOn(component, 'retrieveBranchesAndTags');
                    spyOn(component, 'resetSearch');
                    component.ngOnChanges({
                        branchTitle: {
                            currentValue: 'branch',
                            previousValue: undefined,
                            firstChange: false,
                            isFirstChange(): boolean {
                                return false;
                            }
                        }
                    });
                    expect(component.retrieveBranchesAndTags).not.toHaveBeenCalled();
                    expect(component.resetSearch).toHaveBeenCalled();
                });
                it('not for the first time', function() {
                    spyOn(component, 'retrieveBranchesAndTags');
                    spyOn(component, 'resetSearch');
                    component.ngOnChanges({
                        branchTitle: {
                            currentValue: 'branch',
                            previousValue: 'MASTER',
                            firstChange: false,
                            isFirstChange(): boolean {
                                return false;
                            }
                        }
                    });
                    expect(component.retrieveBranchesAndTags).toHaveBeenCalled();
                    expect(component.resetSearch).toHaveBeenCalled();
                });
            });
        });
        it('should filter branches based on provided text',  async function() {
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();
            let result: any = component.filter('');
            let branches: any = find(result, {title: 'Branches'});
            let tags: any = find(result, {title: 'Tags'});

            expect(branches.options.length).toEqual(2);
            expect(branches.options[0]).toEqual(branch1);
            expect(branches.options[1]).toEqual(branch2);
            expect(tags.options.length).toEqual(1);
            expect(tags.options[0]).toEqual(tag1);

            result = component.filter('total');
            branches = find(result, {title: 'Branches'});
            tags = find(result, {title: 'Tags'});

            expect(branches.options.length).toEqual(1);
            expect(branches.options[0]).toEqual(branch2);
            expect(tags.options.length).toEqual(1);
            expect(tags.options[0]).toEqual(tag1);
        });
        describe('should select the version', function() {
            beforeEach(function() {
                shapesGraphStateStub.listItem.versionedRdfRecord.recordId = 'recordId';
            });
            it('unless there is an in progress commit', function() {
                shapesGraphStateStub.isCommittable.and.returnValue(true);
                component.selectVersion(branchEvent);
                expect(utilStub.createWarningToast).toHaveBeenCalled();
            });
            describe('for a branch and update state', function() {
                it('successfully', async function() {
                    await component.selectVersion(branchEvent);
                    expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branch1.branchIri, 'recordId', 'catalog');
                    expect(shapesGraphStateStub.changeShapesGraphVersion).toHaveBeenCalledWith('recordId', branch1.branchIri, branch1.commitIri, undefined, branch1.title);
                    expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                });
                describe('unless an error occurs', function() {
                    it('when retrieving the branch', async function() {
                        catalogManagerStub.getRecordBranch.and.returnValue(Promise.reject('Error'));
                        await component.selectVersion(branchEvent);
                        expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branch1.branchIri, 'recordId', 'catalog');
                        expect(shapesGraphStateStub.changeShapesGraphVersion).not.toHaveBeenCalled();
                        expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error');
                    });
                    it('when updating the state', async function() {
                        shapesGraphStateStub.changeShapesGraphVersion.and.returnValue(Promise.reject('Error'));
                        await component.selectVersion(branchEvent);
                        expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(branch1.branchIri, 'recordId', 'catalog');
                        expect(shapesGraphStateStub.changeShapesGraphVersion).toHaveBeenCalledWith('recordId', branch1.branchIri, branch1.commitIri, undefined, branch1.title);
                        expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error');
                    });
                });
            });
            describe('for a tag and update state', function() {
                it('successfully', async function() {
                    await component.selectVersion(tagEvent);
                    expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(tag1.commitIri);
                    expect(shapesGraphStateStub.changeShapesGraphVersion).toHaveBeenCalledWith('recordId', undefined, tag1.commitIri, tag1.tagIri, tag1.title);
                    expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                });
                describe('unless an error occurs', function() {
                    it('when retrieving the commit', async function() {
                        catalogManagerStub.getCommit.and.returnValue(Promise.reject('Error'));
                        await component.selectVersion(tagEvent);
                        expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(tag1.commitIri);
                        expect(shapesGraphStateStub.changeShapesGraphVersion).not.toHaveBeenCalled();
                        expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error');
                    });
                    it('when updating the state', async function() {
                        shapesGraphStateStub.changeShapesGraphVersion.and.returnValue(Promise.reject('Error'));
                        await component.selectVersion(tagEvent);
                        expect(catalogManagerStub.getCommit).toHaveBeenCalledWith(tag1.commitIri);
                        expect(shapesGraphStateStub.changeShapesGraphVersion).toHaveBeenCalledWith('recordId', undefined, tag1.commitIri, tag1.tagIri, tag1.title);
                        expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error');
                    });
                });
            });
        });
        describe('should reset the search', function() {
            beforeEach(async function() {
                component.ngOnInit();
                fixture.detectChanges();
                await fixture.whenStable();
            })
            it('when no version title is set', function() {
               spyOn(component.branchSearchControl, 'setValue');
               component.resetSearch();
               expect(component.branchSearchControl.setValue).toHaveBeenCalledWith('');
               expect(component.selectedIcon).toEqual({
                   mat: true,
                   icon: ''
               });
            });
            describe('when a version title is set', function() {
                it('and is a branch', function() {
                    shapesGraphStateStub.listItem.currentVersionTitle = branch1.title;
                    shapesGraphStateStub.listItem.versionedRdfRecord.branchId = branch1.branchIri;
                    spyOn(component.branchSearchControl, 'setValue');
                    component.resetSearch();
                    expect(component.branchSearchControl.setValue).toHaveBeenCalledWith(branch1.title);
                    expect(component.selectedIcon).toEqual({
                        mat: false,
                        icon: 'fa fa-code-fork fa-lg'
                    });
                });
                it('and is a tag', function() {
                    shapesGraphStateStub.listItem.currentVersionTitle = tag1.title;
                    shapesGraphStateStub.listItem.versionedRdfRecord.tagId = tag1.tagIri;
                    shapesGraphStateStub.listItem.versionedRdfRecord.commitId = tag1.commitIri;
                    spyOn(component.branchSearchControl, 'setValue');
                    component.resetSearch();
                    expect(component.branchSearchControl.setValue).toHaveBeenCalledWith(tag1.title);
                    expect(component.selectedIcon).toEqual({
                        mat: true,
                        icon: 'local_offer'
                    });
                });
                it('and is a commit', function() {
                    component.commits = [commit1];
                    shapesGraphStateStub.listItem.currentVersionTitle = commit1.title;
                    shapesGraphStateStub.listItem.versionedRdfRecord.tagId = '';
                    shapesGraphStateStub.listItem.versionedRdfRecord.commitId = commit1.commitIri;
                    spyOn(component.branchSearchControl, 'setValue');
                    component.resetSearch();
                    expect(component.branchSearchControl.setValue).toHaveBeenCalledWith(commit1.title);
                    expect(component.selectedIcon).toEqual({
                        mat: true,
                        icon: 'commit'
                    });
                });
            });
        });
        describe('should retrieve the branches and tags', function() {
            describe('when there are return values', function() {
                describe('and the current version', function() {
                    describe('of a branch', function() {
                        it('exists', async function() {
                            spyOn<any>(component, 'setFilteredOptions');
                            spyOn<any>(component, 'resetToMaster');
                            spyOn(component, 'resetSearch');

                            shapesGraphStateStub.listItem.versionedRdfRecord.branchId = branch1.branchIri;
                            expect(shapesGraphStateStub.listItem.currentVersionTitle).toEqual('');
                            await component.retrieveBranchesAndTags();

                            expect(component.branches).toEqual([branch1, branch2]);
                            expect(component.tags).toEqual([tag1]);
                            expect(shapesGraphStateStub.listItem.currentVersionTitle).toEqual(branch1.title);
                            expect(component['resetToMaster']).not.toHaveBeenCalled();
                            expect(component['setFilteredOptions']).toHaveBeenCalled();
                            expect(component.resetSearch).toHaveBeenCalled();
                        });
                        describe(' does not exists and it resets to master', function() {
                            beforeEach(function() {
                                shapesGraphStateStub.listItem.versionedRdfRecord.branchId = 'urn:doesntExist';
                                shapesGraphStateStub.listItem.currentVersionTitle = 'Not Exists';
                            });
                            it('successfully', async function() {
                                shapesGraphStateStub.deleteState.and.returnValue(Promise.resolve());
                                shapesGraphStateStub.openShapesGraph.and.returnValue(Promise.resolve());
                                spyOn<any>(component, 'setFilteredOptions');
                                spyOn(component.autocompleteTrigger, 'closePanel');
                                await component.retrieveBranchesAndTags();

                                expect(component.branches).toEqual([branch1, branch2]);
                                expect(component.tags).toEqual([tag1]);
                                expect(shapesGraphStateStub.listItem.currentVersionTitle).toEqual('MASTER');
                                expect(utilStub.createWarningToast).toHaveBeenCalledWith('Branch Not Exists cannot be found. Switching to MASTER');
                                expect(component['setFilteredOptions']).toHaveBeenCalled();
                                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                                expect(component.autocompleteTrigger.closePanel).toHaveBeenCalled();
                            });
                            describe('unless an error occurs', function() {
                                it('when deleting state', async function() {
                                    shapesGraphStateStub.deleteState.and.returnValue(Promise.reject('Error'));
                                    spyOn<any>(component, 'setFilteredOptions');
                                    spyOn(component.autocompleteTrigger, 'closePanel');
                                    await component.retrieveBranchesAndTags();

                                    expect(component.branches).toEqual([branch1, branch2]);
                                    expect(component.tags).toEqual([tag1]);
                                    expect(shapesGraphStateStub.listItem.currentVersionTitle).toEqual('Not Exists');
                                    expect(utilStub.createWarningToast).toHaveBeenCalledWith('Branch Not Exists cannot be found. Switching to MASTER');
                                    expect(component['setFilteredOptions']).toHaveBeenCalled();
                                    expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error');
                                    expect(component.autocompleteTrigger.closePanel).toHaveBeenCalled();
                                });
                                it('when opening a shapes graph', async function() {
                                    shapesGraphStateStub.deleteState.and.returnValue(Promise.resolve());
                                    shapesGraphStateStub.openShapesGraph.and.returnValue(Promise.reject('Error'));
                                    spyOn<any>(component, 'setFilteredOptions');
                                    spyOn(component.autocompleteTrigger, 'closePanel');
                                    await component.retrieveBranchesAndTags();

                                    expect(component.branches).toEqual([branch1, branch2]);
                                    expect(component.tags).toEqual([tag1]);
                                    expect(shapesGraphStateStub.listItem.currentVersionTitle).toEqual('Not Exists');
                                    expect(utilStub.createWarningToast).toHaveBeenCalledWith('Branch Not Exists cannot be found. Switching to MASTER');
                                    expect(component['setFilteredOptions']).toHaveBeenCalled();
                                    expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error');
                                    expect(component.autocompleteTrigger.closePanel).toHaveBeenCalled();
                                });
                            });
                        });
                    });
                    describe('of a tag', function() {
                        it('exists', async function() {
                            spyOn<any>(component, 'setFilteredOptions');
                            spyOn<any>(component, 'resetToMaster');
                            spyOn(component, 'resetSearch');

                            shapesGraphStateStub.listItem.versionedRdfRecord.branchId = '';
                            shapesGraphStateStub.listItem.versionedRdfRecord.commitId = tag1.commitIri;
                            shapesGraphStateStub.listItem.versionedRdfRecord.tagId = tag1.tagIri;
                            expect(shapesGraphStateStub.listItem.currentVersionTitle).toEqual('');
                            await component.retrieveBranchesAndTags();

                            expect(component.branches).toEqual([branch1, branch2]);
                            expect(component.tags).toEqual([tag1]);
                            expect(shapesGraphStateStub.listItem.currentVersionTitle).toEqual(tag1.title);
                            expect(component['resetToMaster']).not.toHaveBeenCalled();
                            expect(component['setFilteredOptions']).toHaveBeenCalled();
                            expect(component.resetSearch).toHaveBeenCalled();
                        });
                        describe('does not exists and it resets to master', function() {
                            beforeEach(function() {
                                shapesGraphStateStub.listItem.versionedRdfRecord.branchId = '';
                                shapesGraphStateStub.listItem.versionedRdfRecord.tagId = tag1.tagIri;
                                shapesGraphStateStub.listItem.versionedRdfRecord.commitId = 'urn:doesntExist';
                                shapesGraphStateStub.listItem.currentVersionTitle = 'Not Exists';
                            });
                            it('successfully', async function() {
                                shapesGraphStateStub.deleteState.and.returnValue(Promise.resolve());
                                shapesGraphStateStub.openShapesGraph.and.returnValue(Promise.resolve());
                                spyOn<any>(component, 'setFilteredOptions');
                                spyOn(component.autocompleteTrigger, 'closePanel');
                                await component.retrieveBranchesAndTags();

                                expect(component.branches).toEqual([branch1, branch2]);
                                expect(component.tags).toEqual([tag1]);
                                expect(shapesGraphStateStub.listItem.currentVersionTitle).toEqual('MASTER');
                                expect(utilStub.createWarningToast).toHaveBeenCalledWith('Tag Not Exists cannot be found. Switching to MASTER');
                                expect(component['setFilteredOptions']).toHaveBeenCalled();
                                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                                expect(component.autocompleteTrigger.closePanel).toHaveBeenCalled();
                            });
                            describe('unless an error occurs', function() {
                                it('when deleting state', async function() {
                                    shapesGraphStateStub.deleteState.and.returnValue(Promise.reject('Error'));
                                    spyOn<any>(component, 'setFilteredOptions');
                                    spyOn(component.autocompleteTrigger, 'closePanel');
                                    await component.retrieveBranchesAndTags();

                                    expect(component.branches).toEqual([branch1, branch2]);
                                    expect(component.tags).toEqual([tag1]);
                                    expect(shapesGraphStateStub.listItem.currentVersionTitle).toEqual('Not Exists');
                                    expect(utilStub.createWarningToast).toHaveBeenCalledWith('Tag Not Exists cannot be found. Switching to MASTER');
                                    expect(component['setFilteredOptions']).toHaveBeenCalled();
                                    expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error');
                                    expect(component.autocompleteTrigger.closePanel).toHaveBeenCalled();
                                });
                                it('when opening a shapes graph', async function() {
                                    shapesGraphStateStub.deleteState.and.returnValue(Promise.resolve());
                                    shapesGraphStateStub.openShapesGraph.and.returnValue(Promise.reject('Error'));
                                    spyOn<any>(component, 'setFilteredOptions');
                                    spyOn(component.autocompleteTrigger, 'closePanel');
                                    await component.retrieveBranchesAndTags();

                                    expect(component.branches).toEqual([branch1, branch2]);
                                    expect(component.tags).toEqual([tag1]);
                                    expect(shapesGraphStateStub.listItem.currentVersionTitle).toEqual('Not Exists');
                                    expect(utilStub.createWarningToast).toHaveBeenCalledWith('Tag Not Exists cannot be found. Switching to MASTER');
                                    expect(component['setFilteredOptions']).toHaveBeenCalled();
                                    expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error');
                                    expect(component.autocompleteTrigger.closePanel).toHaveBeenCalled();
                                });
                            });
                        });
                    });
                    it('of a commit', async function() {
                        component.commits = [commit1];
                        spyOn<any>(component, 'setFilteredOptions');
                        spyOn<any>(component, 'resetToMaster');
                        spyOn(component, 'resetSearch');

                        shapesGraphStateStub.listItem.versionedRdfRecord.branchId = '';
                        shapesGraphStateStub.listItem.versionedRdfRecord.commitId = commit1.commitIri;
                        shapesGraphStateStub.listItem.versionedRdfRecord.tagId = '';
                        expect(shapesGraphStateStub.listItem.currentVersionTitle).toEqual('');
                        await component.retrieveBranchesAndTags();

                        expect(component.branches).toEqual([branch1, branch2]);
                        expect(component.tags).toEqual([tag1]);
                        expect(shapesGraphStateStub.listItem.currentVersionTitle).toEqual(commit1.title);
                        expect(component['resetToMaster']).not.toHaveBeenCalled();
                        expect(component['setFilteredOptions']).toHaveBeenCalled();
                        expect(component.resetSearch).toHaveBeenCalled();
                    });
                });
            });
            it('unless there are no return values', async function() {
                catalogManagerStub.getRecordBranches.and.returnValue(Promise.resolve({data: []}));
                catalogManagerStub.getRecordVersions.and.returnValue(Promise.resolve({data: []}));
                spyOn<any>(component, 'checkVersionDeleted');
                spyOn<any>(component, 'setFilteredOptions');
                spyOn(component, 'resetSearch');
                await component.retrieveBranchesAndTags();
                expect(component['checkVersionDeleted']).not.toHaveBeenCalled();
                expect(component['setFilteredOptions']).toHaveBeenCalled();
                expect(component.resetSearch).toHaveBeenCalled();
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            });
            it('unless the branch promise fails', async function() {
                catalogManagerStub.getRecordBranches.and.returnValue(Promise.reject('Error'));
                await component.retrieveBranchesAndTags();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error');
            });
            it('unless the tag promise fails', async function() {
                catalogManagerStub.getRecordVersions.and.returnValue(Promise.reject('Error'));
                await component.retrieveBranchesAndTags();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error');
            });
        });
        describe('should open the delete confirmation modal', function() {
            it('when a branch', function() {
                spyOn(component.autocompleteTrigger, 'closePanel');
                component.showDeleteBranchConfirmationOverlay(branch1, new Event('delete'));
                expect(modalStub.openConfirmModal).toHaveBeenCalledWith(jasmine.stringMatching('Are you sure you want to delete'), jasmine.any(Function));
                expect(component.autocompleteTrigger.closePanel).toHaveBeenCalled();
            });
            it('when a tag', function() {
                spyOn(component.autocompleteTrigger, 'closePanel');
                component.showDeleteBranchConfirmationOverlay(tag1, new Event('delete'));
                expect(modalStub.openConfirmModal).toHaveBeenCalledWith(jasmine.stringMatching('Are you sure you want to delete'), jasmine.any(Function));
                expect(component.autocompleteTrigger.closePanel).toHaveBeenCalled();
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('mat-form-field.editor-branch-select')).length).toEqual(1);
        });
        it('with an input for filtering', function() {
            const input = element.queryAll(By.css('input'));
            expect(input.length).toEqual(1);
        });
        describe('with a mat-autocomplete', function() {
            it('with groups for branches and tags', async function () {
                component.ngOnInit();
                fixture.detectChanges();
                await fixture.whenStable();

                component.autocompleteTrigger.openPanel();
                fixture.detectChanges();
                await fixture.whenStable();

                const labels = element.queryAll(By.css('.mat-optgroup-label'));
                expect(labels.length).toEqual(2);
                expect(labels[0].nativeElement.textContent).toEqual('Branches');
                expect(labels[1].nativeElement.textContent).toEqual('Tags');
            });
        });
    });
    it('should call showDeleteBranchConfirmationOverlay when the branch delete button is clicked', async function() {
        spyOn(component, 'showDeleteBranchConfirmationOverlay');
        fixture.detectChanges();
        await fixture.whenStable();

        component.autocompleteTrigger.openPanel();
        fixture.detectChanges();
        await fixture.whenStable();

        const createButton = element.queryAll(By.css('button.delete-branch'))[0];
        createButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(component.showDeleteBranchConfirmationOverlay).toHaveBeenCalled();
    });
    it('should call showDeleteTagConfirmationOverlay when the branch delete button is clicked', async function() {
        spyOn(component, 'showDeleteTagConfirmationOverlay');
        fixture.detectChanges();
        await fixture.whenStable();

        component.autocompleteTrigger.openPanel();
        fixture.detectChanges();
        await fixture.whenStable();

        const createButton = element.queryAll(By.css('button.delete-tag'))[0];
        createButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(component.showDeleteTagConfirmationOverlay).toHaveBeenCalled();
    });
    it('should select a version when clicked', async function() {
        spyOn(component, 'selectVersion');
        fixture.detectChanges();
        await fixture.whenStable();

        component.autocompleteTrigger.openPanel();
        fixture.detectChanges();
        await fixture.whenStable();

        const option = element.queryAll(By.css('mat-option'))[1]; // Open branch
        option.triggerEventHandler('click', null);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(component.selectVersion).toHaveBeenCalled();
    });
});
