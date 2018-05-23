/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
        it('should get the percentage of a particular step', function() {
            expect(this.controller.getPercentage(scope.stepNumber, 0)).toEqual(0);
            expect(this.controller.getPercentage(scope.stepNumber, 1)).toEqual(50);
            expect(this.controller.getPercentage(scope.stepNumber, 2)).toEqual(100);
        });
        it('should return the correct value for the \'left\' style', function() {
            expect(this.controller.calculateLeft(0)).toEqual('0%');
            expect(this.controller.calculateLeft(1)).toEqual('50%');
            expect(this.controller.calculateLeft(2)).toEqual('auto');
        });
        it('should return the correct value for the \'right\' style', function() {
            expect(this.controller.calculateRight(0)).toEqual('auto');
            expect(this.controller.calculateRight(1)).toEqual('auto');
            expect(this.controller.calculateRight(2)).toEqual('0%');
        });
        it('should return the correct value for the \'transform\' style', function() {
            expect(this.controller.calculateTransform(0)).toEqual('none');
            expect(this.controller.calculateTransform(1)).toEqual('translate(-50%)');
            expect(this.controller.calculateTransform(2)).toEqual('none');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('step-progress-bar')).toEqual(true);
            expect(this.element.hasClass('row')).toEqual(true);
            expect(this.element.querySelectorAll('.col-xs-12').length).toEqual(1);
            expect(this.element.querySelectorAll('.progress').length).toEqual(1);
            expect(this.element.querySelectorAll('.progress-bar').length).toEqual(1);
        });
        it('depending on the range', function() {
            spyOn(this.controller, 'getRange').and.returnValue([0, 1, 2]);
            scope.$digest();
            expect(this.element.querySelectorAll('.progress .step').length).toEqual(3);
        });
        it('depending on whether the step is completed', function() {
            spyOn(this.controller, 'getRange').and.returnValue([0]);
            scope.$digest();
            var step = angular.element(this.element.querySelectorAll('.step')[0]);
            expect(step.hasClass('completed')).toEqual(true);
        });
        it('with the correct styles for a step', function() {
            spyOn(this.controller, 'getRange').and.returnValue([0]);
            spyOn(this.controller, 'calculateLeft').and.returnValue('10%');
            spyOn(this.controller, 'calculateRight').and.returnValue('10%');
            spyOn(this.controller, 'calculateTransform').and.returnValue('none');
            scope.$digest();
            var step = angular.element(this.element.querySelectorAll('.step')[0]);
            expect(step.css('left')).toEqual('10%');
            expect(step.css('right')).toEqual('10%');
            expect(step.css('transform')).toEqual('none');
        });
        it('depending on whether the step is the current step', function() {
            spyOn(this.controller, 'getRange').and.returnValue([0]);
            scope.$digest();
            var span = angular.element(this.element.querySelectorAll('.step span')[0]);
            expect(span.text().trim()).toEqual('1');
        });
        it('depending on whether the step is before the current step', function() {
            spyOn(this.controller, 'getRange').and.returnValue([0, 1]);
            scope.currentStep = 1;
            scope.$digest();
            var span = angular.element(this.element.querySelectorAll('.step span')[0]);
            expect(span.querySelectorAll('i').length).toEqual(1);
        });
    });
});
