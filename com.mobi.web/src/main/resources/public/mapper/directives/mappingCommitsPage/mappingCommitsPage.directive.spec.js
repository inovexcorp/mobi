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
describe('Mapping Commits Page directive', function() {
    var $compile, scope, mapperStateSvc;

    beforeEach(function() {
        module('templates');
        module('mappingCommitsPage');
        mockMapperState();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _mapperStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mapperStateSvc = _mapperStateService_;
        });

        mapperStateSvc.mapping = {record: {id: 'id'}};
    });

    beforeEach(function compile() {
        this.compile = function(newMapping) {
            mapperStateSvc.newMapping = newMapping;
            this.element = $compile(angular.element('<mapping-commits-page></mapping-commits-page>'))(scope);
            scope.$digest();
        };
    });

    afterEach(function () {
        $compile = null;
        scope = null;
        mapperStateSvc = null;
        this.element.remove();
    });

    describe('should initialize correctly', function() {
        it('if the mapping master branch has not been set yet for an existing mapping', function() {
            this.compile(false);
            expect(mapperStateSvc.setMasterBranch).toHaveBeenCalled();
        });
        it('if the mapping master branch has not been set yet for a new mapping', function() {
            this.compile(true);
            expect(mapperStateSvc.setMasterBranch).not.toHaveBeenCalled();
        });
        it('if the mapping master branch has been retrieved already', function() {
            mapperStateSvc.mapping.branch = {};
            this.compile(false);
            expect(mapperStateSvc.setMasterBranch).not.toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.compile(false);
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('mapping-commits-page')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
            expect(this.element.querySelectorAll('.col-8').length).toBe(1);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(this.element.find('block-header').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('with a commit-history-table', function() {
            expect(this.element.find('commit-history-table').length).toBe(1);
        });
    });
});
