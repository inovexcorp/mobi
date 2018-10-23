/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
describe('Search Tab directive', function() {
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

        inject(function(_$q_, _$compile_, _$rootScope_, _ontologyStateService_, _ontologyUtilsManagerService_, _ontologyManagerService_, _httpService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontoUtils = _ontologyUtilsManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            httpSvc = _httpService_;
        });

        ontologyStateSvc.listItem.selected = {
            key: [{
                '@id': 'id'
            },
            {
                '@value': 'value'
            }]
        }
        ontologyStateSvc.listItem.editorTabStates.search = {
            errorMessage: 'error',
            highlightText: 'highlight',
            infoMessage: 'info',
            results: {
                key: [{
                    entity: {
                        value: 'value'
                    }
                }]
            },
            searchText: 'searchText',
            selected: ontologyStateSvc.listItem.selected
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

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('search-tab')).toBe(true);
        });
        it('with a .search', function() {
            expect(this.element.querySelectorAll('.search').length).toBe(1);
        });
        it('with an error-display', function() {
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('with an info-message', function() {
            expect(this.element.find('info-message').length).toBe(1);
        });
        it('with a .result', function() {
            expect(this.element.querySelectorAll('.result').length).toBe(1);
        });
        it('with a tree-item', function() {
            expect(this.element.find('tree-item').length).toBe(1);
        });
        it('with .value-containers', function() {
            expect(this.element.querySelectorAll('.prop-value-container').length).toBe(2);
        });
        it('with .value-displays', function() {
            expect(this.element.querySelectorAll('.value-display').length).toBe(2);
        });
        it('with a link in .value-display', function() {
            expect(this.element.querySelectorAll('.value-display a').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('onKeyup', function() {
            it('when keyCode is not 13, does not call methods', function() {
                [12, 14].forEach(function(item) {
                    this.controller.onKeyup({keyCode: item});
                    expect(ontologyStateSvc.unSelectItem).not.toHaveBeenCalled();
                    expect(ontologyManagerSvc.getSearchResults).not.toHaveBeenCalled();
                }, this);
            });
            describe('when keyCode is 13,', function() {
                it('calls the correct manager function', function() {
                    ontologyManagerSvc.getSearchResults.and.returnValue($q.when());
                    this.controller.onKeyup({keyCode: 13});
                    expect(httpSvc.cancel).toHaveBeenCalledWith('search-' + ontologyStateSvc.listItem.ontologyRecord.recordId);
                    expect(ontologyStateSvc.unSelectItem).toHaveBeenCalled();
                    expect(ontologyManagerSvc.getSearchResults).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.listItem.editorTabStates.search.searchText, this.controller.id);
                    expect(httpSvc.cancel).toHaveBeenCalledWith('search-' + ontologyStateSvc.listItem.ontologyRecord.recordId);
                });
                describe('when resolved', function() {
                    it('it sets the correct variables', function() {
                        ontologyManagerSvc.getSearchResults.and.returnValue($q.when([]));
                        this.controller.onKeyup({keyCode: 13});
                        scope.$apply();
                        expect(ontologyStateSvc.listItem.editorTabStates.search.errorMessage).toEqual('');
                        expect(ontologyStateSvc.listItem.editorTabStates.search.highlightText).toEqual(ontologyStateSvc.listItem.editorTabStates.search.searchText);
                    });
                    it('where the response has results, sets the correct variables', function() {
                        var results = {
                            'http://www.w3.org/2002/07/owl#Class': [
                                'class1',
                                'class2'
                            ]
                        };
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
        it('onClear should reset state variables', function() {
            expect(ontologyStateSvc.listItem.editorTabStates.search.errorMessage).not.toEqual('');
            expect(ontologyStateSvc.listItem.editorTabStates.search.infoMessage).not.toEqual('');
            expect(ontologyStateSvc.listItem.editorTabStates.search.results).not.toEqual({});
            expect(ontologyStateSvc.listItem.editorTabStates.search.searchText).not.toEqual('');
            expect(ontologyStateSvc.listItem.editorTabStates.search.selected).not.toEqual({});
            expect(ontologyStateSvc.listItem.editorTabStates.search.highlightText).not.toEqual('');
            this.controller.onClear();
            expect(httpSvc.cancel).toHaveBeenCalledWith('search-' + ontologyStateSvc.listItem.ontologyRecord.recordId);
            expect(ontologyStateSvc.listItem.editorTabStates.search.errorMessage).toEqual('');
            expect(ontologyStateSvc.listItem.editorTabStates.search.infoMessage).toEqual('');
            expect(ontologyStateSvc.listItem.editorTabStates.search.results).toEqual({});
            expect(ontologyStateSvc.listItem.editorTabStates.search.searchText).toEqual('');
            expect(ontologyStateSvc.listItem.editorTabStates.search.selected).toEqual({});
            expect(ontologyStateSvc.listItem.editorTabStates.search.highlightText).toEqual('');
        });
        it('check $watch', function() {
            ontologyStateSvc.listItem.selected = {
                '@id': 'new',
                key: 'new',
                mobi: 'new'
            }
            scope.$digest();
            expect(ontologyStateSvc.listItem.editorTabStates.search.selected).toEqual({key: 'new'});
        });
    });
});
