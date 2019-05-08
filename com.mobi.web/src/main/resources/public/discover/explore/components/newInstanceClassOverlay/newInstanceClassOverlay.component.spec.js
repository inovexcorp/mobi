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
describe('New Instance Class Overlay component', function() {
    var $compile, scope, $q, discoverStateSvc, exploreSvc, util, splitIRI;

    beforeEach(function() {
        module('templates');
        module('explore');
        mockDiscoverState();
        mockExplore();
        mockUtil();
        injectSplitIRIFilter();

        module(function($provide) {
            $provide.service('uuid', function() {
                this.v4 = jasmine.createSpy('v4').and.returnValue('');
            });
        });

        inject(function(_$q_, _$compile_, _$rootScope_, _discoverStateService_, _exploreService_, _utilService_, _splitIRIFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            discoverStateSvc = _discoverStateService_;
            exploreSvc = _exploreService_;
            util = _utilService_;
            splitIRI = _splitIRIFilter_;
        });

        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        scope.resolve = {classes: [{id: 'test'}, {id: 'blah'}]};
        this.element = $compile(angular.element('<new-instance-class-overlay dismiss="dismiss()" close="close()" resolve="resolve"></new-instance-class-overlay>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
        this.controller = this.element.controller('newInstanceClassOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        discoverStateSvc = null;
        exploreSvc = null;
        util = null;
        splitIRI = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('close should be called in the parent scope', function() {
            this.controller.close();
            expect(scope.close).toHaveBeenCalled();
        });
        it('dismiss should be called in the parent scope', function() {
            this.controller.dismiss();
            expect(scope.dismiss).toHaveBeenCalled();
        });
        it('resolve is one way bound', function() {
            this.controller.resolve = {};
            scope.$digest();
            expect(scope.resolve).toEqual({classes: [{id: 'test'}, {id: 'blah'}]});
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('NEW-INSTANCE-CLASS-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        ['form', 'h3', 'p', 'md-autocomplete'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
        it('with buttons to cancel and submit', function() {
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on whether the selected class is deprecated', function() {
            var button = angular.element(this.element.querySelectorAll('.btn.btn-primary')[0]);
            expect(this.element.find('error-display').length).toEqual(0);
            expect(button.attr('disabled')).toBeFalsy();

            this.controller.selectedClass = {deprecated: true};
            scope.$digest();
            expect(this.element.find('error-display').length).toEqual(1);
            expect(button.attr('disabled')).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        it('should get filtered classes', function() {
            expect(this.controller.getClasses('test')).toEqual([{id: 'test'}]);
            expect(this.controller.getClasses('TE')).toEqual([{id: 'test'}]);
            expect(this.controller.getClasses('')).toEqual([{id: 'test'}, {id: 'blah'}]);
        });
        describe('should create an instance of a class', function() {
            beforeEach(function() {
                this.controller.selectedClass = {
                    id: 'class',
                    title: 'Class',
                    deprecated: true
                };
            });
            it('unless getClassInstanceDetails rejects', function() {
                exploreSvc.getClassInstanceDetails.and.returnValue($q.reject('Error message'));
                this.controller.submit();
                scope.$apply();
                expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, this.controller.selectedClass.id, {offset: 0, limit: discoverStateSvc.explore.instanceDetails.limit});
                expect(util.createErrorToast).toHaveBeenCalledWith('Error message');
                expect(scope.close).not.toHaveBeenCalled();
            });
            describe('when getClassInstanceDetails resolves', function() {
                beforeEach(function() {
                    exploreSvc.getClassInstanceDetails.and.returnValue($q.when([]));
                    splitIRI.and.returnValue({begin: 'begin/', then: 'then/', end: 'end'});
                });
                it('if instances already exist', function() {
                    exploreSvc.createPagedResultsObject.and.returnValue({data: [{instanceIRI: 'instance'}]});
                    this.controller.submit();
                    scope.$apply();
                    expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, this.controller.selectedClass.id, {offset: 0, limit: discoverStateSvc.explore.instanceDetails.limit});
                    expect(discoverStateSvc.explore.creating).toEqual(true);
                    expect(discoverStateSvc.explore.classId).toEqual(this.controller.selectedClass.id);
                    expect(discoverStateSvc.explore.classDeprecated).toEqual(this.controller.selectedClass.deprecated);
                    expect(discoverStateSvc.resetPagedInstanceDetails).toHaveBeenCalled();
                    expect(discoverStateSvc.explore.instanceDetails.data).toEqual([{instanceIRI: 'instance'}]);
                    expect(splitIRI).toHaveBeenCalledWith('instance');
                    expect(discoverStateSvc.explore.instance.entity).toEqual([{'@id': 'begin/then/', '@type': [this.controller.selectedClass.id]}]);
                    expect(discoverStateSvc.explore.instance.metadata.instanceIRI).toEqual('begin/then/');
                    expect(discoverStateSvc.explore.breadcrumbs).toEqual(['Classes', this.controller.selectedClass.title, 'New Instance']);
                    expect(scope.close).toHaveBeenCalled();
                });
                it('if there are no instances', function() {
                    exploreSvc.createPagedResultsObject.and.returnValue({data: []});
                    this.controller.submit();
                    scope.$apply();
                    expect(exploreSvc.getClassInstanceDetails).toHaveBeenCalledWith(discoverStateSvc.explore.recordId, this.controller.selectedClass.id, {offset: 0, limit: discoverStateSvc.explore.instanceDetails.limit});
                    expect(discoverStateSvc.explore.creating).toEqual(true);
                    expect(discoverStateSvc.explore.classId).toEqual(this.controller.selectedClass.id);
                    expect(discoverStateSvc.explore.classDeprecated).toEqual(this.controller.selectedClass.deprecated);
                    expect(discoverStateSvc.resetPagedInstanceDetails).toHaveBeenCalled();
                    expect(discoverStateSvc.explore.instanceDetails.data).toEqual([]);
                    expect(splitIRI).toHaveBeenCalledWith(this.controller.selectedClass.id);
                    expect(discoverStateSvc.explore.instance.entity).toEqual([{'@id': 'http://mobi.com/data/end/', '@type': [this.controller.selectedClass.id]}]);
                    expect(discoverStateSvc.explore.instance.metadata.instanceIRI).toEqual('http://mobi.com/data/end/');
                    expect(discoverStateSvc.explore.breadcrumbs).toEqual(['Classes', this.controller.selectedClass.title, 'New Instance']);
                    expect(scope.close).toHaveBeenCalled();
                });
            });
        });
        it('should cancel the overlay', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    it('should call submit when the button is clicked', function() {
        spyOn(this.controller, 'submit');
        var continueButton = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        continueButton.triggerHandler('click');
        expect(this.controller.submit).toHaveBeenCalled();
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var continueButton = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        continueButton.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
});