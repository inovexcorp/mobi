/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
describe('Statement Container component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('shared');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        this.element = $compile(angular.element('<statement-container></statement-container>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('statementContainer');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('STATEMENT-CONTAINER');
            expect(this.element.querySelectorAll('.statement-container').length).toEqual(1);
        });
        it('without a h5', function() {
            expect(this.element.find('h5').length).toEqual(0);
        });
        it('with a h5 when additions attribute is set', function() {
            this.element = $compile(angular.element('<statement-container additions></statement-container>'))(scope);
            scope.$digest();
            expect(this.element.querySelectorAll('.additions').length).toEqual(1);
            expect(this.element.find('h5').length).toEqual(1);
            expect(angular.element(this.element.find('h5')[0]).text()).toEqual('Added Statements');
        });
        it('with a h5 when deletions attribute is set', function() {
            this.element = $compile(angular.element('<statement-container deletions></statement-container>'))(scope);
            scope.$digest();
            expect(this.element.querySelectorAll('.deletions').length).toEqual(1);
            expect(this.element.find('h5').length).toEqual(1);
            expect(angular.element(this.element.find('h5')[0]).text()).toEqual('Deleted Statements');
        });
    });
});
