package com.mobi.ontology.core.api;

/*-
 * #%L
 * com.mobi.ontology.api
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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

import com.mobi.ontology.core.utils.MobiOntologyException;
import com.mobi.query.TupleQueryResult;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.ValueFactory;

import java.io.OutputStream;
import java.util.Optional;
import java.util.Set;

public interface Ontology {

    Model asModel(ModelFactory factory) throws MobiOntologyException;

    /**
     * Returns the Ontology as TURTLE in an OutputStream.
     *
     * @return an OutputStream of TURTLE
     * @throws MobiOntologyException If an error occurs while parsing
     */
    OutputStream asTurtle() throws MobiOntologyException;

    /**
     * Returns the Ontology as RDF-XML in an OutputStream.
     *
     * @return an OutputStream of RDF-XML
     * @throws MobiOntologyException If an error occurs while parsing
     */
    OutputStream asRdfXml() throws MobiOntologyException;

    /**
     * Returns the Ontology as OWL-XML in an OutputStream.
     *
     * @return an OutputStream of OWL-XML
     * @throws MobiOntologyException If an error occurs while parsing
     */
    OutputStream asOwlXml() throws MobiOntologyException;

    /**
     * Returns the Ontology as TURTLE written to the given OutputStream.
     *
     * @param outputStream The outputStream to write the TURTLE to
     * @return the OutputStream that was written to
     * @throws MobiOntologyException If an error occurs while parsing
     */
    OutputStream asTurtle(OutputStream outputStream) throws MobiOntologyException;

    /**
     * Returns the Ontology as RDF-XML written to the given OutputStream.
     *
     * @param outputStream The outputStream to write the RDF-XML to
     * @return the OutputStream that was written to
     * @throws MobiOntologyException If an error occurs while parsing
     */

    OutputStream asRdfXml(OutputStream outputStream) throws MobiOntologyException;

    /**
     * Returns the Ontology as OWL-XML written to the given OutputStream.
     *
     * @param outputStream The outputStream to write the OWL-XML to
     * @return the OutputStream that was written to
     * @throws MobiOntologyException If an error occurs while parsing
     */
    OutputStream asOwlXml(OutputStream outputStream) throws MobiOntologyException;

    /**
     * Returns the Ontology as JSON-LD in an OutputStream.
     *
     * @param skolemize Whether or not blank node ids should be skolemized before rendering
     * @return an OutputStream of JSON-LD
     * @throws MobiOntologyException If an error occurs while parsing
     */
    OutputStream asJsonLD(boolean skolemize) throws MobiOntologyException;

    /**
     * Returns the Ontology as JSON-LD written to the given OutputStream.
     *
     * @param skolemize Whether or not blank node ids should be skolemized before rendering
     * @param outputStream The outputStream to write the JSON-LD to
     * @return the OutputStream that was written to
     * @throws MobiOntologyException If an error occurs while parsing
     */
    OutputStream asJsonLD(boolean skolemize, OutputStream outputStream) throws MobiOntologyException;

    /**
     * Returns the OntologyID that describes the Ontology IRI, Version IRI,
     * and Ontology identifier. Note: If the serialized ontology contains an
     * Ontology IRI or Version IRI, it must match the Ontology and Version IRIs in
     * this OntologyId object.
     *
     * @return the OntologyID that describes the Ontology IRI, Version IRI,
     * and Ontology identifier
     */
    OntologyId getOntologyId();

    /**
     * Returns the set of IRIs of unloadable imported ontologies.  The set is accumulated during loading the
     * ontology from an ontology document or an ontology IRI.
     *
     * @return set of IRIs
     */
    Set<IRI> getUnloadableImportIRIs();

    /**
     * Gets the set of loaded ontologies that this ontology is related to via the reflexive transitive closure
     * of the directlyImports relation as defined in Section 3.4 of the OWL 2 Structural Specification.
     *
     * <p>Note: The import closure of an ontology O is a set containing O and all the ontologies that O imports.
     * The import closure of O SHOULD NOT contain ontologies O1 and O2 such that O1 and O2
     * are different ontology versions
     * from the same ontology series, or O1 contains an ontology annotation owl:incompatibleWith with
     * the value equal to either
     * the ontology IRI or the version IRI of O2.</p>
     *
     * @return set of ontologies
     */
    Set<Ontology> getImportsClosure();

    /**
     * Gets the set of IRIs for directly imported ontologies of this ontology.
     *
     * @return set of ontology IRIs
     */
    Set<IRI> getImportedOntologyIRIs();

    /**
     * Gets the set of IRIs that are annotated with owl:deprecated true within this ontology.
     *
     * @return set of ontology deprecated IRIs
     */
    Set<IRI> getDeprecatedIRIs();

    /**
     * Gets the ontology annotations, excluding annotations for other objects such as classes and entities.
     *
     * @return ontology annotations
     */
    Set<Annotation> getOntologyAnnotations();

    /**
     * Gets all the annotations in the ontology, excluding ontology annotations, annotations for other objects such
     * as classes and entities.
     *
     * @return ontology annotations
     */
    Set<Annotation> getAllAnnotations();

    /**
     * Gets all the annotation properties defined in the ontology.
     *
     * @return ontology annotation properties
     */
    Set<AnnotationProperty> getAllAnnotationProperties();

    /**
     * Determines if the class iri is found in the ontology.
     *
     * @param iri the IRI of the class
     * @return true if the class is in the ontology; otherwise, false
     */
    boolean containsClass(IRI iri);

    /**
     * Gets all classes explicitly defined within the ontology (excluding imports).
     *
     * @return A {@link Set} of {@link OClass} objects representing defined classes in the ontology
     */
    Set<OClass> getAllClasses();

    /**
     * Attempts to get all of the object properties (including imports) that can be set on the class with the specified
     * IRI in the ontology.
     *
     * @param iri the IRI of the class
     * @return a {@link Set} of all class object properties
     */
    Set<ObjectProperty> getAllClassObjectProperties(IRI iri);

    /**
     * Attempts to get all of the object properties that have no domain set.
     *
     * @return a {@link Set} of all object properties without a domain
     */
    Set<ObjectProperty> getAllNoDomainObjectProperties();

    /**
     * Attempts to get all of the data properties (including imports) that can be set on the class with the specified
     * IRI in the ontology.
     *
     * @param iri the IRI of the class
     * @return a {@link Set} of all class data properties
     */
    Set<DataProperty> getAllClassDataProperties(IRI iri);

    /**
     * Attempts to get all of the data properties that have no domain set.
     *
     * @return a {@link Set} of all data properties without a domain
     */
    Set<DataProperty> getAllNoDomainDataProperties();

    Set<Datatype> getAllDatatypes();

    /**
     * Gets all object properties explicitly defined within the ontology (excluding imports).
     *
     * @return A {@link Set} of {@link ObjectProperty} objects representing defined object properties in the ontology
     */
    Set<ObjectProperty> getAllObjectProperties();

    /**
     * Attempts to get a specific object property in the ontology by its IRI.
     *
     * @param iri the IRI of an object property
     * @return an {@link Optional} with the {@link ObjectProperty} if found
     */
    Optional<ObjectProperty> getObjectProperty(IRI iri);

    /**
     * Retrieves a {@link Set} of Resources corresponding to the range of the passed object property within the
     * ontology. Set will be empty if the object property cannot be found in the ontology, has no ranges set, or if none
     * of the ranges can be represented as a Resource.
     *
     * @param objectProperty an object property from the ontology
     * @return a {@link Set} of Resources representing all the range values of the object property
     */
    Set<Resource> getObjectPropertyRange(ObjectProperty objectProperty);

    /**
     * Gets all data properties explicitly defined within the ontology (excluding imports).
     *
     * @return A {@link Set} of {@link DataProperty} objects representing defined data properties in the ontology
     */
    Set<DataProperty> getAllDataProperties();

    /**
     * Attempts to get a specific data property in the ontology by its IRI.
     *
     * @param iri the IRI of a data property
     * @return an Optional with the data property if found
     */
    Optional<DataProperty> getDataProperty(IRI iri);

    /**
     * Retrieves a {@link Set} of Resources corresponding to the range of the passed data property within the ontology.
     * Set will be empty if the data property cannot be found in the ontology, has no ranges set, or if none of the
     * ranges can be represented as a Resource.
     *
     * @param dataProperty a data property from the ontology
     * @return a {@link Set} of {@link Resource}s representing all the range values of the data property
     */
    Set<Resource> getDataPropertyRange(DataProperty dataProperty);

    /**
     * Retrieves a {@link Set} of all Individuals explicitly defined in the ontology.
     *
     * @return a {@link Set} of all {@link Individual}s in the {@link Ontology}
     */
    Set<Individual> getAllIndividuals();

    /**
     * Searches for all explicitly defined individuals of a particular class or any sub-classes of the provided class.
     *
     * @param classIRI The {@link IRI} of the class of individuals to find.
     * @return The {@link Set} of {@link Individual}s.
     */
    Set<Individual> getIndividualsOfType(IRI classIRI);

    /**
     * Searches for all explicitly defined individuals of a particular class or any sub-classes of the provided class.
     *
     * @param clazz The {@link OClass} of individuals to find.
     * @return The {@link Set} of {@link Individual}s.
     */
    Set<Individual> getIndividualsOfType(OClass clazz);

    /**
     * Gets the subClassOf relationships for classes in the Ontology. The parents will be OWL Classes and the
     * children will be all OWL Classes that are direct subclasses.
     *
     * @param vf A {@link ValueFactory} for creating the hierarchy
     * @param mf A {@link ModelFactory} for creating the hierarchy
     * @return a {@link Hierarchy} of Class {@link IRI IRIs} to Class {@link IRI IRIs}.
     */
    Hierarchy getSubClassesOf(ValueFactory vf, ModelFactory mf);

    /**
     * Gets the subClassOf relationships for a particular {@link IRI} in the {@link Ontology}. It will provide
     * <em>all</em> classes that can be traced back to the provided class IRI, even if nested.
     *
     * @param iri The {@link IRI} of the class for which you want the list of subclasses.
     * @return a {@link Set} with the {@link IRI IRIs} of the subclasses
     */
    Set<IRI> getSubClassesFor(IRI iri);

    /**
     * Gets the subPropertyOf relationships for a particular {@link IRI} in the {@link Ontology}. It will provide
     * <em>all</em> properties that can be traced back to the provided property IRI, even if nested.
     *
     * @param iri The {@link IRI} of the property for which you want the list of subproperties.
     * @return a {@link Set} with the {@link IRI IRIs} of the subproperties
     */
    Set<IRI> getSubPropertiesFor(IRI iri);

    /**
     * Gets the subPropertyOf relationships for datatype properties in the Ontology. The parents will be OWL
     * DatatypeProperties and the children will be all OWL DatatypeProperties that are direct subproperties.
     *
     * @param vf A {@link ValueFactory} for creating the hierarchy
     * @param mf A {@link ModelFactory} for creating the hierarchy
     * @return a {@link Hierarchy} of DatatypeProperty {@link IRI IRIs} to DatatypeProperty {@link IRI IRIs}.
     */
    Hierarchy getSubDatatypePropertiesOf(ValueFactory vf, ModelFactory mf);

    /**
     * Gets the subPropertyOf relationships for annotation properties in the Ontology. The parents will be OWL
     * AnnotationProperties and the children will be all OWL AnnotationProperties that are direct subproperties.
     *
     * @param vf A {@link ValueFactory} for creating the hierarchy
     * @param mf A {@link ModelFactory} for creating the hierarchy
     * @return a {@link Hierarchy} of AnnotationProperty {@link IRI IRIs} to AnnotationProperty {@link IRI IRIs}.
     */
    Hierarchy getSubAnnotationPropertiesOf(ValueFactory vf, ModelFactory mf);

    /**
     * Gets the subPropertyOf relationships for object properties in the Ontology. The parents will be OWL
     * ObjectProperties and the children will be all OWL ObjectProperties that are direct subproperties.
     *
     * @param vf A {@link ValueFactory} for creating the hierarchy
     * @param mf A {@link ModelFactory} for creating the hierarchy
     * @return a {@link Hierarchy} of ObjectProperty {@link IRI IRIs} to ObjectProperty {@link IRI IRIs}.
     */
    Hierarchy getSubObjectPropertiesOf(ValueFactory vf, ModelFactory mf);

    /**
     * Gets the classes with individuals in the Ontology. The parents will be OWL Classes and the children will be all
     * instances of the classes directly.
     *
     * @param vf A {@link ValueFactory} for creating the hierarchy
     * @param mf A {@link ModelFactory} for creating the hierarchy
     * @return a {@link Hierarchy} of Class {@link IRI IRIs} to individual {@link IRI IRIs}.
     */
    Hierarchy getClassesWithIndividuals(ValueFactory vf, ModelFactory mf);

    /**
     * Gets the entity usages for the provided Resource in the Ontology.
     *
     * @param entity the Resource for the entity you want to get the usages of.
     * @return a {@link TupleQueryResult} with the query results.
     */
    TupleQueryResult getEntityUsages(Resource entity);

    /**
     * Constructs the entity usages for the provided Resource in the Ontology.
     *
     * @param entity the Resource for the entity you want to get the usages of.
     * @return a {@link Model} with the constructed statements.
     */
    Model constructEntityUsages(Resource entity, ModelFactory modelFactory);

    /**
     * Gets the concept relationships in the Ontology. The parents will be instances of skos:Concept or a subclass and
     * the children will be instances of skos:Concept or a subclass that have a skos:broader, skos:broaderMatch, or
     * skos:broaderTransitive property or are the object of a skos:narrower, skos:narrowerMatch, or
     * skos:narrowerTransitive property.
     *
     * @param vf A {@link ValueFactory} for creating the hierarchy
     * @param mf A {@link ModelFactory} for creating the hierarchy
     * @return a {@link Hierarchy} of Concept {@link IRI IRIs} to Concept {@link IRI IRIs}.
     */
    Hierarchy getConceptRelationships(ValueFactory vf, ModelFactory mf);

    /**
     * Gets the concept scheme relationships in the Ontology. The parents will be instances of skos:ConceptScheme or
     * a subclass and the children are instances of skos:Concept or a subclass that have a skos:inScheme or
     * skos:topConceptOf property or are the object of a skos:hasTopConcept property.
     *
     * @param vf A {@link ValueFactory} for creating the hierarchy
     * @param mf A {@link ModelFactory} for creating the hierarchy
     * @return a {@link Hierarchy} of Concept Scheme {@link IRI IRIs} to Concept {@link IRI IRIs}.
     */
    Hierarchy getConceptSchemeRelationships(ValueFactory vf, ModelFactory mf);

    /**
     * Searches the Ontology using the provided searchText.
     *
     * @param searchText the String for the text you want to search for in the Ontology.
     * @return a Set with the query results.
     */
    TupleQueryResult getSearchResults(String searchText, ValueFactory valueFactory);

    /**
     * Searches the Ontology & its import closures using the provided Sparql query.
     *
     * @param queryString the Sparql query string you want to execute.
     * @param includeImports include data from ontology imports when querying
     * @return a Tuple Set with the query results.
     */
    TupleQueryResult getTupleQueryResults(String queryString, boolean includeImports);

    /**
     * Searches the Ontology & its import closures using the provided SPARQL query.
     *
     * @param queryString the Sparql query string you want to execute.
     * @param includeImports include data from ontology imports when querying
     * @return a model with the query results.
     */
    Model getGraphQueryResults(String queryString, boolean includeImports, ModelFactory modelFactory);

    /**
     * Compares two SimpleOntology objects by their resource ids (ontologyId) and RDF model of the ontology objects,
     * and returns true if the resource ids are equal and their RDF models are isomorphic.
     *
     * <p>Two models are considered isomorphic if for each of the graphs in one model, an isomorphic graph exists in the
     * other model, and the context identifiers of these graphs are either identical or (in the case of blank nodes)
     * map 1:1 on each other.  RDF graphs are isomorphic graphs if statements from one graphs can be mapped 1:1 on to
     * statements in the other graphs. In this mapping, blank nodes are not considered mapped when having an identical
     * internal id, but are mapped from one graph to the other by looking at the statements in which the blank nodes
     * occur.</p>
     *
     * <p>Note: Depending on the size of the models, this can be an expensive operation.</p>
     *
     * @return true if the resource ids are equal and their RDF models are isomorphic.
     */
    boolean equals(Object obj);

    int hashCode();
}
