/*-
 * #%L
 * org.matonto.web
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
describe('Ontology Overlays directive', function() {
    var $compile,
        scope,
        element,
        controller,
        ontologyStateSvc,
        ontologyManagerSvc,
        propertyManagerSvc,
        deferred;

    beforeEach(function() {
        module('templates');
        module('ontologyOverlays');
        mockOntologyManager();
        mockOntologyState();
        mockPropertyManager();

        inject(function(_$q_, _$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_,
            _propertyManagerService_) {
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            propertyManagerSvc = _propertyManagerService_;
            deferred = _$q_.defer();
        });
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            ontologyStateSvc.showAnnotationOverlay = true;
            ontologyStateSvc.showDataPropertyOverlay = true;
            ontologyStateSvc.showObjectPropertyOverlay = true;
            ontologyStateSvc.showDownloadOverlay = true;
            ontologyStateSvc.showCreateAnnotationOverlay = true;
            ontologyStateSvc.showCreateClassOverlay = true;
            ontologyStateSvc.showCreatePropertyOverlay = true;
            ontologyStateSvc.showCreateIndividualOverlay = true;
            ontologyStateSvc.showCloseOverlay = true;
            ontologyStateSvc.showRemoveOverlay = true;
            ontologyStateSvc.showRemoveIndividualPropertyOverlay = true;
            ontologyStateSvc.showSaveOverlay = true;
            element = $compile(angular.element('<ontology-overlays></ontology-overlays>'))(scope);
            scope.$digest();
        });
        it('for an ontology-overlays', function() {
            expect(element.prop('tagName')).toBe('ONTOLOGY-OVERLAYS');
        });
        it('based on confirmation-overlays', function() {
            var confirmations = element.find('confirmation-overlay');
            expect(confirmations.length).toBe(3);
        });
        _.forEach(['annotation-overlay', 'datatype-property-overlay', 'object-property-overlay',
        'ontology-download-overlay', 'create-annotation-overlay', 'create-class-overlay', 'create-property-overlay',
        'create-individual-overlay', 'ontology-close-overlay'], function(item) {
            it('based on ' + item, function() {
                var items = element.find(item);
                expect(items.length).toBe(1);
            });
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            element = $compile(angular.element('<ontology-overlays></ontology-overlays>'))(scope);
            scope.$digest();
            controller = element.controller('ontologyOverlays');
        });
        describe('save', function() {
            beforeEach(function() {
                ontologyStateSvc.state.ontologyId = 'id';
                ontologyManagerSvc.saveChanges.and.returnValue(deferred.promise);
                controller.save();
            });
            it('calls the correct manager function', function() {
                expect(ontologyStateSvc.getUnsavedEntities).toHaveBeenCalledWith(ontologyStateSvc.ontology);
                expect(ontologyStateSvc.getCreatedEntities).toHaveBeenCalledWith(ontologyStateSvc.ontology);
                expect(ontologyManagerSvc.saveChanges).toHaveBeenCalledWith(ontologyStateSvc.state.ontologyId,
                    ontologyStateSvc.getUnsavedEntities(ontologyStateSvc.ontology),
                    ontologyStateSvc.getCreatedEntities(ontologyStateSvc.ontology),
                    ontologyStateSvc.state.deletedEntities);
            });
            it('when resolved, sets the correct variable and calls correct manager function', function() {
                deferred.resolve('id');
                scope.$apply();
                expect(ontologyStateSvc.showSaveOverlay).toBe(false);
                expect(ontologyStateSvc.afterSave).toHaveBeenCalledWith('id');
            });
        });
        it('removeProperty calls the correct manager functions and sets the correct manager variables', function() {
            controller.removeProperty();
            expect(propertyManagerSvc.remove).toHaveBeenCalledWith(ontologyStateSvc.selected, ontologyStateSvc.key,
                ontologyStateSvc.index);
            expect(ontologyStateSvc.setUnsaved).toHaveBeenCalledWith(ontologyStateSvc.ontology,
                ontologyStateSvc.selected.matonto.originalIRI, true);
            expect(ontologyStateSvc.showRemoveOverlay).toBe(false);
        });
        it('removeIndividualProperty calls the correct manager functions and sets the correct manager variables', function() {
            ontologyStateSvc.selected = {key: ['value0', 'value1']};
            ontologyStateSvc.key = 'key';
            ontologyStateSvc.index = 0;
            controller.removeIndividualProperty();
            expect(ontologyStateSvc.selected.key).toBeDefined();
            expect(ontologyStateSvc.selected.key).not.toContain('value0');
            expect(ontologyStateSvc.setUnsaved).toHaveBeenCalledWith(ontologyStateSvc.state.ontology,
                ontologyStateSvc.state.entityIRI, true);
            expect(ontologyStateSvc.showRemoveIndividualPropertyOverlay).toBe(false);

            controller.removeIndividualProperty();
            expect(ontologyStateSvc.selected.key).toBeUndefined();
            expect(ontologyStateSvc.setUnsaved).toHaveBeenCalledWith(ontologyStateSvc.state.ontology,
                ontologyStateSvc.state.entityIRI, true);
            expect(ontologyStateSvc.showRemoveIndividualPropertyOverlay).toBe(false);
        });
    });
});