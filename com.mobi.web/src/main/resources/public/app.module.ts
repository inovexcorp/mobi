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

import * as angular from 'angular';
import * as Snap from 'snapsvg';
import * as chroma from 'chroma-js';
import * as _ from 'lodash';
import * as CodeMirror  from 'codemirror-minified';
(<any> window).CodeMirror = CodeMirror;
import * as Handsontable from 'handsontable';
(<any> window).Handsontable = Handsontable;
import 'codemirror-no-newlines/no-newlines.js';
import 'codemirror-minified/mode/sparql/sparql.js';
import 'codemirror-minified/mode/turtle/turtle.js';
import 'codemirror-minified/mode/xml/xml.js';
import 'codemirror-minified/mode/javascript/javascript.js';
import 'codemirror-minified/addon/edit/matchbrackets.js';
import 'lodash';
import 'jquery';
import 'popper.js';
import 'angular-animate';
import 'angular-touch';
import 'ui-bootstrap4';
import 'daemonite-material';
import 'angular-ui-codemirror';
import 'angular-ui-router';
import 'angular-toastr';
import 'angular-uuid';
import 'angular-cookies';
import 'angular-messages';
import 'angular-aria';
import 'angular-material';
import 'ngclipboard';
import 'ui-select';
import 'ng-handsontable/dist/ngHandsontable.min.js';
import 'clipboard';
import showdown from 'showdown';
import sparqljs from 'sparqljs';

import 'angular-material/angular-material.min.css';
import 'font-awesome/css/font-awesome.min.css';
import 'handsontable/dist/handsontable.full.min.css';
import 'ui-select/dist/select.min.css';
import 'angular-toastr/dist/angular-toastr.css';
import 'codemirror-minified/lib/codemirror.css';
import './css/customMaterial.scss';
import './css/manchestersyntax.scss';
import './css/styles.scss';

import './vendor/manchestersyntax.js';

import ariaConfig from './aria.config';
import httpInterceptorConfig from './httpInterceptor.config';
import ignoreUnhandledRejectionsConfig from './ignoreUnhandledRejections.config';
import hashPrefixConfig from './hashPrefix.config';
import routeConfig from './route.config';
import themingConfig from './theming.config';

import requestInterceptor from './requestInterceptor.service';
import beforeUnload from './beforeUnload.service';

import './home/home.module';
import './login/login.module';
import './settings/settings.module';
import './shared/shared.module';
import './user-management/user-management.module';

// prefix + 'bootstrap/' + (prefix.includes(dest) ? '**' : 'dist/js') + '/bootstrap.min.js',

angular
    .module('app', [
        /* Third Party */
        'angular-uuid',
        'ngAnimate',
        'ngAria',
        'ngCookies',
        'ngMaterial',
        'ngclipboard',
        'ngHandsontable',
        'ngMessages',
        'toastr',
        'ui.bootstrap',
        'ui.codemirror',
        'ui.router',
        'ui.select',

        /* Custom Modules */
        // 'catalog',
        // 'datasets',
        // 'discover',
        'home',
        'login',
        // 'mapper',
        // 'merge-requests',
        // 'ontology-editor',
        'settings',
        'shared',
        'user-management'
    ])
    .config(ariaConfig)
    .config(httpInterceptorConfig)
    .config(ignoreUnhandledRejectionsConfig)
    .config(routeConfig)
    .config(hashPrefixConfig)
    .config(themingConfig)
    .constant('chroma', chroma)
    .constant('Snap', Snap)
    .constant('sparqljs', sparqljs)
    .constant('showdown', showdown)
    .constant('REGEX', {
        'IRI': /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i,
        'LOCALNAME': /^[a-zA-Z0-9._\-]+$/,
        'FILENAME': /^[\w\-. ]+$/,
        'UUID': /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
        'DATETIME': /^\d{4}(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?)?)?)?$/i,
        'INTEGER': /^[-+]?\d+$/,
        'DECIMAL': /^[-+]?\d*[.]?\d*$/,
        'ANYTHING': /^.+$/
    })
    .constant('INDENT', 1.28571429)
    .constant('REST_PREFIX', '/mobirest/')
    .factory('requestInterceptor', requestInterceptor)
    .service('beforeUnload', beforeUnload)
    .run(function(beforeUnload) {
        // We have to invoke the service at least once
    })
    .run(run);

run.$inject = ['$rootScope', '$state', '$transitions'];

function run($rootScope, $state, $transitions) {
    $rootScope.$state = $state;

    $transitions.onBefore({ to: 'login' }, trans => {
        var lm = trans.injector().get('loginManagerService');
        if (lm.currentUser) {
            trans.router.stateService.transitionTo('root.home');
            return false;
        }
    });
}