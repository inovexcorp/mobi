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
describe('Class Details directive', function() {
    var $compile, scope, element, discoverStateSvc;

    beforeEach(function() {
        module('templates');
        module('classDetails');
        mockDiscoverState();

        inject(function(_$compile_, _$rootScope_, _discoverStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
        });

        discoverStateSvc.explore.classDetails = [{
            label: 'label',
            count: 1,
            examples: ['example1', 'example2'],
            overview: 'overview',
            ontologyId: 'ontologyId'
        }];
        element = $compile(angular.element('<class-details></class-details>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('class-details')).toBe(true);
        });
        it('with a .list-wrapper.full-height', function() {
            expect(element.querySelectorAll('.list-wrapper.full-height').length).toBe(1);
        });
        it('with a .list-item-wrapper', function() {
            expect(element.querySelectorAll('.list-item-wrapper').length).toBe(1);
        });
        it('with a md-list-item', function() {
            expect(element.find('md-list-item').length).toBe(1);
        });
        it('with a .md-title', function() {
            expect(element.querySelectorAll('.md-title').length).toBe(1);
        });
    });
});