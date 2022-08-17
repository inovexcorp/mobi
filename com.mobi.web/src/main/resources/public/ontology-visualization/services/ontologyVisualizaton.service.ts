/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { Inject, Injectable, } from '@angular/core';
import { Observable, Subject, Subscriber, from, of, forkJoin } from 'rxjs';
import { map, tap, switchMap, catchError, shareReplay } from 'rxjs/operators';

import { buildColorScale } from '../helpers/graphSettings';
import { StateNode, SidebarState, StateEdge, GraphState } from '../classes/index';
import {
    RangesI,
    ControlRecordI,
    SidePanelPayloadI,
    ParentMapI,
    ChildIrisI,
    EntityInfoI,
    inProgressCommitI,
    OntologyGraphData
} from '../interfaces/visualization.interfaces';
import { OntologyManagerService } from '../../shared/services/ontologyManager.service';
import { HierarchyResponse } from '../../shared/models/hierarchyResponse.interface';
import { EntityNames } from '../../shared/models/entityNames.interface';
import { IriList } from '../../shared/models/iriList.interface';
import { OntologyAction } from '../../shared/models/ontologyAction';
import { OntologyStateService } from '../../shared/services/ontologyState.service';
import { OntologyListItem } from '../../shared/models/ontologyListItem.class';
import { Hierarchy } from '../../shared/models/hierarchy.interface';
import { ProgressSpinnerService } from '../../shared/components/progress-spinner/services/progressSpinner.service';
import { HelperService } from '../../shared/services/helper.service'
import { cloneDeep, forEach } from "lodash";

/**
 * @class OntologyVisualization.service
 *
 * A service that communicates with Various Rest endpoint 
 * and defines/holds the data needed for the visualizaiton to render the Network diagrams.
 */

@Injectable()
export class OntologyVisualizationService {
    // Used to store the graph state for a specific commitId
    private _graphStateCache = new Map<string, GraphState>();
    private _sidebarCache = new Map<string, SidebarState>();
    // Observable string source
    // Only the service has access to the subject
    private _sidePanelActionSubject = new Subject<SidePanelPayloadI>(); // Used for controling graph outside of OntologyVisualization component
    private _ontologyClassSelectedSubject = new Subject<string>();

    // Observable Streams
    // enable subscription
    sidePanelActionAction$ = this._sidePanelActionSubject.asObservable();
    ontologyClassSelectedAction$ = this._ontologyClassSelectedSubject.asObservable().pipe(shareReplay(1));
    
    readonly ERROR_MESSAGE: string = 'Something went wrong. Please try again later.';
    readonly IN_PROGRESS_COMMIT_MESSAGE: string = 'Uncommitted changes will not appear in the graph';
    readonly NO_CLASS_MESSAGE: string = 'No classes defined';
    readonly spinnerId = 'ontology-visualization';
    readonly DEFAULT_NODE_LIMIT = 500; // GLOBAL Node Limit for graph, each graphState will has it own

    constructor(private os: OntologyStateService,
                private spinnerSrv : ProgressSpinnerService,
                private om: OntologyManagerService,
                private helper: HelperService,
                @Inject('utilService') private utilService) {
        if (this.os.ontologyRecordAction$) {
            this.os.ontologyRecordAction$.subscribe(record => this.removeOntologyCache(record));
        }
    }

    public get graphStateCache() {
        return this._graphStateCache;
    }

    // BEGIN dispatch messages
    // Emitt messsages from the sevice.

    /**
     *
     * @param action
     */
    public emitSelectAction(action):void {
        this._ontologyClassSelectedSubject.next(action);
    }

    /**
     * Emit SidePanel events or actions
     * @param action
     */
    public emitSidePanelAction(action:SidePanelPayloadI) {
        this._sidePanelActionSubject.next(action);
    }

