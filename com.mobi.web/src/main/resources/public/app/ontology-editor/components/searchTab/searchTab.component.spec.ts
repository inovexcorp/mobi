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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { cloneDeep, omit } from 'lodash';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { OntologyManagerService } from '../../../shared/services/ontologyManager.service';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { TreeItemComponent } from '../treeItem/treeItem.component';
import { SearchBarComponent } from '../../../shared/components/searchBar/searchBar.component';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { SelectedDetailsComponent } from '../selectedDetails/selectedDetails.component';
import { WarningMessageComponent } from '../../../shared/components/warningMessage/warningMessage.component';
import { PrefixationPipe } from '../../../shared/pipes/prefixation.pipe';
import { HighlightTextPipe } from '../../../shared/pipes/highlightText.pipe';
import { TrustedHtmlPipe } from '../../../shared/pipes/trustedHtml.pipe';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { SearchTabComponent } from './searchTab.component';

describe('Search Tab component', function() {
    let component: SearchTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<SearchTabComponent>;
    let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;

    const recordId = 'recordId';
    const branchId = 'branchId';
    const commitId = 'commitId';
    const searchText = 'searchText';
    const selected: JSONLDObject = {
        '@id': 'selected',
        key: [{
            '@id': 'id'
        },
        {
            '@value': 'value'
        }]
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
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
                MockProvider(OntologyStateService),
                MockProvider(OntologyManagerService),
                MockProvider(ProgressSpinnerService)
            ]
        }).compileComponents();
        
        fixture = TestBed.createComponent(SearchTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
        ontologyManagerStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;

        ontologyStateStub.listItem = new OntologyListItem();
        ontologyStateStub.listItem.versionedRdfRecord.recordId = recordId;
        ontologyStateStub.listItem.versionedRdfRecord.branchId = branchId;
        ontologyStateStub.listItem.versionedRdfRecord.commitId = commitId;
        ontologyStateStub.listItem.selected = selected;
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
            searchText: searchText,
            selected: omit(selected, '@id')
        };
        ontologyStateStub.isLinkable.and.callFake(id => !!id);
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        ontologyStateStub = null;
        ontologyManagerStub = null;
        component = null;
        element = null;
        fixture = null;
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
            });
            it('calls the correct manager function', function() {
                ontologyManagerStub.getSearchResults.and.returnValue(of({}));
                component.onKeyup();
                expect(component.unselectItem).toHaveBeenCalledWith();
                expect(ontologyManagerStub.getSearchResults).toHaveBeenCalledWith(recordId, branchId, commitId, searchText);
            });
            describe('when resolved', function() {
                it('it sets the correct variables', function() {
                    ontologyManagerStub.getSearchResults.and.returnValue(of({}));
                    component.onKeyup();
                    fixture.detectChanges();
                    expect(ontologyStateStub.listItem.editorTabStates.search.errorMessage).toEqual('');
                    expect(ontologyStateStub.listItem.editorTabStates.search.highlightText).toEqual(searchText);
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
                    expect(ontologyStateStub.listItem.editorTabStates.search.infoMessage).toEqual('There were no results for your search text.');
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
            ontologyStateStub.selectItem.and.returnValue(of(null));
            component.selectItem('blah');
            fixture.detectChanges();
            expect(ontologyStateStub.selectItem).toHaveBeenCalledWith('blah', false);
            expect(cloneDeep(ontologyStateStub.listItem.editorTabStates.search.selected)).toEqual({prop: [{'@value': 'test'}]});
        });
        it('should unselect an item in the list', function() {
            component.unselectItem();
            expect(ontologyStateStub.unSelectItem).toHaveBeenCalledWith();
            expect(ontologyStateStub.listItem.editorTabStates.search.selected).toBeUndefined();
        });
    });
});
