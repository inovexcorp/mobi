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
describe('Analytics Landing Page directive', function() {
    var $compile, scope, element, controller;

    beforeEach(function() {
        module('templates');
        module('analyticsLandingPage');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
        
        element = $compile(angular.element('<analytics-landing-page></analytics-landing-page>'))(scope);
        scope.$digest();
        controller = element.controller('analyticsLandingPage');
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('analytics-landing-page')).toBe(true);
            expect(element.hasClass('full-height')).toBe(true);
            expect(element.hasClass('clearfix')).toBe(true);
        });
        it('with a .blue-bar', function() {
            expect(element.querySelectorAll('.blue-bar').length).toBe(1);
        });
        it('with a .white-bar', function() {
            expect(element.querySelectorAll('.white-bar').length).toBe(1);
        });
        it('with a .row', function() {
            expect(element.querySelectorAll('.row').length).toBe(1);
        });
        it('with a .col-xs-8', function() {
            expect(element.querySelectorAll('.col-xs-8').length).toBe(1);
        });
        it('with a block', function() {
            expect(element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(element.find('block-header').length).toBe(1);
        });
        it('with a new-analytic-overlay', function() {
            expect(element.find('new-analytic-overlay').length).toBe(0);
            controller.showOverlay = true;
            scope.$apply();
            expect(element.find('new-analytic-overlay').length).toBe(1);
        });
    });
});