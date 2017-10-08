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
describe('Analytics Page directive', function() {
    var $compile, scope, element, analyticStateSvc;

    beforeEach(function() {
        module('templates');
        module('analyticsPageContent');
        mockAnalyticState();

        inject(function(_$compile_, _$rootScope_, _analyticStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            analyticStateSvc = _analyticStateService_;
        });
        
        element = $compile(angular.element('<analytics-page-content></analytics-page-content>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('analytics-page-content')).toBe(true);
            expect(element.hasClass('full-height')).toBe(true);
        });
        it('with a analytics-landing-page', function() {
            expect(element.find('analytics-landing-page').length).toBe(1);
            analyticStateSvc.landing = false;
            scope.$apply();
            expect(element.find('analytics-landing-page').length).toBe(0);
        });
        it('with a analytics-editor-page', function() {
            expect(element.find('analytics-editor-page').length).toBe(0);
            analyticStateSvc.editor = true;
            scope.$apply();
            expect(element.find('analytics-editor-page').length).toBe(1);
        });
    });
});