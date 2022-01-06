/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
export function loginManagerServiceFactory(i: any) {
    return i.get('loginManagerService');
}

export const loginManagerServiceProvider = {
    provide: 'loginManagerService',
    useFactory: loginManagerServiceFactory,
    deps: ['$injector']
};

export function utilServiceFactory(i: any) {
    return i.get('utilService');
}

export const utilServiceProvider = {
    provide: 'utilService',
    useFactory: utilServiceFactory,
    deps: ['$injector']
};

export function modalServiceFactory(i: any) {
    return i.get('modalService');
}

export const modalServiceProvider = {
    provide: 'modalService',
    useFactory: modalServiceFactory,
    deps: ['$injector']
};

export function settingManagerServiceFactory(i: any) {
    return i.get('settingManagerService');
}

export const settingManagerServiceProvider = {
    provide: 'settingManagerService',
    useFactory: settingManagerServiceFactory,
    deps: ['$injector']
};

export function provManagerServiceFactory(i: any) {
    return i.get('provManagerService');
}

export const provManagerServiceProvider = {
    provide: 'provManagerService',
    useFactory: provManagerServiceFactory,
    deps: ['$injector']
};

export function prefixesFactory(i: any) {
    return i.get('prefixes');
}

export const prefixesProvider = {
    provide: 'prefixes',
    useFactory: prefixesFactory,
    deps: ['$injector']
};

export function httpServiceFactory(i: any) {
    return i.get('httpService');
}

export const httpServiceProvider = {
    provide: 'httpService',
    useFactory: httpServiceFactory,
    deps: ['$injector']
};

export function ontologyStateServiceFactory(i: any) {
    return i.get('ontologyStateService');
}

export const ontologyStateServiceProvider = {
    provide: 'ontologyStateService',
    useFactory: ontologyStateServiceFactory,
    deps: ['$injector']
};

export function ontologyManagerServiceFactory(i: any) {
    return i.get('ontologyManagerService');
}

export const ontologyManagerServiceProvider = {
    provide: 'ontologyManagerService',
    useFactory: ontologyManagerServiceFactory,
    deps: ['$injector']
};

export function discoverStateServiceFactory(i: any) {
    return i.get('discoverStateService');
}

export const discoverStateServiceProvider = {
    provide: 'discoverStateService',
    useFactory: discoverStateServiceFactory,
    deps: ['$injector']
};

export function catalogManagerServiceFactory(i: any) {
    return i.get('catalogManagerService');
}

export const catalogManagerServiceProvider = {
    provide: 'catalogManagerService',
    useFactory: catalogManagerServiceFactory,
    deps: ['$injector']
};

export function stateManagerServiceFactory(i: any) {
    return i.get('stateManagerService');
}

export const stateManagerServiceProvider = {
    provide: 'stateManagerService',
    useFactory: stateManagerServiceFactory,
    deps: ['$injector']
};

export function toastrFactory(i: any) {
    return i.get('toastr');
}

export const toastrProvider = {
    provide: 'toastr',
    useFactory: toastrFactory,
    deps: ['$injector']
};
