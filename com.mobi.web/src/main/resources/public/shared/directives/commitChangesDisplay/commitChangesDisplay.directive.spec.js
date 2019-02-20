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
describe('Commit Changes Display directive', function() {
    var $compile, scope, utilSvc, ontologyUtilsManagerSvc;

    beforeEach(function() {
        module('templates');
        module('shared');
        mockComponent('shared', 'statementContainer');
        mockComponent('shared', 'statementDisplay');
        mockUtil();
        mockPrefixes();
        injectSplitIRIFilter();
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _utilService_, _splitIRIFilter_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
            splitIRI = _splitIRIFilter_;
            ontologyUtilsManagerSvc = _ontologyUtilsManagerService_;
        });

        scope.additions = [];
        scope.deletions = [];
        this.element = $compile(angular.element('<commit-changes-display additions="additions" deletions="deletions" click-event="clickEvent(event, id)"></commit-changes-display>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
        this.controller = this.element.controller('commitChangesDisplay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        utilSvc = null;
        ontologyUtilsManagerSvc = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('additions should be one way bound', function() {
            this.isolatedScope.additions = [{}];
            scope.$digest();
            expect(scope.additions).toEqual([]);
        });
        it('deletions should be one way bound', function() {
            this.isolatedScope.deletions = [{}];
            scope.$digest();
            expect(scope.deletions).toEqual([]);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('commit-changes-display')).toBe(true);
        });
        it('depending on whether there are additions and deletions', function() {
            expect(this.element.querySelectorAll('div.property-values').length).toBe(0);

            this.controller.list = ['id'];
            this.controller.results = {'id': {additions: [''], deletions: []}};
            scope.$digest();
            expect(this.element.querySelectorAll('div.property-values').length).toBe(this.controller.list.length);
        });
        it('depending on whether there are additions', function() {
            expect(this.element.find('statement-container').length).toBe(0);
            expect(this.element.find('statement-display').length).toBe(0);
            this.controller.list = ['id'];
            this.controller.results = {'id': {additions: [''], deletions: []}};
            scope.$digest();
            expect(this.element.find('statement-container').length).toBe(1);
            expect(this.element.find('statement-display').length).toBe(1);
        });
        it('depending on whether there are deletions', function() {
            expect(this.element.find('statement-container').length).toBe(0);
            expect(this.element.find('statement-display').length).toBe(0);
            this.controller.list = ['id'];
            this.controller.results = {'id': {additions: [], deletions: ['']}};
            scope.$digest();
            expect(this.element.find('statement-container').length).toBe(1);
            expect(this.element.find('statement-display').length).toBe(1);
        });
        it('depending on whether there are additions and deletions', function() {
            expect(this.element.find('statement-container').length).toBe(0);
            expect(this.element.find('statement-display').length).toBe(0);
            this.controller.list = ['id'];
            this.controller.results = {'id': {additions: [''], deletions: ['']}};
            scope.$digest();
            expect(this.element.find('statement-container').length).toBe(2);
            expect(this.element.find('statement-display').length).toBe(2);
        });
    });
    describe('$scope.$watch triggers when changing the', function() {
        it('additions', function() {
            scope.additions = [{'@id': 'test'}];
            scope.$apply();
            expect(this.controller.list).toEqual(['test']);
        });
        it('deletions', function() {
            scope.deletions = [{'@id': 'test'}];
            scope.$apply();
            expect(this.controller.list).toEqual(['test']);
        });
    });
});
