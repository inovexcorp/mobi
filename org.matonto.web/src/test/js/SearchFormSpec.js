/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
describe('Search Form directive', function() {
    var $compile, scope, $q, element, controller, searchSvc, discoverStateSvc, exploreSvc;

    beforeEach(function() {
        module('templates');
        module('searchForm');
        mockDiscoverState();
        mockSearch();
        mockExplore();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$q_, _searchService_, _discoverStateService_, _exploreService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            searchSvc = _searchService_;
            discoverStateSvc = _discoverStateService_;
            exploreSvc = _exploreService_;
        });

        discoverStateSvc.search.queryConfig.filters = [{
            title: 'title',
            range: 'range',
            display: 'display'
        }];

        element = $compile(angular.element('<search-form></search-form>'))(scope);
        scope.$digest();
        controller = element.controller('searchForm');
    });

    describe('controller methods', function() {
        describe('should submit the search query', function() {
            beforeEach(function() {
                discoverStateSvc.search.results = {};
            });
            it('unless an error occurs', function() {
                searchSvc.submitSearch.and.returnValue($q.reject('Error Message'));
                controller.submit();
                scope.$apply();
                expect(searchSvc.submitSearch).toHaveBeenCalledWith(discoverStateSvc.search.datasetRecordId, discoverStateSvc.search.queryConfig);
                expect(controller.errorMessage).toEqual('Error Message');
                expect(discoverStateSvc.search.results).toBeUndefined();
            });
            it('and set the results', function() {
                searchSvc.submitSearch.and.returnValue($q.when({head: {}}));
                controller.submit();
                scope.$apply();
                expect(searchSvc.submitSearch).toHaveBeenCalledWith(discoverStateSvc.search.datasetRecordId, discoverStateSvc.search.queryConfig);
                expect(controller.errorMessage).toEqual('');
                expect(discoverStateSvc.search.results).toEqual({head: {}});
            });
        });
        describe('getTypes calls the proper method when getClassDetails', function() {
            beforeEach(function() {
                discoverStateSvc.search.datasetRecordId = 'id';
                discoverStateSvc.search.typeObject = {key: []};
            });
            it('resolves', function() {
                exploreSvc.getClassDetails.and.returnValue($q.when([{ontologyRecordTitle: 'title', prop: 'details'}]));
                controller.getTypes();
                scope.$apply();
                expect(discoverStateSvc.search.queryConfig.types).toEqual([]);
                expect(exploreSvc.getClassDetails).toHaveBeenCalledWith('id');
                expect(angular.copy(discoverStateSvc.search.typeObject)).toEqual({title: [{ontologyRecordTitle: 'title', prop: 'details'}]});
                expect(controller.errorMessage).toBe('');
            });
            it('rejects', function() {
                exploreSvc.getClassDetails.and.returnValue($q.reject('error'));
                controller.getTypes();
                scope.$apply();
                expect(discoverStateSvc.search.queryConfig.types).toEqual([]);
                expect(exploreSvc.getClassDetails).toHaveBeenCalledWith('id');
                expect(discoverStateSvc.search.typeObject).toEqual({});
                expect(controller.errorMessage).toBe('error');
            });
        });
        describe('getSelectedText returns the correct text when queryConfig.types', function() {
            it('is empty', function() {
                expect(controller.getSelectedText()).toBe('');
            });
            it('has values', function() {
                discoverStateSvc.search.queryConfig.types = [{classTitle: 'title1'}, {classTitle: 'title2'}];
                expect(controller.getSelectedText()).toBe('title1, title2');
            });
        });
        it('removeFilter should remove the filter associated with the provided index', function() {
            var data = [{
                prop: 'removed'
            }, {
                prop: 'saved'
            }];
            var expected = [{
                prop: 'saved'
            }];
            discoverStateSvc.search.queryConfig.filters = angular.copy(data);
            controller.removeFilter(0);
            expect(discoverStateSvc.search.queryConfig.filters).toEqual(expected);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('search-form')).toBe(true);
        });
        it('with a block', function() {
            expect(element.find('block').length).toEqual(1);
        });
        it('with a block-content', function() {
            expect(element.find('block-content').length).toEqual(1);
        });
        it('with a .strike', function() {
            expect(element.querySelectorAll('.strike').length).toEqual(3);
        });
        it('with a dataset-form-group', function() {
            expect(element.find('dataset-form-group').length).toEqual(1);
        });
        it('with a block-footer', function() {
            expect(element.find('block-footer').length).toEqual(1);
        });
        it('with a custom-label', function() {
            expect(element.find('custom-label').length).toEqual(3);
        });
        it('with a md-chips', function() {
            expect(element.find('md-chips').length).toEqual(1);
        });
        it('with a .properties-container', function() {
            expect(element.querySelectorAll('.properties-container').length).toEqual(1);
        });
        it('with a .header-wrapper', function() {
            expect(element.querySelectorAll('.header-wrapper').length).toEqual(1);
        });
        it('with a .property-link', function() {
            expect(element.querySelectorAll('.property-link').length).toEqual(1);
        });
        it('with a md-list', function() {
            expect(element.find('md-list').length).toEqual(1);
        });
        it('with a md-list-item', function() {
            expect(element.find('md-list-item').length).toEqual(1);
        });
        it('with a .md-list-item-text', function() {
            expect(element.querySelectorAll('.md-list-item-text').length).toEqual(1);
        });
        it('with a .md-list-item-text h3', function() {
            expect(element.querySelectorAll('.md-list-item-text h3').length).toEqual(1);
        });
        it('with .md-list-item-text ps', function() {
            expect(element.querySelectorAll('.md-list-item-text p').length).toEqual(2);
        });
        it('with a .md-list-item-text md-icon', function() {
            expect(element.querySelectorAll('.md-list-item-text md-icon').length).toEqual(1);
        });
        it('with a button to submit', function() {
            var buttons = element.querySelectorAll('[type="submit"]');
            expect(buttons.length).toEqual(1);
            expect(buttons.text()).toContain('Submit');
        });
        it('depending on whether an error has occurred', function() {
            expect(element.find('error-display').length).toEqual(0);

            controller.errorMessage = 'Test';
            scope.$digest();
            expect(element.find('error-display').length).toEqual(1);
        });
    });
});
