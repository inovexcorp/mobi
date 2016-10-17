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
    var $compile;
    var element;
    var scope;
    var ontologyStateSvc;
    var ontologyUtilsManagerSvc;
    var ontologyManagerSvc;
    var deferred;

    beforeEach(function() {
        module('templates');
        module('searchTab');
        mockOntologyState();
        mockOntologyManager();
        mockOntologyUtilsManager();
        injectPrefixationFilter();
        injectTrustedFilter();
        injectHighlightFilter();
        injectBeautifyFilter();
        injectSplitIRIFilter();

        inject(function(_$q_, _$compile_, _$rootScope_, _ontologyStateService_, _ontologyUtilsManagerService_, _ontologyManagerService_) {
            $q = _$q_;
            deferred = _$q_.defer();
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyUtilsManagerSvc = _ontologyUtilsManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        ontologyStateSvc.state = {
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
            searchText: 'searchText'
        }
        ontologyStateSvc.selected = {
            key: [{
                '@id': 'id'
            },
            {
                '@value': 'value'
            }]
        }
        ontologyUtilsManagerSvc.isLinkable.and.callFake(function(id) {
            return !!id;
        });
        element = $compile(angular.element('<search-tab></search-tab>'))(scope);
        scope.$digest();
    });

    describe('contains the correct html', function() {
        it('for a DIV tag', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on .search-tab', function() {
            expect(element.hasClass('search-tab')).toBe(true);
        });
        it('for blocks', function() {
            var blocks = element.find('block');
            expect(blocks.length).toBe(2);
        });
        it('for block-headers', function() {
            var blockHeaders = element.find('block-header');
            expect(blockHeaders.length).toBe(2);
        });
        it('for block-contents', function() {
            var blockContents = element.find('block-content');
            expect(blockContents.length).toBe(2);
        });
        it('for error-display', function() {
            var errorDisplay = element.find('error-display');
            expect(errorDisplay.length).toBe(1);
        });
        it('for info-message', function() {
            var infoMessage = element.find('info-message');
            expect(infoMessage.length).toBe(1);
        });
        it('for .result', function() {
            var result = element.querySelectorAll('.result');
            expect(result.length).toBe(1);
        });
        it('for tree-item', function() {
            var treeItem = element.find('tree-item');
            expect(treeItem.length).toBe(1);
        });
        it('for .property-values', function() {
            var propertyValues = element.querySelectorAll('.property-values');
            expect(propertyValues.length).toBe(1);
        });
        it('for .value-container', function() {
            var valueContainers = element.querySelectorAll('.value-container');
            expect(valueContainers.length).toBe(2);
        });
        it('for .value-display', function() {
            var valueDisplays = element.querySelectorAll('.value-display');
            expect(valueDisplays.length).toBe(2);
        });
        it('for .value-display a', function() {
            var anchor = element.querySelectorAll('.value-display a');
            expect(anchor.length).toBe(1);
        });
    });
    describe('controller methods', function() {
        var controller;
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
                    expect(ontologyStateSvc.unSelectItem).toHaveBeenCalled();
                    expect(ontologyManagerSvc.getSearchResults).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyId,
                        ontologyStateSvc.state.searchText);
                });
                describe('when resolved', function() {
                    it('it sets the correct variables', function() {
                        deferred.resolve([]);
                        scope.$apply();
                        expect(ontologyStateSvc.state.errorMessage).toEqual('');
                        expect(ontologyStateSvc.state.highlightText).toEqual(ontologyStateSvc.state.searchText);
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
                        expect(ontologyStateSvc.state.results).toEqual(results);
                        expect(ontologyStateSvc.state.infoMessage).toEqual('');
                    });
                    it('where the response does not have results, sets the correct variables', function() {
                        deferred.resolve({});
                        scope.$apply();
                        expect(ontologyStateSvc.state.results).toEqual({});
                        expect(ontologyStateSvc.state.infoMessage).toEqual('There were no results for your search text.')
                    });
                });
                it('when rejected, it sets the correct variables', function() {
                    deferred.reject('error message');
                    scope.$apply();
                    expect(ontologyStateSvc.state.errorMessage).toEqual('error message');
                    expect(ontologyStateSvc.state.infoMessage).toEqual('');
                });
            });
        });
        it('onClear should reset state variables', function() {
            expect(ontologyStateSvc.state.errorMessage).not.toEqual('');
            expect(ontologyStateSvc.state.infoMessage).not.toEqual('');
            expect(ontologyStateSvc.state.results).not.toEqual({});
            expect(ontologyStateSvc.state.searchText).not.toEqual('');
            expect(ontologyStateSvc.state.selected).not.toEqual({});
            expect(ontologyStateSvc.state.highlightText).not.toEqual('');
            controller.onClear();
            expect(ontologyStateSvc.state.errorMessage).toEqual('');
            expect(ontologyStateSvc.state.infoMessage).toEqual('');
            expect(ontologyStateSvc.state.results).toEqual({});
            expect(ontologyStateSvc.state.searchText).toEqual('');
            expect(ontologyStateSvc.state.selected).toEqual({});
            expect(ontologyStateSvc.state.highlightText).toEqual('');
        });
        it('check $watch', function() {
            ontologyStateSvc.selected = {
                '@id': 'new',
                key: 'new',
                'matonto': 'new'
            }
            scope.$digest();
            expect(ontologyStateSvc.state.selected).toEqual({key: 'new'});
        });
    });
});
