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
// @Injectable define a class as a service
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
    private errorMessage = 'Something went wrong. Please try again later.';
    public nodesLimit = 500;
    public spinnerId = 'ontology-visualization';

    constructor(@Inject('ontologyStateService') private os, 
                @Inject('ontologyManagerService') private om, 
                @Inject('utilService') private utilService) { }

               // use commit id instead of branch 
    init() {
        this.ontologyId = this.os.listItem.ontologyId;
        this.commitId = this.os.listItem.ontologyRecord.commitId;
        this.branchId = this.os.listItem.ontologyRecord.branchId;
        this.hasInProgressCommit = this.os.hasInProgressCommit();

        const classes = this.getOntologyClasses();

        return new Promise<void>((resolve, reject) =>  {
            if (!this.graphState.has(this.commitId)) {
                if (!this.hasInProgressCommit) {
                    if (classes.flat.length) {
                        try {
                            this.isOverLimit = classes.flat.length > this.nodesLimit;
                            this.initDataSetup(classes, this.os.listItem.entityInfo);
                            resolve();
                        } catch (e) {
                            reject(this.errorMessage);
                        }
                    } else {
                        reject('No classes defined');
                    }
                } else {
                    const ontolgoyGraph = this.getOntolgoyById(this.ontologyId);
                    if (ontolgoyGraph) {
                        this.setGraphState(ontolgoyGraph.data);
                        resolve();
                    } else {
                        const requests = from( this.om.getClassHierarchies(this.os.listItem.ontologyRecord.recordId,
                            this.os.listItem.ontologyRecord.branchId,
                            this.os.listItem.ontologyRecord.commitId,
                            false
                        )).pipe(catchError(error => of(reject(error)) ));
    
                       requests.subscribe( val => {
                           const classHierarchy : any = val;
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
                        reject('No classes defined');
                    }
                    resolve();
                } catch (e) {
                    reject(this.errorMessage);
                }
            }
        });
    }

    set ontologyId(id) {
        this._ontologyId = id;
    }

    get ontologyId() {
      
        return this._ontologyId;
    }
    set commitId(id) {
       this._commitId = id;
    }

    get commitId() {
        return this._commitId;
    }

    set branchId(id) {
        this._branchId = id;
    }

    get branchId() {
        return this._branchId;
    }

    set isOverLimit(val) {
        this._isOverLimit = val;
    }

    get isOverLimit() {
        return this._isOverLimit;
    }

    set hasInProgressCommit(val) {
        this._hasInProgressCommit = val;
    }

    get hasInProgressCommit() {
       return this._hasInProgressCommit;
    }
    
    updateInProgressCommit(){
        this.hasInProgressCommit = this.os.hasInProgressCommit();
    }

    setGraphState(graph, position = false) {
        this.graphState.set(this.commitId, 
            { 
                data: graph, 
                positioned: position, 
                ontologyId: this.ontologyId, 
                branchId: this.branchId
            });
    }

    getGraphData() {
        if (this.graphState && this.graphState.has(this.commitId)) {
            return this.graphState.get(this.commitId).data;
        }
    }

    hasPositions() {
        const state = this.graphState.has(this.commitId) ? this.graphState.get(this.commitId).positioned : false;
        return state;
    }

    getOntologyClasses() {
        return this.os.listItem && this.os.listItem.classes ? this.os.listItem.classes : { flat: [] };
    }

    hasClasses() {
        return this.getOntologyClasses().flat.length > 0;
    }

    buildGraphData(nodes, entityInfo) {
        const classList = nodes.parentMap;
        const parentIds =  Object.keys(classList);
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

        if ( this.uniqueNodes.size > 0) {
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
            for (const item  of uriMap.keys()) {
                const node: any = this.buildNodeData(entityInfo[<any>item], item, 'nodes');
                if (node) {
                    this.uniqueNodes.set(item, node);
                }
            }
            uriMap.clear();
        }
        this.setGraphState([...this.uniqueNodes.values()]);
        this.uniqueNodes.clear();
    }

    private limitGraphData(classes, entityInfo) {
        const classIds = Object.keys(classes.iris);
        const map = { parentMap: this.buildParentMap(classIds, classes)};
        this.buildGraphData(map, entityInfo);
    }

    private initDataSetup(classes, entityInfo) {
        if (!this.isOverLimit) {
            this.buildGraphData(classes, entityInfo);
        } else {
            this.limitGraphData(classes, entityInfo);
        }
    }

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

    private buildLinkData(linkInfo, source, target, linkId, group) {
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
                weight: 0
            };
            return link;
        }
        return {};
    }

    private buildId(a, b) {
        return a + '-' + b;
    }

    private buildParentMap(data,classes) {
        const iriList = data.slice(0, this.nodesLimit);
        const parents:any = {};
        iriList.forEach((item, index) => {
            if (Object.prototype.hasOwnProperty.call(classes.parentMap, item)) {
                parents[item] = [] ;
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
           return  Object.assign(parents, ...iriList.map(item => ({[item]: []})));
        }
        return parents;
    }
    
    getOntolgoyById(id) {
       return [...this.graphState.values()].filter(item => item.ontologyId === id)[0];
    }
}
