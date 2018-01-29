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
    var $compile, scope, ontologyStateSvc, prefixes, ontoUtils, propertyManagerSvc, util;

    beforeEach(function() {
        module('templates');
        module('datatypePropertyOverlay');
        mockOntologyState();
        mockUtil();
        mockPrefixes();
        mockOntologyUtilsManager();
        mockPropertyManager();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _prefixes_, _ontologyUtilsManagerService_, _propertyManagerService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            prefixes = _prefixes_;
            ontoUtils = _ontologyUtilsManagerService_;
            propertyManagerSvc = _propertyManagerService_;
            util = _utilService_;
        });

        this.element = $compile(angular.element('<datatype-property-overlay></datatype-property-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('datatypePropertyOverlay');
        propertyManagerSvc.createValueObj.and.returnValue({id: 'newValue'});
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        prefixes = null;
        ontoUtils = null;
        propertyManagerSvc = null;
        util = null;
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
        it('depending on whether the type is rdf:langString', function() {
            expect(this.element.find('language-select').length).toEqual(0);

            spyOn(this.controller, 'isLangString').and.returnValue(true);
            scope.$digest();
            expect(this.element.find('language-select').length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        describe('should add a data property', function() {
            beforeEach(function() {
                this.value = 'value';
                this.prop = 'prop';
                this.type = 'type';
                this.language = 'en';
                ontologyStateSvc.listItem.selected = {};
                propertyManagerSvc.addValue.and.returnValue(true);
                spyOn(this.controller, 'isLangString').and.returnValue(true);
            });
            it('unless it is a duplicate value', function() {
                propertyManagerSvc.addValue.and.returnValue(false);
                this.controller.addProperty(this.prop, this.value);
                expect(propertyManagerSvc.addValue).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.prop, this.value, prefixes.xsd + 'string', '');
                expect(util.createJson).not.toHaveBeenCalled();
                expect(ontologyStateSvc.addToAdditions).not.toHaveBeenCalled();
                expect(util.createWarningToast).toHaveBeenCalled();
                expect(ontoUtils.saveCurrentChanges).not.toHaveBeenCalled();
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
            });
            it('without a type and no language', function() {
                this.controller.addProperty(this.prop, this.value);
                expect(propertyManagerSvc.addValue).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.prop, this.value, prefixes.xsd + 'string', '');
                expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], this.prop, {id: 'newValue'});
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(util.createWarningToast).not.toHaveBeenCalled();
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
            });
            it('with a language and isLangString is true', function() {
                this.controller.addProperty(this.prop, this.value, this.type, this.language);
                expect(propertyManagerSvc.addValue).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.prop, this.value, '', this.language);
                expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], this.prop, {id: 'newValue'});
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(util.createWarningToast).not.toHaveBeenCalled();
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
            });
            it('with a language and isLangString is false', function() {
                this.controller.isLangString.and.returnValue(false);
                this.controller.addProperty(this.prop, this.value, this.type, this.language);
                expect(propertyManagerSvc.addValue).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.prop, this.value, this.type, '');
                expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], this.prop, {id: 'newValue'});
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(util.createWarningToast).not.toHaveBeenCalled();
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
            });
            it('without a language', function() {
                this.controller.addProperty(this.prop, this.value, this.type);
                expect(propertyManagerSvc.addValue).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.prop, this.value, this.type, '');
                expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], this.prop, {id: 'newValue'});
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(util.createWarningToast).not.toHaveBeenCalled();
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
            });
        });
        describe('should edit a data property', function() {
            beforeEach(function() {
                this.value = 'value';
                this.prop = 'prop';
                this.type = 'type';
                this.language = 'en';
                ontologyStateSvc.listItem.selected[this.prop] = [{}];
                ontologyStateSvc.propertyIndex = 0;
                propertyManagerSvc.editValue.and.returnValue(true);
                spyOn(this.controller, 'isLangString').and.returnValue(true);
                propertyManagerSvc.createValueObj.and.returnValue({id: 'newValue'});
            });
            it('unless it is a duplicate value', function() {
                propertyManagerSvc.editValue.and.returnValue(false);
                this.controller.editProperty(this.prop, this.value);
                expect(propertyManagerSvc.editValue).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.prop, ontologyStateSvc.propertyIndex, this.value, prefixes.xsd + 'string', '');
                expect(util.createJson).not.toHaveBeenCalled();
                expect(ontologyStateSvc.addToAdditions).not.toHaveBeenCalled();
                expect(ontologyStateSvc.addToDeletions).not.toHaveBeenCalled();
                expect(ontoUtils.saveCurrentChanges).not.toHaveBeenCalled();
                expect(util.createWarningToast).toHaveBeenCalled();
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
            });
            it('if the type is provided and no language', function() {
                this.controller.editProperty(this.prop, this.value, this.type);
                expect(propertyManagerSvc.editValue).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.prop, ontologyStateSvc.propertyIndex, this.value, this.type, '');
                expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], this.prop, {});
                expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], this.prop, {id: 'newValue'});
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(util.createWarningToast).not.toHaveBeenCalled();
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
            });
            it('if the type is not provided and no language', function() {
                this.controller.editProperty(this.prop, this.value);
                expect(propertyManagerSvc.editValue).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.prop, ontologyStateSvc.propertyIndex, this.value, prefixes.xsd + 'string', '');
                expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], this.prop, {});
                expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], this.prop, {id: 'newValue'});
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(util.createWarningToast).not.toHaveBeenCalled();
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
            });
            it('if the language is provided and isLangString is true', function() {
                this.controller.editProperty(this.prop, this.value, this.type, this.language);
                expect(propertyManagerSvc.editValue).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.prop, ontologyStateSvc.propertyIndex, this.value, '', this.language);
                expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], this.prop, {});
                expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], this.prop, {id: 'newValue'});
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(util.createWarningToast).not.toHaveBeenCalled();
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
            });
            it('if the language is provided and isLangString is false', function() {
                this.controller.isLangString.and.returnValue(false);
                this.controller.editProperty(this.prop, this.value, this.type, this.language);
                expect(propertyManagerSvc.editValue).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.prop, ontologyStateSvc.propertyIndex, this.value, this.type, '');
                expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], this.prop, {});
                expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], this.prop, {id: 'newValue'});
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(util.createWarningToast).not.toHaveBeenCalled();
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
            });
            it('if the language is not provided', function() {
                this.controller.editProperty(this.prop, this.value, this.type);
                expect(propertyManagerSvc.editValue).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, this.prop, ontologyStateSvc.propertyIndex, this.value, this.type, '');
                expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], this.prop, {});
                expect(util.createJson).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected['@id'], this.prop, {id: 'newValue'});
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, jasmine.any(Object));
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
                expect(util.createWarningToast).not.toHaveBeenCalled();
                expect(ontologyStateSvc.showDataPropertyOverlay).toBe(false);
            });
        });
        describe('should determine if type if a string type', function() {
            it('when undefined', function() {
                expect(this.controller.isLangString()).toBe(false);
            });
            it('when it is not a string type', function() {
                ontologyStateSvc.propertyType = 'wrong';
                expect(this.controller.isLangString()).toBe(false);
            });
            it('when it is a string type', function() {
                ontologyStateSvc.propertyType = prefixes.rdf + 'langString';
                expect(this.controller.isLangString()).toBe(true);
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