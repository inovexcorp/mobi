/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { 
    mockComponent,
    mockYasguiService,
    mockSparqlManager,
    mockDiscoverState
} from '../../../../../../../test/js/Shared';

describe('Query Tab component', function() {
    var $compile, scope, yasguiSvc;

    beforeEach(function() {
        angular.mock.module('query');
        mockComponent('discover', 'datasetFormGroup');
        mockYasguiService();
        mockSparqlManager();
        mockDiscoverState();

        inject(function(_$compile_, _$rootScope_, _yasguiService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            yasguiSvc = _yasguiService_;
        });

        this.element = $compile(angular.element('<query-tab></query-tab>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        yasguiSvc = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('QUERY-TAB');
        });
        ['.discover-query', '.bg-white', 'dataset-form-group'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.querySelectorAll(test).length).toBe(1);
            });
        });
    });
    //TODO: Test for the button
});
