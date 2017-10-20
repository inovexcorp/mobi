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
describe('Static IRI directive', function() {
    var $compile, scope, $filter, ontologyStateSvc, ontoUtils, toastr;

    beforeEach(function() {
        module('templates');
        module('staticIri');
        injectSplitIRIFilter();
        injectRegexConstant();
        mockOntologyState();
        mockOntologyUtilsManager();
        mockToastr();

        inject(function(_$compile_, _$rootScope_, _$filter_, _ontologyStateService_, _ontologyUtilsManagerService_, _toastr_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $filter = _$filter_;
            ontologyStateSvc = _ontologyStateService_;
            ontoUtils = _ontologyUtilsManagerService_;
            toastr = _toastr_;
        });

        scope.onEdit = jasmine.createSpy('onEdit');
        scope.iri = 'iri';
        this.element = $compile(angular.element('<static-iri on-edit="onEdit()" iri="iri"></static-iri>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
        this.controller = this.element.controller('staticIri');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $filter = null;
        ontologyStateSvc = null;
        ontoUtils = null;
        toastr = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('onEdit should be called in parent scope', function() {
            this.isolatedScope.onEdit();
            scope.$digest();
            expect(scope.onEdit).toHaveBeenCalled();
        });
    });
    describe('controller bound variable', function() {
        it('iri should be two way bound', function() {
            this.controller.iri = 'new';
            scope.$digest();
            expect(scope.iri).toBe('new');
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            ontologyStateSvc.showIriOverlay = true;
            scope.$digest();
        });
        it('for wrapping containers STATIC-IRI', function() {
            expect(this.element.prop('tagName')).toBe('STATIC-IRI');
            expect(this.element.querySelectorAll('.static-iri').length).toBe(1);
        });
        it('with a h6', function() {
            expect(this.element.find('h6').length).toBe(1);
        });
        it('with a form', function() {
            expect(this.element.find('form').length).toBe(1);
        });
        it('with a .btn-container', function() {
            expect(this.element.querySelectorAll('.btn-container').length).toBe(1);
        });
        it('depending on whether the iri overlay should be shown', function() {
            expect(this.element.querySelectorAll('.overlay').length).toBe(1);

            ontologyStateSvc.showIriOverlay = false;
            scope.$digest();
            expect(this.element.querySelectorAll('.overlay').length).toBe(0);
        });
        it('depending on whether the begin field is invalid', function() {
            var beginContainer = angular.element(this.element.querySelectorAll('.overlay .begin-container')[0]);
            expect(beginContainer.hasClass('has-error')).toBe(false);

            this.controller.iriForm = {
                iriBegin: {
                    '$error': {
                        pattern: true
                    }
                }
            };
            scope.$digest();
            expect(beginContainer.hasClass('has-error')).toBe(true);
        });
        it('depending on whether the ends field is invalid', function() {
            var endsContainer = angular.element(this.element.querySelectorAll('.overlay .ends-container')[0]);
            expect(endsContainer.hasClass('has-error')).toBe(false);

            this.controller.iriForm = {
                iriEnd: {
                    '$error': {
                        pattern: true
                    }
                }
            };
            scope.$digest();
            expect(endsContainer.hasClass('has-error')).toBe(true);
        });
        it('depending on the form validity', function() {
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary.pull-right')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.iriForm.$invalid = false;
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on the IRI which already exists in the ontology.', function() {
            ontoUtils.checkIri.and.returnValue(true);
            this.controller.iriForm.$invalid = false;

            scope.$digest();

            var disabled = this.element.querySelectorAll(':disabled');
            expect(disabled.length).toBe(1);
            expect(angular.element(disabled[0]).text()).toBe('Submit');

            var errorDisplays = this.element.find('error-display');
            expect(errorDisplays.length).toBe(2);
            expect(angular.element(errorDisplays[0]).text()).toBe('This IRI already exists');
            expect(angular.element(errorDisplays[1]).text()).toBe('This IRI already exists');
        });
        it('depending on the IRI which does not exist in the ontology.', function() {
            ontoUtils.checkIri.and.returnValue(false);
            this.controller.iriForm.$invalid = false;

            scope.$digest();

            var disabled = this.element.querySelectorAll(':disabled');
            expect(disabled.length).toBe(0);

            var errorDisplays = this.element.find('error-display');
            expect(errorDisplays.length).toBe(0);
        });

    });
    describe('controller methods', function() {
        beforeEach(function() {
            ontologyStateSvc.listItem.ontology[0].mobi.iriBegin = 'begin';
            ontologyStateSvc.listItem.ontology[0].mobi.iriThen = 'then';
        });
        it('setVariables changes the passed in variable', function() {
            var obj = {
                iriBegin: 'begin',
                iriThen: 'then',
                iriEnd: 'end'
            }
            this.controller.setVariables(obj);
            expect(obj.iriBegin).toBe('');
            expect(obj.iriThen).toBe('');
            expect(obj.iriEnd).toBe('');
        });
        it('resetVariables updates iriBegin, iriThen, and iriEnd', function() {
            this.controller.refresh = {
                iriBegin: 'new',
                iriThen: 'new',
                iriEnd: 'new'
            }
            this.controller.resetVariables();
            expect(this.controller.iriBegin).toBe('new');
            expect(this.controller.iriThen).toBe('new');
            expect(this.controller.iriEnd).toBe('new');
        });
        it('onSuccess calls correct toastr method', function() {
            this.controller.onSuccess();
            expect(toastr.success).toHaveBeenCalledWith('', 'Copied', {timeOut: 2000});
        });
        it('check $watch', function() {
            this.controller.setVariables = jasmine.createSpy('setVariables');
            this.controller.iri = 'new';
            scope.$digest();
            expect(this.controller.setVariables).toHaveBeenCalled();
        });
    });
});
