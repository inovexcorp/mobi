/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import { entries } from 'lodash';
import { Inject, Injectable } from '@angular/core';

import { catchError } from 'rxjs/operators';
import { from } from 'rxjs/observable/from';
import { of } from 'rxjs/observable/of';
import { forkJoin } from 'rxjs/observable/forkJoin';

/**
 * @class OntologyVisualization.service
 *
 * A service that communicates with Various Rest endpoint 
 * and defines/holds the data needed for the visualizaiton to render the Network diagrams.
 */
@Injectable()
export class OntologyVisualizationService {
    private graphData = [];
    private uniqueNodes = new Map();
    private graphState = new Map();
    private _commitId;
    private _ontologyId;
    private _branchId;
    private _isOverLimit = false;
    private _hasInProgressCommit;
    private entityNames;
    private errorMessage = 'Something went wrong. Please try again later.';
    private inProgressCommitMessage = 'Uncommitted changes will not appear in the graph';
    private _propertyRanges;
    public nodesLimit = 500;
    public spinnerId = 'ontology-visualization';
    private clasess;

    constructor(@Inject('ontologyStateService') private os,
        @Inject('ontologyManagerService') private om,
        @Inject('utilService') private utilService) { }

    /**
    * @name init
    *
    * @description
    * Set the initial state of the visualation or 
    * Retrieve the state of the visualization 
    *
    * @returns {Promise} A promise that resolves to a Map (data structure) that cointaints the graph state.
    */
    init() {
        this.ontologyId = this.os.listItem.ontologyId;
        this.commitId = this.os.listItem.ontologyRecord.commitId;
        this.branchId = this.os.listItem.ontologyRecord.branchId;
        this.hasInProgressCommit = this.os.hasInProgressCommit();
        if (!this.hasInProgressCommit) { 
            this.setOntologyClasses(null);
        }
        const classes = this.getOntologyClasses();

        return new Promise<void>((resolve, reject) => {
            if (!this.graphState.has(this.commitId)) {
                if (!this.hasInProgressCommit) {
                    if (classes.flat.length) {
                        try {
                            const req = from(this.getPropertyRangeQuery()).pipe(catchError(error => of(reject(error))));
                            req.subscribe(({ propertyToRanges }) => {
                                this.propertyRanges = propertyToRanges;
                                this.isOverLimit = classes.flat.length > this.nodesLimit;
                                this.initDataSetup(classes, this.os.listItem.entityInfo);
                                resolve();
                            });
                        } catch (e) {
                            reject(this.errorMessage);
                        }
                    } else {
                        reject('No classes defined');
                    }
                } else {
                    const ontologyGraph = this.getOntologyById(this.ontologyId);
                    if (ontologyGraph) {
                        this.setGraphState(ontologyGraph.data);
                        resolve();
                    } else {
                        const requests = forkJoin(this.om.getClassHierarchies(this.os.listItem.ontologyRecord.recordId,
                            this.os.listItem.ontologyRecord.branchId,
                            this.os.listItem.ontologyRecord.commitId,
                            false),
                            this.getPropertyRangeQuery(false),
                            this.om.getOntologyEntityNames(this.os.listItem.ontologyRecord.recordId,
                                this.os.listItem.ontologyRecord.branchId,
                                this.os.listItem.ontologyRecord.commitId,
                                true,
                                false)
                        ).pipe(catchError(error => of(reject(error))));

                        requests.subscribe(val => {
                            const classHierarchy: any = val[0];
                            this.propertyRanges = val[1].propertyToRanges;
                            this.entityNames = val[2];
                            if (!classHierarchy.iris || (classHierarchy.iris && classHierarchy.iris.length === 0)) { 
                                reject(this.inProgressCommitMessage);
                            }
                            const listItem = {
                                classes: {
                                    parentMap: classHierarchy.parentMap,
                                    childMap: classHierarchy.childMap,
                                    flat: {},
                                    iris: {}
                                },
                                ontologyRecord: this.os.listItem.ontologyRecord,
                                ontologyId: this.ontologyId,
                                entityInfo: {}
                            };

                            classHierarchy.iris.forEach(iri => this.os.addToClassIRIs(listItem, iri, this.ontologyId));
                            this.isOverLimit = classHierarchy.iris.length > this.nodesLimit;
                            listItem.classes.flat = this.os.flattenHierarchy(listItem.classes, listItem);
                            this.setOntologyClasses(listItem.classes);
                            this.initDataSetup(listItem.classes, listItem.entityInfo);
                            resolve();
                        },
                            (err) => reject(err)
                        );
                    }

                }
            } else {
                try {
                    this.isOverLimit = classes.flat.length > this.nodesLimit;
                    if (classes.flat.length) {
                        const info = this.graphState.get(this.commitId);
                        if (info && info.positioned) {
                            this.graphData = info.data;
                        } else {
                            //Just in case we didn't finish loading the graph the first time.
                            this.graphState.delete(this.branchId);
                            this.initDataSetup(classes, this.os.listItem.entityInfo);
                        }
                    } else {
                        if (this.hasInProgressCommit) {
                            reject(this.inProgressCommitMessage);
                        } else {
                            reject('No classes defined');
                        }
                    }
                    resolve();
                } catch (e) {
                    reject(this.errorMessage);
                }
            }
        });
    }

