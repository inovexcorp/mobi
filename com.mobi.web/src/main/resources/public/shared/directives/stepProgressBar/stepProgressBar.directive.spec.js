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
describe('Step Progress Bar directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('stepProgressBar');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.stepNumber = 3;
        scope.currentStep = 0;
        this.element = $compile(angular.element('<step-progress-bar current-step="currentStep" step-number="stepNumber"></step-progress-bar>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('stepProgressBar');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should return the range of steps', function() {
            expect(this.controller.getRange(3)).toEqual([0, 1, 2]);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('step-progress-bar')).toEqual(true);
        });
        it('depending on the range', function() {
            spyOn(this.controller, 'getRange').and.returnValue([0, 1, 2]);
            scope.$digest();
            expect(this.element.querySelectorAll('.stepper').length).toEqual(3);
        });
        it('depending on whether the step is completed', function() {
            spyOn(this.controller, 'getRange').and.returnValue([0, 1]);
            scope.currentStep = 1;
            scope.$digest();
            var stepper = angular.element(this.element.querySelectorAll('.stepper')[0]);
            expect(stepper.hasClass('done')).toEqual(true);
        });
        it('depending on whether the step is the current step', function() {
            spyOn(this.controller, 'getRange').and.returnValue([0]);
            scope.$digest();
            var stepper = angular.element(this.element.querySelectorAll('.stepper')[0]);
            expect(stepper.hasClass('active')).toEqual(true);
            expect(stepper.find('span').text().trim()).toEqual('1');
        });
        it('depending on whether the step is before the current step', function() {
            spyOn(this.controller, 'getRange').and.returnValue([0, 1]);
            scope.currentStep = 1;
            scope.$digest();
            var stepper = angular.element(this.element.querySelectorAll('.stepper')[0]);
            expect(stepper.querySelectorAll('i').length).toEqual(1);
        });
    });
});
