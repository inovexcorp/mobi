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
    var $compile, scope, ontologyStateSvc;

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
        this.controller = this.element.controller('commitsTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('commits-tab')).toBe(true);
        });
        it('with a .col-8', function() {
            expect(this.element.querySelectorAll('.col-8').length).toBe(1);
        });
        it('with a .section-header', function() {
            expect(this.element.querySelectorAll('.section-header').length).toBe(1);
        });
        it('with a commit-history-table', function() {
            expect(this.element.find('commit-history-table').length).toBe(1);
        });
        it('depending on how many commits there are', function() {
            expect(this.element.querySelectorAll('.view-table').length).toEqual(0);

            this.controller.commits = [{id: '1'}, {id: '2'}];
            scope.$digest();
            expect(this.element.querySelectorAll('.view-table').length).toEqual(1);
            expect(this.element.querySelectorAll('.view-table tbody tr').length).toEqual(this.controller.commits.length);
        });
        it('depending on whether the user has saved changes', function() {
            ontologyStateSvc.hasChanges.and.returnValue(false);
            this.controller.commits = [{id: 'commit'}];
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.view-table tbody button')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            ontologyStateSvc.hasChanges.and.returnValue(true);
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        it('should get the currently selected branch', function() {
            var branch = {'@id': 'branchId', 'http://purl.org/dc/terms/title': [{'@value': 'title'}]};
            ontologyStateSvc.listItem = {branches: [branch], ontologyRecord: {branchId: branch['@id']}};
            this.controller.getBranchTitle();
            expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(branch, 'title');
        });
        it('should open the ontology at a commit', function() {
            this.controller.openOntologyAtCommit({id: 'commit'});
            expect(ontologyStateSvc.updateOntologyWithCommit).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, 'commit');
        });
    });
    it('should open an ontology at a commit when its view button is clicked', function() {
        this.controller.commits = [{id: 'commit'}];
        scope.$digest();
        spyOn(this.controller, 'openOntologyAtCommit');

        var button = angular.element(this.element.querySelectorAll('.view-table tbody button')[0]);
        button.triggerHandler('click');
        expect(this.controller.openOntologyAtCommit).toHaveBeenCalledWith({id: 'commit'});
    });
});
