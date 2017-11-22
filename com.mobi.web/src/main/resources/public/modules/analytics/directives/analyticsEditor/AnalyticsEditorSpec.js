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
describe('Analytics Editor directive', function() {
    var $compile, scope, analyticStateSvc;

    beforeEach(function() {
        module('templates');
        module('analyticsEditor');
        mockAnalyticState();

        inject(function(_$compile_, _$rootScope_, _analyticStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            analyticStateSvc = _analyticStateService_;
        });

        this.element = $compile(angular.element('<analytics-editor></analytics-editor>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        analyticStateSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('analytics-editor')).toBe(true);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('with .rows', function() {
            expect(this.element.querySelectorAll('.row').length).toBe(2);
        });
        it('with a .property-area', function() {
            expect(this.element.querySelectorAll('.property-area').length).toBe(1);
        });
        it('with a md-chips', function() {
            expect(this.element.find('md-chips').length).toBe(0);
            analyticStateSvc.selectedProperties = [{}];
            scope.$apply();
            expect(this.element.find('md-chips').length).toBe(1);
        });
        it('with a md-chip-template', function() {
            expect(this.element.find('md-chip-template').length).toBe(0);
            analyticStateSvc.selectedProperties = [{}];
            scope.$apply();
            expect(this.element.find('md-chip-template').length).toBe(1);
        });
        it('with a .class-area', function() {
            expect(this.element.querySelectorAll('.class-area').length).toBe(1);
        });
        it('with a .table-area', function() {
            expect(this.element.querySelectorAll('.table-area').length).toBe(1);
        });
        it('with a error-display', function() {
            expect(this.element.find('error-display').length).toBe(0);
            analyticStateSvc.queryError = 'error';
            scope.$apply();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('with a .table-wrapper', function() {
            expect(this.element.querySelectorAll('.table-wrapper').length).toBe(1);
        });
        it('with a sortable-table', function() {
            expect(this.element.find('sortable-table').length).toBe(1);
        });
        it('with a .paging-wrapper', function() {
            expect(this.element.querySelectorAll('.paging-wrapper').length).toBe(0);
            analyticStateSvc.results = {};
            scope.$apply();
            expect(this.element.querySelectorAll('.paging-wrapper').length).toBe(1);
        });
        it('with a paging-details', function() {
            expect(this.element.find('paging-details').length).toBe(0);
            analyticStateSvc.results = {};
            scope.$apply();
            expect(this.element.find('paging-details').length).toBe(1);
        });
        it('with a pagination', function() {
            expect(this.element.find('pagination').length).toBe(0);
            analyticStateSvc.results = {};
            scope.$apply();
            expect(this.element.find('pagination').length).toBe(1);
        });
    });
});