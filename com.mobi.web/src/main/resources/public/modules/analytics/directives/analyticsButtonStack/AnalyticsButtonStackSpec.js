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
describe('Analytics Button Stack directive', function() {
    var $compile, $q, scope, analyticStateSvc, analyticManagerSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('analyticsButtonStack');
        mockAnalyticState();
        mockAnalyticManager();
        mockUtil();

        inject(function(_$compile_, _$q_, _$rootScope_, _analyticStateService_, _analyticManagerService_, _utilService_) {
            $compile = _$compile_;
            $q = _$q_;
            scope = _$rootScope_;
            analyticStateSvc = _analyticStateService_;
            analyticManagerSvc = _analyticManagerService_;
            utilSvc = _utilService_;
        });

        this.element = $compile(angular.element('<analytics-button-stack></analytics-button-stack>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('analyticsButtonStack');
    });

    afterEach(function() {
        $compile = null;
        $q = null;
        scope = null;
        analyticStateSvc = null;
        analyticManagerSvc = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('analytics-button-stack')).toBe(true);
            expect(this.element.hasClass('ontology-button-stack')).toBe(true);
        });
        it('with a circle-button-stack', function() {
            expect(this.element.find('circle-button-stack').length).toBe(1);
        });
        it('with circle-buttons', function() {
            expect(this.element.find('circle-button').length).toBe(3);
        });
        it('with a save-analytic-overlay', function() {
            expect(this.element.find('save-analytic-overlay').length).toBe(0);
            this.controller.showSaveOverlay = true;
            scope.$apply();
            expect(this.element.find('save-analytic-overlay').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('save should', function() {
            it('not call updateAnalytic when there is no analyticRecordId', function() {
                this.controller.save();
                expect(this.controller.showSaveOverlay).toEqual(true);
                expect(analyticManagerSvc.updateAnalytic).not.toHaveBeenCalled();
            });
            describe('call updateAnalytic and call correct methods when it', function() {
                beforeEach(function() {
                    _.set(analyticStateSvc, 'record.analyticRecordId', 'recordId');
                    analyticStateSvc.createTableConfigurationConfig.and.returnValue({});
                });
                it('resolves', function() {
                    analyticManagerSvc.updateAnalytic.and.returnValue($q.resolve());
                    this.controller.save();
                    scope.$apply();
                    expect(analyticManagerSvc.updateAnalytic).toHaveBeenCalledWith({analyticRecordId: 'recordId'});
                    expect(utilSvc.createSuccessToast).toHaveBeenCalledWith('Analytic successfully saved');
                });
                it('rejects', function() {
                    analyticManagerSvc.updateAnalytic.and.returnValue($q.reject('error'));
                    this.controller.save();
                    scope.$apply();
                    expect(analyticManagerSvc.updateAnalytic).toHaveBeenCalledWith({analyticRecordId: 'recordId'});
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
                });
            });
        });
    });
});