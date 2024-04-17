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
const workflowsCommands = {
    createWorkflow: function(title) {
        return this.useCss()
            .click('app-workflow-controls button:nth-child(4)')
            .waitForElementVisible('mat-dialog-container')
            .assert.visible('mat-dialog-container')
            .waitForElementVisible('mat-dialog-container input[name="title"]')
            .setValue('mat-dialog-container input[name=title]', title)
            .click('mat-dialog-container button.mat-primary')
            .click('app-workflow-record button span.fa-chevron-left')
    }
}

module.exports = {
    elements: {},
    commands: [workflowsCommands]
}
