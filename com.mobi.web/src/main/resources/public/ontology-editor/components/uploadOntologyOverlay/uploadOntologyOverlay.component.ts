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
import { pullAt, map, trim } from 'lodash';

const template = require('./uploadOntologyOverlay.component.html');

/**
 * @ngdoc component
 * @name ontology-editor.component:uploadOntologyOverlay
 * @requires shared.service:ontologyManagerService
 * @requires shared.service:ontologyStateService
 *
 * @description
 * `uploadOntologyOverlay` is a component that creates content for a modal that provides a form for entering
 * catalog record metadata about each of the {@link shared.service:ontologyStateService uploaded files}.
 * The form contains a {@link shared.component:textInput} for the record title, a
 * {@link shared.component:textArea} for the record description, and a
 * {@link shared.component:keywordSelect} for each uploaded file. The title defaults to the file name.
 * The modal contains buttons to Cancel, Submit the current ontology upload, and Submit all the subsequent
 * ontology uploads with the default values.
 *
 * @param {Function} close A function that closes the modal
 * @param {Function} dismiss A function that dismisses the modal
 */
const uploadOntologyOverlayComponent = {
    template,
    bindings: {
        close: '&',
        dismiss: '&',
        resolve: '<'
    },
    controllerAs: 'dvm',
    controller: uploadOntologyOverlayComponentCtrl
};

uploadOntologyOverlayComponentCtrl.$inject = ['ontologyManagerService', 'ontologyStateService'];

function uploadOntologyOverlayComponentCtrl(ontologyManagerService, ontologyStateService) {
    var dvm = this;
    var om = ontologyManagerService;
    var os = ontologyStateService;
    var file = undefined;
    var uploadOffset = 0;
    dvm.total = 0;
    dvm.index = 0;
    dvm.title = '';
    dvm.description = '';
    dvm.keywords = [];

    dvm.$onInit = function() {
        uploadOffset = os.uploadList.length;
        dvm.total = os.uploadFiles.length;
        if (dvm.total) {
            setFormValues();
        }
        if (dvm.total < 1) {
            dvm.cancel();
        }
    }
    dvm.submit = function() {
        const id = 'upload-' + (uploadOffset + dvm.index);
        const emtyPromise = new Promise(resolve => {
        });
        dvm.resolve.startUpload();
        os.uploadList
            .push({title: dvm.title, id, promise: emtyPromise, error: undefined, isProcessing: true});
        om.uploadOntology(file, undefined, dvm.title, dvm.description, map(dvm.keywords, trim), id, this.finishLoading);
        if ((dvm.index + 1) < dvm.total) {
            dvm.index++;
            setFormValues();
        } else {
            os.uploadFiles.splice(0);
            dvm.close();
        }
    }
    dvm.submitAll = function() {
        for (var i = dvm.index; i < dvm.total; i++) {
            dvm.submit();
        }
    }
    dvm.finishLoading = function(id,promise, title) {
        promise.then(dvm.resolve.finishUpload, errorObject => {
                 os.addErrorToUploadItem(id, errorObject);
                 dvm.resolve.finishUpload();
             });
        let fileInfo = os.uploadList.find(item => item.id === id);
        fileInfo.promise = promise;
        fileInfo.isProcessing = false;
    }

    dvm.cancel = function() {
        os.uploadFiles.splice(0);
        dvm.total = 0;
        dvm.dismiss();
    }

    function setFormValues() {
        file = pullAt(os.uploadFiles, 0)[0];
        dvm.title = file.name;
        dvm.description = '';
        dvm.keywords = [];
    }
}

export default uploadOntologyOverlayComponent;