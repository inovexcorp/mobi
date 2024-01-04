/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import { TestBed } from '@angular/core/testing';

import { cleanStylesFromDOM } from '../../../test/ts/Shared';
import { UserStateService } from './userState.service';

describe('User State service', function() {
    let service: UserStateService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                UserStateService
            ]
        });

        service = TestBed.inject(UserStateService);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
    });

    it('should reset variables', function() {
        service.groupSearchString = 'test';
        service.userSearchString = 'test';
        service.tabIndex = 1;
        service.selectedGroup = {
            title: '',
            description: '',
            roles: [],
            members: [],
            external: false
        };
        service.selectedUser = {
            username: '',
            firstName: '',
            lastName: '',
            email: '',
            roles: [],
            external: false
        };
        service.reset();
        expect(service.userSearchString).toEqual('');
        expect(service.groupSearchString).toEqual('');
        expect(service.selectedGroup).toBeUndefined();
        expect(service.selectedUser).toBeUndefined();
        expect(service.tabIndex).toEqual(0);
    });
});