    /**
     * Set the Ontology Identifier
     * @method { set }  ontologyId 
     * @param { string } id - The Ontology Identifier.
     */
    set ontologyId(id) {
        this._ontologyId = id;
    }

    /**
    * Returns the Ontology Identifier
    * @method { get }  ontologyId 
    * @returns { string } id - The Ontology Identifier.
    */
    get ontologyId() {
        return this._ontologyId;
    }

    /**
    * Set the commit Id
    * @method { get }  ontologyId 
    * @param { string } id - The Commit Id.
    */
    set commitId(id) {
        this._commitId = id;
    }

    /**
     * Returns the commit Id
     * @method { get }  ontologyId 
     * @returns { string } id - The Commit Id.
     */
    get commitId() {
        return this._commitId;
    }

    /**
     * Set the Branch Id
     * @method { get }  branchId 
     * @param { string } id - The Branch Id.
     */
    set branchId(id) {
        this._branchId = id;
    }

    /**
     * Returns the Branch Id
     * @method { get }  branchId 
     * @param { string } id - The Branch Id.
     */
    get branchId() {
        return this._branchId;
    }

    /**
     * Set isOverLimit flag to true or false.
     * @method { set }  isOverLimit 
     * @param { boolean } id - The Branch Id.
     */
    set isOverLimit(val) {
        this._isOverLimit = val;
    }

    /**
     * Returns the isOverLimit value
     * @method { get }  branchId 
     * @returns { boolean } isOverLimit
     */
    get isOverLimit() {
        return this._isOverLimit;
    }

    /**
     * Sets the value of hasInProgressCommit
     * @method { set }  hasInProgressCommit 
     * @param { boolean } val - hasInProgressCommit value (true/false).
     */
    set hasInProgressCommit(val) {
        this._hasInProgressCommit = val;
    }

    /**
     * Returns the hasInProgressCommit value indicating if the current 
     * branch has any commit in progress. 
     * True/False
     * @method { get }  hasInProgressCommit 
     * @returns { boolean } hasInProgressCommit
     */
    get hasInProgressCommit() {
        return this._hasInProgressCommit;
    }

    /**
    * Update the value of the attribute hasInProgressCommit.
    */
    updateInProgressCommit() {
        this.hasInProgressCommit = this.os.hasInProgressCommit();
    }

    /**
     * Stores a key-value pair (Map) where each key is the commitId that is associated with an Object 
     * that contains information about the graph.
     * The Object holds the following 
     * data : An object that contains graph data, 
     * positioned : a flag that tells the graph has been positioned before.
     * ontologyId: the ontology associdated with the graph
     * branchId : The branch Id associdated with the graph
     * @param graph  An Array that contains the Ontology classes (nodes) and its parent-child relationship.
     * @param positioned a flag that tells the graph has been positioned before.
     */
    setGraphState(graph, positioned = false) {
        this.graphState.set(this.commitId,
            {
                data: graph,
                positioned: positioned,
                ontologyId: this.ontologyId,
                branchId: this.branchId
            });
    }

    /**
     * Returns Graph-level information.
     * @returns { Array } An array of objets that contains grapha data
     */
    getGraphData() {
        if (this.graphState && this.graphState.has(this.commitId)) {
            return this.graphState.get(this.commitId).data;
        }
    }

    /**
     * Holds an object with (ObjectPropertyRange) properties and ranges
     * @param { Object } an object with properties and ranges.
     */
    set propertyRanges(val) {
        this._propertyRanges = val;
    }

    /**
     * @returns an object with properties and ranges
     */
    get propertyRanges() {
        return this._propertyRanges;
    }

    /**
     * Returns a Boolean indicating if the graph nodes has been positioned.
     * @returns { boolean }
     */
    hasPositions() {
        const state = this.graphState.has(this.commitId) ? this.graphState.get(this.commitId).positioned : false;
        return state;
    }

    setOntologyClasses (clasess) {
        this.clasess = clasess;
    }
    /**
     * Retrieves all the classses linked to the ontology
     * @returns { array } a list of ontology classes
     */
    getOntologyClasses() {
        if (!this.clasess) {
            return this.os.listItem && this.os.listItem.classes ? this.os.listItem.classes : { flat: [] };    
        } else {
           return this.clasess;
        }
    }

