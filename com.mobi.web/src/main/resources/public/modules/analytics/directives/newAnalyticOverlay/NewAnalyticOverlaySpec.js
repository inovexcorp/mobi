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
describe('Class And Property Block directive', function() {
    var $q, $compile, scope, analyticStateSvc, datasetManagerSvc, prefixes, utilSvc;

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

        datasetManagerSvc.datasetRecords = [[{'@id': 'id', '@type': 'type'}, {}]];
        analyticStateSvc.getOntologies.and.returnValue([{}]);
        utilSvc.getPropertyId.and.returnValue('utilId');
        utilSvc.getDctermsValue.and.returnValue('title');
        scope.onCancel = jasmine.createSpy('onCancel');
        this.element = $compile(angular.element('<new-analytic-overlay on-cancel="onCancel()"></new-analytic-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('newAnalyticOverlay');
    });

    afterEach(function() {
        $q = null;
        $compile = null;
        scope = null;
        analyticStateSvc = null;
        datasetManagerSvc = null;
        prefixes = null;
        utilSvc = null;
        this.element.remove();
    });

    it('initializes with the correct value for datasets', function() {
        expect(this.controller.datasets).toEqual([{
            id: 'id',
            datasetIRI: 'utilId',
            selected: false,
            title: 'title',
            ontologies: [{}]
        }]);
        expect(analyticStateSvc.getOntologies).toHaveBeenCalledWith([{'@id': 'id', '@type': 'type'}, {}], {'@id': 'id', '@type': 'type'});
        expect(utilSvc.getPropertyId).toHaveBeenCalledWith({'@id': 'id', '@type': 'type'}, prefixes.dataset + 'dataset');
        expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({'@id': 'id', '@type': 'type'}, 'title');
    });
    describe('controller bound variables', function() {
        it('onCancel to be called in parent scope', function() {
            this.controller.onCancel();
            expect(scope.onCancel).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('new-analytic-overlay')).toBe(true);
            expect(this.element.hasClass('overlay')).toBe(true);
        });
        it('with a form', function() {
            expect(this.element.find('form').length).toBe(1);
        });
        it('with a h1', function() {
            expect(this.element.find('h1').length).toBe(1);
        });
        it('with a h2', function() {
            expect(this.element.find('h2').length).toBe(1);
        });
        it('with a info-message', function() {
            expect(this.element.find('info-message').length).toBe(0);
            this.controller.datasets = [];
            scope.$apply();
            expect(this.element.find('info-message').length).toBe(1);
        });
        it('with a md-list', function() {
            expect(this.element.find('md-list').length).toBe(1);
        });
        it('with a md-list-item', function() {
            expect(this.element.find('md-list-item').length).toBe(1);
            this.controller.datasets = [];
            scope.$apply();
            expect(this.element.find('md-list-item').length).toBe(0);
        });
        it('with a .md-list-item-text', function() {
            expect(this.element.querySelectorAll('.md-list-item-text').length).toBe(1);
            this.controller.datasets = [];
            scope.$apply();
            expect(this.element.querySelectorAll('.md-list-item-text').length).toBe(0);
        });
        it('with a h3', function() {
            expect(this.element.find('h3').length).toBe(1);
            this.controller.datasets = [];
            scope.$apply();
            expect(this.element.find('h3').length).toBe(0);
        });
        it('with a p', function() {
            expect(this.element.find('p').length).toBe(1);
            this.controller.datasets = [];
            scope.$apply();
            expect(this.element.find('p').length).toBe(0);
        });
        it('with a .btn-container', function() {
            expect(this.element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('with a .btn-primary', function() {
            expect(this.element.querySelectorAll('.btn-primary').length).toBe(1);
        });
        it('with a .btn-default', function() {
            expect(this.element.querySelectorAll('.btn-default').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.controller.datasets = [{id: 'selectedId', ontologies: [], selected: true}, {id: 'otherId', selected: false}];
        });
        it('submit correctly sets variables and calls methods', function() {
            this.controller.submit();
            expect(analyticStateSvc.datasets).toEqual([{id: 'selectedId', ontologies: []}]);
            expect(analyticStateSvc.showEditor).toHaveBeenCalled();
            expect(scope.onCancel).toHaveBeenCalled();
        });
        it('change resets other datasets selected property', function() {
            this.controller.change({id: 'otherId'});
            expect(this.controller.datasets).toEqual([{id: 'selectedId', ontologies: [], selected: false}, {id: 'otherId', selected: false}]);
        });
        describe('isSubmittable returns the correct value when a dataset is', function() {
            it('not selected', function() {
                this.controller.datasets = [{selected: false}];
                expect(this.controller.isSubmittable()).toBe(false);
            });
            it('selected', function() {
                this.controller.datasets = [{selected: true}];
                expect(this.controller.isSubmittable()).toBe(true);
            });
        });
    });
});