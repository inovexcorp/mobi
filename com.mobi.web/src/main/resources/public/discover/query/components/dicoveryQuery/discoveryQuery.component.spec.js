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
    mockSparqlManager
} from '../../../../../../../test/js/Shared';

describe('Discoverry Query Editor component', function() {
    var $compile, scope, sparqlManagerSvc, yasguiSvc;

    beforeEach(function() {
        angular.mock.module('query');
        mockSparqlManager();

        inject(function(_$compile_, _$rootScope_, _sparqlManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            sparqlManagerSvc = _sparqlManagerService_;
        });
      
        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        this.element = $compile(angular.element('<div class="yasgui-editor"></div>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('discoveryQuery');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });
  
    describe('contains the correct html', function() {
        it('with a discovery-query', function() {
           expect(this.element.hasClass('yasgui-editor')).toBe(true);
        });
    });

});