    /**
     * Rertuns an object with keys corresponding to Ontology Object Properties and ranges.
     * @param {boolean} applyInProgressCommit Whether or not the saved changes in the logged-in User's InProgressCommit
     * should be applied to the resource
     * @return {Promise} A Promise with an object containing listItem keys. 
     */
    getPropertyRangeQuery(applyInProgressCommit = true) {
        if (!this.om.getPropertyToRange ) {
            return {};
        }
        return this.om.getPropertyToRange(this.os.listItem.ontologyRecord.recordId,
            this.os.listItem.ontologyRecord.branchId,
            this.os.listItem.ontologyRecord.commitId,
            applyInProgressCommit
        );
    }

    /**
     * Checks if the current ontology contain any class. Returns a boolean.
     * @returns { boolean } returns a boolean
     */
    hasClasses() {
        return this.getOntologyClasses().flat.length > 0;
    }

    /**
     * 
     * @param nodes 
     * @param entityInfo 
     */
    buildGraphData(nodes, entityInfo) {
        const classList = nodes.parentMap;
        const parentIds = Object.keys(classList);
        const uriMap = new Map(entries(nodes.iris));
        const removeIri = (iri) => {
            if (uriMap.has(iri)) {
                uriMap.delete(iri);
            }
        };
        const addNodeData = (iri) => {
            if (!this.uniqueNodes.has(iri)) {
                removeIri(parent);
                const info = entityInfo[iri];
                if (info) {
                    const node = this.buildNodeData(info, iri, 'nodes');
                    this.uniqueNodes.set(iri, node);
                }
            }
        };

        if (this.uniqueNodes.size > 0) {
            this.uniqueNodes.clear();
        }

        parentIds.forEach((parent) => {
            addNodeData(parent);
            classList[parent].forEach((child) => {
                addNodeData(child);
                const id = this.buildId(parent, child);
                if (!this.uniqueNodes.has(id)) {
                    const link = this.buildLinkData(entityInfo[child], child, parent, id, 'edges');
                    if (link && this.uniqueNodes.has(parent) && this.uniqueNodes.has(child)) {
                        this.uniqueNodes.set(id, link);
                    }
                }
            });
        });
        if (!this.isOverLimit && uriMap.size > 0) {
            for (const item of uriMap.keys()) {
                const node: any = this.buildNodeData(entityInfo[<any>item], item, 'nodes');
                if (node) {
                    this.uniqueNodes.set(item, node);
                }
            }
            uriMap.clear();
        }
        const ranges = this.getPropertyRange(this.os.listItem.classToChildProperties, this.os.listItem.dataProperties, this.propertyRanges);
        const getPropertyLabel = (propertyIri) => {
            const getLabel = (entities, iri) => Object.prototype.hasOwnProperty.call(entities, iri) ? entities[iri].label : '';
            let lbl = '';
            if (!this.hasInProgressCommit) {
                lbl = getLabel(this.os.listItem.entityInfo, propertyIri);
            } else {
                lbl = getLabel(this.entityNames, propertyIri);
            }
            if (!lbl) {
                lbl = this.utilService.getBeautifulIRI(propertyIri);
            }
            return lbl;
        };
        ranges.forEach(item => {
            item.forEach(property => {
                if (property && this.uniqueNodes.has(property.domain) && this.uniqueNodes.has(property.range)) {
                    const id = this.buildId(property.domain + `_${property.property}_`, property.range);
                    if (!this.uniqueNodes.has(id)) {
                        const info = {
                            label: getPropertyLabel(property.property),
                            class: 'ranges'
                        };
                        const link = this.buildLinkData(entityInfo[property.domain], property.domain, property.range, id, 'edges', info);
                        if (link) {
                            this.uniqueNodes.set(id, link);
                        }
                    }
                }
            });
        });
        this.setGraphState([...this.uniqueNodes.values()]);
        this.uniqueNodes.clear();
    }
    /**
     * Returns the graph information if any key matches the ID
     * @param id ontologyId
     * @returns { array } Return an array that cointaints the graph state/information
     */
     getOntologyById(id) {
        return [...this.graphState.values()].filter(item => item.ontologyId === id)[0];
    }

    /**
     * 
     * @param classes Ontology classes
     * @param entityInfo  Contains information about ontoloty entities
     **/
    private limitGraphData(classes, entityInfo) {
        const classIds = Object.keys(classes.iris);
        const map = { parentMap: this.buildParentMap(classIds, classes) };
        this.buildGraphData(map, entityInfo);
    }

    /**
     * Limits the size of the array that is going to be use to build the visualazation.
     * @param classes Ontology classes
     * @param entityInfo  Contains information about ontoloty entities
     */
    private initDataSetup(classes, entityInfo) {
        if (!this.isOverLimit) {
            this.buildGraphData(classes, entityInfo);
        } else {
            this.limitGraphData(classes, entityInfo);
        }
    }

