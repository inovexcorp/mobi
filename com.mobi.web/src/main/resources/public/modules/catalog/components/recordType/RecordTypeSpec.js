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
describe('Record Type component', function() {
    var $compile, scope, catalogManagerSvc, utilSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('catalog');
        mockCatalogManager();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _catalogManagerService_, _utilService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        catalogManagerSvc.coreRecordTypes = ['core']
        catalogManagerSvc.recordTypes = ['core', 'typeA', 'typeB'];
        utilSvc.getBeautifulIRI.and.callFake(_.identity);

        scope.record = {'@type': ['core', 'typeA']};
        this.element = $compile(angular.element('<record-type record="record"></record-type>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('recordType');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        catalogManagerSvc = null;
        utilSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('record should be one way bound', function() {
            this.controller.record = {};
            scope.$digest();
            expect(scope.record).not.toEqual({});
        });
    });
    describe('initializes correctly', function() {
        describe('with a type', function() {
            it('if it is a recognized type', function() {
                expect(this.controller.type).toEqual('typeA');
            });
            it('if it is not a recognized type', function() {
                scope.record['@type'] = ['test'];
                this.controller.$onChanges();
                expect(this.controller.type).toEqual(prefixes.catalog + 'Record');                
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('RECORD-TYPE');
            expect(this.element.querySelectorAll('.record-type').length).toEqual(1);
        });
    });
});