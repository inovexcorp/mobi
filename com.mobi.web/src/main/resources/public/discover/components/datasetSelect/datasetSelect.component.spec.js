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
describe('Dataset Select component', function() {
    var $compile, scope, datasetManagerSvc;

    beforeEach(function() {
        module('templates');
        module('discover');
        injectTrustedFilter();
        injectHighlightFilter();
        mockUtil();
        mockDatasetManager();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _datasetManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            datasetManagerSvc = _datasetManagerService_;
        });

        datasetManagerSvc.datasetRecords = [[]];
        datasetManagerSvc.splitDatasetArray.and.returnValue({});
        scope.bindModel = '';
        scope.changeEvent = jasmine.createSpy('changeEvent');
        this.element = $compile(angular.element('<dataset-select bind-model="bindModel" change-event="changeEvent(value)"></dataset-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('datasetSelect');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    it('initializes with the correct value for datasetRecords', function() {
        expect(this.controller.datasetRecords).toEqual([{}]);
    });
    describe('controller bound variable', function() {
        it('bindModel should be one way bound', function() {
            this.controller.bindModel = 'Test';
            scope.$digest();
            expect(scope.bindModel).toEqual('');
        });
        it('changeEvent should be called in the parent scope', function() {
            this.controller.changeEvent({value: 'Test'});
            expect(scope.changeEvent).toHaveBeenCalledWith('Test');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DATASET-SELECT');
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toBe(1);
        });
        it('with a ui-select-match', function() {
            expect(this.element.find('ui-select-match').length).toBe(1);
        });
        it('with a ui-select-choices', function() {
            expect(this.element.find('ui-select-choices').length).toBe(1);
        });
    });
});