    /**
     * It defines a new Object with data for the network visualization.
     * it returns the data values used to create a Node 
     * @param { object} nodeInfo contains information about the current node
     * @param { string } classId The class unique Identifier. Class IRI
     * @param { string } group  The group name
     * @returns { Object } Returns a new Object with attributes
     */
    private buildNodeData(nodeInfo, classId, group) {
        if (group && nodeInfo && classId) {
            const node: any = {
                selectable: true,
                locked: false,
                grabbed: false,
                grabbable: true,
                data: {},
                id: classId,
                group: group,
                ontologyId: nodeInfo.ontologyId
            };

            node.data = {
                id: classId,
                idInt: classId,
                weight: 0,
                name: nodeInfo.label
            };
            return node;
        }
        return {};
    }

    /**
     * It defines a new Object with data for the network visualization.
     * it returns the data values used to create an edge/link.
     * @param linkInfo contains information about the Link/Edge
     * @param source The source node Id
     * @param target The target node Id
     * @param linkId A unique name for the link
     * @param group The group name that defines this element `edges` 
     * @param propertyInfo Information needed to create a property range.
     * @returns a new object with information needed to create a new link.
     */
    private buildLinkData(linkInfo, source, target, linkId, group, propertyInfo = null) {
        if (group && linkInfo && linkInfo.ontologyId) {
            const link: any = {
                position: {},
                group: group,
                removed: false,
                selected: false,
                selectable: true,
                locked: false,
                grabbed: false,
                grabbable: true,
                data: {},
                id: linkId
            };
            link.data = {
                id: linkId,
                idInt: linkId,
                source: source,
                target: target,
                arrow: 'triangle',
                weight: 0,
                label: ''
            };
            if (propertyInfo) {
                if (source === target) {
                    link.classes = `${propertyInfo.class} loop`;
                    link.data.type = 'bezier';
                    link.data.flipLabel = true;
                } else {
                    link.data.type = 'bezier';
                    link.classes = `${propertyInfo.class} bezier-radius`;
                }
                link.data.label = propertyInfo.label;
            }
            return link;
        }
        return {};
    }

    /**
     * Concatenates two URI
     * @param a URI left side of the new string
     * @param b URI Right side of the new string
     * @returns the combatination of the URIs {a}-{b}
     */
    private buildId(a, b) {
        return a + '-' + b;
    }

    /**
     * Build a new array of parent IRIs with children IRIs
     * @param { array } data iriList list of classes URI
     * @param { object } classes An object with meta-data about classes
     * @returns 
     */
    private buildParentMap(data, classes) {
        const iriList = data.slice(0, this.nodesLimit);
        const parents: any = {};
        iriList.forEach((item, index) => {
            if (Object.prototype.hasOwnProperty.call(classes.parentMap, item)) {
                parents[item] = [];
                iriList.splice(index, 1);
            }
        });
        Object.keys(parents).forEach((parent) => {
            const current = classes.parentMap[parent];
            current.forEach((item) => {
                if (iriList.includes(item)) {
                    const iriIndex = iriList.indexOf(item);
                    parents[parent].push(item);
                    iriList.splice(iriIndex, 1);
                }
            });
        });
        if (iriList.length > 0) {
            return Object.assign(parents, ...iriList.map(item => ({ [item]: [] })));
        }
        return parents;
    }

    /**
     * Build a new array with Properties, domains and its ranges.
     * @param { object } classToChildProperties 
     * @param { object } dataProperty An Object with dataProperties
     * @param { object } propertyToRanges An Object with properties and Ranges
     * @returns { array } returns an array with objects properties, domains and ranges.
     */
    private getPropertyRange(classToChildProperties, dataProperty, propertyToRanges) {
        interface RangesInterface {
            domain: string,
            property: string,
            range: string
        }
        const ranges = [];
        if (classToChildProperties) {
            Object.keys(classToChildProperties).forEach(item => {
                const properties = classToChildProperties[item].filter(index => {
                    if (dataProperty &&
                        Object.keys(dataProperty).length &&
                        Object.prototype.hasOwnProperty.call(dataProperty.iris, index)) {
                        return false;
                    } else {
                        return true;
                    }
                });
                const propertyInfo: Array<RangesInterface> = [];
    
                properties.forEach(element => {
                    if (propertyToRanges[element]) {
                        propertyToRanges[element].forEach(iri => {
                            const data: RangesInterface = {
                                domain: item,
                                property: '',
                                range: ''
                            };
                            if (iri) {
                                data.property = element;
                                data.range = iri;
                                propertyInfo.push(data);
                            }
                        });
                    }
                });
                ranges.push(propertyInfo);
            });
        }
        return ranges;
    }
}
