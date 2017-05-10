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
describe('Explore Tab directive', function() {
    var $compile, scope, element, discoverStateSvc;

    beforeEach(function() {
        module('templates');
        module('exploreTab');
        mockDiscoverState();

        inject(function(_$compile_, _$rootScope_, _discoverStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
        });

        element = $compile(angular.element('<explore-tab></explore-tab>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('explore-tab')).toBe(true);
            expect(element.hasClass('row')).toBe(true);
        });
        it('with a .col-xs-12', function() {
            expect(element.querySelectorAll('.col-xs-12').length).toBe(1);
        });
        it('with a block', function() {
            expect(element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(element.find('block-header').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(element.find('block-content').length).toBe(1);
        });
        it('with a .padding and info-message', function() {
            expect(element.querySelectorAll('.padding').length).toBe(1);
            expect(element.find('info-message').length).toBe(1);
            
            discoverStateSvc.explore.instanceDetails = [{}];
            scope.$digest();
            
            expect(element.querySelectorAll('.padding').length).toBe(0);
            expect(element.find('info-message').length).toBe(0);
        });
        it('with a .content-container, instance-details, and instance-cards', function() {
            expect(element.querySelectorAll('.content-container').length).toBe(0);
            expect(element.find('instance-details').length).toBe(0);
            expect(element.find('instance-cards').length).toBe(0);
            
            discoverStateSvc.explore.instanceDetails = [{}];
            scope.$digest();
            
            expect(element.querySelectorAll('.content-container').length).toBe(1);
            expect(element.find('instance-details').length).toBe(1);
            expect(element.find('instance-cards').length).toBe(1);
        });
    });
});