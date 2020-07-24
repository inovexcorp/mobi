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

import { 
    yasguiMockResponse, 
    turtleResponseText, 
    rdfResponseText, 
    getJsonLDResponseText 
} from './yasguiMockResponse';
import { element } from 'angular';

describe('YASGUI service', function() {
    let yasguiSvc, sparqlManagerSvc, discoverStateSvc, modalSvc, $q, scope, httpSvc, $httpBackend, windowSvc, $compile, _yasgui, yasguiWrapper, yasMock, turtleResponse, rdfResponse, jsonLDResponse;

    beforeEach(function() {
        angular.mock.module('shared');
        mockUtil();
        mockHttpService();
        mockDiscoverState();
        injectRestPathConstant();
        mockModal();
        yasMock = yasguiMockResponse();
        turtleResponse = turtleResponseText();
        rdfResponse = rdfResponseText();
        jsonLDResponse = getJsonLDResponseText();

        
        inject(function(yasguiService, _sparqlManagerService_, _discoverStateService_, _modalService_, _$q_, _$rootScope_,
             _httpService_, _$httpBackend_, _$window_, _$compile_) {
            yasguiSvc = yasguiService;
            sparqlManagerSvc =  _sparqlManagerService_;
            discoverStateSvc = _discoverStateService_;
            modalSvc = _modalService_;
            $q = _$q_;
            scope = _$rootScope_;
            $httpBackend = _$httpBackend_;
            httpSvc = _httpService_;
            windowSvc = _$window_;
            $compile = _$compile_; 
        });
    
        this.element = $compile(angular.element('<div class="test-yasgui"></div>'))(scope);
        yasguiSvc.initYasgui(this.element[0], {endpoint : 'mobirest/sparql/limited-results?'})
        yasguiSvc.submitQuery = jasmine.createSpy('submiQuery');
    });

    afterEach(function() {
        sparqlManagerSvc = null;
        $q = null;
        scope = null;
        httpSvc = null;
        $httpBackend = null;
        this.result = null;
    });

    describe('yasgui Initial state', function() {
        it('should have updated hasInitialized', function() {
            expect(yasguiSvc.hasInitialized).toBe(true);
        });
        describe('Yasgui plugins', function() {
            beforeEach(function() {
                this.yasr = yasguiSvc.getYasgui().getTab().yasr;
                let plugins = this.yasr.plugins;
                this.hasPlugin = function(name) {
                     return Object.prototype.hasOwnProperty.call(plugins, name);
                };
            });
            it('response plugin is disabled', function() {
                expect(this.yasr.rootEl.querySelector(`.select_response`).classList.contains('hide')).toBe(true);
                expect(this.yasr.plugins['response'].canHandleResults()).toBe(false)
            });
            it('should have MOBI custom plugins ', function() {
                expect(this.hasPlugin('turtle')).toBe(true);
                expect(this.hasPlugin('jsonLD')).toBe(true);
                expect(this.hasPlugin('rdfXml')).toBe(true);
            });
        });
    });
    describe('should query the repository', function() {
        beforeEach(function () {
            let yasgui = yasguiSvc.getYasgui().getTab(); 
            this.updateHeaders = function (type) {
                this.response.req.header = {
                    "Accept": type
                };
                this.response.headers['content-type'] = type;
                this.response.type = type;
                this.response.header['accept'] = type
                this.response.header['content-type'] = type;
                this.response.body = null;
                this.response.links = {};
            }
            this.yasr = yasgui.yasr;
            this.url = yasgui.yasr.config.getPlainQueryLinkToEndpoint();
            this.query = 'query';
            this.response = yasMock;
            this.results = this.response.body;
            
        });
        it('table plugin is displayed', function() {
            yasguiSvc.submitQuery();
            this.yasr.setResponse(this.response, 50);
            let canHandleData = !!this.yasr.results && this.yasr.results.getVariables() && this.yasr.results.getVariables().length > 0;
            expect(this.yasr.results.getType()).toEqual('json');
            expect(this.yasr.drawnPlugin).toEqual('table');
            expect(canHandleData).toEqual(true);
        });    
        it('turtle plugin is displayed', function() {
            yasguiSvc.submitQuery();
            this.updateHeaders('text/turtle');
            this.response.text = turtleResponse.text;
            this.yasr.setResponse(this.response, 50);
            expect(this.yasr.results.getContentType()).toEqual('text/turtle');
            expect(this.yasr.results.getType()).toEqual('ttl');
        }); 
        it('RDF/XML plugin is displayed', function() {
            yasguiSvc.submitQuery();
            this.updateHeaders('application/rdf+xml');
            this.response.text = rdfResponse.text;
            this.yasr.setResponse(this.response, 50);
            expect(this.yasr.results.getContentType()).toEqual('application/rdf+xml');
            expect(this.yasr.results.getType()).toEqual('xml');
        });
        it('JSON-LD plugin is displayed', function() {
            yasguiSvc.submitQuery();
            this.updateHeaders('application/ld+json');
            this.response.text = jsonLDResponse.text;
            this.yasr.setResponse(this.response, 50);
            expect(this.yasr.results.getContentType()).toEqual('application/ld+json');
            expect(this.yasr.results.getType()).toEqual('xml');
        }); 
    });
});