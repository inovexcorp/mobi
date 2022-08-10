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
    injectTrustedFilter
} from '../../../../../../test/js/Shared';

describe('SPARQL Result Table component', function() {
    var $compile, scope;

    beforeEach(function() {
        angular.mock.module('discover');
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.data = [
            {
                var1: {type: 'a-type1', value: 'a-value1'},
                var2: {type: 'a-type2', value: 'a-value2'}
            },
            {
                var1: {type: 'b-type1', value: 'b-value1'},
                var2: {type: 'b-type2', value: 'b-value2'}
            }
        ];
        scope.bindings = ['var1', 'var2'];
        scope.headers = {var1: 'var1', var2: 'var2'};
        this.element = $compile(angular.element('<sparql-result-table bindings="bindings" data="data" headers="headers"></sparql-result-table>'))(scope);
        // fixture.detectChanges(); // scope.$digest();
        this.controller = this.element.controller('sparqlResultTable');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('data is one way bound', function() {
            var copy = angular.copy(component.data);
            component.data = [];
            // fixture.detectChanges(); // scope.$digest();
            expect(scope.data).toEqual(copy);
        });
        it('bindings is one way bound', function() {
            var copy = angular.copy(component.bindings);
            component.bindings = [];
            // fixture.detectChanges(); // scope.$digest();
            expect(scope.bindings).toEqual(copy);
        });
        it('headers is one way bound', function() {
            var copy = angular.copy(component.headers);
            component.headers = [];
            // fixture.detectChanges(); // scope.$digest();
            expect(scope.headers).toEqual(copy);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('SPARQL-RESULT-TABLE');
        });
        it('depending on how many binding names there are', function() {
            var theadList = element.queryAll(By.css('thead'));
            expect(this.element.html()).not.toContain('None');
            expect(theadList.length).toBe(1);
            var thead = theadList[0];
            expect(thead.querySelectorAll('th').length).toBe(component.bindings.length);
        });
        it('depending on how many results there are', function() {
            var tbodyList = element.queryAll(By.css('tbody'));
            expect(this.element.html()).not.toContain('None');
            expect(tbodyList.length).toBe(1);
            var tbody = tbodyList[0];
            expect(tbody.querySelectorAll('tr').length).toBe(component.data.length);
        });
    });
});