    public getSidePanelActionActionObserver() {
        return  this.sidePanelActionAction$;
    }
    // END dispatch messages
    /**
     * @name init
     * 
     * @param commitId commitId 
     * @param inProgressCommit If there are any inProgressCommits
     * @returns {Observable} A Observable that resolves to a Map (data structure) that contains the graph state.
     */
    init(commitId: string, inProgressCommit: inProgressCommitI): Observable<GraphState> {
        const self = this;
        const ontologyListItem = new OntologyListItem();
        if (inProgressCommit) {
            ontologyListItem.inProgressCommit.additions = inProgressCommit?.additions;
            ontologyListItem.inProgressCommit.deletions = inProgressCommit?.deletions;
        }
        const hasInProgressCommit: boolean = inProgressCommit ? this.os.hasInProgressCommit(ontologyListItem) : null;
        return of(commitId).pipe(
            tap((commitId: string): void => {
                if (this.os.listItem.hasPendingRefresh) {
                    this.os.listItem.hasPendingRefresh = false;
                    this.graphStateCache.delete(commitId);
                }
            }),

            map((commitId: string): GraphState => {
                if (this.graphStateCache.has(commitId)) {
                    return this.graphStateCache.get(commitId);
                } else {
                    const commitGraphState: GraphState = new GraphState({
                        commitId: commitId,
                        ontologyId: this.os.listItem.ontologyId,
                        recordId: this.os.listItem.versionedRdfRecord.recordId,
                        importedOntologies: this.os.listItem.importedOntologies || [],
                        positioned: false,
                        isOverLimit: false,
                        nodeLimit: self.DEFAULT_NODE_LIMIT,
                        allGraphNodes: [],
                        allGraphEdges: [],
                        data: { nodes: [], edges: [] },
                        selectedNodes: false
                    });
                    this.graphStateCache.set(commitId, commitGraphState);
                    return commitGraphState;
                }
            }),

            switchMap( (commitGraphState: GraphState): Observable<GraphState> => 
                from(this.buildGraphData(commitGraphState, hasInProgressCommit))),
            tap((commitGraphState: GraphState): void => {
                const styleObject = buildColorScale(commitGraphState.importedOntologies, commitGraphState.ontologyId);
                commitGraphState.style = styleObject.style,
                commitGraphState.ontologyColorMap = new Map(Object.entries(styleObject.ontologyColorMap));

                const ontologiesClassMap = new Map();
                commitGraphState.importedOntologies.forEach( (item, index) => {
                    ontologiesClassMap.set(item.id, `Ontology-${index}`);
                });
                commitGraphState.ontologiesClassMap = ontologiesClassMap;
                commitGraphState.isOverLimit = commitGraphState.allGraphNodes.length > commitGraphState.nodeLimit;
                commitGraphState.getName = (iri) => this.utilService.getBeautifulIRI(iri);
                const controlRecordSearch = commitGraphState.getControlRecordSearch(0);
                commitGraphState.emitGraphData(controlRecordSearch);
            })
        );
    }

    public getSidebarState(commitId) {
        let state;
        if (this._sidebarCache.has(commitId)) {
          state = this._sidebarCache.get(commitId);
        } else {
            state = new SidebarState({commitId, recordId: this.os.listItem.versionedRdfRecord.recordId});
            this._sidebarCache.set(commitId, state);
        }
        return  state;
    }

