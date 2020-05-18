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
import {
    mockComponent,
    mockOntologyState,
    mockOntologyManager,
    injectSplitIRIFilter
} from '../../../../../../test/js/Shared';

describe('Preview Block component', function() {
    var $compile, scope, $q, ontologyStateSvc, ontologyManagerSvc, splitIRIFilter;

    beforeEach(function() {
        angular.mock.module('ontology-editor');
        mockComponent('ontology-editor', 'serializationSelect');
        mockOntologyState();
        mockOntologyManager();
        injectSplitIRIFilter();

        angular.mock.module(function($provide) {
            $provide.value('jsonFilter', () => 'json');
        });

        inject(function(_$compile_, _$rootScope_, _$q_, _ontologyStateService_, _ontologyManagerService_, _splitIRIFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            splitIRIFilter = _splitIRIFilter_;
        });

        scope.activePage = {};
        scope.changeEvent = jasmine.createSpy('changeEvent');
        this.element = $compile(angular.element('<preview-block active-page="activePage" change-event="changeEvent(value)"></preview-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('previewBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        splitIRIFilter = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('activePage is one way bound', function() {
            var original = angular.copy(scope.activePage);
            this.controller.activePage = {mode: 'test'};
            scope.$digest();
            expect(scope.activePage).toEqual(original);
        });
        it('changeEvent should be called in parent scope', function() {
            this.controller.changeEvent({value: {}});
            expect(scope.changeEvent).toHaveBeenCalledWith({});
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('PREVIEW-BLOCK');
            expect(this.element.querySelectorAll('.preview-block').length).toEqual(1);
        });
        _.forEach(['card', 'card-header', 'card-body'], item => {
            it('with a .' + item, function() {
                expect(this.element.querySelectorAll('.' + item).length).toEqual(1);
            });
        });
        _.forEach(['form', 'serialization-select'], item => {
            it('with a ' + item, function() {
                expect(this.element.find(item).length).toEqual(1);
            });
        });
        it('depending on whether a preview is generated', function() {
            expect(this.element.find('ui-codemirror').length).toEqual(0);

            this.controller.activePage = {preview: 'test'};
            scope.$digest();
            expect(this.element.find('ui-codemirror').length).toEqual(1);
        });
        it('depending on whether a serialization was selected', function() {
            var button = angular.element(this.element.querySelectorAll('.refresh-button')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.activePage = {serialization: 'test'};
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    describe('controller methods', function() {
        describe('should get a preview', function() {
            it('unless an error occurs', function() {
                this.controller.activePage = {serialization: 'test'};
                ontologyManagerSvc.getQueryResults.and.returnValue($q.reject('Error'));
                this.controller.getPreview();
                scope.$apply();
                expect(ontologyManagerSvc.getQueryResults).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, 'CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o . } LIMIT 5000', 'test', '', false, true);
                expect(this.controller.activePage.preview).toEqual('Error');
                expect(scope.changeEvent).toHaveBeenCalledWith(this.controller.activePage);
            });
            describe('successfully', function() {
                beforeEach(function() {
                    ontologyManagerSvc.getQueryResults.and.returnValue($q.when('Test'));
                });
                it('if the format is JSON-LD', function() {
                    this.controller.activePage = {serialization: 'jsonld'};
                    this.controller.getPreview();
                    scope.$apply();
                    expect(this.controller.activePage.mode).toEqual('application/ld+json');
                    expect(ontologyManagerSvc.getQueryResults).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, 'CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o . } LIMIT 5000', 'jsonld', '', false, true);
                    expect(this.controller.activePage.preview).toEqual('json');
                    expect(scope.changeEvent).toHaveBeenCalledWith(this.controller.activePage);
                });
                it('if the format is not JSON-LD', function() {
                    [
                        {
                            serialization: 'turtle',
                            mode: 'text/turtle'
                        },
                        {
                            serialization: 'rdf/xml',
                            mode: 'application/xml'
                        }
                    ].forEach(test => {
                        this.controller.activePage = {serialization: test.serialization};
                        this.controller.getPreview();
                        scope.$apply();
                        expect(this.controller.activePage.mode).toEqual(test.mode);
                        expect(ontologyManagerSvc.getQueryResults).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, 'CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o . } LIMIT 5000', test.serialization, '', false, true);
                        expect(this.controller.activePage.preview).toEqual('Test');
                        expect(scope.changeEvent).toHaveBeenCalledWith(this.controller.activePage);
                    });
                });
            });
        });
        it('should download the ontology', function() {
            splitIRIFilter.and.returnValue({end: 'test'});
            this.controller.activePage.serialization = 'jsonld';
            this.controller.download();
            scope.$apply();
            expect(splitIRIFilter).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyId);
            expect(ontologyManagerSvc.downloadOntology).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId, ontologyStateSvc.listItem.ontologyRecord.branchId, ontologyStateSvc.listItem.ontologyRecord.commitId, 'jsonld', 'test');
        });
        it('should update the serialization', function() {
            this.controller.changeSerialization('test');
            expect(this.controller.activePage.serialization).toEqual('test');
            expect(scope.changeEvent).toHaveBeenCalledWith(this.controller.activePage);
        });
    });
    it('should call getPreview when the button is clicked', function() {
        spyOn(this.controller, 'getPreview');
        var button = angular.element(this.element.querySelectorAll('button.refresh-button')[0]);
        button.triggerHandler('click');
        expect(this.controller.getPreview).toHaveBeenCalled();
    });
    it('should call download when the download button is clicked', function() {
        spyOn(this.controller, 'download');
        var button = angular.element(this.element.querySelectorAll('button.download-button')[0]);
        button.triggerHandler('click');
        expect(this.controller.download).toHaveBeenCalled();
    });
});