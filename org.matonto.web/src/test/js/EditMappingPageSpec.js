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
describe('Edit Mapping Page directive', function() {
    var $compile, scope, $q, element, controller, mappingManagerSvc, mapperStateSvc, delimitedManagerSvc, catalogManagerSvc, catalogId;

    beforeEach(function() {
        module('templates');
        module('editMappingPage');
        mockMappingManager();
        mockMapperState();
        mockDelimitedManager();
        mockCatalogManager();

        inject(function(_$compile_, _$rootScope_, _$q_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_, _catalogManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            delimitedManagerSvc = _delimitedManagerService_;
            catalogManagerSvc = _catalogManagerService_;
        });

        catalogId = 'catalog';
        catalogManagerSvc.localCatalog = {'@id': catalogId};
        mapperStateSvc.mapping = {record: {id: 'Id', title: 'Title', description: 'Description', keywords: ['Keyword']}, jsonld: []};
        element = $compile(angular.element('<edit-mapping-page></edit-mapping-page>'))(scope);
        scope.$digest();
        controller = element.controller('editMappingPage');
    });

    describe('controller methods', function() {
        it('should test whether the mapping config is not set', function() {
            mappingManagerSvc.getSourceOntologyInfo.and.returnValue({});
            expect(controller.configNotSet()).toBe(true);

            mappingManagerSvc.getSourceOntologyInfo.and.returnValue({test: true});
            expect(controller.configNotSet()).toBe(false);
        });
        describe('should set the correct state for saving a mapping', function() {
            describe('if it already exists', function() {
                var createDeferred, step;
                beforeEach(function() {
                    step = mapperStateSvc.step;
                    createDeferred = $q.defer();
                    mapperStateSvc.newMapping = false;
                    catalogManagerSvc.createInProgressCommit.and.returnValue(createDeferred.promise);
                });
                describe("and createInProgressCommit resolves", function() {
                    var updateDeferred;
                    beforeEach(function() {
                        createDeferred.resolve();
                        updateDeferred = $q.defer();
                        catalogManagerSvc.updateInProgressCommit.and.returnValue(updateDeferred.promise);
                    });
                    describe("and updateInProgressCommit resolves", function() {
                        var createCommitDeferred;
                        beforeEach(function() {
                            updateDeferred.resolve();
                            createCommitDeferred = $q.defer();
                            catalogManagerSvc.createBranchCommit.and.returnValue(createCommitDeferred.promise);
                        });
                        it("and createBranchCommit resolves", function() {
                            createCommitDeferred.resolve();
                            controller.save();
                            scope.$apply();
                            expect(catalogManagerSvc.createInProgressCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, catalogId);
                            expect(mappingManagerSvc.upload).not.toHaveBeenCalled();
                            expect(catalogManagerSvc.updateInProgressCommit).toHaveBeenCalled();
                            expect(catalogManagerSvc.createBranchCommit).toHaveBeenCalled();
                            expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                            expect(mapperStateSvc.initialize).toHaveBeenCalled();
                            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                            expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                            expect(controller.errorMessage).toBe('');
                        });
                        it("and createBranchCommit rejects", function() {
                            createCommitDeferred.reject('Error message');
                            
                        });
                    });
                    it("and updateInProgressCommit rejects", function() {
                        updateDeferred.reject('Error message');
                        
                    });
                });
                it("and createInProgressCommit rejects", function() {
                    createDeferred.reject('Error message');
                    controller.save();
                    scope.$apply();
                    expect(catalogManagerSvc.createInProgressCommit).toHaveBeenCalledWith(mapperStateSvc.mapping.record.id, catalogId);
                    expect(mappingManagerSvc.upload).not.toHaveBeenCalled();
                    expect(catalogManagerSvc.updateInProgressCommit).not.toHaveBeenCalled();
                    expect(catalogManagerSvc.createBranchCommit).not.toHaveBeenCalled();
                    expect(mapperStateSvc.step).toBe(step);
                    expect(mapperStateSvc.initialize).not.toHaveBeenCalled();
                    expect(mapperStateSvc.resetEdit).not.toHaveBeenCalled();
                    expect(delimitedManagerSvc.reset).not.toHaveBeenCalled();
                    expect(controller.errorMessage).toBe('Error message');
                });
            });
            describe('if does not exist yet', function() {
                var uploadDeferred, step;
                beforeEach(function() {
                    uploadDeferred = $q.defer();
                    step = mapperStateSvc.step;
                    mapperStateSvc.newMapping = true;
                    mappingManagerSvc.upload.and.returnValue(uploadDeferred.promise);
                });
                it('unless an error occurs', function() {
                    uploadDeferred.reject('Error message');
                    controller.save();
                    scope.$apply();
                    expect(catalogManagerSvc.createInProgressCommit).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.upload).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, mapperStateSvc.mapping.record.title, mapperStateSvc.mapping.record.description, mapperStateSvc.mapping.record.keywords);
                    expect(mapperStateSvc.step).toBe(step);
                    expect(mapperStateSvc.initialize).not.toHaveBeenCalled();
                    expect(mapperStateSvc.resetEdit).not.toHaveBeenCalled();
                    expect(delimitedManagerSvc.reset).not.toHaveBeenCalled();
                    expect(controller.errorMessage).toBe('Error message');
                });
                it('successfully', function() {
                    uploadDeferred.resolve();
                    controller.save();
                    scope.$apply();
                    expect(catalogManagerSvc.createInProgressCommit).not.toHaveBeenCalled();
                    expect(mappingManagerSvc.upload).toHaveBeenCalledWith(mapperStateSvc.mapping.jsonld, mapperStateSvc.mapping.record.title, mapperStateSvc.mapping.record.description, mapperStateSvc.mapping.record.keywords);
                    expect(mapperStateSvc.step).toBe(mapperStateSvc.selectMappingStep);
                    expect(mapperStateSvc.initialize).toHaveBeenCalled();
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                    expect(controller.errorMessage).toBe('');
                });
            });
        });
        it('should set the correct state for canceling', function() {
            controller.cancel();
            expect(mapperStateSvc.displayCancelConfirm).toBe(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('edit-mapping-page')).toBe(true);
            expect(element.hasClass('row')).toBe(true);
            expect(element.querySelectorAll('.col-xs-5').length).toBe(1);
            expect(element.querySelectorAll('.col-xs-7').length).toBe(1);
            expect(element.querySelectorAll('.edit-tabs').length).toBe(1);
        });
        it('with a mapping title', function() {
            expect(element.find('mapping-title').length).toBe(1);
        });
        it('with a tabset', function() {
            expect(element.find('tabset').length).toBe(1);
        });
        it('with two tabs', function() {
            expect(element.find('tab').length).toBe(2);
        });
        it('with blocks', function() {
            expect(element.find('block').length).toBe(3);
        });
        it('with an edit mapping form', function() {
            expect(element.find('edit-mapping-form').length).toBe(1);
        });
        it('with an RDF preview form', function() {
            expect(element.find('rdf-preview-form').length).toBe(1);
        });
        it('with buttons for canceling, saving, and saving and running', function() {
            var footers = element.querySelectorAll('tab block-footer');
            _.forEach(footers, function(footer) {
                var buttons = angular.element(footer).find('button');
                expect(buttons.length).toBe(3);
                expect(['Cancel', 'Save', 'Save & Run']).toContain(angular.element(buttons[0]).text().trim());
                expect(['Cancel', 'Save', 'Save & Run']).toContain(angular.element(buttons[1]).text().trim());
                expect(['Cancel', 'Save', 'Save & Run']).toContain(angular.element(buttons[2]).text().trim());
            });
        });
        it('depending on whether the mapping configuration has been set', function() {
            spyOn(controller, 'configNotSet').and.returnValue(true);
            scope.$digest();
            var buttons = element.querySelectorAll('tab block-footer button.btn-primary');
            _.forEach(_.toArray(buttons), function(button) {
                expect(angular.element(button).attr('disabled')).toBeTruthy();
            });

            mapperStateSvc.mapping.jsonld = [{}, {}];
            scope.$digest();
            _.forEach(_.toArray(buttons), function(button) {
                expect(angular.element(button).attr('disabled')).toBeFalsy();
            });

            controller.configNotSet.and.returnValue(false);
            mapperStateSvc.mapping.jsonld = [];
            scope.$digest();
            _.forEach(_.toArray(buttons), function(button) {
                expect(angular.element(button).attr('disabled')).toBeFalsy();
            });
        });
    });
    it('should call cancel when a cancel button is clicked', function() {
        spyOn(controller, 'cancel');
        var cancelButtons = element.querySelectorAll('tab block-footer button.btn-default');
        _.forEach(_.toArray(cancelButtons), function(button) {
            controller.cancel.calls.reset();
            angular.element(button).triggerHandler('click');
            expect(controller.cancel).toHaveBeenCalled();
        });
    });
    it('should call save when a save button is clicked', function() {
        spyOn(controller, 'save');
        var saveButtons = element.querySelectorAll('tab block-footer button.btn-primary.save-btn');
        _.forEach(_.toArray(saveButtons), function(button) {
            controller.save.calls.reset();
            angular.element(button).triggerHandler('click');
            expect(controller.save).toHaveBeenCalled();
        });
    });
    it('should set the correct state when a save and run button is clicked', function() {
        var saveRunButtons = element.querySelectorAll('tab block-footer button.btn-primary.save-run-btn');
        _.forEach(_.toArray(saveRunButtons), function(button) {
            mapperStateSvc.displayRunMappingOverlay = false;
            angular.element(button).triggerHandler('click');
            expect(mapperStateSvc.displayRunMappingOverlay).toBe(true);
        });
    });
});