    /**
     * getOntologyNetworkObservable
     * 
     * ForkJoin Does 4 backend requests
     * - getClassHierarchies - Retrieves an object with the hierarchy of classes in the ontology organized 
     *     by the subClassOf property and with an index of each IRI and its parent IRIs. 
     *     {iris: ["classId1"] parentMap: {"parentClassId": ["classId1", "classId2"]}  }
     *     Note: * Does not contain class ClassHierarchies for imported ontolgies * 
     *  - getPropertyToRange - retrieves an object with keys corresponding to Ontology Object Properties and ranges
     *    { propertyToRanges: { "propertyId": ["classId1"] } }
     *  - getOntologyEntityNames - retrieves an object with entity info
     *     { "classId1": {label: "atto", names: ["atto"]}
     *      Note: ** Includes imported entity info ** 
     *  - getImportedIris - retrieves an array of objects with IRIs for various entity types for each imported ontology of the identified ontology.
     *   [ {importData}, {importData}]
     *   Note: ** This does not contain the hierarchy for import data ** 
     *   importData[] = annotationProperties, 
     * @returns Observable of with map of data
     */
    // TODO figure out targeted spinnner
    getOntologyNetworkObservable(): Observable<any>{

        return this.spinnerSrv.track(forkJoin([this.om.getClassHierarchies(this.os.listItem.versionedRdfRecord.recordId,
            this.os.listItem.versionedRdfRecord.branchId,
            this.os.listItem.versionedRdfRecord.commitId,
            false),
            this.om.getPropertyToRange(this.os.listItem.versionedRdfRecord.recordId,
                this.os.listItem.versionedRdfRecord.branchId,
                this.os.listItem.versionedRdfRecord.commitId,
                false),
            this.om.getOntologyEntityNames(this.os.listItem.versionedRdfRecord.recordId,
                this.os.listItem.versionedRdfRecord.branchId,
                this.os.listItem.versionedRdfRecord.commitId,
                true,
                false),
            this.om.getImportedIris(this.os.listItem.versionedRdfRecord.recordId,
                this.os.listItem.versionedRdfRecord.branchId,
                this.os.listItem.versionedRdfRecord.commitId,
                false)]
        ).pipe(
            catchError(error => { throw 'Network Issue in Source. Details: ' + error } ),
            map((networkData): any =>{
                const classHierarchy: HierarchyResponse = networkData[0];
                const propertyRanges: {[key: string]: string[]} = networkData[1].propertyToRanges;
                const entityNames: EntityNames = networkData[2];
                const importedIris: IriList[] = networkData[3];

                const listItem: OntologyListItem = new OntologyListItem();
                listItem.classes.parentMap = classHierarchy.parentMap;
                listItem.classes.childMap = classHierarchy.childMap;
                listItem.versionedRdfRecord = this.os.listItem.versionedRdfRecord;
                listItem.ontologyId = this.os.listItem.ontologyId;
                listItem.entityInfo = entityNames;
    
                if (importedIris && importedIris.length > 0) {
                    importedIris.forEach(info => {
                        const importedOntologyListItem = {
                            id: info.id,
                            ontologyId: info.id
                        };
                        listItem.importedOntologyIds.push(info.id);
                        listItem.importedOntologies.push(importedOntologyListItem);
                        if (info.classes && info.classes.length) {
                            info.classes.forEach(iri => this.os.addToClassIRIs(listItem, iri, info.id));
                        }
                    });
                }
                classHierarchy.iris.forEach(iri => this.os.addToClassIRIs(listItem, iri, listItem.ontologyId));
                listItem.classes.flat = this.os.flattenHierarchy(listItem.classes, listItem);
           
                const ranges = this.getPropertyRange(this.os.listItem.classToChildProperties, this.os.listItem.dataProperties, propertyRanges);
               
                return  {
                    classParentMap: listItem.classes.parentMap, 
                    childIris: listItem.classes.iris, 
                    entityInfo: listItem.entityInfo,
                    ranges: ranges
                };
             })
        )).pipe(catchError(this.helper.handleError));
    }

    /**
     * Get ontology data from os.listitem
     * @returns Observable
     */
    // TODO figure out targeted spinner
    getOntologyLocalObservable(): Observable<any>{
        return  this.spinnerSrv.track(forkJoin(
            [this.om.getPropertyToRange(this.os.listItem.versionedRdfRecord.recordId,
                this.os.listItem.versionedRdfRecord.branchId,
                this.os.listItem.versionedRdfRecord.commitId,
                false)]
            ).pipe(
                catchError(error => of(error)),
                map((networkData):any =>{
                    const propertyRanges: {[key: string]: string[]} = networkData[0].propertyToRanges;
                    const classesObject: Hierarchy = this.os.listItem && this.os.listItem.classes ? this.os.listItem.classes : {
                        iris: {},
                        parentMap: {},
                        childMap: {},
                        circularMap: {},
                        flat: []
                    };
                    const classParentMap = classesObject.parentMap;
                    const classIris = classesObject.iris;
                    const entityInfo = this.os.listItem.entityInfo;
                    const ranges = this.getPropertyRange(this.os.listItem.classToChildProperties, this.os.listItem.dataProperties, propertyRanges);

                    return  {
                        classParentMap: cloneDeep(classParentMap),
                        childIris: cloneDeep(classIris),
                        entityInfo: cloneDeep(entityInfo),
                        ranges: cloneDeep(ranges)
                    };
                })
            )).pipe(catchError(this.helper.handleError));
    }

    /**
     * Build Graph Data for Ontology. 
     * Responsible for building { @link StateNode } and { @link StateLink } objects used for cytoscape chart.
     * 
     * Only the domains and ranges set directly on the property definitions are taken into account
     * If an object property has more than one domain, it should be shown originating from each class
     * If an object property has more than one range, it should be shown ending at each class
     * 
     * @param commitGraphState commit graph state
     * @param hasInProgressCommit boolean whether there is an in progress commit
     * @return Promise
     */
     buildGraphData(commitGraphState: GraphState, hasInProgressCommit: boolean): Observable<GraphState>{
        return new Observable((observer: Subscriber<GraphState>) => {
            // Data has already been initialized previously
            if (commitGraphState.allGraphNodes.length > 0) {
                return observer.next(commitGraphState); 
            }
        
            // TODO https://www.learnrxjs.io/learn-rxjs/operators/conditional/iif
            // If hasInProgress then use getOntologyNetworkObservable, 
            // else use getOntologyLocalObservable
            if (hasInProgressCommit) {
                this.getOntologyNetworkObservable().subscribe( (ontologyData: OntologyGraphData) => {
                    return this.graphDataFormat(ontologyData, commitGraphState, observer);
                });
            } else {
                this.getOntologyLocalObservable().subscribe( (ontologyData:OntologyGraphData) => {
                    return this.graphDataFormat(ontologyData, commitGraphState, observer);
                });
            }

        });
    }

