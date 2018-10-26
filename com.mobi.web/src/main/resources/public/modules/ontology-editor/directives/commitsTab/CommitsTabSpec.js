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
describe('Commits Tab directive', function() {
    var $compile, scope, $q, ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('commitsTab');
        mockOntologyState();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            utilSvc = _utilService_;
        });

        this.element = $compile(angular.element('<commits-tab></commits-tab>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('commits-tab')).toBe(true);
        });
        it('with a .section-header', function() {
            expect(this.element.querySelectorAll('.section-header').length).toBe(1);
        });
        it('with a .col-8', function() {
            expect(this.element.querySelectorAll('.col-8').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.controller = this.element.controller('commitsTab');
        });
        it('should get the currently selected branch', function() {
            var branch = {'@id': 'branchId', 'http://purl.org/dc/terms/title': [{'@value': 'title'}]};
            ontologyStateSvc.listItem = {branches: [branch], ontologyRecord: {branchId: branch['@id']}};
            this.controller.getBranchTitle();
            expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(branch, 'title');
        });
    });
});
