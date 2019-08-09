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
describe('Commit Changes Display component', function() {
    var $compile, scope, utilSvc;

    beforeEach(function() {
        module('templates');
        module('shared');
        mockComponent('shared', 'statementContainer');
        mockComponent('shared', 'statementDisplay');
        mockUtil();
        injectSplitIRIFilter();

        inject(function(_$compile_, _$rootScope_, _utilService_, _splitIRIFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
            splitIRI = _splitIRIFilter_;
        });

        scope.additions = [];
        scope.deletions = [];
        this.element = $compile(angular.element('<commit-changes-display additions="additions" deletions="deletions"></commit-changes-display>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('commitChangesDisplay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        utilSvc = null;
        ontologyUtilsManagerSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('additions should be one way bound', function() {
            this.controller.additions = [{}];
            scope.$digest();
            expect(scope.additions).toEqual([]);
        });
        it('deletions should be one way bound', function() {
            this.controller.deletions = [{}];
            scope.$digest();
            expect(scope.deletions).toEqual([]);
        });
    });
    describe('controller methods', function() {
        it('$onChanges should produce current number of list elements', function() {
            this.controller.additions = _.map(_.range(0, 150), i => ({'@id': `${i}`}));
            this.controller.deletions = _.map(_.range(50, 200), i => ({'@id': `${i}`}));
            utilSvc.getChangesById.and.returnValue([]);
            this.controller.$onChanges();
            expect(this.controller.list.length).toEqual(200);
            expect(this.controller.chunkList.length).toEqual(2);
            expect(this.controller.chunkList[0].length).toEqual(100);
            expect(this.controller.chunks).toEqual(1);
            expect(this.controller.results).toEqual(jasmine.objectContaining({
                '1': {additions: [], deletions: []},
                '3': {additions: [], deletions: []}
            }));
        });
        it('should get more results', function() {
            this.controller.list = ['1', '2', '3', '4'];
            this.controller.size = 2;
            this.controller.index = 0;
            this.controller.chunkList = [['1', '2'], ['3', '4']];
            this.additions = [{'@id': 'add'}];
            this.deletions = [{'@id': 'del'}];
            this.controller.additions = this.additions;
            this.controller.deletions = this.deletions;
            this.controller.results = {
                '1': {additions: this.additions, deletions: this.deletions},
                '2': {additions: this.additions, deletions: this.deletions}
            };
            utilSvc.getChangesById.and.callFake((id, arr) => arr);
            this.controller.getMoreResults();
            expect(this.controller.index).toEqual(1);
            this.controller.chunkList[1].forEach(id => {
                expect(utilSvc.getChangesById).toHaveBeenCalledWith(id, this.controller.additions);
                expect(utilSvc.getChangesById).toHaveBeenCalledWith(id, this.controller.deletions);
            });
            expect(this.controller.results).toEqual({
                '1': {additions: this.additions, deletions: this.deletions},
                '2': {additions: this.additions, deletions: this.deletions},
                '3': {additions: this.additions, deletions: this.deletions},
                '4': {additions: this.additions, deletions: this.deletions}
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('COMMIT-CHANGES-DISPLAY');
            expect(this.element.querySelectorAll('.commit-changes-display').length).toEqual(1);
        });
        it('depending on whether there are additions and deletions', function() {
            expect(this.element.querySelectorAll('div.property-values').length).toEqual(0);

            this.controller.list = ['id'];
            this.controller.results = {'id': {additions: [''], deletions: []}};
            scope.$digest();
            expect(this.element.querySelectorAll('div.property-values').length).toEqual(this.controller.list.length);
        });
        it('depending on whether there are additions', function() {
            expect(this.element.find('statement-container').length).toEqual(0);
            expect(this.element.find('statement-display').length).toEqual(0);
            this.controller.list = ['id'];
            this.controller.results = {'id': {additions: [''], deletions: []}};
            scope.$digest();
            expect(this.element.find('statement-container').length).toEqual(1);
            expect(this.element.find('statement-display').length).toEqual(1);
        });
        it('depending on whether there are deletions', function() {
            expect(this.element.find('statement-container').length).toEqual(0);
            expect(this.element.find('statement-display').length).toEqual(0);
            this.controller.list = ['id'];
            this.controller.results = {'id': {additions: [], deletions: ['']}};
            scope.$digest();
            expect(this.element.find('statement-container').length).toEqual(1);
            expect(this.element.find('statement-display').length).toEqual(1);
        });
        it('depending on whether there are additions and deletions', function() {
            expect(this.element.find('statement-container').length).toEqual(0);
            expect(this.element.find('statement-display').length).toEqual(0);
            this.controller.list = ['id'];
            this.controller.results = {'id': {additions: [''], deletions: ['']}};
            scope.$digest();
            expect(this.element.find('statement-container').length).toEqual(2);
            expect(this.element.find('statement-display').length).toEqual(2);
        });
    });
    describe('$onChanges triggers when changing the', function() {
        beforeEach(function() {
            spyOn(this.controller, '$onChanges');
        });
        it('additions', function() {
            scope.additions = [{'@id': 'test'}];
            scope.$apply();
            expect(this.controller.$onChanges).toHaveBeenCalled();
        });
        it('deletions', function() {
            scope.deletions = [{'@id': 'test'}];
            scope.$apply();
            expect(this.controller.$onChanges).toHaveBeenCalled();
        });
    });
});