    private graphDataFormat(ontologyData:OntologyGraphData, commitGraphState: GraphState, observer) {
        const result = this.buildGraph(ontologyData.classParentMap, 
            ontologyData.childIris,
            ontologyData.entityInfo,
            ontologyData.ranges, 
            false, 
            commitGraphState.nodeLimit);

        commitGraphState.allGraphNodes = result.allGraphNodes;
        commitGraphState.allGraphEdges = result.allEdges;

        const uniqueOntologyIds = new Set();
        const importedOntologiesTemp = [];
        
        result.allGraphNodes.forEach(controlRecord => {
            if (controlRecord.isImported && !uniqueOntologyIds.has(controlRecord.ontologyId)) {
                importedOntologiesTemp.push({id: controlRecord.ontologyId, ontologyId: controlRecord.ontologyId});
                uniqueOntologyIds.add(controlRecord.ontologyId);
            }
        });

        commitGraphState.importedOntologies.forEach(v => {
            if (!uniqueOntologyIds.has(v.id)) {
                importedOntologiesTemp.push(v);
                uniqueOntologyIds.add(v.id);
            }
        });
            
        commitGraphState.importedOntologies = importedOntologiesTemp;
        commitGraphState.importedOntologies.sort((a, b) => { 
            if (a.id < b.id) {
                return -1;
            }
            if (a.id > b.id) {
                return 1;
            }
            return 0;
        });

        if (result.allGraphNodes.length > 0) {
            return observer.next(commitGraphState);
        } else {
            return observer.error(this.NO_CLASS_MESSAGE);
        }
    }

    public buildGraph(classParentMap:ParentMapI,
                      childIris:ChildIrisI,
                      entityInfo: EntityInfoI,
                      ranges: Array<any>= [],
                      hasInProgressCommit: boolean,
                      _localNodeLimit: number) {

        const self = this;
        const allNodeIds = new Set<string>();
        const allNodes: StateNode[] = [];
        const allEdges: StateEdge[] = [];

        const pushNode = (stateNode: StateNode): void => {
            const nodeId = stateNode.data.id;
            if (allNodeIds.has(nodeId)) {
                return;
            }
          
            allNodes.push(stateNode);
            allNodeIds.add(nodeId);
        };
        
        // iteration of classParentMap
        forEach(classParentMap, function(childrenIris, parentIri) {
            const parentEntityInfo = entityInfo[parentIri];
            const currentStateNode = self.buildStateNode(parentEntityInfo, parentIri);
            currentStateNode.data.subClassesCount = childrenIris.length;
            pushNode(currentStateNode);
            for (const childIri of childrenIris) {
                const childEntityInfo = entityInfo[childIri];
                pushNode(self.buildStateNode(childEntityInfo, childIri));
                // StateEdge
                const edgeId = parentIri + '<-subClass-' + childIri;
                const edge = self.buildStateEdge(childEntityInfo, childIri, parentIri, edgeId);
                allEdges.push(edge);
            }
        });
        
        forEach(childIris, function(ontologyId, parentIri) {
            const nodeEntityInfo = entityInfo[parentIri];
            pushNode(self.buildStateNode(nodeEntityInfo, parentIri));
        } );

        // create range edges
        ranges.forEach((item:Array<RangesI>= [])=> {
            item.forEach((property:RangesI) => {
                if (property && allNodeIds.has(property.domain) && allNodeIds.has(property.range)) {
                    const edgeId = property.domain + '-' + property.property +'-' + property.range;
                    const info = {
                        label: self.getPropertyLabel(property.property, entityInfo, hasInProgressCommit),
                        class: 'ranges'
                    };
                    const link = self.buildStateEdge(entityInfo[property.domain], property.domain, property.range, edgeId, info);
                    if (link) {
                        allEdges.push(link);
                    }
                }
            });
            }
        );

        // Object properties are displayed: As solid lines, Directed arrows from the domain to the range, 
        //     With labels of the calculated names used in the other tabs
        // Post Process - Only this.nodeLimit is allowed
        const graphNodes: StateNode[] = allNodes.slice(0, 500); // sets the intial nodes on the graph
        const graphNodesIds = new Set(graphNodes.map((node)=> node.data.id));
        const allGraphNodes: ControlRecordI[] = allNodes.map((node: StateNode) => node.asControlRecord(graphNodesIds.has(node.data.id)));
        return { allGraphNodes , allEdges };
    }

