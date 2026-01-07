package com.mobi.ontology.core.api.owl2shacl;

/*-
 * #%L
 * com.mobi.ontology.api
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

import com.mobi.exception.MobiException;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.rio.RemoveContextHandler;
import com.mobi.repository.api.OsgiRepository;
import com.mobi.repository.api.RepositoryManager;
import org.apache.commons.lang3.time.StopWatch;
import org.eclipse.rdf4j.model.IRI;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.model.ModelFactory;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.Value;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.DynamicModelFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.query.Operation;
import org.eclipse.rdf4j.query.TupleQuery;
import org.eclipse.rdf4j.query.TupleQueryResult;
import org.eclipse.rdf4j.query.Update;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFWriter;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.turtle.TurtleWriterSettings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Collections;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * A static class that provides methods to convert OWL ontology data into SHACL shapes graph data.
 */
public class OWL2SHACL {

    private static final ValueFactory vf = new ValidatingValueFactory();
    private static final ModelFactory mf = new DynamicModelFactory();
    private static final IRI NAMED_GRAPH = vf.createIRI("https://mobi.solutions/working-graph");
    private static final Logger log = LoggerFactory.getLogger(OWL2SHACL.class);

    /**
     * Converts the provided input stream of OWL ontology data in Turtle format into a SHACL Shapes Graph and returns
     * as a Model.
     *
     * @param ontology An {@link Model} of OWL ontology data
     * @param repoManager The {@link RepositoryManager} ot use to create a memory repository to use for the conversion
     * @return The {@link Model} containing the converted SHACL Shapes Graph
     */
    public static Model convertOWLToSHACL(Model ontology, RepositoryManager repoManager) {
        log.debug("Converting OWL to SHACL");
        StopWatch watch = new StopWatch();
        OsgiRepository repo = repoManager.createMemoryRepository();
        try (RepositoryConnection conn = repo.getConnection()) {
            log.trace("Loading ontology data");
            watch.start();
            conn.add(ontology);
            watch.stop();
            log.trace("Loaded ontology data: {}ms", watch.getTime());
            watch.reset();

            convertOWLToSHACL(conn, watch);
            Model output = mf.createEmptyModel();
            conn.getStatements(null, null, null, NAMED_GRAPH).forEach(statement ->
                    output.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));
            return output;
        } catch (IOException e) {
            throw new MobiException(e);
        } finally {
            repo.shutDown();
        }
    }

    /**
     * Converts the provided input stream of OWL ontology data in Turtle format into a SHACL Shapes Graph and returns
     * as a Model.
     *
     * @param ontology An {@link InputStream} of Turtle OWL ontology data
     * @param inputFormat The {@link RDFFormat} of the ontology data in the InputStream
     * @param repoManager The {@link RepositoryManager} ot use to create a memory repository to use for the conversion
     * @return The {@link Model} containing the converted SHACL Shapes Graph
     */
    public static Model convertOWLToSHACL(InputStream ontology, RDFFormat inputFormat, RepositoryManager repoManager) {
        log.debug("Converting OWL to SHACL");
        StopWatch watch = new StopWatch();
        OsgiRepository repo = repoManager.createMemoryRepository();
        try (RepositoryConnection conn = repo.getConnection()) {
            log.trace("Loading ontology data");
            watch.start();
            conn.add(ontology, inputFormat);
            watch.stop();
            log.trace("Loaded ontology data: {}ms", watch.getTime());
            watch.reset();

            convertOWLToSHACL(conn, watch);
            Model output = mf.createEmptyModel();
            conn.getStatements(null, null, null, NAMED_GRAPH).forEach(statement ->
                    output.add(statement.getSubject(), statement.getPredicate(), statement.getObject()));
            return output;
        } catch (IOException e) {
            throw new MobiException(e);
        } finally {
            repo.shutDown();
        }
    }

    /**
     * Converts the provided input stream of OWL ontology data into a SHACL Shapes Graph and writes to the provided
     * OutputStream in the requested RDF Format.
     *
     * @param ontology An {@link InputStream} of OWL ontology data
     * @param inputFormat The {@link RDFFormat} of the ontology data in the InputStream
     * @param repoManager The {@link RepositoryManager} ot use to create a memory repository to use for the conversion
     * @param out The {@link OutputStream} to write the converted SHACL data to
     * @param outputFormat The {@link RDFFormat} to write the converted SHACL data as
     */
    public static void convertOWLToSHACL(InputStream ontology, RDFFormat inputFormat, RepositoryManager repoManager,
                                         OutputStream out, RDFFormat outputFormat) {
        log.debug("Converting OWL to SHACL");
        StopWatch watch = new StopWatch();
        OsgiRepository repo = repoManager.createMemoryRepository();
        try (RepositoryConnection conn = repo.getConnection()) {
            log.trace("Loading ontology data");
            watch.start();
            conn.add(ontology, inputFormat);
            watch.stop();
            log.trace("Loaded ontology data: {}ms", watch.getTime());
            watch.reset();

            convertOWLToSHACL(conn, out, outputFormat, watch);
        } catch (IOException e) {
            throw new MobiException(e);
        } finally {
            repo.shutDown();
        }
    }

    /**
     * Converts the provided input stream of OWL ontology data within a Model into a SHACL Shapes Graph and writes to
     * the provided OutputStream in the requested RDF Format.
     *
     * @param ontology An {@link Model} of OWL ontology data
     * @param repoManager The {@link RepositoryManager} ot use to create a memory repository to use for the conversion
     * @param out The {@link OutputStream} to write the converted SHACL data to
     * @param outputFormat The {@link RDFFormat} to write the converted SHACL data as
     */
    public static void convertOWLToSHACL(Model ontology, RepositoryManager repoManager, OutputStream out,
                                         RDFFormat outputFormat) {
        log.debug("Converting OWL to SHACL");
        StopWatch watch = new StopWatch();
        OsgiRepository repo = repoManager.createMemoryRepository();
        try (RepositoryConnection conn = repo.getConnection()) {
            log.trace("Loading ontology data");
            watch.start();
            conn.add(ontology);
            watch.stop();
            log.trace("Loaded ontology data: {}ms", watch.getTime());
            watch.reset();

            convertOWLToSHACL(conn, out, outputFormat, watch);
        } catch (IOException e) {
            throw new MobiException(e);
        } finally {
            repo.shutDown();
        }
    }

    private static void convertOWLToSHACL(RepositoryConnection conn, OutputStream out, RDFFormat outputFormat,
                                          StopWatch watch) throws IOException {
        convertOWLToSHACL(conn, watch);
        writeData(conn, out, outputFormat);
    }

    private static void convertOWLToSHACL(RepositoryConnection conn, StopWatch watch) throws IOException {
        log.trace("Loading helper data");
        watch.start();
        conn.add(OWL2SHACL.class.getResourceAsStream("/helperTriples.ttl"), RDFFormat.TURTLE);
        watch.stop();
        log.trace("Loaded helper data: {}ms", watch.getTime());
        watch.reset();

        // Start - Collect Classes
        log.trace("Collecting classes to convert");
        watch.start();
        String query = """
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    SELECT ?clazz
                    WHERE {
                        {
                            ?type rdfs:subClassOf* rdfs:Class .
                            ?clazz a ?type .
                            FILTER isIRI(?clazz) .
                        }
                        FILTER(!STRSTARTS(STR(?clazz), "http://www.w3.org/1999/02/22-rdf-syntax-ns#"))
                        FILTER(!STRSTARTS(STR(?clazz), "http://www.w3.org/2000/01/rdf-schema#"))
                        FILTER(!STRSTARTS(STR(?clazz), "http://www.w3.org/2002/07/owl#"))
                        FILTER(!STRSTARTS(STR(?clazz), "http://www.w3.org/2001/XMLSchema#"))
                    }
                    """;
        Set<Resource> classIRIs;
        try (TupleQueryResult result = conn.prepareTupleQuery(query).evaluate()) {
            classIRIs = result.stream().map(bindings -> Bindings.requiredResource(bindings, "clazz"))
                    .collect(Collectors.toSet());
        }
        watch.stop();
        log.debug("Fetched {} class IRIs: {}ms", classIRIs.size(), watch.getTime());
        watch.reset();
        classIRIs.forEach(classIRI -> log.trace(classIRI.stringValue()));
        String classIRIValues = "VALUES ?this { " + classIRIs.stream()
                .map(iri -> "<" + iri + ">").collect(Collectors.joining(" ")) + " }";
        watch.start();
        log.debug("Step -1");
        runBasicUpdate("CopyEquivalentIntersection", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    INSERT {
                        ?this owl:intersectionOf ?inter .
                    }
                    WHERE {
                        %VALUES%
                        ?this owl:equivalentClass ?equi .
                        FILTER isBlank(?equi) .
                        ?equi owl:intersectionOf ?inter .
                    }
                    """, classIRIValues, conn);
        log.debug("Finish Step -1");

        log.debug("Step 0");
        // TODO: Revisit this after user feedback. Maybe make a targetClass selector instead?
        runBasicUpdate("AddTypeNodeShape", """
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    INSERT {
                        GRAPH ?graph {
                            ?this a sh:NodeShape, owl:Class, rdfs:Class .
                        }
                    }
                    WHERE {
                        %VALUES%
                    }
                    """, classIRIValues, conn);

        runBasicUpdate("FlattenIntersectionOf", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                    INSERT {
                        ?this rdfs:subClassOf ?superClass .
                    }
                    WHERE {
                        %VALUES%
                        ?this owl:intersectionOf ?list .
                        ?list rdf:rest*/rdf:first ?superClass .
                        FILTER isBlank(?superClass) .
                    }
                    """, classIRIValues, conn);
        log.debug("Finish Step 0");

        log.debug("Step 1");
        runPropertyShapeUpdate("CreatePropertyShapesFromRestrictions", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    SELECT DISTINCT ?this ?property
                    WHERE {
                        %VALUES%
                        ?this rdfs:subClassOf/owl:onProperty ?property .
                    }
                    """, """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?this sh:property ?propertyShape .
                            ?propertyShape sh:path ?property .
                        }
                    }
                    WHERE {
                    }
                    """, classIRIValues, Set.of("property"), conn);

        runBasicUpdate("owlDisjointWith2NotClass", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?this sh:not ?class .
                            ?class sh:class ?disjointWith .
                        }
                    }
                    WHERE {
                        %VALUES%
                        ?this owl:disjointWith ?disjointWith .
                        FILTER isIRI(?disjointWith) .
                        BIND (BNODE() AS ?class) .
                    }
                    """, classIRIValues, conn);
        log.debug("Finish Step 1");

        log.debug("Step 2");
        runPropertyShapeUpdate("CreatePropertyShapesFromMatchingDomains", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    SELECT DISTINCT ?this ?property
                    WHERE {
                        %VALUES%
                        {
                            ?property rdfs:domain ?this .
                        }
                        UNION {
                            ?unionOf rdf:rest*/rdf:first ?this .
                            ?domain owl:unionOf ?unionOf .
                            ?property rdfs:domain ?domain .
                        }
                    }
                    """, """
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?this sh:property ?propertyShape .
                            ?propertyShape sh:path ?property .
                        }
                    }
                    WHERE {
                    }
                    """, classIRIValues, Set.of("property"), conn);
        log.debug("Finish Step 2");

        log.debug("Step 3");
        runBasicUpdate("owlFunctionalProperty2shMaxCount1", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?propertyShape sh:maxCount 1 .
                        }
                    }
                    WHERE {
                        %VALUES%
                        ?this sh:property ?propertyShape .
                        ?propertyShape sh:path ?property .
                        ?property a owl:FunctionalProperty .
                        FILTER NOT EXISTS {
                            ?this rdfs:subClassOf* ?class .
                            ?class rdfs:subClassOf ?restriction .
                            ?restriction a owl:Restriction .
                            ?restriction owl:onProperty ?property .
                            ?restriction owl:maxCardinality|owl:cardinality ?any .
                        }
                    }
                    """, classIRIValues, conn);
        log.debug("Finish Step 3");

        log.debug("Step 4");
        runPropertyShapeUpdate("owlAllValuesFrom2shClassOrDatatype", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    SELECT DISTINCT ?this ?property ?parameter ?value ?mappedFromDatatype
                    WHERE {
                        %VALUES%
                        {
                            {
                                ?this rdfs:subClassOf ?restriction .
                                ?restriction a owl:Restriction .
                                FILTER isBlank(?restriction) .
                            }
                            ?restriction owl:onProperty ?property .
                            ?restriction owl:allValuesFrom ?allValuesFrom .
                            # FILTER isIRI(?allValuesFrom) .
                        }
                        # Avoids clash with owlAllValuesFromUnion2shClassOrDatatype
                        FILTER NOT EXISTS {
                            ?allValuesFrom owl:unionOf ?something .
                        }
                        BIND((
                            (?allValuesFrom = rdfs:Literal) ||
                            EXISTS { ?allValuesFrom a rdfs:Datatype } ||
                            EXiSTS { ?allValuesFrom owl:equivalentClass/rdf:type rdfs:Datatype }
                        ) AS ?isDatatype)
                        BIND (IF(?isDatatype, sh:datatype, sh:class) AS ?parameter)
                        OPTIONAL {
                            ?allValuesFrom (owl:onDatatype | (owl:equivalentClass/owl:onDatatype)) ?base
                        }
                        BIND(COALESCE(?base, ?allValuesFrom) AS ?baseDatatype)
                        BIND (IF(?isDatatype, ?baseDatatype, ?allValuesFrom) AS ?value) .
                        BIND (IF(?isDatatype, ?allValuesFrom, ?none) AS ?mappedFromDatatype) .
                    }
                    """, """
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?propertyShape ?parameter ?value .
                        }
                        ?propertyShape <urn:mappedFromDatatype> ?mappedFromDatatype .
                    }
                    WHERE {
                    }
                    """, classIRIValues, Set.of("parameter", "value", "mappedFromDatatype"), conn);

        runPropertyShapeUpdate("owlAllValuesFromUnion2shClassOrDatatype", """
                PREFIX owl: <http://www.w3.org/2002/07/owl#>
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                PREFIX sh: <http://www.w3.org/ns/shacl#>
                                    
                SELECT DISTINCT ?this ?property ?orListNode ?valueShape ?nextNode ?parameter ?value ?mappedFromDatatype
                WHERE {
                    %VALUES%
                    # Match the pattern
                    {
                        ?this rdfs:subClassOf ?restriction .
                        ?restriction a owl:Restriction .
                        FILTER isBlank(?restriction) .
                    }
                    ?restriction owl:onProperty ?property .
                    ?restriction owl:allValuesFrom ?allValuesFrom .
                    ?allValuesFrom owl:unionOf ?unionList .
                    FILTER isBlank(?allValuesFrom) .
                   
                    # The original union list becomes our template
                    # We mirror its structure for the sh:or list
                    ?unionList rdf:rest* ?originalNode .
                    ?originalNode rdf:first ?member .
                    FILTER isIRI(?member) .
                   
                    # Create corresponding sh:or list nodes
                    # Use the original node structure as a key for consistent blank nodes
                    BIND (BNODE(CONCAT("or-", STR(?property), "-", STR(?member))) AS ?orListNode) .
                    BIND (BNODE(CONCAT("shape-", STR(?property), "-", STR(?member))) AS ?valueShape) .
                   
                    # Determine parameter type and value
                    BIND((
                        (?member = rdfs:Literal) ||
                        EXISTS { ?member a rdfs:Datatype } ||
                        EXiSTS { ?member owl:equivalentClass/rdf:type rdfs:Datatype }
                    ) AS ?isDatatype)
                    BIND (IF(?isDatatype, sh:datatype, sh:class) AS ?parameter)
                    OPTIONAL {
                        ?member (owl:onDatatype | (owl:equivalentClass/owl:onDatatype)) ?base
                    }
                    BIND(COALESCE(?base, ?member) AS ?baseDatatype)
                    BIND (IF(?isDatatype, ?baseDatatype, ?member) AS ?value) .
                    BIND (IF(?isDatatype, ?member, ?none) AS ?mappedFromDatatype) .
                   
                    # Mirror the rest structure from original list
                    OPTIONAL {
                        ?originalNode rdf:rest ?originalRest .
                        FILTER (?originalRest != rdf:nil) .
                        ?originalRest rdf:first ?originalRestMember .
                        BIND (BNODE(CONCAT("or-", STR(?property), "-", STR(?originalRestMember))) AS ?nextNode) .
                    }
                    BIND (COALESCE(?nextNode, rdf:nil) AS ?nextNode) .
                }
                """, """
                PREFIX owl: <http://www.w3.org/2002/07/owl#>
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                PREFIX sh: <http://www.w3.org/ns/shacl#>
                                    
                INSERT {
                    GRAPH ?graph {
                        # Main connection
                        ?propertyShape sh:or ?orListNode .
                   
                        # List structure
                        ?orListNode rdf:first ?valueShape .
                        ?orListNode rdf:rest ?nextNode .
                   
                       # Value shapes
                        ?valueShape ?parameter ?value .
                        ?valueShape <urn:mappedFromDatatype> ?mappedFromDatatype .
                    }
                }
                WHERE {
                }
                """, classIRIValues, Set.of("orListNode", "valueShape", "nextNode", "parameter", "value",
                "mappedFromDatatype"), conn);

        runPropertyShapeUpdate("owlMinCardinality2shMinCount", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                    SELECT DISTINCT ?this ?property ?minCount
                    WHERE {
                        %VALUES%
                        {
                            ?this rdfs:subClassOf ?restriction .
                            ?restriction a owl:Restriction .
                            FILTER isBlank(?restriction) .
                        }
                        ?restriction owl:minCardinality|owl:cardinality ?raw .
                        ?restriction owl:onProperty ?property .
                        BIND (xsd:integer(?raw) AS ?minCount) .
                    }
                    """, """
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?propertyShape sh:minCount ?minCount .
                        }
                    }
                    WHERE {
                    }
                    """, classIRIValues, Set.of("minCount"), conn);

        runPropertyShapeUpdate("owlSomeValuesFrom2shMinCount1", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    SELECT DISTINCT ?this ?property
                    WHERE {
                        %VALUES%
                        ?this rdfs:subClassOf ?restriction .
                        ?restriction a owl:Restriction .
                        ?restriction owl:someValuesFrom ?someValuesFrom .
                        ?restriction owl:onProperty ?property .
                    }
                    """, """
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?propertyShape sh:minCount 1
                        }
                    }
                    WHERE {
                    }
                    """, classIRIValues, Collections.emptySet(), conn);

        runPropertyShapeUpdate("owlSomeValuesFromIRI2dashHasValueWithClass", """
                PREFIX owl: <http://www.w3.org/2002/07/owl#>
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                PREFIX sh: <http://www.w3.org/ns/shacl#>
                
                SELECT DISTINCT ?this ?property ?someValuesFrom
                WHERE {
                    %VALUES%
                    {
                        ?this rdfs:subClassOf ?restriction .
                        ?restriction a owl:Restriction .
                        FILTER isBlank(?restriction) .
                    }
                    ?restriction owl:someValuesFrom ?someValuesFrom .
                    ?restriction owl:onProperty ?property .
                    BIND((
                      (?someValuesFrom = rdfs:Literal) ||
                      EXISTS { ?someValuesFrom a rdfs:Datatype } ||
                      EXiSTS { ?someValuesFrom owl:equivalentClass/rdf:type rdfs:Datatype }
                    ) AS ?isDatatype)
                    FILTER (isIRI(?someValuesFrom) && !?isDatatype) .
                    FILTER NOT EXISTS { ?property rdfs:range ?someValuesFrom } .
                }
                """, """
                PREFIX owl: <http://www.w3.org/2002/07/owl#>
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                PREFIX sh: <http://www.w3.org/ns/shacl#>
                                   
                INSERT {
                    GRAPH ?graph {
                        ?propertyShape sh:qualifiedMinCount 1 .
                        ?propertyShape sh:qualifiedValueShape ?valueShape .
                        ?valueShape sh:class ?someValuesFrom .
                    }
                }
                WHERE {
                    BIND(BNODE() as ?valueShape)
                }
                """, classIRIValues, Set.of("someValuesFrom"), conn);

        runPropertyShapeUpdate("owlSomeValuesFromUnion2dashHasValueWithClass", """
                PREFIX owl: <http://www.w3.org/2002/07/owl#>
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                PREFIX sh: <http://www.w3.org/ns/shacl#>
                                    
                SELECT DISTINCT ?this ?property ?orListNode ?valueShape ?nextNode ?member
                WHERE {
                  %VALUES%
                  # Match the pattern
                  {
                    ?this rdfs:subClassOf ?restriction .
                    ?restriction a owl:Restriction .
                    FILTER isBlank(?restriction) .
                  }
                  ?restriction owl:onProperty ?property .
                  ?restriction owl:someValuesFrom ?someValuesFrom .
                  ?someValuesFrom owl:unionOf ?unionList .
                  FILTER isBlank(?someValuesFrom) .
                                    
                  # The original union list becomes our template
                  # We mirror its structure for the sh:or list
                  ?unionList rdf:rest* ?originalNode .
                  ?originalNode rdf:first ?member .
                  FILTER isIRI(?member) .
                                    
                  # Create corresponding sh:or list nodes
                  # Use the original node structure as a key for consistent blank nodes
                  BIND (BNODE(CONCAT("or-", STR(?property), "-", STR(?member))) AS ?orListNode) .
                  BIND (BNODE(CONCAT("shape-", STR(?property), "-", STR(?member))) AS ?valueShape) .
                                    
                  # Filter out non-datatypes
                  BIND((
                      (?member = rdfs:Literal) ||
                      EXISTS { ?member a rdfs:Datatype } ||
                      EXiSTS { ?member owl:equivalentClass/rdf:type rdfs:Datatype }
                    ) AS ?isDatatype)
                  FILTER(!?isDatatype)
                                    
                  # Mirror the rest structure from original list
                  OPTIONAL {
                    ?originalNode rdf:rest ?originalRest .
                    FILTER (?originalRest != rdf:nil) .
                    ?originalRest rdf:first ?originalRestMember .
                    BIND (BNODE(CONCAT("or-", STR(?property), "-", STR(?originalRestMember))) AS ?nextNode) .
                  }
                  BIND (COALESCE(?nextNode, rdf:nil) AS ?nextNode) .
                }
                """, """
                PREFIX owl: <http://www.w3.org/2002/07/owl#>
                PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                PREFIX sh: <http://www.w3.org/ns/shacl#>
                                   
                INSERT {
                    GRAPH ?graph {
                        # Main connection
                        ?propertyShape sh:or ?orListNode .
                   
                        # List structure
                        ?orListNode rdf:first ?valueShape .
                        ?orListNode rdf:rest ?nextNode .
                   
                        # Value shapes
                        ?valueShape sh:qualifiedMinCount 1 .
                        ?valueShape sh:qualifiedValueShape ?qualifiedValueShape .
                                    
                        # Qualified value shape
                        ?qualifiedValueShape sh:class ?member .
                    }
                }
                WHERE {
                    BIND(BNODE() as ?qualifiedValueShape)
                }
                """, classIRIValues, Set.of("orListNode", "valueShape", "nextNode", "member"), conn);

        runBasicUpdate("owlUnionOfIRIs2rdfsSubClassOf", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                    INSERT {
                        GRAPH ?graph {
                            ?this rdfs:subClassOf ?class .
                        }
                    }
                    WHERE {
                        %VALUES%
                        {
                            ?this rdfs:subClassOf ?union .
                            ?union owl:unionOf ?unionOf .
                            FILTER isBlank(?union) .
                        }
                        FILTER NOT EXISTS {
                            ?unionOf rdf:rest*/rdf:first ?member .
                            FILTER (!isIRI(?member)) .
                        } .
                        ?unionOf rdf:rest*/rdf:first ?class .
                    }
                    """, classIRIValues, conn);
        log.debug("Finish Step 4");

        // Step 5 - owl2shacl:rdfsRange2shClassOrDatatype
        log.debug("Step 5");
        runBasicUpdate("rdfsRange2shClassOrDatatype", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?propertyShape ?parameter ?value .
                        }
                        ?propertyShape <urn:mappedFromDatatype> ?mappedFromDatatype .
                    }
                    WHERE {
                        %VALUES%
                        {
                            {
                                ?this sh:property ?propertyShape .
                                FILTER NOT EXISTS { ?propertyShape sh:class|sh:datatype ?any } .
                            }
                            ?propertyShape sh:path ?property .
                            ?property rdfs:range ?range .
                            # FILTER isIRI(?range) .
                        }
                        BIND((
                            (?range = rdfs:Literal) ||
                            EXISTS { ?range a rdfs:Datatype } ||
                            EXiSTS { ?range owl:equivalentClass/rdf:type rdfs:Datatype }
                        ) AS ?isDatatype)
                        BIND (IF(?isDatatype, sh:datatype, sh:class) AS ?parameter) .
                        OPTIONAL {
                            ?range (owl:onDatatype | (owl:equivalentClass/owl:onDatatype)) ?base
                        }
                        BIND(COALESCE(?base, ?range) AS ?baseDatatype)
                        BIND (IF(?isDatatype, ?baseDatatype, ?range) AS ?value) .
                        BIND (IF(?isDatatype, ?range, ?none) AS ?mappedFromDatatype) .
                    }
                    """, classIRIValues, conn);
        log.debug("Finish Step 5");

        log.debug("Step 6");
        runPropertyShapeUpdate("owlMaxCardinality2shMaxCount", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                    SELECT DISTINCT ?this ?property ?maxCount
                    WHERE {
                        %VALUES%
                        ?this rdfs:subClassOf ?restriction .
                        ?restriction a owl:Restriction .
                        FILTER isBlank(?restriction) .
                        ?restriction owl:onProperty ?property .
                        ?restriction owl:maxCardinality|owl:cardinality ?raw .
                        BIND (xsd:integer(?raw) AS ?maxCount) .
                    }
                    """, """
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?propertyShape sh:maxCount ?maxCount .
                        }
                    }
                    WHERE {
                    }
                    """, classIRIValues, Set.of("maxCount"), conn);

        runPropertyShapeUpdate("owlMaxQualifiedCardinalityOnClass2shMaxCount", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                    SELECT DISTINCT ?this ?property ?maxCount
                    WHERE {
                        %VALUES%
                        {
                            ?this rdfs:subClassOf ?restriction .
                            ?restriction a owl:Restriction .
                            FILTER isBlank(?restriction) .
                        }
                        ?restriction owl:maxQualifiedCardinality ?raw .
                        ?restriction owl:onProperty ?property .
                        ?restriction owl:onClass ?onClass .
                        FILTER isIRI(?onClass) .
                        FILTER EXISTS { ?property rdfs:range ?onClass } .
                        BIND (xsd:integer(?raw) AS ?maxCount) .
                    }
                    """, """
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?propertyShape sh:maxCount ?maxCount .
                        }
                    }
                    WHERE {
                    }
                    """, classIRIValues, Set.of("maxCount"), conn);

        runBasicUpdate("owlMaxQualifiedCardinalityOnClass2shQualifiedMaxCount", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?this sh:property ?propertyShape .
                            ?propertyShape sh:path ?property .
                            ?propertyShape sh:qualifiedMaxCount ?maxCount .
                            ?propertyShape sh:qualifiedValueShape ?valueShape .
                            ?valueShape sh:class ?onClass .
                        }
                    }
                    WHERE {
                        %VALUES%
                        {
                            ?this rdfs:subClassOf ?restriction .
                            ?restriction a owl:Restriction .
                            FILTER isBlank(?restriction) .
                        }
                        ?restriction owl:maxQualifiedCardinality ?raw .
                        ?restriction owl:onProperty ?property .
                        ?restriction owl:onClass ?onClass .
                        FILTER isIRI(?onClass) .
                        FILTER NOT EXISTS { ?property rdfs:range ?onClass } .
                        BIND (xsd:integer(?raw) AS ?maxCount) .
                        BIND (BNODE() AS ?propertyShape) .
                        BIND (BNODE() AS ?valueShape) .
                    }
                    """, classIRIValues, conn);

        runBasicUpdate("owlMaxQualifiedCardinalityOnDataRange2shQualifiedMaxCount", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?this sh:property ?propertyShape .
                            ?propertyShape sh:path ?property .
                            ?propertyShape sh:qualifiedMaxCount ?maxCount .
                            ?propertyShape sh:qualifiedValueShape ?valueShape .
                            ?valueShape sh:datatype ?onDataRange .
                        }
                    }
                    WHERE {
                        %VALUES%
                        {
                            ?this rdfs:subClassOf ?restriction .
                            ?restriction a owl:Restriction .
                            FILTER isBlank(?restriction) .
                        }
                        ?restriction owl:maxQualifiedCardinality ?raw .
                        ?restriction owl:onProperty ?property .
                        ?restriction owl:onDataRange ?onDataRange .
                        FILTER isIRI(?onDataRange) .
                        BIND (xsd:integer(?raw) AS ?maxCount) .
                        BIND (BNODE() AS ?propertyShape) .
                        BIND (BNODE() AS ?valueShape) .
                    }
                    """, classIRIValues, conn);

        runPropertyShapeUpdate("owlMinQualifiedCardinalityOnClass2shMinCount", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                    SELECT DISTINCT ?this ?property ?minCount
                    WHERE {
                        %VALUES%
                        {
                            ?this rdfs:subClassOf ?restriction .
                            ?restriction a owl:Restriction .
                            FILTER isBlank(?restriction) .
                        }
                        ?restriction owl:minQualifiedCardinality ?raw .
                        ?restriction owl:onClass ?onClass .
                        ?restriction owl:onProperty ?property .
                        FILTER isIRI(?onClass) .
                        FILTER EXISTS { ?property rdfs:range ?onClass } .
                        BIND (xsd:integer(?raw) AS ?minCount) .
                    }
                    """, """
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?propertyShape sh:minCount ?minCount .
                        }
                    }
                    WHERE {
                    }
                    """, classIRIValues, Set.of("minCount"), conn);

        runBasicUpdate("owlMinQualifiedCardinalityOnClass2shQualifiedMinCount", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?this sh:property ?propertyShape .
                            ?propertyShape sh:path ?property .
                            ?propertyShape sh:qualifiedMinCount ?minCount .
                            ?propertyShape sh:qualifiedValueShape ?valueShape .
                            ?valueShape sh:class ?onClass .
                        }
                    }
                    WHERE {
                        %VALUES%
                        {
                            ?this rdfs:subClassOf ?restriction .
                            ?restriction a owl:Restriction .
                            FILTER isBlank(?restriction) .
                        }
                        ?restriction owl:minQualifiedCardinality ?raw .
                        ?restriction owl:onClass ?onClass .
                        ?restriction owl:onProperty ?property .
                        FILTER isIRI(?onClass) .
                        FILTER NOT EXISTS { ?property rdfs:range ?onClass } .
                        BIND (xsd:integer(?raw) AS ?minCount) .
                        BIND (BNODE() AS ?propertyShape) .
                        BIND (BNODE() AS ?valueShape) .
                    }
                    """, classIRIValues, conn);

        runBasicUpdate("owlMinQualifiedCardinalityOnDataRange2shQualifiedMinCount", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?this sh:property ?propertyShape .
                            ?propertyShape sh:path ?property .
                            ?propertyShape sh:qualifiedMinCount ?minCount .
                            ?propertyShape sh:qualifiedValueShape ?valueShape .
                            ?valueShape sh:datatype ?onDataRange .
                        }
                    }
                    WHERE {
                        %VALUES%
                        {
                            ?this rdfs:subClassOf ?restriction .
                            ?restriction a owl:Restriction .
                            FILTER isBlank(?restriction) .
                        }
                        ?restriction owl:minQualifiedCardinality ?raw .
                        ?restriction owl:onDataRange ?onDataRange .
                        ?restriction owl:onProperty ?property .
                        FILTER isIRI(?onDataRange) .
                        BIND (xsd:integer(?raw) AS ?minCount) .
                        BIND (BNODE() AS ?propertyShape) .
                        BIND (BNODE() AS ?valueShape) .
                    }
                    """, classIRIValues, conn);

        runPropertyShapeUpdate("owlQualifiedCardinalityOnClass2shMinMaxCount", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                    SELECT DISTINCT ?this ?property ?count
                    WHERE {
                        %VALUES%
                        {
                            ?this rdfs:subClassOf ?restriction .
                            ?restriction a owl:Restriction .
                            FILTER isBlank(?restriction) .
                        }
                        ?restriction owl:qualifiedCardinality ?raw .
                        ?restriction owl:onClass ?onClass .
                        ?restriction owl:onProperty ?property .
                        FILTER isIRI(?onClass) .
                        FILTER EXISTS { ?property rdfs:range ?onClass } .
                        BIND (xsd:integer(?raw) AS ?count) .
                    }
                    """, """
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?propertyShape sh:maxCount ?count .
                            ?propertyShape sh:minCount ?count .
                        }
                    }
                    WHERE {
                    }
                    """, classIRIValues, Set.of("count"), conn);

        runBasicUpdate("owlQualifiedCardinalityOnClass2shQualifiedMinMaxCount", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?this sh:property ?propertyShape .
                            ?propertyShape sh:path ?property .
                            ?propertyShape sh:qualifiedMaxCount ?count .
                            ?propertyShape sh:qualifiedMinCount ?count .
                            ?propertyShape sh:qualifiedValueShape ?valueShape .
                            ?valueShape sh:class ?onClass .
                        }
                    }
                    WHERE {
                        %VALUES%
                        {
                            ?this rdfs:subClassOf ?restriction .
                            ?restriction a owl:Restriction .
                            FILTER isBlank(?restriction) .
                        }
                        ?restriction owl:qualifiedCardinality ?raw .
                        ?restriction owl:onClass ?onClass .
                        ?restriction owl:onProperty ?property .
                        FILTER isIRI(?onClass) .
                        FILTER NOT EXISTS { ?property rdfs:range ?onClass } .
                        BIND (xsd:integer(?raw) AS ?count) .
                        BIND (BNODE() AS ?propertyShape) .
                        BIND (BNODE() AS ?valueShape) .
                    }
                    """, classIRIValues, conn);

        runBasicUpdate("owlQualifiedCardinalityOnDataRange2shQualifiedMinMaxCount", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?this sh:property ?propertyShape .
                            ?propertyShape sh:path ?property .
                            ?propertyShape sh:qualifiedMaxCount ?count .
                            ?propertyShape sh:qualifiedMinCount ?count .
                            ?propertyShape sh:qualifiedValueShape ?valueShape .
                            ?valueShape sh:datatype ?onDataRange .
                        }
                    }
                    WHERE {
                        %VALUES%
                        {
                            ?this rdfs:subClassOf ?restriction .
                            ?restriction a owl:Restriction .
                            FILTER isBlank(?restriction) .
                        }
                        ?restriction owl:qualifiedCardinality ?raw .
                        ?restriction owl:onDataRange ?onDataRange .
                        ?restriction owl:onProperty ?property .
                        FILTER isIRI(?onDataRange) .
                        BIND (xsd:integer(?raw) AS ?count) .
                        BIND (BNODE() AS ?propertyShape) .
                        BIND (BNODE() AS ?valueShape) .
                    }
                    """, classIRIValues, conn);

        runBasicUpdate("xsdLength2shMaxMinLength", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?propertyShape sh:minLength ?length .
                            ?propertyShape sh:maxLength ?length .
                        }
                    }
                    WHERE {
                        %VALUES%
                        ?this sh:property ?propertyShape .
                        ?propertyShape <urn:mappedFromDatatype> ?range .
                        ?range (owl:equivalentClass/owl:withRestrictions/rdf:rest*/rdf:first/xsd:length) |
                            (owl:withRestrictions/rdf:rest*/rdf:first/xsd:length) ?lengthRaw .
                        BIND (xsd:integer(?lengthRaw) AS ?length) .
                    }
                    """, classIRIValues, conn);

        runBasicUpdate("xsdMaxExclusive2shMaxExclusive", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?propertyShape sh:maxExclusive ?value .
                        }
                    }
                    WHERE {
                        %VALUES%
                        ?this sh:property ?propertyShape .
                        ?propertyShape <urn:mappedFromDatatype> ?range .
                        ?range (owl:equivalentClass/owl:withRestrictions/rdf:rest*/rdf:first/xsd:maxExclusive) |
                            (owl:withRestrictions/rdf:rest*/rdf:first/xsd:maxExclusive) ?value .
                    }
                    """, classIRIValues, conn);

        runBasicUpdate("xsdMaxInclusive2shMaxInclusive", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?propertyShape sh:maxInclusive ?value .
                        }
                    }
                    WHERE {
                        %VALUES%
                        ?this sh:property ?propertyShape .
                        ?propertyShape <urn:mappedFromDatatype> ?range .
                        ?range (owl:equivalentClass/owl:withRestrictions/rdf:rest*/rdf:first/xsd:maxInclusive) |
                            (owl:withRestrictions/rdf:rest*/rdf:first/xsd:maxInclusive) ?value .
                    }
                    """, classIRIValues, conn);

        runBasicUpdate("xsdMaxLength2shMaxLength", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?propertyShape sh:maxLength ?maxLength .
                        }
                    }
                    WHERE {
                        %VALUES%
                        ?this sh:property ?propertyShape .
                        ?propertyShape <urn:mappedFromDatatype> ?range .
                        ?range (owl:equivalentClass/owl:withRestrictions/rdf:rest*/rdf:first/xsd:maxLength) |
                            (owl:withRestrictions/rdf:rest*/rdf:first/xsd:maxLength) ?maxLengthRaw .
                        BIND (xsd:integer(?maxLengthRaw) AS ?maxLength) .
                    }
                    """, classIRIValues, conn);

        runBasicUpdate("xsdMinExclusive2shMinExclusive", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?propertyShape sh:minExclusive ?value .
                        }
                    }
                    WHERE {
                        %VALUES%
                        ?this sh:property ?propertyShape .
                        ?propertyShape <urn:mappedFromDatatype> ?range .
                        ?range (owl:equivalentClass/owl:withRestrictions/rdf:rest*/rdf:first/xsd:minExclusive) |
                            (owl:withRestrictions/rdf:rest*/rdf:first/xsd:minExclusive) ?value .
                    }
                    """, classIRIValues, conn);

        runBasicUpdate("xsdMinInclusive2shMinInclusive", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?propertyShape sh:minInclusive ?value .
                        }
                    }
                    WHERE {
                        %VALUES%
                        ?this sh:property ?propertyShape .
                        ?propertyShape <urn:mappedFromDatatype> ?range .
                        ?range (owl:equivalentClass/owl:withRestrictions/rdf:rest*/rdf:first/xsd:minInclusive) |
                            (owl:withRestrictions/rdf:rest*/rdf:first/xsd:minInclusive) ?value .
                    }
                    """, classIRIValues, conn);

        runBasicUpdate("xsdMinLength2shMinLength", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?propertyShape sh:minLength ?minLength .
                        }
                    }
                    WHERE {
                        %VALUES%
                        ?this sh:property ?propertyShape .
                        ?propertyShape <urn:mappedFromDatatype> ?range .
                        ?range (owl:equivalentClass/owl:withRestrictions/rdf:rest*/rdf:first/xsd:minLength) |
                            (owl:withRestrictions/rdf:rest*/rdf:first/xsd:minLength) ?minLengthRaw .
                        BIND (xsd:integer(?minLengthRaw) AS ?minLength) .
                    }
                    """, classIRIValues, conn);

        runBasicUpdate("xsdPattern2shPattern", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?propertyShape sh:pattern ?pattern .
                        }
                    }
                    WHERE {
                        %VALUES%
                        ?this sh:property ?propertyShape .
                        ?propertyShape <urn:mappedFromDatatype> ?range .
                        ?range (owl:equivalentClass/owl:withRestrictions/rdf:rest*/rdf:first/xsd:pattern) |
                            (owl:withRestrictions/rdf:rest*/rdf:first/xsd:pattern) ?pattern .
                    }
                    """, classIRIValues, conn);
        log.debug("Finish Step 6");

        log.debug("Step 7");
        runBasicUpdate("owlSomeValuesFromAllValuesFrom2dashHasValueWithClass", """
                PREFIX owl: <http://www.w3.org/2002/07/owl#>
                PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                PREFIX sh: <http://www.w3.org/ns/shacl#>
                INSERT {
                    GRAPH ?graph {
                        ?this sh:property ?propertyShape .
                        ?propertyShape sh:qualifiedMinCount 1 .
                        ?propertyShape sh:qualifiedValueShape ?valueShape .
                        ?valueShape sh:class ?allValuesFrom .
                        ?propertyShape sh:path ?firstNode .
                        ?firstNode rdf:first ?property .
                        ?firstNode rdf:rest ?secondNode .
                        ?secondNode rdf:first ?allValuesFromProperty .
                        ?secondNode rdf:rest rdf:nil .
                    }
                }
                WHERE {
                    %VALUES%
                    {
                        {
                            ?this rdfs:subClassOf ?restriction .
                            ?restriction a owl:Restriction .
                            FILTER isBlank(?restriction) .
                        }
                        ?restriction owl:someValuesFrom ?someValuesFrom .
                        ?someValuesFrom owl:allValuesFrom ?allValuesFrom .
                        FILTER isIRI(?allValuesFrom) .
                        BIND((
                            (?allValuesFrom = rdfs:Literal) ||
                            EXISTS { ?allValuesFrom a rdfs:Datatype } ||
                            EXiSTS { ?allValuesFrom owl:equivalentClass/rdf:type rdfs:Datatype }
                        ) AS ?isDatatype)
                        FILTER (!?isDatatype) .
                        FILTER isBlank(?someValuesFrom) .
                    }
                    ?restriction owl:onProperty ?property .
                    ?someValuesFrom owl:onProperty ?allValuesFromProperty .
                    BIND (BNODE() AS ?propertyShape) .
                    BIND (BNODE() AS ?firstNode) .
                    BIND (BNODE() AS ?secondNode) .
                    BIND (BNODE() AS ?valueShape) .
                }
                """, classIRIValues, conn);
        log.debug("Finish Step 7");

        log.debug("Step 8");
        runPropertyShapeUpdate("owlHasValue2shHasValue", """
                    PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                    SELECT ?this ?property ?hasValue
                    WHERE {
                        %VALUES%
                        {
                            ?this rdfs:subClassOf ?restriction .
                            ?restriction a owl:Restriction .
                            FILTER isBlank(?restriction) .
                        }
                        ?restriction owl:onProperty ?property .
                        ?restriction owl:hasValue ?hasValue .
                    }
                    """, """
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?propertyShape sh:hasValue ?hasValue .
                        }
                    }
                    WHERE {
                    }
                    """, classIRIValues, Set.of("hasValue"), conn);
        log.debug("Finish Step 8");

        log.debug("Final Step");
        runBasicUpdate("shPropertyShapeCleanUp", """
                    PREFIX sh: <http://www.w3.org/ns/shacl#>
                    INSERT {
                        GRAPH ?graph {
                            ?propertyShape a sh:PropertyShape .
                        }
                    }
                    WHERE {
                        %VALUES%
                        ?this sh:property ?propertyShape .
                    }
                    """, classIRIValues, conn);
        log.debug("Finish Final Step");
        watch.stop();
        log.debug("Finished conversion of classes: {}ms", watch.getTime());
    }

    private static <T extends Operation> T setUpdateBindings(T query, Resource thisValue) {
        return setBinding(setBinding(query, "this", thisValue), "graph", NAMED_GRAPH);
    }

    private static <T extends Operation> T setThisBinding(T query, Resource thisValue) {
        return setBinding(query, "this", thisValue);
    }

    private static <T extends Operation> T setBinding(T query, String binding, Value bindingValue) {
        query.setBinding(binding, bindingValue);
        return query;
    }

    private static void runBasicUpdate(String name, String query, String values, RepositoryConnection conn) {
        StopWatch watch = new StopWatch();
        log.trace("{} start", name);
        watch.start();
        String updatedQuery = query.replace("%VALUES%", values);
        setBinding(conn.prepareUpdate(updatedQuery), "graph", NAMED_GRAPH).execute();
        watch.stop();
        log.trace("{} complete: {}ms", name, watch.getTime());
    }

    private static void runPropertyShapeUpdate(String name, String selectQuery, String updateQuery,
                                               String values, Set<String> extraBindings, RepositoryConnection conn) {
        StopWatch watch = new StopWatch();
        log.trace("{} start", name);
        watch.start();
        String updatedSelectQuery = selectQuery.replace("%VALUES%", values);
        try (TupleQueryResult result = conn.prepareTupleQuery(updatedSelectQuery).evaluate()) {
            result.forEach(bindings -> {
                Resource classIRI = Bindings.requiredResource(bindings, "this");
                Resource predicate = Bindings.requiredResource(bindings, "property");
                Resource propertyShape = getPropertyShape(predicate, classIRI, conn);
                Update update = setBinding(
                        setUpdateBindings(conn.prepareUpdate(updateQuery), classIRI),
                        "propertyShape",
                        propertyShape
                );
                for (String bindingName : extraBindings) {
                    Optional.ofNullable(bindings.getBinding(bindingName)).ifPresent(binding ->
                            setBinding(update, bindingName, binding.getValue()));
                }
                update.execute();
            });
        }
        watch.stop();
        log.trace("{} stop: {}ms", name, watch.getTime());
    }

    private static Resource getPropertyShape(Resource predicate, Resource shape, RepositoryConnection conn) {
        String query = """
                PREFIX sh: <http://www.w3.org/ns/shacl#>
                SELECT ?result
                WHERE {
                    {
                        ?shape sh:property ?result .
                        ?result sh:path ?predicate .
                    }
                    UNION
                    {
                        BIND(
                            IF(isIRI(?shape),
                                IRI(
                                    CONCAT(
                                        STR(?shape),
                                        "-",
                                        REPLACE(STR(?predicate), "^.*?([_\\\\p{L}][-_\\\\p{L}\\\\p{N}]*)$", "$1")
                                    )
                                ),
                                BNODE()) AS ?result) .
                    }
                }
                """;
        TupleQuery tupleQuery = conn.prepareTupleQuery(query);
        tupleQuery.setBinding("shape", shape);
        tupleQuery.setBinding("predicate", predicate);
        try (TupleQueryResult result = tupleQuery.evaluate()) {
            if (result.hasNext()) {
                return Bindings.requiredResource(result.next(), "result");
            }
            return vf.createBNode();
        }
    }

    private static void writeData(RepositoryConnection conn, OutputStream out, RDFFormat outputFormat) {
        RDFWriter writer = Rio.createWriter(outputFormat, out);
        if (RDFFormat.TURTLE.equals(outputFormat) || RDFFormat.TRIG.equals(outputFormat)) {
            writer.getWriterConfig().set(TurtleWriterSettings.ABBREVIATE_NUMBERS, false);
        }
        RemoveContextHandler removeContextSH = new RemoveContextHandler(vf);

        com.mobi.persistence.utils.rio.Rio.write(conn.getStatements(null, null, null, NAMED_GRAPH), writer,
                removeContextSH);

    }
}
