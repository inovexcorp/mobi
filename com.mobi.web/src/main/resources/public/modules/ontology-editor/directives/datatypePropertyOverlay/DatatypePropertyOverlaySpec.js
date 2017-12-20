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
describe('Datatype Property Overlay directive', function() {
    var $compile, scope, ontologyStateSvc, prefixes, ontoUtils;

    beforeEach(function() {
        module('templates');
        module('datatypePropertyOverlay');
        mockOntologyState();
        mockUtil();
        mockPrefixes();
        mockOntologyUtilsManager();
        injectHighlightFilter();
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _prefixes_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            prefixes = _prefixes_;
            ontoUtils = _ontologyUtilsManagerService_;
        });

        this.element = $compile(angular.element('<datatype-property-overlay></datatype-property-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('datatypePropertyOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        prefixes = null;
        ontoUtils = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('datatype-property-overlay')).toBe(true);
            expect(this.element.querySelectorAll('.content').length).toBe(1);
        });
        it('depending on whether the property is being edited', function() {
            [
                {
                    value: true,
                    header: 'Edit Individual Data Property',
                    button: 'Edit'
                },
                {
                    value: false,
                    header: 'Add Individual Data Property',
                    button: 'Add'
                }
            ].forEach(function(test) {
                ontologyStateSvc.editingProperty = test.value;
                scope.$digest();

                var header = angular.element(this.element.find('h6')[0]);
                var buttons = this.element.querySelectorAll('button.btn-primary');
                expect(header.text().trim()).toBe(test.header);
                expect(buttons.length).toBe(1);
                expect(angular.element(buttons[0]).text().trim()).toBe(test.button);
            }, this);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toBe(1);
        });
        it('with a text-area', function() {
            expect(this.element.find('text-area').length).toBe(1);
        })
        it('with an iri-select', function() {
            expect(this.element.find('iri-select').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('should add a data property', function() {
            beforeEach(function() {
                this.value = 'value';
                this.type = 'type';
                this.language = 'en';
                ontologyStateSvc.listItem.selected = {};
            });
            it('with a type and no language', function() {
                this.controller.addProperty('prop', this.value, this.type);
                expect(ontologyStateSvc.listItem.selected.prop).toBeDefined();
                expect(ontologyStateSvc.listItem.selected.prop).toContain({'@value': this.value, '@type': this.type});
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('without a type and no language', function() {
                this.controller.addProperty('prop', this.value);
                expect(ontologyStateSvc.listItem.selected.prop).toBeDefined();
                expect(ontologyStateSvc.listItem.selected.prop).toContain({'@value': this.value});
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('with a language and isStringType is true', function() {
                spyOn(this.controller, 'isStringType').and.returnValue(true);
                this.controller.addProperty('prop', this.value, this.type, this.language);
                expect(ontologyStateSvc.listItem.selected.prop).toBeDefined();
                expect(ontologyStateSvc.listItem.selected.prop).toContain({'@value': this.value, '@language': this.language});
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('with a language and isStringType is false', function() {
                spyOn(this.controller, 'isStringType').and.returnValue(false);
                this.controller.addProperty('prop', this.value, this.type, this.language);
                expect(ontologyStateSvc.listItem.selected.prop).toBeDefined();
                expect(ontologyStateSvc.listItem.selected.prop).toContain({'@value': this.value, '@type': this.type});
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('without a language', function() {
                spyOn(this.controller, 'isStringType').and.returnValue(false);
                this.controller.addProperty('prop', this.value, this.type);
                expect(ontologyStateSvc.listItem.selected.prop).toBeDefined();
                expect(ontologyStateSvc.listItem.selected.prop).toContain({'@value': this.value, '@type': this.type});
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
        });
        describe('should edit a data property', function() {
            beforeEach(function() {
                this.value = 'value';
                this.type = 'type';
                this.language = 'en';
                ontologyStateSvc.listItem.selected = {prop: [{}]};
                ontologyStateSvc.propertyIndex = 0;
            });
            it('if the type is provided and no language', function() {
                this.controller.editProperty('prop', this.value, this.type);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontologyStateSvc.listItem.selected.prop[ontologyStateSvc.propertyIndex]).toEqual({'@value': this.value, '@type': this.type});
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('if the type is not provided and no language', function() {
                this.controller.editProperty('prop', this.value);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontologyStateSvc.listItem.selected.prop[ontologyStateSvc.propertyIndex]).toEqual({'@value': this.value});
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('if the language is provided and isStringType is true', function() {
                spyOn(this.controller, 'isStringType').and.returnValue(true);
                this.controller.editProperty('prop', this.value, this.type, this.language);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontologyStateSvc.listItem.selected.prop[ontologyStateSvc.propertyIndex]).toEqual({'@value': this.value, '@language': this.language});
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('if the language is provided and isStringType is false', function() {
                spyOn(this.controller, 'isStringType').and.returnValue(false);
                this.controller.editProperty('prop', this.value, this.type, this.language);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontologyStateSvc.listItem.selected.prop[ontologyStateSvc.propertyIndex]).toEqual({'@value': this.value, '@type': this.type});
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('if the language is not provided', function() {
                this.controller.editProperty('prop', this.value, this.type);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontologyStateSvc.listItem.selected.prop[ontologyStateSvc.propertyIndex]).toEqual({'@value': this.value, '@type': this.type});
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
        });
        describe('should determine if type if a string type', function() {
            it('when undefined', function() {
                expect(this.controller.isStringType()).toBe(false);
            });
            it('when it is not a string type', function() {
                ontologyStateSvc.propertyType = 'wrong';
                expect(this.controller.isStringType()).toBe(false);
            });
            it('when it is a string type', function() {
                ontologyStateSvc.propertyType = prefixes.rdf + 'langString';
                expect(this.controller.isStringType()).toBe(true);
            });
        });
    });
    it('should call editProperty when the button is clicked', function() {
        spyOn(this.controller, 'editProperty');
        ontologyStateSvc.editingProperty = true;
        scope.$digest();

        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.editProperty).toHaveBeenCalled();
    });
    it('should call addProperty when the button is clicked', function() {
        spyOn(this.controller, 'addProperty');
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.addProperty).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-default')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
    });
});