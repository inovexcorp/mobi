/*-
 * #%L
 * itests-web
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

const parentEl = 'shapes-graph-editor-page';

const propertyValues = `${parentEl} shapes-graph-property-values`;

const shapesEditorCommands = {
    openRecordSelect: function() {
        return this.api.page.editorPage().openRecordSelect(parentEl);
    },

    createShapesGraph: function(title, description) {
        return this.api.page.editorPage().createRecord(parentEl, title, description);
    },

    uploadShapesGraph: function(shapes_file) {
        return this.api.page.editorPage().uploadRecord(parentEl, shapes_file);;
    },

    searchForShapesGraph: function(title) {
        return this.api.page.editorPage().searchForRecord(parentEl, title);
    },

    openShapesGraph: function(title) {
        return this.api.page.editorPage().openRecord(parentEl, title);
    },

    closeShapesGraph: function(title) {
        return this.api.page.editorPage().closeRecord(parentEl, title);
    },

    openUploadRecordLog: function() {
        return this.api.page.editorPage().openUploadRecordLog(parentEl);
    },    

    createBranch: function(branch_title, branch_description) {
        return this.api.page.editorPage().createBranch(parentEl, branch_title);
    },

    createTag: function(tag_title) {
        return this.api.page.editorPage().createTag(parentEl, tag_title);
    },

    openBranchSelect: function() {
        return this.api.page.editorPage().openBranchSelect(parentEl);
    },

    switchBranch: function(branch_title) {
        return this.api.page.editorPage().switchBranch(parentEl, branch_title);
    },

    deleteBranchOrTag: function(title, isBranch = true) {
        return this.api.page.editorPage().deleteBranchOrTag(parentEl, title, isBranch);
    },

    deleteShapesGraph: function(title) {
        return this.api.page.editorPage().deleteRecord(parentEl, title);
    },

    uploadChanges: function(file) {
        return this.api.page.editorPage().uploadChanges(parentEl, file);
    },

    commit: function(message) {
        return this.api.page.editorPage().commit(parentEl, message);
    },

    toggleChangesPage: function(open = true) {
        return this.api.page.editorPage().toggleChangesPage(parentEl, open);
    }
}

module.exports = {
    elements: {
        propertyValues: propertyValues
    },
    commands: [shapesEditorCommands]
}
