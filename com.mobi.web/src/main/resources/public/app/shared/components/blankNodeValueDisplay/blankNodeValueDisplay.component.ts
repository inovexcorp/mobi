/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { Component, Input, OnInit } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';

import { OntologyStateService } from '../../services/ontologyState.service';
import { TrustedHtmlPipe } from '../../pipes/trustedHtml.pipe';
import { PrefixationPipe } from '../../pipes/prefixation.pipe';
import { VersionedRdfState } from '../../services/versionedRdfState.service';
import { VersionedRdfListItem } from '../../models/versionedRdfListItem.class';

/**
 * @name shared.BlankNodeValueDisplayComponent
 *
 * A component that creates a ui-codemirror container for displaying a blank node with
 * provided `nodeId`. The codemirror syntax is Manchester syntax and is non-editable.
 *
 * @param {string} nodeId The ID of a blank node in the current {@link shared.OntologyStateService#listItem ontology}
 */
@Component({
  selector: 'blank-node-value-display',
  templateUrl: './blankNodeValueDisplay.component.html',
  styleUrls: ['./blankNodeValueDisplay.component.scss']
})
export class BlankNodeValueDisplayComponent implements OnInit {
  @Input() stateService: VersionedRdfState<VersionedRdfListItem>;
  @Input() node;

  htmlValue: SafeHtml;
  typeValue: SafeHtml;
  langValue: SafeHtml;

  constructor(
    private safeHtml: TrustedHtmlPipe,
    private prefixation: PrefixationPipe
  ) { }

  ngOnInit(): void {
    this.calcNodeProperties();
  }

  private calcNodeProperties(): void {
    this.htmlValue = this.safeHtml.transform(this.stateService.getBlankNodeValue(this.node['@id']) || this.node['@id'] || this.node['@value'], 'html');
    this.typeValue = this.node['@type'] ? this.safeHtml.transform(this.prefixation.transform(this.node['@type']), 'html') : undefined;
    this.langValue = this.node['@language'] ? this.safeHtml.transform(this.prefixation.transform(this.node['@language']), 'html') : undefined;
  }
}
