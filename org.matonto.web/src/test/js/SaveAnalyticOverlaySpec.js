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
describe('Save Analytic Overlay directive', function() {
    var $compile, scope, element, controller, $q, analyticManagerSvc, analyticStateSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('saveAnalyticOverlay');
        mockAnalyticManager();
        mockAnalyticState();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _analyticManagerService_, _analyticStateService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            analyticManagerSvc = _analyticManagerService_;
            analyticStateSvc = _analyticStateService_;
            prefixes = _prefixes_;
        });
        
        scope.close = jasmine.createSpy('close');
        element = $compile(angular.element('<save-analytic-overlay close="close()"></save-analytic-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('saveAnalyticOverlay');
    });
    
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('save-analytic-overlay')).toBe(true);
            expect(element.hasClass('overlay')).toBe(true);
        });
        it('with a form', function() {
            expect(element.find('form').length).toBe(1);
        });
        it('with a .form-group', function() {
            expect(element.querySelectorAll('.form-group').length).toBe(1);
        });
        it('with a custom-label', function() {
            expect(element.find('custom-label').length).toBe(1);
        });
        it('with a title field', function() {
            expect(element.querySelectorAll('input[name="title"]').length).toBe(1);
        });
        it('with a text-area', function() {
            expect(element.find('text-area').length).toBe(1);
        });
        it('with a keyword-select', function() {
            expect(element.find('keyword-select').length).toBe(1);
        });
        it('depending on the validity of the form', function() {
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeTruthy();
            controller.config.title = 'title';
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('with buttons to cancel and submit', function() {
            var buttons = element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    describe('controller methods', function() {
        it('cancel sets and calls the correct method', function() {
            analyticStateSvc.record = {title: 'title'};
            controller.cancel();
            expect(analyticStateSvc.record).toEqual({});
            expect(scope.close).toHaveBeenCalled();
        });
        describe('submit should call the correct methods if createAnalytic', function() {
            var expected;
            beforeEach(function() {
                analyticStateSvc.datasets = [{id: 'datasetId'}];
                analyticStateSvc.selectedClass = {id: 'classId'};
                analyticStateSvc.selectedProperties = [{id: 'propId1'}, {id: 'propId2'}];
                controller.config = {
                    title: 'title',
                    description: 'description',
                    keywords: ['keyword1', 'keyword2']
                };
                expected = {
                    title: 'title',
                    description: 'description',
                    keywords: ['keyword1', 'keyword2'],
                    type: prefixes.analytic + 'TableConfiguration',
                    json: JSON.stringify({
                        datasetRecordId: 'datasetId',
                        row: 'classId',
                        columns: ['propId1', 'propId2']
                    })
                };
            });
            it('resolves', function() {
                analyticManagerSvc.createAnalytic.and.returnValue($q.resolve('analyticId'));
                controller.submit();
                scope.$apply();
                expect(analyticManagerSvc.createAnalytic).toHaveBeenCalledWith(expected);
                expect(scope.close).toHaveBeenCalled();
                expect(analyticStateSvc.showLanding).toHaveBeenCalled();
            });
            it('rejects', function() {
                analyticManagerSvc.createAnalytic.and.returnValue($q.reject('error'));
                controller.submit();
                scope.$apply();
                expect(analyticManagerSvc.createAnalytic).toHaveBeenCalledWith(expected);
                expect(controller.error).toBe('error');
            });
        });
    });
});