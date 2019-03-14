/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
fdescribe('Search Tab component', function() {
    var $compile, scope, $q, ontologyStateSvc, ontoUtils, ontologyManagerSvc, httpSvc;

    beforeEach(function() {
        module('templates');
        module('searchTab');
        injectPrefixationFilter();
        injectTrustedFilter();
        injectHighlightFilter();
        injectBeautifyFilter();
        injectSplitIRIFilter();
        mockOntologyState();
        mockOntologyManager();
        mockOntologyUtilsManager();
        mockHttpService();

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _ontologyUtilsManagerService_, _ontologyManagerService_, _httpService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
            ontoUtils = _ontologyUtilsManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            httpSvc = _httpService_;
        });

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
        ontologyStateSvc.listItem.ontologyRecord = {
            recordId: this.recordId,
            branchId: this.branchId,
            commitId: this.commitId
        };
        ontologyStateSvc.listItem.selected = this.selected;
        ontologyStateSvc.listItem.editorTabStates.search = {
            errorMessage: 'error',
            entityIRI: 'entityIRI',
            highlightText: 'highlight',
            infoMessage: 'info',
            results: {
                key: [{
                    entity: {
                        value: 'value'
                    }
                }]
            },
            searchText: this.searchText,
            selected: this.selected
        }
        ontoUtils.isLinkable.and.callFake(id => !!id);
        this.element = $compile(angular.element('<search-tab></search-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('searchTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        ontoUtils = null;
        ontologyManagerSvc = null;
        httpSvc = null;
        this.element.remove();
    });

    describe('should initialize with the correct values for', function() {
        it('the id', function() {
            expect(ontologyStateSvc.listItem.editorTabStates.search.id).toEqual('search-' + this.recordId);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('SEARCH-TAB');
            expect(this.element.querySelectorAll('.search-tab').length).toEqual(1);
        });
        ['.search', '.result', '.property-values', '.entity-IRI'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.querySelectorAll(test).length).toEqual(1);
            });
        });
        ['error-display', 'info-message', 'tree-item'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
        it('with .value-containers', function() {
            expect(this.element.querySelectorAll('.prop-value-container').length).toEqual(2);
        });
        it('with .value-displays', function() {
            expect(this.element.querySelectorAll('.value-display').length).toEqual(2);
        });
        it('with a link in .value-display', function() {
            expect(this.element.querySelectorAll('.value-display a').length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        describe('onKeyup', function() {
            describe('when keyCode is 13,', function() {
                beforeEach(function() {
                    spyOn(this.controller, 'unselectItem');
                    this.id = ontologyStateSvc.listItem.editorTabStates.search.id;
                });
                it('calls the correct manager function', function() {
                    ontologyManagerSvc.getSearchResults.and.returnValue($q.when());
                    this.controller.onKeyup({keyCode: 13});
                    expect(httpSvc.cancel).toHaveBeenCalledWith(this.id);
                    expect(this.controller.unselectItem).toHaveBeenCalled();
                    expect(ontologyManagerSvc.getSearchResults).toHaveBeenCalledWith(this.recordId, this.branchId, this.commitId, this.searchText, this.id);
                });
                describe('when resolved', function() {
                    it('it sets the correct variables', function() {
                        ontologyManagerSvc.getSearchResults.and.returnValue($q.when([]));
                        this.controller.onKeyup({keyCode: 13});
                        scope.$apply();
                        expect(ontologyStateSvc.listItem.editorTabStates.search.errorMessage).toEqual('');
                        expect(ontologyStateSvc.listItem.editorTabStates.search.highlightText).toEqual(this.searchText);
                    });
                    it('where the response has results, sets the correct variables', function() {
                        var results = {
                            'http://www.w3.org/2002/07/owl#Class': [
                                'class1',
                                'class2'
                            ]
                        };
                        ontologyStateSvc.getEntityNameByIndex.and.returnValue('');
                        ontologyManagerSvc.getSearchResults.and.returnValue($q.when(results));
                        this.controller.onKeyup({keyCode: 13});
                        scope.$apply();
                        expect(ontologyStateSvc.listItem.editorTabStates.search.results).toEqual(results);
                        expect(ontologyStateSvc.listItem.editorTabStates.search.infoMessage).toEqual('');
                    });
                    it('where the response does not have results, sets the correct variables', function() {
                        ontologyManagerSvc.getSearchResults.and.returnValue($q.when({}));
                        this.controller.onKeyup({keyCode: 13});
                        scope.$apply();
                        expect(ontologyStateSvc.listItem.editorTabStates.search.results).toEqual({});
                        expect(ontologyStateSvc.listItem.editorTabStates.search.infoMessage).toEqual('There were no results for your search text.')
                    });
                });
                it('when rejected, it sets the correct variables', function() {
                    ontologyManagerSvc.getSearchResults.and.returnValue($q.reject('error message'));
                    this.controller.onKeyup({keyCode: 13});
                    scope.$apply();
                    expect(ontologyStateSvc.listItem.editorTabStates.search.errorMessage).toEqual('error message');
                    expect(ontologyStateSvc.listItem.editorTabStates.search.infoMessage).toEqual('');
                });
            });
        });
        it('should determine whether you can go to an entity', function() {
            ontologyStateSvc.listItem.editorTabStates.search.entityIRI = '';
            expect(this.controller.canGoTo()).toEqual(false);

            ontologyStateSvc.listItem.editorTabStates.search.entityIRI = 'id';
            ontologyManagerSvc.isOntology.and.returnValue(false);
            expect(this.controller.canGoTo()).toEqual(true);

            ontologyManagerSvc.isOntology.and.returnValue(true);
            ontologyStateSvc.listItem.ontologyId = '';
            expect(this.controller.canGoTo()).toEqual(false);

            ontologyStateSvc.listItem.ontologyId = 'id';
            expect(this.controller.canGoTo()).toEqual(true);
        });
        it('should go to an entity if you can', function() {
            spyOn(this.controller, 'canGoTo').and.returnValue(false);
            this.controller.goToIfYouCan({});
            expect(ontologyStateSvc.goTo).not.toHaveBeenCalled();

            this.controller.canGoTo.and.returnValue(true);
            this.controller.goToIfYouCan({});
            expect(ontologyStateSvc.goTo).toHaveBeenCalledWith({});
        });
        it('should select an item in the list', function() {
            ontologyStateSvc.listItem.selected = {
                '@id': 'id',
                '@type': ['test'],
                mobi: {},
                prop: [{'@value': 'test'}]
            };
            this.controller.selectItem({});
            expect(ontologyStateSvc.selectItem).toHaveBeenCalledWith({}, false);
            expect(ontologyStateSvc.listItem.editorTabStates.search.selected).toEqual({prop: [{'@value': 'test'}]});
        });
        it('should unselect an item in the list', function() {
            this.controller.unselectItem();
            expect(ontologyStateSvc.unSelectItem).toHaveBeenCalled();
            expect(ontologyStateSvc.listItem.editorTabStates.search.selected).toBeUndefined();
        });
    });
});
