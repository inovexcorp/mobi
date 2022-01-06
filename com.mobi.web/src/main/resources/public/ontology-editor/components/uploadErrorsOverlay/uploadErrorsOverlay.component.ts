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
import { get } from 'lodash';

const template = require('./uploadErrorsOverlay.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:uploadErrorsOverlay
 *
 * @description
 * `uploadErrorsOverlay` is a component that creates content for a modal that shows errors of the uploaded file
 *
 * @param {Function} close A function that closes the modal
 * @param {Function} dismiss A function that dismisses the modal
 */
const uploadErrorsOverlayComponent = {
    template,
    bindings: {
        close: '&',
        dismiss: '&',
        resolve: '<'
    },
    controllerAs: 'dvm',
    controller: uploadErrorsOverlayComponentCtrl
};

function uploadErrorsOverlayComponentCtrl() {
    var dvm = this;
    dvm.itemTitle = '';
    dvm.errorMessage = '';
    dvm.errorDetails = [];

    dvm.$onInit = function() {
        dvm.itemTitle = get(dvm.resolve, 'item.title', 'Something went wrong. Please try again later.');
        dvm.errorMessage = get(dvm.resolve, 'item.error.errorMessage', '');
        dvm.errorDetails = get(dvm.resolve, 'item.error.errorDetails', []);
    }

    dvm.cancel = function() {
        dvm.dismiss();
    }
}

export default uploadErrorsOverlayComponent;
