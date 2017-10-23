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
describe('Commit Changes Display directive', function() {
    var $compile,
        scope,
        element,
        isolatedScope,
        controller,
        utilSvc,
        ontologyUtilsManagerSvc;

    beforeEach(function() {
        module('templates');
        module('commitChangesDisplay');
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
        element = $compile(angular.element('<commit-changes-display additions="additions" deletions="deletions" click-event="clickEvent(event, id)"></commit-changes-display>'))(scope);
        scope.$digest();
        isolatedScope = element.isolateScope();
        controller = element.controller('commitChangesDisplay');
    });

    describe('in isolated scope', function() {
        it('additions should be one way bound', function() {
            isolatedScope.additions = [{}];
            scope.$digest();
            expect(scope.additions).toEqual([]);
        });
        it('deletions should be one way bound', function() {
            isolatedScope.deletions = [{}];
            scope.$digest();
            expect(scope.deletions).toEqual([]);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('commit-changes-display')).toBe(true);
        });
        it('depending on whether there are additions and deletions', function() {
            expect(element.querySelectorAll('div.property-values').length).toBe(0);

            controller.list = ['id'];
            controller.results = {'id': {additions: [''], deletions: []}};
            scope.$digest();
            expect(element.querySelectorAll('div.property-values').length).toBe(controller.list.length);
        });
        it('depending on whether there are additions', function() {
            expect(element.find('statement-container').length).toBe(0);
            expect(element.find('statement-display').length).toBe(0);
            controller.list = ['id'];
            controller.results = {'id': {additions: [''], deletions: []}};
            scope.$digest();
            expect(element.find('statement-container').length).toBe(1);
            expect(element.find('statement-display').length).toBe(1);
        });
        it('depending on whether there are deletions', function() {
            expect(element.find('statement-container').length).toBe(0);
            expect(element.find('statement-display').length).toBe(0);
            controller.list = ['id'];
            controller.results = {'id': {additions: [], deletions: ['']}};
            scope.$digest();
            expect(element.find('statement-container').length).toBe(1);
            expect(element.find('statement-display').length).toBe(1);
        });
        it('depending on whether there are additions and deletions', function() {
            expect(element.find('statement-container').length).toBe(0);
            expect(element.find('statement-display').length).toBe(0);
            controller.list = ['id'];
            controller.results = {'id': {additions: [''], deletions: ['']}};
            scope.$digest();
            expect(element.find('statement-container').length).toBe(2);
            expect(element.find('statement-display').length).toBe(2);
        });
    });
    describe('$scope.$watch triggers when changing the', function() {
        it('additions', function() {
            scope.additions = [{'@id': 'test'}];
            scope.$apply();
            expect(controller.list).toEqual(['test']);
        });
        it('deletions', function() {
            scope.deletions = [{'@id': 'test'}];
            scope.$apply();
            expect(controller.list).toEqual(['test']);
        });
    });
});
