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
    var $compile, scope, element, controller, $q, analyticManagerSvc, analyticStateSvc, prefixes, utilSvc;

    beforeEach(function() {
        module('templates');
        module('saveAnalyticOverlay');
        mockAnalyticManager();
        mockAnalyticState();
        mockPrefixes();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$q_, _analyticManagerService_, _analyticStateService_, _prefixes_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            analyticManagerSvc = _analyticManagerService_;
            analyticStateSvc = _analyticStateService_;
            prefixes = _prefixes_;
            utilSvc = _utilService_;
        });
        
        scope.close = jasmine.createSpy('close');
        compileElement();
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
        describe('submit should call the correct methods if createAnalytic', function() {
            var expected;
            beforeEach(function() {
                controller.config = {
                    title: 'title',
                    description: 'description',
                    keywords: ['keyword1', 'keyword2']
                };
                analyticStateSvc.createTableConfigurationConfig.and.returnValue({type: 'type', json: '{}'});
                expected = {
                    title: 'title',
                    description: 'description',
                    keywords: ['keyword1', 'keyword2'],
                    type: 'type',
                    json: '{}'
                };
            });
            it('resolves', function() {
                analyticManagerSvc.createAnalytic.and.returnValue($q.resolve({analyticRecordId: 'analyticId', configurationId: 'configId'}));
                controller.submit();
                scope.$apply();
                expect(analyticManagerSvc.createAnalytic).toHaveBeenCalledWith(expected);
                expect(analyticManagerSvc.updateAnalytic).not.toHaveBeenCalled();
                expect(scope.close).toHaveBeenCalled();
                expect(analyticStateSvc.record).toEqual(jasmine.objectContaining(controller.config));
                expect(analyticStateSvc.record.analyticRecordId).toBe('analyticId');
                expect(analyticStateSvc.selectedConfigurationId).toBe('configId');
                expect(utilSvc.createSuccessToast).toHaveBeenCalledWith('Analytic successfully saved');
            });
            it('rejects', function() {
                analyticManagerSvc.createAnalytic.and.returnValue($q.reject('error'));
                controller.submit();
                scope.$apply();
                expect(analyticManagerSvc.createAnalytic).toHaveBeenCalledWith(expected);
                expect(analyticManagerSvc.updateAnalytic).not.toHaveBeenCalled();
                expect(controller.error).toBe('error');
            });
        });
    });
    it('controller.config should be initialized correctly', function() {
        var record = {
            description: 'description',
            keywords: ['keyword1', 'keyword2'],
            title: 'title'
        };
        analyticStateSvc.record = record;
        compileElement();
        expect(controller.config).toEqual(record);
    });
    
    function compileElement() {
        element = $compile(angular.element('<save-analytic-overlay close="close()"></save-analytic-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('saveAnalyticOverlay');
    }
});