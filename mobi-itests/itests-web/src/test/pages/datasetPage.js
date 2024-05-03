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
const datasetCommands = {
    createDataset: function(title, description, onts) {
        this.click('div.datasets-page button.mat-primary')
            .waitForElementVisible('new-dataset-overlay')
            .waitForElementVisible('new-dataset-overlay input[name="title"]')
            .setValue('div.mat-dialog-content input[name=title]', title)
            .setValue('div.mat-dialog-content textarea', description);
        if (onts) {
          onts.forEach(function(ont) {
              this.useXpath()
                  .waitForElementVisible(`//div[contains(@class, "datasets-ontology-picker")]//h4[text()[contains(.,"${ont}")]]//ancestor::mat-list-option`)
                  .click(`//div[contains(@class, "datasets-ontology-picker")]//h4[text()[contains(.,"${ont}")]]//ancestor::mat-list-option`);
          }.bind(this));
        }
        return this.useCss()
            .click('new-dataset-overlay div.mat-dialog-actions button.mat-primary')
            .waitForElementNotPresent('new-dataset-overlay div.mat-dialog-actions button:not(.mat-primary)');
    }
}

module.exports = {
    elements: {},
    commands: [datasetCommands]
}
