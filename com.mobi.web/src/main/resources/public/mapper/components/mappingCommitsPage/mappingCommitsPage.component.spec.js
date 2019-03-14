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
describe('Mapping Commits Page component', function() {
    var $compile, scope, mapperStateSvc;

    beforeEach(function() {
        module('templates');
        module('mapper');
        mockMapperState();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _mapperStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mapperStateSvc = _mapperStateService_;
        });

        mapperStateSvc.mapping = {record: {id: 'id'}};
        this.element = $compile(angular.element('<mapping-commits-page></mapping-commits-page>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('mappingCommitsPage');
    });

    afterEach(function () {
        $compile = null;
        scope = null;
        mapperStateSvc = null;
        this.element.remove();
    });

    describe('should initialize correctly', function() {
        beforeEach(function() {
            mapperStateSvc.setMasterBranch.calls.reset();
        });
        it('if the mapping master branch has not been set yet for an existing mapping', function() {
            mapperStateSvc.newMapping = false;
            this.controller.$onInit();
            expect(mapperStateSvc.setMasterBranch).toHaveBeenCalled();
        });
        it('if the mapping master branch has not been set yet for a new mapping', function() {
            mapperStateSvc.newMapping = true;
            this.controller.$onInit();
            expect(mapperStateSvc.setMasterBranch).not.toHaveBeenCalled();
        });
        it('if the mapping master branch has been retrieved already', function() {
            mapperStateSvc.mapping.branch = {};
            mapperStateSvc.newMapping = false;
            this.controller.$onInit();
            expect(mapperStateSvc.setMasterBranch).not.toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('MAPPING-COMMITS-PAGE');
            expect(this.element.querySelectorAll('.mapping-commits-page').length).toEqual(1);
            expect(this.element.querySelectorAll('.row').length).toEqual(1);
            expect(this.element.querySelectorAll('.col-8').length).toEqual(1);
        });
        ['block', 'block-header', 'block-content', 'commit-history-table'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
    });
});
