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
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockProvider } from 'ng-mocks';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { SharedModule } from '../../../shared/shared.module';
import { DCTERMS } from '../../../prefixes';
import { EntityPublisherComponent } from './entityPublisher.component';

describe('Entity Publisher component', function() {
    let component: EntityPublisherComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<EntityPublisherComponent>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;

    const userId = 'userId';
    const username = 'user';

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                EntityPublisherComponent
            ],
            providers: [
                MockProvider(UserManagerService),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EntityPublisherComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        
        userManagerStub = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;
        
        userManagerStub.users = [{iri: userId, username, external: false, firstName: '', lastName: '', email: '', roles: []}];
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        userManagerStub = null;
    });

    describe('initializes correctly on entity change', function() {
        it('if the user can be found', function() {
            component.entity = { '@id': '', '@type': [], [`${DCTERMS}publisher`]: [{ '@id': userId }] };
            expect(component.publisherName).toEqual(username);
        });
        it('if the entity does not have a publisher', function() {
            component.entity = {'@id': '', '@type': []};
            expect(component.publisherName).toEqual('(None)');
        });
        it('if the user cannot be found', function() {
            userManagerStub.users = [];
            component.entity = {'@id': '', '@type': []};
            expect(component.publisherName).toEqual('(None)');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.entity-publisher')).length).toBe(1);
        });
    });
});
