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
describe('Edit Mapping Page component', function() {
    var $compile, scope, $q, mappingManagerSvc, mapperStateSvc, delimitedManagerSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('mapper');
        mockComponent('mapper', 'editMappingForm');
        mockComponent('mapper', 'rdfPreviewForm');
        mockComponent('mapper', 'previewDataGrid');
        mockMappingManager();
        mockMapperState();
        mockDelimitedManager();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _$q_, _mappingManagerService_, _mapperStateService_, _delimitedManagerService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mapperStateSvc = _mapperStateService_;
            mappingManagerSvc = _mappingManagerService_;
            delimitedManagerSvc = _delimitedManagerService_;
            modalSvc = _modalService_;
        });

        mapperStateSvc.mapping = {record: {id: 'Id', title: 'Title', description: 'Description', keywords: ['Keyword']}, jsonld: []};
        this.element = $compile(angular.element('<edit-mapping-page></edit-mapping-page>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('editMappingPage');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        mappingManagerSvc = null;
        mapperStateSvc = null;
        delimitedManagerSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should open the runMappingDownloadOverlay', function() {
            this.controller.runMappingDownload();
            expect(modalSvc.openModal).toHaveBeenCalledWith('runMappingDownloadOverlay', {}, undefined, 'sm');
        });
        it('should open the runMappingDatasetOverlay', function() {
            this.controller.runMappingDataset();
            expect(modalSvc.openModal).toHaveBeenCalledWith('runMappingDatasetOverlay', {}, undefined, 'sm');
        });
        it('should open the runMappingOntologyOverlay', function() {
            this.controller.runMappingOntology();
            expect(modalSvc.openModal).toHaveBeenCalledWith('runMappingOntologyOverlay');
        });
        describe('should set the correct state for saving a mapping', function() {
            beforeEach(function() {
                this.step = mapperStateSvc.step;
            });
            describe('if the mapping has changed', function() {
                beforeEach(function() {
                    mapperStateSvc.isMappingChanged.and.returnValue(true);
                });
                it('unless an error occurs', function() {
                    mapperStateSvc.saveMapping.and.returnValue($q.reject('Error message'));
                    this.controller.save();
                    scope.$apply();
                    expect(mapperStateSvc.saveMapping).toHaveBeenCalled();
                    expect(mapperStateSvc.step).toEqual(this.step);
                    expect(mapperStateSvc.initialize).not.toHaveBeenCalled();
                    expect(mapperStateSvc.resetEdit).not.toHaveBeenCalled();
                    expect(delimitedManagerSvc.reset).not.toHaveBeenCalled();
                    expect(this.controller.errorMessage).toEqual('Error message');
                });
                it('successfully', function() {
                    this.controller.save();
                    scope.$apply();
                    expect(mapperStateSvc.saveMapping).toHaveBeenCalled();
                    expect(mapperStateSvc.step).toEqual(mapperStateSvc.selectMappingStep);
                    expect(mapperStateSvc.initialize).toHaveBeenCalled();
                    expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                    expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                    expect(this.controller.errorMessage).toEqual('');
                });
            });
            it('if the mapping has not changed', function() {
                this.controller.save();
                expect(mapperStateSvc.saveMapping).not.toHaveBeenCalled();
                expect(mapperStateSvc.step).toEqual(mapperStateSvc.selectMappingStep);
                expect(mapperStateSvc.initialize).toHaveBeenCalled();
                expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                expect(this.controller.errorMessage).toEqual('');
            });
        });
        describe('should set the correct state for canceling', function() {
            it('if the mapping has been changed', function() {
                mapperStateSvc.isMappingChanged.and.returnValue(true);
                this.controller.cancel();
                expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.stringMatching('Are you sure'), this.controller.reset);
            });
            it('if the mapping has not been changed', function() {
                this.controller.cancel();
                expect(mapperStateSvc.step).toEqual(mapperStateSvc.selectMappingStep);
                expect(mapperStateSvc.initialize).toHaveBeenCalled();
                expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
                expect(delimitedManagerSvc.reset).toHaveBeenCalled();
                expect(this.controller.errorMessage).toEqual('');
            });
        });
        describe('should test whether the mapping is saveable when', function() {
            it('there are no class mappings and there are no invalid property mappings', function() {
                mappingManagerSvc.getAllClassMappings.and.returnValue([]);
                expect(this.controller.isSaveable()).toEqual(false);
            });
            it('there are class mappings and there are no invalid property mappings', function () {
                mappingManagerSvc.getAllClassMappings.and.returnValue([{}]);
                expect(this.controller.isSaveable()).toEqual(true);
            });
            it('there are invalid property mappings', function() {
                mapperStateSvc.invalidProps = [{}];
                expect(this.controller.isSaveable()).toEqual(false);
            });
        });
        it('should set the correct state for reseting', function() {
            this.controller.reset();
            expect(mapperStateSvc.initialize).toHaveBeenCalled();
            expect(mapperStateSvc.resetEdit).toHaveBeenCalled();
            expect(delimitedManagerSvc.reset).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('EDIT-MAPPING-PAGE');
            expect(this.element.querySelectorAll('.edit-mapping-page').length).toEqual(1);
            expect(this.element.querySelectorAll('.row').length).toEqual(1);
            expect(this.element.querySelectorAll('.col-5').length).toEqual(1);
            expect(this.element.querySelectorAll('.col-7').length).toEqual(1);
            expect(this.element.querySelectorAll('.editor-column').length).toEqual(1);
        });
        it('depending on which tab is active', function() {
            expect(this.element.find('edit-mapping-form').length).toEqual(1);
            expect(this.element.find('rdf-preview-form').length).toEqual(0);
            
            this.controller.tabs.edit = false;
            this.controller.tabs.preview = true;
            scope.$digest();
            expect(this.element.find('edit-mapping-form').length).toEqual(0);
            expect(this.element.find('rdf-preview-form').length).toEqual(1);
        });
        ['.tab-headings', '.tab-contents'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.querySelectorAll(test).length).toEqual(1);
            });
        });
        it('with .tab-headings', function() {
            expect(this.element.querySelectorAll('.tab-heading').length).toEqual(2);
        });
        it('with blocks', function() {
            expect(this.element.find('block').length).toEqual(2);
        });
        it('with buttons for canceling, saving, and saving and running', function() {
            var buttons = this.element.querySelectorAll('.tab-contents block-footer button');
            expect(buttons.length).toEqual(6);
            expect(['Cancel', 'Save', 'Toggle Dropdown', 'Download', 'Upload to Dataset', 'Commit to Ontology']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Save', 'Toggle Dropdown', 'Download', 'Upload to Dataset', 'Commit to Ontology']).toContain(angular.element(buttons[1]).text().trim());
            expect(['Cancel', 'Save', 'Toggle Dropdown', 'Download', 'Upload to Dataset', 'Commit to Ontology']).toContain(angular.element(buttons[2]).text().trim());
            expect(['Cancel', 'Save', 'Toggle Dropdown', 'Download', 'Upload to Dataset', 'Commit to Ontology']).toContain(angular.element(buttons[3]).text().trim());
            expect(['Cancel', 'Save', 'Toggle Dropdown', 'Download', 'Upload to Dataset', 'Commit to Ontology']).toContain(angular.element(buttons[4]).text().trim());
            expect(['Cancel', 'Save', 'Toggle Dropdown', 'Download', 'Upload to Dataset', 'Commit to Ontology']).toContain(angular.element(buttons[5]).text().trim());
        });
        it('with disabled buttons if the mapping is not saveable', function() {
            spyOn(this.controller, 'isSaveable');
            scope.$digest();
            var buttons = _.toArray(this.element.querySelectorAll('.tab-contents block-footer button.btn-primary'));
            _.forEach(buttons, button => expect(angular.element(button).attr('disabled')).toBeTruthy());

            this.controller.isSaveable.and.returnValue(true);
            scope.$digest();
            _.forEach(buttons, button => expect(angular.element(button).attr('disabled')).toBeFalsy());
        });
    });
    it('should call cancel when the button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var button = angular.element(this.element.querySelectorAll('.cancel-mapping')[0]);
        button.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
    it('should call save when the button is clicked', function() {
        spyOn(this.controller, 'save');
        var button = angular.element(this.element.querySelectorAll('.save-btn')[0]);
        button.triggerHandler('click');
        expect(this.controller.save).toHaveBeenCalled();
    });
    it('should call runMappingDownload when the run download button is clicked', function() {
        spyOn(this.controller, 'runMappingDownload');
        var button = angular.element(this.element.querySelectorAll('.run-download')[0]);
        button.triggerHandler('click');
        expect(this.controller.runMappingDownload).toHaveBeenCalled();
    });
    it('should call runMappingDataset when the run dataset button is clicked', function() {
        spyOn(this.controller, 'runMappingDataset');
        var button = angular.element(this.element.querySelectorAll('.run-dataset')[0]);
        button.triggerHandler('click');
        expect(this.controller.runMappingDataset).toHaveBeenCalled();
    });
    it('should call runMappingOntology when the run ontology button is clicked', function() {
        spyOn(this.controller, 'runMappingOntology');
        var button = angular.element(this.element.querySelectorAll('.run-ontology')[0]);
        button.triggerHandler('click');
        expect(this.controller.runMappingOntology).toHaveBeenCalled();
    });
});
