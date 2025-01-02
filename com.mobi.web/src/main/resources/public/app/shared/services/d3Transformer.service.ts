/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { Injectable } from '@angular/core';
import { forEach, get, find, filter, startsWith } from 'lodash';

/**
 * @class shared.D3TransformerService
 *
 * `d3TransformerService` is a service that provides different transformers to convert json-ld
 *  to json objects used by the d3 library.
 */
@Injectable()
export class D3TransformerService {
    constructor() {}

    /**
     * Transform provided JSON-LD object to the D3 force directed graph json format
     *
     * @param {Object} inputData A JSON-LD array (typically contains an ontology or dataset records)
     * @return {Object} A formatted JSON object
     */
    buildForceDirectedGraphD3Format(inputData) {
        const jsonld = JSON.parse(inputData);
        const allNodes: any = {};
        allNodes.nodes = [];
        allNodes.links = [];

        forEach(jsonld, (jsonldNode, index) => {
            const jsonldNodeKeys = Object.keys(jsonldNode);
            const getValueId = get(jsonldNode, '@id');

            this._buildNode(allNodes, getValueId, 1, 'obj');

            const filterAnnotations = filter(jsonldNodeKeys, o => !startsWith(o, '@'));

            forEach(filterAnnotations, (element, key) => {
                const getValue = get(jsonldNode, element);
                this._buildWithLinks(allNodes, getValueId, element, getValue);
            });
        });
        return allNodes;
    }

    /**
     * Transform provided JSON-LD object to the D3 hierarchy json format
     *
     * @param {Object} jsonld A JSON-LD array (typically contains an ontology or dataset records)
     * @return {Object} A formatted JSON object
     */
    /* buildHierarchyD3Format(jsonld) {
        return '';
    } */

    private _buildWithLinks(allNodes, parentId, predicate, jsonld) {
        forEach(jsonld, (jsonldNode, index) => {
            const jsonldNodeKeys = Object.keys(jsonldNode);

            const link: any = {};
            const getValueId = get(jsonldNode, '@id');

            if (getValueId) {
                this._buildNode(allNodes, getValueId, 1, 'obj');

                link.source = parentId;
                link.predicate = predicate;
                link.target = getValueId;
                link.edgetype = 'obj';
                allNodes.links.push(link);
            }

            forEach(jsonldNodeKeys, (element, key) => {
                const singleNode = {};
                const getValue = get(jsonldNode, element);
                const innerparentId = get(getValue, '@id');

                if (innerparentId) {
                    this._buildWithLinks(allNodes, innerparentId, element, getValue);
                }
            });
        });
    }

    private _buildNode(allNodes, id, group, type) {
        const singleNode: any = {};
        if (id && group) {
            singleNode.id = id;
            singleNode.group = 1;
            singleNode.type = type;
            if (!find(allNodes.nodes, singleNode)) {
                allNodes.nodes.push(singleNode);
            }
        }
    }
}
