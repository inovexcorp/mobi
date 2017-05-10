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
describe('Instance Cards directive', function() {
    var $compile, scope, element, discoverStateSvc;

    beforeEach(function() {
        module('templates');
        module('instanceCards');
        mockDiscoverState();

        inject(function(_$compile_, _$rootScope_, _discoverStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
        });

        discoverStateSvc.explore.instanceDetails = [{
            label: 'label',
            count: 1,
            examples: ['example1', 'example2'],
            overview: 'overview',
            ontologyId: 'ontologyId'
        }];
        element = $compile(angular.element('<instance-cards></instance-cards>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('instance-cards')).toBe(true);
        });
        it('with a .row', function() {
            expect(element.querySelectorAll('.row').length).toBe(1);
        });
        it('with a .col-xs-4', function() {
            expect(element.querySelectorAll('.col-xs-4').length).toBe(1);
        });
        it('with a md-card', function() {
            expect(element.find('md-card').length).toBe(1);
        });
        it('with a md-card-title', function() {
            expect(element.find('md-card-title').length).toBe(1);
        });
        it('with a md-card-title-text', function() {
            expect(element.find('md-card-title-text').length).toBe(1);
        });
        it('with a .card-header', function() {
            expect(element.querySelectorAll('.card-header').length).toBe(1);
        });
        it('with a .md-headline.text', function() {
            expect(element.querySelectorAll('.md-headline.text').length).toBe(1);
        });
        it('with a .badge', function() {
            expect(element.querySelectorAll('.badge').length).toBe(1);
        });
        it('with a md-card-content', function() {
            expect(element.find('md-card-content').length).toBe(1);
        });
        it('with a .instance-overview', function() {
            expect(element.querySelectorAll('.instance-overview').length).toBe(1);
        });
        it('with a .text-muted', function() {
            expect(element.querySelectorAll('.text-muted').length).toBe(2);
        });
    });
});