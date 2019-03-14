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
describe('Characteristics Block directive', function() {
    var $compile, scope, ontologyStateSvc, prefixes, ontologyManagerSvc, ontoUtils;

    beforeEach(function() {
        module('templates');
        module('characteristicsBlock');
        mockPrefixes();
        mockOntologyState();
        mockOntologyUtilsManager();
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _prefixes_, _ontologyUtilsManagerService_, _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            prefixes = _prefixes_;
            ontoUtils = _ontologyUtilsManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        this.functionalProperty = prefixes.owl + 'FunctionalProperty';
        this.asymmetricProperty = prefixes.owl + 'AsymmetricProperty';
        ontologyStateSvc.listItem.selected = undefined;
        this.element = $compile(angular.element('<characteristics-block></characteristics-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('characteristicsBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        prefixes = null;
        ontologyManagerSvc = null;
        ontoUtils = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('characteristics-block')).toBe(true);
        });
        it('with a .section-header', function() {
            expect(this.element.querySelectorAll('.section-header').length).toBe(1);
        });
        describe('with checkboxes if a', function() {
            it('object property is selected', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                scope.$digest();
                expect(this.element.find('checkbox').length).toBe(2);
            });
            it('data property is selected', function() {
                scope.$digest();
                expect(this.element.find('checkbox').length).toBe(1);
            });
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.id = 'id';
            this.statement = {
                '@id': this.id,
                '@type': [this.functionalProperty]
            };
            this.characteristicObj = {
                checked: true,
                typeIRI: this.functionalProperty
            };
            ontologyStateSvc.listItem.selected = {'@id': this.id};
        });
        describe('onChange sets all variables correctly when characteristic', function() {
            it('is checked and no match in deletions', function() {
                this.controller.onChange(this.characteristicObj, true);
                expect(this.characteristicObj.checked).toEqual(true);
                expect(_.includes(_.get(ontologyStateSvc.listItem.selected, '@type', []), this.functionalProperty)).toBe(true);
                expect(ontologyStateSvc.addToAdditions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.statement);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('is checked and the statement is in deletions', function() {
                ontologyStateSvc.listItem.deletions = [angular.copy(this.statement)];
                this.controller.onChange(this.characteristicObj, true);
                expect(this.characteristicObj.checked).toEqual(true);
                expect(_.includes(_.get(ontologyStateSvc.listItem.selected, '@type', []), this.functionalProperty)).toBe(true);
                expect(ontologyStateSvc.addToAdditions).not.toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.deletions.length).toBe(0);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('is checked and the statement with another property is in deletions', function() {
                var object = angular.copy(this.statement);
                object.other = 'value';
                ontologyStateSvc.listItem.deletions = [object];
                this.controller.onChange(this.characteristicObj, true);
                expect(this.characteristicObj.checked).toEqual(true);
                expect(_.includes(_.get(ontologyStateSvc.listItem.selected, '@type', []), this.functionalProperty)).toBe(true);
                expect(ontologyStateSvc.addToAdditions).not.toHaveBeenCalled();
                expect(_.some(ontologyStateSvc.listItem.deletions, {'@id': this.id, other: 'value'})).toBe(true);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('is not checked and no match in additions', function() {
                ontologyStateSvc.listItem.selected = angular.copy(this.statement);
                this.controller.onChange(this.characteristicObj, false);
                expect(this.characteristicObj.checked).toEqual(false);
                expect(_.includes(_.get(ontologyStateSvc.listItem.selected, '@type', []), this.functionalProperty)).toBe(false);
                expect(ontologyStateSvc.addToDeletions).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, this.statement);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('is not checked and the statement is in additions', function() {
                ontologyStateSvc.listItem.additions = [angular.copy(this.statement)];
                ontologyStateSvc.listItem.selected = angular.copy(this.statement);
                this.controller.onChange(this.characteristicObj, false);
                expect(this.characteristicObj.checked).toEqual(false);
                expect(_.includes(_.get(ontologyStateSvc.listItem.selected, '@type', []), this.functionalProperty)).toBe(false);
                expect(ontologyStateSvc.addToDeletions).not.toHaveBeenCalled();
                expect(ontologyStateSvc.listItem.additions.length).toBe(0);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
            it('is not checked and the statement is in additions', function() {
                var object = angular.copy(this.statement);
                object.other = 'value';
                ontologyStateSvc.listItem.additions = [object];
                ontologyStateSvc.listItem.selected = angular.copy(this.statement);
                this.controller.onChange(this.characteristicObj, false);
                expect(this.characteristicObj.checked).toEqual(false);
                expect(_.includes(_.get(ontologyStateSvc.listItem.selected, '@type', []), this.functionalProperty)).toBe(false);
                expect(ontologyStateSvc.addToDeletions).not.toHaveBeenCalled();
                expect(_.some(ontologyStateSvc.listItem.additions, {'@id': this.id, other: 'value'})).toBe(true);
                expect(ontoUtils.saveCurrentChanges).toHaveBeenCalled();
            });
        });
    });
    it('correctly updates the checkboxes when the selected entities changes', function() {
        _.forEach(this.controller.characteristics, obj => {
            obj.checked = false;
        });
        spyOn(this.controller, 'onChange');
        ontologyStateSvc.listItem.selected = {'@type': [this.functionalProperty, this.asymmetricProperty]};
        scope.$digest();
        expect(this.controller.onChange).not.toHaveBeenCalled();
        _.forEach(this.controller.characteristics, obj => {
            expect(obj.checked).toBe(true);
        });
    });
});
