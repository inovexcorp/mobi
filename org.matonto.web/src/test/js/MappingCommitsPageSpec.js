/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
    var $compile, scope, element, mapperStateSvc;

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
        mapperStateSvc.newMapping = false;
        element = $compile(angular.element('<mapping-commits-page></mapping-commits-page>'))(scope);
        scope.$digest();
    });

    describe('should initialize correctly', function() {
        it('if the mapping master branch has not been set yet for an existing mapping', function() {
            expect(mapperStateSvc.setMasterBranch).toHaveBeenCalled();
        });
        it('if the mapping master branch has not been set yet for a new mapping', function() {
            mapperStateSvc.newMapping = true;
            mapperStateSvc.setMasterBranch.calls.reset();
            element = $compile(angular.element('<mapping-commits-page></mapping-commits-page>'))(scope);
            scope.$digest();
            expect(mapperStateSvc.setMasterBranch).not.toHaveBeenCalled();
        });
        it('if the mapping master branch has been retrieved already', function() {
            mapperStateSvc.mapping.branch = {};
            mapperStateSvc.setMasterBranch.calls.reset();
            element = $compile(angular.element('<mapping-commits-page></mapping-commits-page>'))(scope);
            scope.$digest();
            expect(mapperStateSvc.setMasterBranch).not.toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('mapping-commits-page')).toBe(true);
            expect(element.hasClass('row')).toBe(true);
            expect(element.querySelectorAll('.col-xs-8').length).toBe(1);
        });
        it('with a block', function() {
            expect(element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(element.find('block-header').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(element.find('block-content').length).toBe(1);
        });
        it('depending on whether a new mapping is being created', function() {
            expect(element.find('p').length).toBe(0);
            expect(element.find('commit-history-table').length).toBe(1);

            mapperStateSvc.newMapping = true;
            scope.$digest();
            expect(element.find('p').length).toBe(1);
            expect(element.find('commit-history-table').length).toBe(0);
        });
    });
});