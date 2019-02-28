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
describe('Open Record Button component', function() {
    var $compile, scope, prefixes;

    beforeEach(function() {
        module('templates');
        module('catalog');
        mockCatalogManager();
        mockCatalogState();
        mockMappingManager();
        mockMapperState();
        mockOntologyState();
        mockPolicyEnforcement();
        mockPolicyManager();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            prefixes = _prefixes_;
        });

        scope.record = {
            '@id': 'recordId',
            '@type': [prefixes.catalog + 'Record']
        };
        scope.stopProp = '';
        this.element = $compile(angular.element('<open-record-button record="record" stop-prop="stopProp"></open-record-button>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('openRecordButton');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('should initialize', function() {

    });
    describe('controller bound variable', function() {
        it('record is one way bound', function() {
            var copy = angular.copy(scope.record);
            this.controller.record = {};
            scope.$digest();
            expect(scope.record).toEqual(copy);
        });
        it('stopProp is one way bound', function() {
            this.controller.stopProp = undefined;
            scope.$digest();
            expect(scope.stopProp).toEqual('');
        });
    });
    describe('controller methods', function() {

    });
    describe('contains the correct html', function() {

    });
});