/*-
 * #%L
 * org.matonto.web
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
    var $compile, scope, $q, element, controller, ontologyStateSvc, ontologyUtilsManagerSvc, ontologyManagerSvc, deferred, httpSvc;

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
            deferred = _$q_.defer();
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyUtilsManagerSvc = _ontologyUtilsManagerService_;
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
        ontologyUtilsManagerSvc.isLinkable.and.callFake(function(id) {
            return !!id;
        });
        element = $compile(angular.element('<search-tab></search-tab>'))(scope);
        scope.$digest();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('search-tab')).toBe(true);
        });
        it('with blocks', function() {
            expect(element.find('block').length).toBe(2);
        });
        it('with block-headers', function() {
            expect(element.find('block-header').length).toBe(2);
        });
        it('with block-contents', function() {
            expect(element.find('block-content').length).toBe(2);
        });
        it('with a error-display', function() {
            expect(element.find('error-display').length).toBe(1);
        });
        it('with a info-message', function() {
            expect(element.find('info-message').length).toBe(1);
        });
        it('with a .result', function() {
            expect(element.querySelectorAll('.result').length).toBe(1);
        });
        it('with a tree-item', function() {
            expect(element.find('tree-item').length).toBe(1);
        });
        it('with a .property-values', function() {
            expect(element.querySelectorAll('.property-values').length).toBe(1);
        });
        it('with .value-containers', function() {
            expect(element.querySelectorAll('.value-container').length).toBe(2);
        });
        it('with .value-displays', function() {
            expect(element.querySelectorAll('.value-display').length).toBe(2);
        });
        it('with a link in .value-display', function() {
            expect(element.querySelectorAll('.value-display a').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('searchTab');
        });
        describe('onKeyup', function() {
            it('when keyCode is not 13, does not call methods', function() {
                _.forEach([12, 14], function(item) {
                    controller.onKeyup({keyCode: item});
                    expect(ontologyStateSvc.unSelectItem).not.toHaveBeenCalled();
                    expect(ontologyManagerSvc.getSearchResults).not.toHaveBeenCalled();
                });
            });
            describe('when keyCode is 13,', function() {
                beforeEach(function() {
                    ontologyManagerSvc.getSearchResults.and.returnValue(deferred.promise);
                    controller.onKeyup({keyCode: 13});
                });
                it('calls the correct manager function', function() {
                    expect(httpSvc.cancel).toHaveBeenCalledWith('search-' + ontologyStateSvc.listItem.ontologyRecord.recordId);
                    expect(ontologyStateSvc.unSelectItem).toHaveBeenCalled();
                    expect(ontologyManagerSvc.getSearchResults).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, ontologyStateSvc.listItem.editorTabStates.search.searchText, controller.id);
                    expect(httpSvc.cancel).toHaveBeenCalledWith('search-' + ontologyStateSvc.listItem.ontologyRecord.recordId);
                });
                describe('when resolved', function() {
                    it('it sets the correct variables', function() {
                        deferred.resolve([]);
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
                        deferred.resolve(results);
                        scope.$apply();
                        expect(ontologyStateSvc.listItem.editorTabStates.search.results).toEqual(results);
                        expect(ontologyStateSvc.listItem.editorTabStates.search.infoMessage).toEqual('');
                    });
                    it('where the response does not have results, sets the correct variables', function() {
                        deferred.resolve({});
                        scope.$apply();
                        expect(ontologyStateSvc.listItem.editorTabStates.search.results).toEqual({});
                        expect(ontologyStateSvc.listItem.editorTabStates.search.infoMessage).toEqual('There were no results for your search text.')
                    });
                });
                it('when rejected, it sets the correct variables', function() {
                    deferred.reject('error message');
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
            controller.onClear();
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
                'matonto': 'new'
            }
            scope.$digest();
            expect(ontologyStateSvc.listItem.editorTabStates.search.selected).toEqual({key: 'new'});
        });
    });
});