    /**
    * Returns Commit Graph State.
    * @returns { GraphState } An GraphStateI Object
    */
    getGraphState(commitId: string, error = true): GraphState {
        if (this.graphStateCache.has(commitId)) {
            return this.graphStateCache.get(commitId);
        }

        if (error) {
            throw new Error(`Graph State does not exist for commit: ${commitId}`);
        }     
    }

    /**
     * Get Property Label
     * @param commitGraphState graph state
     * @param propertyIri property iri
     * @param entityInfo entityInfo
     * @returns Property Label
     */
    public getPropertyLabel = (propertyIri:string, entityInfo: EntityInfoI, hasInProgressCommit:boolean) => {
        const getLabel = (entities, iri) => Object.prototype.hasOwnProperty.call(entities, iri) ? entities[iri].label : '';
        let lbl = '';
        if (!hasInProgressCommit) {
            lbl = getLabel(this.os.listItem.entityInfo, propertyIri);
        } else {
            lbl = getLabel(entityInfo, propertyIri);
        }
        if (!lbl) {
            lbl = this.utilService.getBeautifulIRI(propertyIri);
        }
        return lbl;
    }

    /**
     * It defines a new StateNode with data for the network visualization.
     * it returns the data values used to create a Node 
     * @param { object} nodeInfo contains information about the current node
     * @param { string } classIri The class unique Identifier. Class IRI
     * @param { any } ontologiesClassMap Map of color for ontologies
     * @returns Returns a new StateNode Object with attributes
     */
    private buildStateNode(nodeInfo: any, classIri: string): StateNode {
        if (!nodeInfo) {
            throw new Error('buildStateNode - nodeInfo is null. IRI: ' + classIri);
        }
            
        if (!classIri) {
            throw new Error('buildStateNode - classIri is null');
        }
           
        const node: StateNode = new StateNode();

        node.data = {
            id: classIri,
            idInt: classIri,
            weight: 0,
            name: nodeInfo.label,
            ontologyId: nodeInfo.ontologyId,
            isImported: nodeInfo.imported 
        };

        return node;
    }

    /**
     * It defines a new Object with data for the network visualization.
     * it returns the data values used to create an edge/link.
     * @param linkInfo contains information about the Link/Edge {label: string, names: [], imported?: boolean, ontologyId?: string}
     * @param source The source node Id
     * @param target The target node Id
     * @param linkId A unique name for the link
     * @param group The group name that defines this element `edges` 
     * @param propertyInfo Information needed to create a property range.
     * @returns New StateLink Object with information needed to create a new link.
     */
    private buildStateEdge(linkInfo: any, source: string, target: string, linkId: string, propertyInfo = null): StateEdge {
        if (linkInfo && linkInfo.ontologyId) {
            const link = new StateEdge();

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
        throw Error('buildStateLink method is missing data: ' + linkInfo);
    }

    /**
     * Build a new array with Properties, domains and its ranges.
     * @param { object } classToChildProperties 
     * @param { object } dataProperty An Object with dataProperties
     * @param { object } propertyToRanges An Object with properties and Ranges
     * @returns Array<RangesI>[] returns an array with objects properties, domains and ranges.
     */
    private getPropertyRange(classToChildProperties, dataProperty, propertyToRanges): Array<RangesI>[] {
        const ranges: Array<RangesI>[] = [];
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
                const propertyInfo: Array<RangesI> = [];
    
                if (!propertyToRanges) {
                    throw new Error('propertyToRanges can not be null|undefined');
                }
                   
                properties.forEach(element => {
                    if (propertyToRanges[element]) {
                        propertyToRanges[element].forEach(iri => {
                            const data: RangesI = {
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

    /**
     * Remove OntologyRecord from cache
     * @param recordInfo
     */
    public removeOntologyCache(recordInfo:any) : void {
        if (recordInfo && recordInfo.action && recordInfo.action === OntologyAction.ONTOLOGY_CLOSE) {
            this._graphStateCache.forEach(item => {
                if (item.recordId === recordInfo.recordId) {
                    this._graphStateCache.delete(item.commitId);
                }
            });
        }
    }
}
