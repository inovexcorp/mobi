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

    /**
     * @ngdoc directive
     * @name shared.component:rdfVisualization
     *
     * @description
     * `rdfVisualization` is a directive that generates an SVG visualisation from a provided
     * JSON-LD array of objects, this JSON-LD object array will be transformed to provide a list
     * of data objects and uses them as nodes. Think of those nodes as the data bubbles,
     * it also provides a list of links, they connect nodes to display (complex) relations.
     * Every link needs to have at least a source and a target. Both are ids referencing a node.
     * The visualization will have default functionalities like zoom, pan, remove node,
     * highlight node nearest neighbors and dragging events. The directive is replaced by the contents of its
     * template.
     *
     * @param {Object} entity A JSON-LD array
     */
    const rdfVisualizationComponent = {
        templateUrl: 'shared/components/rdfVisualization/rdfVisualization.component.html',
        bindings: {
            jsonld: '<'
        },
        controllerAs: 'dvm',
        controller: rdfVisualizationComponentCtrl
    };

    rdfVisualizationComponentCtrl.$inject = ['$element', 'd3TransformerService', 'd3'];

    function rdfVisualizationComponentCtrl($element, d3TransformerService, d3) {
        var dvm = this;
        /**
        * Next define the main object for the layout. We'll also
        * define a couple of objects to keep track of the D3 selections
        * for the nodes and the links. All of these objects are initialized later on.
        */
        var graph = null;
        var arrowHead = null;

        // Set links markers(arrows) default configuration values
        var markers = {};
        var markersConfig = {
            width: 8,
            height: 8,
            refX: 28,
            refY: 0,
            color: 'gray'
        };

        // Set links(connectors) default configuration values
        var links = {};
        var linksConfig = {
            strokeWidth: 1.25,
            class: 'links',
            stroke: 'gray',
            text: 'predicate'
        };

        // Set EdgePaths(connectors) default configuration values
        var edgepaths = {};
        var edgepathsConfig = {
            class: 'edge-paths',
            fillOpacity: 0,
            strokeOpacity: 0
        };

        // Set connector labels default configuration values
        var edgelabels = {};
        var edgelabelsConfig = {
            fontSize: 8.5,
            fontColor: 'gray',
            textAnchor: 'middle',
            startOffSet: '50%'
        };

        // Set nodes configuration values
        var nodes = {};
        var nodesClass = 'nodes';
        var nodesRadio = 20;
        var nodesMouseOverConfig = {
            fillColor: '#f7bd4a',
            strokeWidth: 3,
            stroke: '#0475d8',
            connectedLinksColor: '#0475d8',
            notConnectedLinksColor: 'gray',
            connectedLinksStrokeWidth: 1.70,
            notConnectedLinksStrokeWidth: 1.25
        };

        // Set nodes mouse over event config values
        var nodesMouseOutConfig = {
            nodesStrokeWidth: 1.25,
            nodesStroke: 'gray',
            nodesFill: '#ccddff',
            cursor: 'move',
            linksStroke: 'gray',
            linksStrokeWidth: 1.25
        };

        // Set nodes mouse over event config values
        var nodesTextConfig = {
            class: 'nodetext',
            fontSize: 10,
            dx: 22,
            dy: '.35em',
            fontWeight: 'bold',
            fill: '#0475d8'
        };

        /**
         * We can also create the SVG container that will hold the
         * visualization. D3 makes it easy to set this container's
         * dimensions and add it to the DOM.
         */
        this.formattedData = undefined;
        this.svg = undefined;

        // Define the dimensions of the visualization. We're using
        // a size that's convenient for displaying the graphic on
        this.width = 0;
        this.height = 0;
        this.radius = 5;

        /**
         * One other parameter for our visualization determines how
         * fast (or slow) the animation executes. It's a time value
         * measured in milliseconds.
         */
        var animationStep = 400;

        // Add simulation forces
        this.simulation = undefined;

        dvm.$onInit = function() {
            this.formattedData = d3TransformerService.buildForceDirectedGraphD3Format(dvm.jsonld);
            var svgGetter = $element.find('svg');
            this.svg = d3.select(svgGetter[0]);
            this.width = this.svg.attr('width');
            this.height = this.svg.attr('height');

            //Add zoom capabilities
            var zoom_handler = d3.zoom()
                .scaleExtent([1, 10])
                .on("zoom", zoom_actions);
            zoom_handler(this.svg);
            this.svg.on("dblclick.zoom", null)

            // Add simulation forces
            this.simulation = d3.forceSimulation()
                .force('link', d3.forceLink().id(element => element.id))
                .force('charge', d3.forceManyBody())
                .force('center', d3.forceCenter(this.width / 2, this.height / 2));
        }
        dvm.$onChanges = function() {
            draw();
        }

        /**
         * Draw force directed graph
         */
        function draw() {
            this.svg.selectAll('*').remove();
            graph = this.svg.append("g")
                .attr("class", "everything");

            markers = setLinksMarkers(markersConfig);
            links = setLinks(linksConfig);
            edgepaths = setEdgePaths(edgepaths);
            edgelabels = setEdgeLabels(edgelabelsConfig);
            nodes = setNodes(nodesClass, nodesRadio);
            setNodesText(nodesTextConfig);
            nodesMouseOver(nodesMouseOverConfig);
            nodesMouseOut(nodesMouseOutConfig);

            /**
            * Create a force layout object and define its properties.
            * Those include the dimensions of the visualization and the arrays
            * of nodes and links.
            */
            this.simulation
                .nodes(this.formattedData.nodes)
                .on('tick', tick);
            this.simulation
                .force('link', d3.forceLink()
                    .id(element => element.id)
                    .distance(150)
                    .strength(.15))
                .force('charge', d3.forceManyBody().strength(-30));
            this.simulation
                .force('link')
                .links(this.formattedData.links);
            setTimeout(this.simulation.stop, 5000);
        }

        /**
         * Callback function to update the element positions after each tick
         */
        function tick() {
            nodes.attr("cx", element => element.x = Math.max(this.radius, Math.min(this.width - this.radius, element.x)))
                .attr("cy", element => element.y = Math.max(this.radius, Math.min(this.height - this.radius, element.y)));

            links.attr("x1",  element => element.source.x)
                    .attr("y1",  element => element.source.y)
                    .attr("x2",  element => element.target.x)
                    .attr("y2",  element => element.target.y)
                    .attr("marker-end", element => "url(#arrowhead)");

            nodes.attr("transform", element => "translate(" + element.x + "," + element.y + ")");

            edgepaths.attr('d', element => 'M ' + element.source.x + ' ' +
                element.source.y + ' L ' + element.target.x + ' ' + element.target.y);

            edgelabels.attr('transform', element => {
                if (element.target.x < element.source.x) {
                    var bbox = this.getBBox();
                    var rx = bbox.x + bbox.width / 2;
                    var ry = bbox.y + bbox.height / 2;
                    return 'rotate(180 ' + rx + ' ' + ry + ')';
                } else {
                    return 'rotate(0)';
                }
            });
        }

        /**
         * Remove selected node from simulation on the double click event
         */
        function removeNode(selectedNode) {
            this.formattedData.nodes.splice(selectedNode.index, 1);
            // Remove the links connected with that node
            _.filter(this.formattedData.links, link => link.target.id === selectedNode.id || link.source.id === selectedNode.id)
            document.getElementById("nodeMetada").textContent = '';
            draw();
        }

        /**
         * Drag node event started
         */
        function dragstarted(d) {
            if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        /**
         * Node dragged event
         */
        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        /**
         * Drag node event ended
         */
        function dragended(d) {
            if (!d3.event.active) this.simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        /**
         * Set cursor
         */
        function set_highlight(d) {
            this.svg.style("cursor", "pointer");
        }

        /**
         * Set zoom event
         */
        function zoom_actions() {
            graph.attr("transform", d3.event.transform)
        }

        /**
         * Set links(connectors) markers(arrow)
         */
        function setLinksMarkers(markersConfig) {
            var markers = graph.append("defs").append("marker")
                .attr("id", "arrowhead")
                .attr("refX", markersConfig.refX)
                .attr("refY", markersConfig.refY)
                .attr("viewBox", '-0 -5 10 10')
                .attr("markerWidth", markersConfig.width)
                .attr("markerHeight", markersConfig.height)
                .attr("orient", "auto")
                .style('fill', element => markersConfig.color)
                .append("path")
                .attr('d', 'M 0,-5 L 10 ,0 L 0,5');
            return markers;
        }

        /**
         * Set all the links(connectors) between nodes using transformed data
         */
        function setLinks(linksConfig) {
            var links = graph.append('g')
                .attr('class', linksConfig.class)
                .selectAll('line.link')
                .data(this.formattedData.links)
                .enter().append('svg:line')
                .style('stroke', linksConfig.stroke)
                .attr('stroke-width', linksConfig.strokeWidth);

            links.append("title")
                .text(element => element[linksConfig.text]);
            return links;
        }

        /**
         * Set links edge paths
         */
        function setEdgePaths(edgepathsConfig) {
            var edgepaths = graph.selectAll(".edgepath")
                .data(this.formattedData.links)
                .enter()
                .append('path')
                .attr("class", edgepathsConfig.class)
                .attr("id", (d, i) => 'edgepath' + i)
                .style("pointer-events", "none");
            return edgepaths;
        }

        /**
         * Set links labels(usually predicates will be used as connectors)
         */
        function setEdgeLabels(edgelabelsConfig) {
            var edgelabels = graph.selectAll(".edgelabel")
                .data(this.formattedData.links)
                .enter()
                .append('text')
                .attr('id', (d, i) => 'edgelabel' + i)
                .attr('font-size', edgelabelsConfig.fontSize)
                .attr('fill', edgelabelsConfig.fontColor);

            edgelabels.append('textPath')
                .attr('xlink:href', (d, i) => '#edgepath' + i)
                .style('text-anchor', edgelabelsConfig.textAnchor)
                .attr('startOffset', edgelabelsConfig.startOffSet)
                .text(d => setLinkText(d.predicate));
            return edgelabels;
        }

        /**
         * Set link(connector) label/text
         */
        function setLinkText(predicate) {
            return predicate.substr(predicate.length - 20, predicate.length - 1);
        }

        /**
         * Manage what happens when a node is clicked
         */
        function clickOnNode(selectedNode) {
            retrieveMetaData(selectedNode);
        }

        /**
         * Return node metadata
         */
        function retrieveMetaData(selectedNode) {
            document.getElementById("nodeMetada").textContent = selectedNode.id;
        }

        /**
         * Set force directed graph nodes
         */
        function setNodes(nodesClass, nodesRadio) {
            var nodes = graph.append('g')
                .attr('class', nodesClass)
                .selectAll('g.node')
                .data(this.formattedData.nodes)
                .enter().append("svg:g")
                .attr('class', 'circle node')
                .on('dblclick', removeNode)
                .on('click', clickOnNode)
                .call(d3.drag()
                    .on('start', dragstarted)
                    .on('drag', dragged)
                    .on('end', dragended));

            d3.selectAll(".circle").append("circle")
                .style("stroke", 'gray')
                .attr("class", element => "nodes type" + element.type).attr("fill", element => '#ccddff')
                .attr("r", element => nodesRadio);
            return nodes;
        }

        /**
         * Set nodes label/text
         */
        function setNodesText(nodesTextConfig) {
            nodes.append("text")
                .attr("class", nodesTextConfig.class)
                .style("font-size", nodesTextConfig.fontSize)
                .attr("dx", nodesTextConfig.dx)
                .attr("dy", nodesTextConfig.dy)
                .style("font-weight", nodesTextConfig.fontWeight)
                .style('fill', nodesTextConfig.fill)
                .text(element => {
                    if (!_.startsWith(element.id, '_:')) {
                        var n = element.id.lastIndexOf('/');
                        var result = element.id.substring(n + 1);
                        return result;
                    }
                });
        }

        /**
         * Manage what happens when a node is hover
         */
        function nodesMouseOver(nodesMouseOverConfig) {
            nodes.on('mouseover', element => {
                set_highlight(element);
                d3.select(this).select('text').transition();
                d3.select(this).select('circle')
                    .style('fill', nodesMouseOverConfig.fillColor)
                    .style('stroke-width', nodesMouseOverConfig.strokeWidth)
                    .style('stroke', nodesMouseOverConfig.stroke);

                links.style('stroke', link => {
                    if (element === link.source || element === link.target) {
                        return nodesMouseOverConfig.connectedLinksColor;
                    } else {
                        return nodesMouseOverConfig.notConnectedLinksColor;
                    }
                });

                links.style('stroke-width', link => {
                    if (element === link.source || element === link.target) {
                        return nodesMouseOverConfig.connectedLinksStrokeWidth;
                    } else {
                        return nodesMouseOverConfig.notConnectedLinksStrokeWidth
                    }
                });
            });
        }

        /**
         * Manage what happens when the cursor is out of the node
         */
        function nodesMouseOut(nodesMouseOutConfig) {
            nodes.on('mouseout', element => {
                links.style('stroke-width', nodesMouseOutConfig.linksStrokeWidth);
                links.style('stroke', nodesMouseOutConfig.linksStroke);
                this.svg.style('cursor', nodesMouseOutConfig.cursor);
                d3.select(this).select('circle')
                    .style('fill', nodesMouseOutConfig.nodesFill)
                    .style('stroke-width', nodesMouseOutConfig.nodesStrokeWidth)
                    .style('stroke', nodesMouseOutConfig.nodesStroke);
            });
        }
    }

    angular.module('shared')
        .component('rdfVisualization', rdfVisualizationComponent);
})();
