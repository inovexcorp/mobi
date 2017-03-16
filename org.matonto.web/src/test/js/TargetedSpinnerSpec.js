/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
describe('Targeted Spinner directive', function() {
    var $compile, scope, element;

    beforeEach(function() {
        module('targetedSpinner');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.trackedHttpRequests = [];
        scope.requestConfig = {method: 'get', url: '\/test'};
    });

    it('should initialize with the correct value for cancelOnDestroy', function() {
        element = $compile(angular.element('<div targeted-spinner=""></div>'))(scope);
        scope.$digest();
        expect(scope.cancelOnDestroy).toBe(false);

        element = $compile(angular.element('<div targeted-spinner="" cancel-on-Destroy></div>'))(scope);
        scope.$digest();
        expect(scope.cancelOnDestroy).toBe(false);

        element = $compile(angular.element('<div targeted-spinner="" cancel-on-destroy="false"></div>'))(scope);
        scope.$digest();
        expect(scope.cancelOnDestroy).toBe(false);

        element = $compile(angular.element('<div targeted-spinner="" cancel-on-destroy="true"></div>'))(scope);
        scope.$digest();
        expect(scope.cancelOnDestroy).toBe(true);
    });
    describe('should inject a spinner and create a tracker', function() {
        it('unless it already exists', function() {
            var tracker = {scopes: [], requestConfig: scope.requestConfig, inProgress: true};
            scope.trackedHttpRequests = [tracker];
            element = $compile(angular.element('<div targeted-spinner="requestConfig"></div>'))(scope);
            scope.$digest();
            expect(element.hasClass('spinner-container')).toBe(true);
            expect(element.children().length).toBe(1);
            expect(scope.showSpinner).toBe(true);
            expect(scope.trackedHttpRequests.length).toBe(1);
            expect(tracker.scopes).toContain(scope);
        });
        it('if it does not already exist', function() {
            element = $compile(angular.element('<div targeted-spinner="requestConfig"></div>'))(scope);
            scope.$digest();
            expect(element.hasClass('spinner-container')).toBe(true);
            expect(element.children().length).toBe(1);
            expect(scope.showSpinner).toBe(false);
            expect(scope.trackedHttpRequests.length).toBe(1);
            expect(scope.trackedHttpRequests).toContain({requestConfig: scope.requestConfig, inProgress: false, scopes: [scope]});
        });
    });
    describe('should update if the request configuration changes', function() {
        beforeEach(function() {
            element = $compile(angular.element('<div targeted-spinner="requestConfig"></div>'))(scope);
            scope.$digest();
        });
        describe('adding a new tracker', function() {
            beforeEach(function() {
                scope.requestConfig.method = 'post';
            });
            it('unless one already exists', function() {
                scope.trackedHttpRequests = [{requestConfig: scope.requestConfig, inProgress: true, scopes: []}];
                scope.$digest();
                expect(scope.showSpinner).toBe(true);
                expect(scope.trackedHttpRequests.length).toBe(1);
                expect(scope.trackedHttpRequests).toContain(jasmine.objectContaining({requestConfig: scope.requestConfig, inProgress: true, scopes: [scope]}));
            });
            it('if one does not already exist', function() {
                scope.$digest();
                expect(scope.showSpinner).toBe(false);
                expect(scope.trackedHttpRequests.length).toBe(1);
                expect(scope.trackedHttpRequests).toContain(jasmine.objectContaining({requestConfig: scope.requestConfig, inProgress: false, scopes: [scope]}));
            });
        });
        describe('updating the old tracker', function() {
            beforeEach(function() {
                this.oldTracker = {requestConfig: angular.copy(scope.requestConfig), inProgress: true, scopes: []};
                scope.trackedHttpRequests = [this.oldTracker];
                scope.requestConfig.method = 'post';
            });
            it('if it has other scopes', function() {
                this.oldTracker.scopes = [{}];
                scope.$digest();
                expect(scope.trackedHttpRequests.length).toBe(2);
                expect(scope.trackedHttpRequests).toContain(this.oldTracker);
            });
            it('if it has no other scopes', function() {
                scope.$digest();
                expect(scope.trackedHttpRequests.length).toBe(1);
                expect(scope.trackedHttpRequests).not.toContain(this.oldTracker);
            });
        });
    });
    describe('should clean up tracker when scope is destroyed', function() {
        beforeEach(function() {
            element = $compile(angular.element('<div targeted-spinner="requestConfig" cancel-on-destroy="true"></div>'))(scope);
            scope.$digest();
            this.tracker = scope.trackedHttpRequests[0];
        });
        it('unless the tracker could not be found', function() {
            scope.trackedHttpRequests = [];
            this.tracker.scopes[0].$destroy();
            expect(scope.trackedHttpRequests).toEqual([]);
        });
        it('successfully', function() {
            this.tracker.scopes[0].$destroy();
            expect(scope.trackedHttpRequests[0].scopes).toEqual([]);
        });
        describe('and cancel any in progress call', function() {
            beforeEach(function() {
                this.canceller = {
                    resolve: jasmine.createSpy('resolve')
                };
                this.tracker.canceller = this.canceller;
            });
            it('unless a watching scope says not to', function() {
                this.tracker.scopes.push({cancelOnDestroy: false});
                this.tracker.scopes[0].$destroy();
                expect(this.canceller.resolve).not.toHaveBeenCalled();
            });
            it('if all watching scopes say to', function() {
                this.tracker.scopes[0].$destroy();
                expect(this.canceller.resolve).toHaveBeenCalled();
            });
        });
    });
});