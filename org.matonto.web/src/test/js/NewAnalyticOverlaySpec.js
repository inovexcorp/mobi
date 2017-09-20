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
describe('Class And Property Block directive', function() {
    var $q, $compile, scope, element, controller, analyticStateSvc, datasetManagerSvc, prefixes, utilSvc;

    beforeEach(function() {
        module('templates');
        module('newAnalyticOverlay');
        mockAnalyticState();
        mockDatasetManager();
        mockPrefixes();
        mockUtil();

        inject(function(_$q_, _$compile_, _$rootScope_, _analyticStateService_, _datasetManagerService_, _prefixes_, _utilService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            analyticStateSvc = _analyticStateService_;
            datasetManagerSvc = _datasetManagerService_;
            prefixes = _prefixes_;
            utilSvc = _utilService_;
        });
        
        compileElement();
    });

    describe('controller bound variables', function() {
        it('onCancel to be called in parent scope', function() {
            controller.onCancel();
            expect(scope.onCancel).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('new-analytic-overlay')).toBe(true);
            expect(element.hasClass('overlay')).toBe(true);
        });
        it('with a form', function() {
            expect(element.find('form').length).toBe(1);
        });
        it('with a h1', function() {
            expect(element.find('h1').length).toBe(1);
        });
        it('with a h2', function() {
            expect(element.find('h2').length).toBe(1);
        });
        it('with a md-list', function() {
            expect(element.find('md-list').length).toBe(1);
        });
        it('with a md-list-item', function() {
            expect(element.find('md-list-item').length).toBe(0);
            controller.datasets = [{id: 'datasetId'}];
            scope.$apply();
            expect(element.find('md-list-item').length).toBe(1);
        });
        it('with a .md-list-item-text', function() {
            expect(element.querySelectorAll('.md-list-item-text').length).toBe(0);
            controller.datasets = [{id: 'datasetId'}];
            scope.$apply();
            expect(element.querySelectorAll('.md-list-item-text').length).toBe(1);
        });
        it('with a h3', function() {
            expect(element.find('h3').length).toBe(0);
            controller.datasets = [{id: 'datasetId'}];
            scope.$apply();
            expect(element.find('h3').length).toBe(1);
        });
        it('with a p', function() {
            expect(element.find('p').length).toBe(0);
            controller.datasets = [{id: 'datasetId'}];
            scope.$apply();
            expect(element.find('h3').length).toBe(1);
        });
        it('with a .btn-container', function() {
            expect(element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with a .btn-primary', function() {
            expect(element.querySelectorAll('.btn-primary').length).toBe(1);
        });
        it('with a .btn-default', function() {
            expect(element.querySelectorAll('.btn-default').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller.datasets = [{id: 'selectedId', ontologies: [], selected: true}, {id: 'otherId', selected: false}];
        });
        it('submit correctly sets variables and calls methods', function() {
            controller.submit();
            expect(analyticStateSvc.datasets).toEqual([{id: 'selectedId', ontologies: []}]);
            expect(analyticStateSvc.showEditor).toHaveBeenCalled();
            expect(scope.onCancel).toHaveBeenCalled();
        });
        it('change resets other datasets selected property', function() {
            controller.change({id: 'otherId'});
            expect(controller.datasets).toEqual([{id: 'selectedId', ontologies: [], selected: false}, {id: 'otherId', selected: false}]);
        });
        describe('isSubmittable returns the correct value when a dataset is', function() {
            it('not selected', function() {
                controller.datasets = [{selected: false}];
                expect(controller.isSubmittable()).toBe(false);
            });
            it('selected', function() {
                controller.datasets = [{selected: true}];
                expect(controller.isSubmittable()).toBe(true);
            });
        });
    });
    it('on startup sets datasets correctly', function() {
        datasetManagerSvc.datasetRecords = [[{'@id': 'id', '@type': 'type'}, {}]];
        utilSvc.getPropertyId.and.returnValue('utilId');
        utilSvc.getDctermsValue.and.returnValue('title');
        compileElement();
        expect(controller.datasets).toEqual([{
            id: 'id',
            datasetIRI: 'utilId',
            selected: false,
            title: 'title',
            ontologies: [{
                recordId: 'utilId',
                branchId: 'utilId',
                commitId: 'utilId'
            }]
        }]);
        expect(utilSvc.getPropertyId).toHaveBeenCalledWith({}, prefixes.dataset + 'linksToRecord');
        expect(utilSvc.getPropertyId).toHaveBeenCalledWith({}, prefixes.dataset + 'linksToBranch');
        expect(utilSvc.getPropertyId).toHaveBeenCalledWith({}, prefixes.dataset + 'linksToCommit');
        expect(utilSvc.getPropertyId).toHaveBeenCalledWith({'@id': 'id', '@type': 'type'}, prefixes.dataset + 'dataset');
        expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({'@id': 'id', '@type': 'type'}, 'title');
    });
    
    function compileElement() {
        scope.onCancel = jasmine.createSpy('onCancel');
        element = $compile(angular.element('<new-analytic-overlay on-cancel="onCancel()"></new-analytic-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('newAnalyticOverlay');
    }
});