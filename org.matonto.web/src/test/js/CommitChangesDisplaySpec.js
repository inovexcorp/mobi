/*-
 * #%L
 * org.matonto.web
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
        utilSvc;

    beforeEach(function() {
        module('templates');
        module('commitChangesDisplay');
        mockUtil();
        mockPrefixes();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _utilService_, _splitIRIFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
            splitIRI = _splitIRIFilter_;
        });

        scope.additions = [];
        scope.deletions = [];
        scope.clickEvent = jasmine.createSpy('clickEvent');
        element = $compile(angular.element('<commit-changes-display additions="additions" deletions="deletions" click-event="clickEvent(event, id)"></commit-changes-display>'))(scope);
        scope.$digest();
        isolatedScope = element.isolateScope();
        controller = element.controller('commitChangesDisplay');
    });

    describe('in insolated scope', function() {
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
    describe('controller bound variable', function() {
        it('clickEvent is called in parent scope when invoked', function() {
            isolatedScope.clickEvent();
            expect(scope.clickEvent).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('commit-changes-display')).toBe(true);
        });
        it('depending on whether there are additions and deletions', function() {
            expect(element.querySelectorAll('div.property-values').length).toBe(0);

            controller.list = [''];
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
        it('depending on whether there are additions', function() {
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
    describe('controller methods', function() {
        /*it('should get the additions of the changes to an entity', function() {
            scope.additions = [{'@id': 'A', 'test': [{'@id': 'test'}]}];
            scope.$digest();
            expect(controller.getAdditions('A')).toEqual([{p: 'test', o: {'@id': 'test'}}]);
            expect(controller.getAdditions('B')).toEqual([]);
        });
        it('should get the deletions of the changes to an entity', function() {
            scope.deletions = [{'@id': 'A', 'test': [{'@id': 'test'}]}];
            scope.$digest();
            expect(controller.getDeletions('A')).toEqual([{p: 'test', o: {'@id': 'test'}}]);
            expect(controller.getDeletions('B')).toEqual([]);
        });*/
        it('orderByPredicate should return the correct value', function() {
            splitIRI.and.returnValue({end: 'end'});
            expect(controller.orderByPredicate({p: 'test'})).toBe('end');
            expect(splitIRI).toHaveBeenCalledWith('test');
        });
    });
    it('should call clickEvent when an entity title is clicked', function() {
        controller.list = ['test'];
        scope.$digest();
        var link = angular.element(element.querySelectorAll('h5 a')[0]);
        link.triggerHandler('click');
        expect(scope.clickEvent).toHaveBeenCalledWith(jasmine.any(Object), 'test');
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