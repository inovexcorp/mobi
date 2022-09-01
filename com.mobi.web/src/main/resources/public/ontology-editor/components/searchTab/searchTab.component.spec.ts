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
import { SearchTabComponent } from './searchTab.component';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { mockOntologyState, mockOntologyManager, mockHttpService, cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { MockComponent, MockPipe } from 'ng-mocks';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { TreeItemComponent } from '../treeItem/treeItem.component';
import { SearchBarComponent } from '../../../shared/components/searchBar/searchBar.component';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { SelectedDetailsComponent } from '../selectedDetails/selectedDetails.component';
import { WarningMessageComponent } from '../../../shared/components/warningMessage/warningMessage.component';
import { PrefixationPipe } from '../../../shared/pipes/prefixation.pipe';
import { HighlightTextPipe } from '../../../shared/pipes/highlightText.pipe';
import { TrustedHtmlPipe } from '../../../shared/pipes/trustedHtml.pipe';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { cloneDeep } from 'lodash';

describe('Search Tab component', function() {
    let component: SearchTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<SearchTabComponent>;
    let ontologyStateStub;
    let ontologyManagerStub;
    let httpStub;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [],
            declarations: [
                SearchTabComponent,
                MockComponent(TreeItemComponent),
                MockComponent(SearchBarComponent),
                MockComponent(ErrorDisplayComponent),
                MockComponent(InfoMessageComponent),
                MockComponent(WarningMessageComponent),
                MockComponent(SelectedDetailsComponent),
                MockPipe(PrefixationPipe),
                MockPipe(HighlightTextPipe),
                MockPipe(TrustedHtmlPipe)
            ],
            providers: [
                { provide: OntologyStateService, useClass: mockOntologyState },
                { provide: OntologyManagerService, useClass: mockOntologyManager },
                { provide: 'httpService', useClass: mockHttpService }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(SearchTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        ontologyStateStub = TestBed.get(OntologyStateService);
        ontologyManagerStub = TestBed.get(OntologyManagerService);
        httpStub = TestBed.get('httpService');

        this.recordId = 'recordId';
        this.branchId = 'branchId';
        this.commitId = 'commitId';
        this.searchText = 'searchText';
        this.selected = {
            key: [{
                '@id': 'id'
            },
            {
                '@value': 'value'
            }]
        };
        ontologyStateStub.listItem.versionedRdfRecord = {
            recordId: this.recordId,
            branchId: this.branchId,
            commitId: this.commitId
        };
        ontologyStateStub.listItem.selected = this.selected;
        ontologyStateStub.listItem.editorTabStates.search = {
            errorMessage: 'error',
            entityIRI: 'entityIRI',
            highlightText: 'highlight',
            infoMessage: 'info',
            warningMessage: 'warning',
            results: {
                key: [{
                    entity: {
                        value: 'value'
                    }
                }]
            },
            searchText: this.searchText,
            selected: this.selected
        };
        ontologyStateStub.isLinkable.and.callFake(id => !!id);
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        ontologyStateStub = null;
        ontologyManagerStub = null;
        httpStub = null;
        component = null;
        element = null;
        fixture = null;
    });

    describe('should initialize with the correct values for', function() {
        it('the id', function() {
            expect(ontologyStateStub.listItem.editorTabStates.search.id).toEqual('search-' + this.recordId);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.search-tab')).length).toEqual(1);
        });
        ['.search', '.result', '.property-values', '.entity-IRI'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        ['error-display', 'info-message', 'tree-item', 'warning-message'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('with .value-containers', function() {
            expect(element.queryAll(By.css('.prop-value-container')).length).toEqual(2);
        });
        it('with .value-displays', function() {
            expect(element.queryAll(By.css('.value-display')).length).toEqual(2);
        });
        it('with a link in .value-display', function() {
            expect(element.queryAll(By.css('.value-display a')).length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        describe('onKeyup', function() {
            beforeEach(function() {
                spyOn(component, 'unselectItem');
                this.id = ontologyStateStub.listItem.editorTabStates.search.id;
            });
            it('calls the correct manager function', function() {
                ontologyManagerStub.getSearchResults.and.returnValue(of([]));
                component.onKeyup();
                expect(component.unselectItem).toHaveBeenCalled();
                expect(ontologyManagerStub.getSearchResults).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.searchText);
            });
            describe('when resolved', function() {
                it('it sets the correct variables', function() {
                    ontologyManagerStub.getSearchResults.and.returnValue(of([]));
                    component.onKeyup();
                    fixture.detectChanges();
                    expect(ontologyStateStub.listItem.editorTabStates.search.errorMessage).toEqual('');
                    expect(ontologyStateStub.listItem.editorTabStates.search.highlightText).toEqual(this.searchText);
                });
                it('where the response has results, sets the correct variables', function() {
                    const results = {
                        'http://www.w3.org/2002/07/owl#Class': [
                            'class1',
                            'class2'
                        ]
                    };
                    ontologyStateStub.getEntityNameByListItem.and.returnValue('');
                    ontologyManagerStub.getSearchResults.and.returnValue(of(results));
                    component.onKeyup();
                    fixture.detectChanges();
                    expect(ontologyStateStub.listItem.editorTabStates.search.results).toEqual(results);
                    expect(ontologyStateStub.listItem.editorTabStates.search.infoMessage).toEqual('');
                    expect(ontologyStateStub.listItem.editorTabStates.search.warningMessage).toEqual('');
                });
                it('where the response has limited results, sets the correct variables', function() {
                    const results = {
                        'http://www.w3.org/2002/07/owl#Class': [],
                        'http://www.w3.org/2002/07/owl#Concept': []
                    };
                    for (let i = 1; i <= 250; i++) {
                        results['http://www.w3.org/2002/07/owl#Class'].push('class' + i);
                        results['http://www.w3.org/2002/07/owl#Concept'].push('concept' + i);
                    }
                    ontologyStateStub.getEntityNameByListItem.and.returnValue('');
                    ontologyManagerStub.getSearchResults.and.returnValue(of(results));
                    component.onKeyup();
                    fixture.detectChanges();
                    expect(ontologyStateStub.listItem.editorTabStates.search.results).toEqual(results);
                    expect(ontologyStateStub.listItem.editorTabStates.search.infoMessage).toEqual('');
                    expect(ontologyStateStub.listItem.editorTabStates.search.warningMessage).toEqual('Search results truncated because they exceeded 500 items.');
                });
                it('where the response does not have results, sets the correct variables', function() {
                    ontologyManagerStub.getSearchResults.and.returnValue(of({}));
                    component.onKeyup();
                    fixture.detectChanges();
                    expect(ontologyStateStub.listItem.editorTabStates.search.results).toEqual({});
                    expect(ontologyStateStub.listItem.editorTabStates.search.infoMessage).toEqual('There were no results for your search text.')
                    expect(ontologyStateStub.listItem.editorTabStates.search.warningMessage).toEqual('');
                });
            });
            it('when rejected, it sets the correct variables', function() {
                ontologyManagerStub.getSearchResults.and.returnValue(throwError('error message'));
                component.onKeyup();
                fixture.detectChanges();
                expect(ontologyStateStub.listItem.editorTabStates.search.errorMessage).toEqual('error message');
                expect(ontologyStateStub.listItem.editorTabStates.search.infoMessage).toEqual('');
                expect(ontologyStateStub.listItem.editorTabStates.search.warningMessage).toEqual('');
            });
        });
        it('should determine whether you can go to an entity', function() {
            ontologyStateStub.listItem.editorTabStates.search.entityIRI = '';
            expect(component.canGoTo()).toEqual(false);

            ontologyStateStub.listItem.editorTabStates.search.entityIRI = 'id';
            ontologyManagerStub.isOntology.and.returnValue(false);
            expect(component.canGoTo()).toEqual(true);

            ontologyManagerStub.isOntology.and.returnValue(true);
            ontologyStateStub.listItem.ontologyId = '';
            expect(component.canGoTo()).toEqual(false);

            ontologyStateStub.listItem.ontologyId = 'id';
            expect(component.canGoTo()).toEqual(true);
        });
        it('should go to an entity if you can', function() {
            const canGoToSpy = spyOn(component, 'canGoTo');
            canGoToSpy.and.returnValue(false);
            component.goToIfYouCan('test');
            expect(ontologyStateStub.goTo).not.toHaveBeenCalled();

            canGoToSpy.and.returnValue(true);
            component.goToIfYouCan('test');
            expect(ontologyStateStub.goTo).toHaveBeenCalledWith('test');
        });
        it('should select an item in the list', function() {
            ontologyStateStub.listItem.selected = {
                '@id': 'id',
                '@type': ['test'],
                prop: [{'@value': 'test'}]
            };
            component.selectItem('blah');
            fixture.detectChanges();
            expect(ontologyStateStub.selectItem).toHaveBeenCalledWith('blah', false);
            expect(cloneDeep(ontologyStateStub.listItem.editorTabStates.search.selected)).toEqual({prop: [{'@value': 'test'}]});
        });
        it('should unselect an item in the list', function() {
            component.unselectItem();
            expect(ontologyStateStub.unSelectItem).toHaveBeenCalled();
            expect(ontologyStateStub.listItem.editorTabStates.search.selected).toBeUndefined();
        });
    });
});
