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
describe('Static IRI component', function() {
    var $compile, scope, ontologyStateSvc, ontoUtils, modalSvc;

    beforeEach(function() {
        module('templates');
        module('ontology-editor');
        mockOntologyState();
        mockOntologyUtilsManager();
        mockModal();
        injectSplitIRIFilter();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyUtilsManagerService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontoUtils = _ontologyUtilsManagerService_;
            modalSvc = _modalService_;
        });

        scope.onEdit = jasmine.createSpy('onEdit');
        scope.iri = 'iri';
        scope.readOnly = true;
        scope.duplicateCheck = true;
        scope.highlightText = '';
        this.element = $compile(angular.element('<static-iri on-edit="onEdit()" iri="iri" read-only="readOnly" duplicate-check="duplicateCheck" highlight-text="highlightText"></static-iri>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('staticIri');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontoUtils = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('iri should be one way bound', function() {
            this.controller.iri = 'new';
            scope.$digest();
            expect(scope.iri).toEqual('iri');
        });
        it('duplicateCheck should be one way bound', function() {
            this.controller.duplicateCheck = false;
            scope.$digest();
            expect(scope.duplicateCheck).toEqual(true);
        });
        it('onEdit should be called in parent scope', function() {
            this.controller.onEdit();
            scope.$digest();
            expect(scope.onEdit).toHaveBeenCalled();
        });
        it('highlightText is one way bound', function() {
            this.controller.highlightText = 'new text';
            scope.$digest();
            expect(scope.highlightText).toEqual('');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('STATIC-IRI');
            expect(this.element.querySelectorAll('.static-iri').length).toEqual(1);
        });
        it('depending on whether the IRI is imported', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.readOnly = false;
            scope.$digest();
            expect(this.element.find('a').length).toEqual(1);

            ontologyStateSvc.listItem.selected.mobi = {imported: true};
            scope.$digest();
            expect(this.element.find('a').length).toEqual(0);
        });
        it('depending on whether the user cannot modify', function() {
            ontologyStateSvc.canModify.and.returnValue(false);
            scope.$digest();
            expect(this.element.find('a').length).toEqual(0);
        });
        describe('depending on whether the IRI', function() {
            beforeEach(function() {
                this.strong = this.element.find('strong');
            });
            describe('exists in the ontology and duplicateCheck is', function() {
                beforeEach(function() {
                    ontoUtils.checkIri.and.returnValue(true);
                });
                it('true', function() {
                    scope.$digest();
                    var errorDisplay = this.element.find('error-display');
                    expect(errorDisplay.length).toEqual(1);
                    expect(errorDisplay.text()).toEqual('This IRI already exists');
                    expect(this.strong.hasClass('duplicate-iri')).toEqual(true);
                });
                it('false', function() {
                    scope.duplicateCheck = false;
                    scope.$digest();
                    expect(this.element.find('error-display').length).toEqual(0);
                    expect(this.strong.hasClass('duplicate-iri')).toEqual(false);
                });
            });
            it('does not exist in the ontology', function() {
                ontoUtils.checkIri.and.returnValue(false);
                scope.$digest();

                expect(this.element.find('error-display').length).toEqual(0);
                expect(this.strong.hasClass('duplicate-iri')).toEqual(false);
            });
            it('is read only', function() {
                ontologyStateSvc.listItem.selected.mobi = {imported: false};
                ontologyStateSvc.canModify.and.returnValue(true);
                scope.readOnly = true;
                scope.$digest();
                expect(this.element.find('a').length).toEqual(0);
            });
        });
    });
    describe('controller methods', function() {
        it('setVariables sets the parts of the IRI', function() {
            this.controller.iriBegin = 'begin';
            this.controller.iriThen = 'then';
            this.controller.iriEnd = 'end';
            this.controller.setVariables();
            expect(this.controller.iriBegin).toEqual('');
            expect(this.controller.iriThen).toEqual('');
            expect(this.controller.iriEnd).toEqual('');
        });
        describe('showIriOverlay opens the editIriOverlay if duplicateCheck is', function() {
            it('true', function() {
                this.controller.showIriOverlay();
                expect(modalSvc.openModal).toHaveBeenCalledWith('editIriOverlay', {
                    iriBegin: this.controller.iriBegin,
                    iriThen: this.controller.iriThen,
                    iriEnd: this.controller.iriEnd,
                    customValidation: {
                        func: ontoUtils.checkIri,
                        msg: 'This IRI already exists'
                    }
                }, jasmine.any(Function));
            });
            it('false', function() {
                scope.duplicateCheck = false;
                scope.$digest();
                this.controller.showIriOverlay();
                expect(modalSvc.openModal).toHaveBeenCalledWith('editIriOverlay', {iriBegin: this.controller.iriBegin, iriThen: this.controller.iriThen, iriEnd: this.controller.iriEnd}, jasmine.any(Function));
            });
        });
    });
    it('updates appropriately when the IRI changes', function() {
        this.controller.setVariables = jasmine.createSpy('setVariables');
        scope.iri = 'new';
        scope.$digest();
        expect(this.controller.setVariables).toHaveBeenCalled();
    });
});
