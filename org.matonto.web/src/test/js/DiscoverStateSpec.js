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
describe('Discover State Service', function() {
    var discoverStateSvc;

    beforeEach(function() {
        module('discoverState');

        inject(function(discoverStateService) {
            discoverStateSvc = discoverStateService;
        });
    });
    
    it('default variables should be set properly', function() {
        expect(discoverStateSvc.explore).toEqual({
            active: true,
            breadcrumbs: ['Classes'],
            classDetails: [],
            instanceDetails: {
                currentPage: 0,
                data: [],
                limit: 99,
                links: {
                    next: '',
                    prev: ''
                },
                total: 0
            },
            recordId: ''
        });
        expect(discoverStateSvc.query).toEqual({active: false});
    });
    
    it('resetPagedInstanceDetails should reset the proper variables', function() {
        discoverStateSvc.explore.instanceDetails = {
            currentPage: 1,
            data: [{prop: 'stuff'}],
            limit: 100,
            links: {
                next: 'next',
                prev: 'prev'
            },
            total: 1
        }
        discoverStateSvc.resetPagedInstanceDetails();
        expect(discoverStateSvc.explore.instanceDetails).toEqual({
            currentPage: 0,
            data: [],
            limit: 99,
            links: {
                next: '',
                prev: ''
            },
            total: 0
        });
    });
});
