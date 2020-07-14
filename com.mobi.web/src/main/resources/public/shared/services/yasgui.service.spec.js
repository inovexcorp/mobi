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
    mockUtil,
    mockHttpService,
    injectRestPathConstant,
    mockDiscoverState,
    mockModal,
    mockYasguiCall
} from '../../../../../test/js/Shared';

import yasguiMockResponse from './yasguiMockResponse';

fdescribe('YASGUI service', function() {
    let yasguiSvc, sparqlManagerSvc, discoverStateSvc, modalSvc, $q, scope, httpSvc, $httpBackend, windowSvc, $compile, _yasgui, yasguiWrapper, yasMock;

    beforeEach(function() {
        angular.mock.module('shared');
        mockUtil();
        mockHttpService();
        mockDiscoverState();
        injectRestPathConstant();
        mockModal();
        yasMock = yasguiMockResponse();

        this.url = 'mobirest/sparql/limited-results?';
        inject(function(yasguiService, _sparqlManagerService_, _discoverStateService_, _modalService_, _$q_, _$rootScope_, _httpService_, _$httpBackend_, _$window_, _$compile_) {
            yasguiSvc = yasguiService;
            sparqlManagerSvc =  _sparqlManagerService_;
            discoverStateSvc = _discoverStateService_;
            modalSvc = _modalService_;
            $q = _$q_;
            scope = _$rootScope_;
            $httpBackend = _$httpBackend_;
            //utilSvc = _utilService_;
            httpSvc = _httpService_;
            windowSvc = _$window_;
            $compile = _$compile_; 
        });


        this.element = $compile(angular.element('<sparql-editor></sparql-editor>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('sparqlEditor');
        _yasgui = yasguiSvc.initYasgui(this.element[0], {name: 'testDicoveryQuery', endpoint: this.url });
        yasguiWrapper = this.element.querySelectorAll('.yasgui');
        yasguiSvc.submitQuery = jasmine.createSpy('submiQuery');
    });

    afterEach(function() {
        sparqlManagerSvc = null;
        $q = null;
        scope = null;
        //utilSvc = null;
        httpSvc = null;
        $httpBackend = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            console.log(this.element);
            expect(yasguiWrapper.length).toEqual(1);
            expect(this.element.querySelectorAll('.yasqe').length).toEqual(1);
            expect(this.element.querySelectorAll('.yasqe .CodeMirror').length).toEqual(1);
            expect(this.element.querySelectorAll('.yasr').length).toEqual(1);
            expect(this.element.querySelectorAll('.yasr .yasr_results').length).toEqual(1);
        });
    });

    describe('should query the repository', function() {
        beforeEach(function () {
            this.url = _yasgui.getTab().yasr.config.getPlainQueryLinkToEndpoint();
            this.query = 'query';
            this.result = yasMock;
            this.yasr = _yasgui.getTab().yasr;
        });

        it('successfully', function() {
            yasguiSvc.submitQuery();
            this.yasr.setResponse(this.result, 50);
            let canHandleData = !!this.yasr.results && this.yasr.results.getVariables() && this.yasr.results.getVariables().length > 0;
            expect(canHandleData).toEqual(true);
        });        
    });
});