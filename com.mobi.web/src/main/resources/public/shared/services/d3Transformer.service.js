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
(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name d3Transformer
         *
         * @description
         * The `d3Transformer` module only provides the `d3TransformerService` service which
         * provides various transformers tools to convrt json-ld to d3 json format
         */
        .module('d3Transformer', [])
        /**
         * @ngdoc service
         * @name d3Transformer.service:d3TransformerService
         *
         * @description
         * `d3TransformerService` is a service that provides different transformers to convert json-ld
         *  to json objects used by the d3 library.
         */
        .service('d3TransformerService', d3TransformerService);

    function d3TransformerService() {
        var self = this;

        /**
         * @ngdoc method
         * @name buildForceDirectedGraphD3Format
         * @methodOf d3Transformer.service:d3TransformerService
         *
         * @description
         * Transform provided JSON-LD object to the D3 force directed graph json format
         *
         * @param {Object} A JSON-LD array (typically contains an ontology or dataset records)
         * @return {Object} A formatted JSON object
         */
        self.buildForceDirectedGraphD3Format = function(inputData) {
            var jsonld = JSON.parse(inputData);
            var allNodes = {};
            allNodes.nodes = [];
            allNodes.links = [];

            _.forEach(jsonld, (jsonldNode, index) => {
                var jsonldNodeKeys = _.keys(jsonldNode);
                var getValueId = _.get(jsonldNode, '@id');

                buildNode(getValueId, 1, "obj");

                var filterAnnotations = _.filter(jsonldNodeKeys, o => !_.startsWith(o, '@'));

                _.forEach(filterAnnotations, (element, key) => {
                    var getValue = _.get(jsonldNode, element);
                    buildWithLinks(getValueId, element, getValue);
                });
            });
            return allNodes;
        }

        /**
         * @ngdoc method
         * @name buildHierarchyD3Format
         * @methodOf d3Transformer.service:d3TransformerService
         *
         * @description
         * Transform provided JSON-LD object to the D3 hierarchy json format
         *
         * @param {Object} A JSON-LD array (typically contains an ontology or dataset records)
         * @return {Object} A formatted JSON object
         */
        /* self.buildHierarchyD3Format = function(jsonld) {
            return '';
        } */

        function buildWithLinks(parentId, predicate, jsonld) {
            _.forEach(jsonld, function(jsonldNode, index) {
                var jsonldNodeKeys = _.keys(jsonldNode);

                var link = {};
                var getValueId = _.get(jsonldNode, '@id');

                if (getValueId) {
                    buildNode(getValueId, 1, "obj");

                    link.source = parentId;
                    link.predicate = predicate;
                    link.target = getValueId;
                    link.edgetype = "obj";
                    allNodes.links.push(link);
                }

                _.forEach(jsonldNodeKeys, (element, key) => {
                    var singleNode = {};
                    var getValue = _.get(jsonldNode, element);
                    var innerparentId = _.get(getValue, '@id');

                    if (innerparentId) {
                        buildWithLinks(innerparentId, element, getValue);
                    }
                })
            });
        }

        function buildNode(id, group, type) {
            var singleNode = {};
            if (id && group) {
                singleNode.id = id;
                singleNode.group = 1;
                singleNode.type = type;
                if (!_.find(allNodes.nodes, singleNode)) {
                    allNodes.nodes.push(singleNode);
                }
            }
        }
    }
})();
