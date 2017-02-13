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
describe('Commit History Table directive', function() {
    var $compile, scope, $q, element;
    var error = 'error';

    beforeEach(function() {
        module('templates');
        module('commitHistoryTable');
        mockOntologyState();
        mockCatalogManager();
        mockUtil();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        element = $compile(angular.element('<commit-history-table></commit-history-table>'))(scope);
        scope.$digest();
        controller = element.controller('commitHistoryTable');
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('commit-history-table')).toBe(true);
        });
        _.forEach(['table', 'thead', 'tbody'], function(item) {
            it('for ' + item, function() {
                expect(element.find(item).length).toBe(1);
            });
        });
        it('for error-display', function() {
            expect(element.find('error-display').length).toBe(0);
            controller.error = error;
            scope.$apply();
            expect(element.find('error-display').length).toBe(1);
        });
        it('for th', function() {
            expect(element.find('th').length).toBe(4);
        });
    });
});
