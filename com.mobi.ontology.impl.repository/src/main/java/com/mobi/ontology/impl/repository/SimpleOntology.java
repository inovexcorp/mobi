package com.mobi.ontology.impl.repository;

/*-
 * #%L
 * com.mobi.ontology.impl.repository
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

import com.google.common.collect.Iterables;
import com.mobi.catalog.api.builder.Difference;
import com.mobi.dataset.api.DatasetConnection;
import com.mobi.dataset.api.DatasetManager;
import com.mobi.exception.MobiException;
import com.mobi.ontology.core.api.Annotation;
import com.mobi.ontology.core.api.AnnotationProperty;
import com.mobi.ontology.core.api.DataProperty;
import com.mobi.ontology.core.api.Datatype;
import com.mobi.ontology.core.api.Hierarchy;
import com.mobi.ontology.core.api.Individual;
import com.mobi.ontology.core.api.OClass;
import com.mobi.ontology.core.api.ObjectProperty;
import com.mobi.ontology.core.api.Ontology;
import com.mobi.ontology.core.api.OntologyId;
import com.mobi.ontology.core.api.OntologyManager;
import com.mobi.ontology.core.utils.MobiOntologyException;
import com.mobi.ontology.utils.OntologyModels;
import com.mobi.ontology.utils.cache.ImportsResolver;
import com.mobi.persistence.utils.Bindings;
import com.mobi.persistence.utils.QueryResults;
import com.mobi.persistence.utils.RepositoryResults;
import com.mobi.persistence.utils.ResourceUtils;
import com.mobi.persistence.utils.api.BNodeService;
import com.mobi.persistence.utils.api.SesameTransformer;
import com.mobi.query.TupleQueryResult;
import com.mobi.query.api.Binding;
import com.mobi.query.api.GraphQuery;
import com.mobi.query.api.TupleQuery;
import com.mobi.rdf.api.BNode;
import com.mobi.rdf.api.IRI;
import com.mobi.rdf.api.Literal;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ModelFactory;
import com.mobi.rdf.api.Resource;
import com.mobi.rdf.api.Statement;
import com.mobi.rdf.api.Value;
import com.mobi.rdf.api.ValueFactory;
import com.mobi.repository.api.Repository;
import com.mobi.repository.api.RepositoryConnection;
import org.apache.commons.io.IOUtils;
import org.eclipse.rdf4j.model.vocabulary.OWL;
import org.eclipse.rdf4j.model.vocabulary.RDF;
import org.eclipse.rdf4j.model.vocabulary.RDFS;
import org.eclipse.rdf4j.model.vocabulary.SKOS;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFHandler;
import org.eclipse.rdf4j.rio.RDFHandlerException;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.WriterConfig;
import org.eclipse.rdf4j.rio.helpers.BufferedGroupingRDFHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import javax.annotation.Nullable;

public class SimpleOntology implements Ontology {

    private static final Logger LOG = LoggerFactory.getLogger(SimpleOntology.class);

    private Repository repository;
    private OntologyId ontologyId;
    private DatasetManager datasetManager;
    private OntologyManager ontologyManager;
    private ImportsResolver importsResolver;
    private ModelFactory mf;
    private ValueFactory vf;
    private SesameTransformer transformer;
    private BNodeService bNodeService;
    private IRI datasetIRI;
    private Set<Resource> importsClosure;
    private Set<Resource> unresolvedImports;
    private Difference difference;

    private static final String DEFAULT_DS_NAMESPACE = "http://mobi.com/dataset/";
    private static final String SYSTEM_DEFAULT_NG_SUFFIX = "_system_dng";
    private static final String UNRESOLVED_IRI_STRING = "http://mobi.com/ontologies/graph#unresolved";

    private static final String GET_SUB_CLASSES_OF;
    private static final String GET_CLASSES_FOR;
    private static final String GET_PROPERTIES_FOR;
    private static final String GET_SUB_DATATYPE_PROPERTIES_OF;
    private static final String GET_SUB_OBJECT_PROPERTIES_OF;
    private static final String GET_CLASSES_WITH_INDIVIDUALS;
    private static final String SELECT_ENTITY_USAGES;
    private static final String CONSTRUCT_ENTITY_USAGES;
    private static final String GET_CONCEPT_RELATIONSHIPS;
    private static final String GET_CONCEPT_SCHEME_RELATIONSHIPS;
    private static final String GET_SEARCH_RESULTS;
    private static final String GET_SUB_ANNOTATION_PROPERTIES_OF;
    private static final String GET_CLASS_DATA_PROPERTIES;
    private static final String GET_CLASS_OBJECT_PROPERTIES;
    private static final String GET_ALL_ANNOTATIONS;
    private static final String GET_ONTOLOGY_ANNOTATIONS;
    private static final String GET_INDIVIDUALS_OF_TYPE;
    private static final String ENTITY_BINDING = "entity";
    private static final String SEARCH_TEXT = "searchText";

    static {
        try {
            GET_SUB_CLASSES_OF = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-sub-classes-of.rq"),
                    "UTF-8"
            );
            GET_CLASSES_FOR = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-sub-classes-for.rq"),
                    "UTF-8"
            );
            GET_PROPERTIES_FOR = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-sub-properties-for.rq"),
                    "UTF-8"
            );
            GET_SUB_DATATYPE_PROPERTIES_OF = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-sub-datatype-properties-of.rq"),
                    "UTF-8"
            );
            GET_SUB_OBJECT_PROPERTIES_OF = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-sub-object-properties-of.rq"),
                    "UTF-8"
            );
            GET_CLASSES_WITH_INDIVIDUALS = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-classes-with-individuals.rq"),
                    "UTF-8"
            );
            SELECT_ENTITY_USAGES = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-entity-usages.rq"),
                    "UTF-8"
            );
            CONSTRUCT_ENTITY_USAGES = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/construct-entity-usages.rq"),
                    "UTF-8"
            );
            GET_CONCEPT_RELATIONSHIPS = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-concept-relationships.rq"),
                    "UTF-8"
            );
            GET_CONCEPT_SCHEME_RELATIONSHIPS = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-concept-scheme-relationships.rq"),
                    "UTF-8"
            );
            GET_SEARCH_RESULTS = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-search-results.rq"),
                    "UTF-8"
            );
            GET_SUB_ANNOTATION_PROPERTIES_OF = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-sub-annotation-properties-of.rq"),
                    "UTF-8"
            );
            GET_CLASS_DATA_PROPERTIES = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-class-data-properties.rq"),
                    "UTF-8"
            );
            GET_CLASS_OBJECT_PROPERTIES = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-class-object-properties.rq"),
                    "UTF-8"
            );
            GET_ALL_ANNOTATIONS = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-all-annotations.rq"),
                    "UTF-8"
            );
            GET_ONTOLOGY_ANNOTATIONS = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-ontology-annotations.rq"),
                    "UTF-8"
            );
            GET_INDIVIDUALS_OF_TYPE = IOUtils.toString(
                    SimpleOntologyManager.class.getResourceAsStream("/get-individuals-of-type.rq"),
                    "UTF-8"
            );
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    public SimpleOntology(Model model, Repository cacheRepo, OntologyManager ontologyManager,
                          DatasetManager datasetManager, ImportsResolver importsResolver, SesameTransformer transformer,
                          BNodeService bNodeService, ValueFactory vf, ModelFactory mf) {
        this.mf = mf;
        this.vf = vf;
        this.datasetIRI = OntologyModels.findFirstOntologyIRI(model, vf)
                .orElseThrow(() -> new IllegalStateException("Ontology must have an identifier."));
        this.repository = cacheRepo;
        this.ontologyManager = ontologyManager;
        this.datasetManager = datasetManager;
        this.importsResolver = importsResolver;
        this.transformer = transformer;
        this.bNodeService = bNodeService;

        this.ontologyId = ontologyManager.createOntologyId(model);
        Map<String, Set<Resource>> imports = importsResolver.loadOntologyIntoCache(this.datasetIRI, null, model,
                repository, ontologyManager);
        this.importsClosure = imports.get("closure");
        this.unresolvedImports = imports.get("unresolved");
    }

    // If exists in catalog but ontology and imports don't exist in cache yet
    public SimpleOntology(String recordCommitKey, Model model, Repository cacheRepo, OntologyManager ontologyManager,
                          DatasetManager datasetManager, ImportsResolver importsResolver, SesameTransformer transformer,
                          BNodeService bNodeService, ValueFactory vf, ModelFactory mf) {
        this.mf = mf;
        this.vf = vf;
        this.datasetIRI = createDatasetIRIFromKey(recordCommitKey);
        this.repository = cacheRepo;
        this.ontologyManager = ontologyManager;
        this.datasetManager = datasetManager;
        this.importsResolver = importsResolver;
        this.transformer = transformer;
        this.bNodeService = bNodeService;

        this.ontologyId = ontologyManager.createOntologyId(model);
        Resource ontologyIRI = OntologyModels.findFirstOntologyIRI(model, vf)
                .orElseThrow(() -> new IllegalStateException("Ontology must have an identifier."));
        Map<String, Set<Resource>> imports = importsResolver.loadOntologyIntoCache(ontologyIRI, recordCommitKey, model,
                repository, ontologyManager);
        this.importsClosure = imports.get("closure");
        this.unresolvedImports = imports.get("unresolved");
    }

    // If it already exists in cache
    public SimpleOntology(String recordCommitKey, Repository cacheRepo, OntologyManager ontologyManager,
                          DatasetManager datasetManager, ImportsResolver importsResolver, SesameTransformer transformer,
                          BNodeService bNodeService, ValueFactory vf, ModelFactory mf) {
        this.mf = mf;
        this.vf = vf;
        this.datasetIRI = createDatasetIRIFromKey(recordCommitKey);
        this.repository = cacheRepo;
        this.ontologyManager = ontologyManager;
        this.datasetManager = datasetManager;
        this.importsResolver = importsResolver;
        this.transformer = transformer;
        this.bNodeService = bNodeService;

        importsClosure = new HashSet<>();
        unresolvedImports = new HashSet<>();

        try (DatasetConnection conn = getDatasetConnection()) {
            List<Statement> imports = RepositoryResults.asList(conn.getStatements(datasetIRI,
                    vf.createIRI(OWL.IMPORTS.stringValue()), null, datasetIRI));
            imports.forEach(imported -> importsClosure.add((Resource) imported.getObject()));
            imports = RepositoryResults.asList(conn.getStatements(datasetIRI,
                    vf.createIRI(UNRESOLVED_IRI_STRING), null, datasetIRI));
            imports.forEach(imported -> unresolvedImports.add((Resource) imported.getObject()));

            Model model = RepositoryResults.asModelNoContext(conn.getStatements(
                    null, null, null,  conn.getSystemDefaultNamedGraph()), mf);
            this.ontologyId = ontologyManager.createOntologyId(model);
        }
    }

    private SimpleOntology(IRI datasetIRI, Model model, Repository cacheRepo, OntologyManager ontologyManager,
                           DatasetManager datasetManager, ImportsResolver importsResolver,
                           SesameTransformer transformer, BNodeService bNodeService, ValueFactory vf, ModelFactory mf) {
        this.mf = mf;
        this.vf = vf;
        this.datasetIRI = datasetIRI;
        this.repository = cacheRepo;
        this.ontologyManager = ontologyManager;
        this.datasetManager = datasetManager;
        this.importsResolver = importsResolver;
        this.transformer = transformer;
        this.bNodeService = bNodeService;

        this.ontologyId = ontologyManager.createOntologyId(model);

        try (RepositoryConnection cacheConn = cacheRepo.getConnection()) {
            if (!cacheConn.containsContext(datasetIRI)) {
                Map<String, Set<Resource>> imports = importsResolver.loadOntologyIntoCache(datasetIRI, null, model,
                        repository, ontologyManager);
                this.importsClosure = imports.get("closure");
                this.unresolvedImports = imports.get("unresolved");
            } else {
                this.importsClosure = new HashSet<>();
                this.unresolvedImports = new HashSet<>();
                RepositoryResults.asList(cacheConn.getStatements(datasetIRI,
                        vf.createIRI(OWL.IMPORTS.stringValue()), null, datasetIRI))
                        .stream()
                        .map(Statement::getObject)
                        .map(imported -> (IRI) imported)
                        .forEach(importsClosure::add);
                RepositoryResults.asList(cacheConn.getStatements(datasetIRI,
                        vf.createIRI(UNRESOLVED_IRI_STRING), null, datasetIRI))
                        .stream()
                        .map(Statement::getObject)
                        .map(imported -> (IRI) imported)
                        .forEach(unresolvedImports::add);
            }

        }
    }

    public void setDifference(Difference difference) {
        this.difference = difference;
    }

    @Override
    public Model asModel(ModelFactory factory) throws MobiOntologyException {
        try (DatasetConnection conn = getDatasetConnection()) {
            Model model = RepositoryResults.asModelNoContext(
                    conn.getStatements(null, null, null, conn.getSystemDefaultNamedGraph()), factory);
            undoApplyDifferenceIfPresent(conn);
            return model;
        }
    }

    @Override
    public OutputStream asTurtle() throws MobiOntologyException {
        return getOntologyOutputStream(RDFFormat.TURTLE);
    }

    @Override
    public OutputStream asRdfXml() throws MobiOntologyException {
        return getOntologyOutputStream(RDFFormat.RDFXML);
    }

    @Override
    public OutputStream asOwlXml() throws MobiOntologyException { // TODO:!!!!!! OWLAPIRDFFormat has OWLXML.....
        return getOntologyOutputStream(RDFFormat.RDFXML);
    }

    @Override
    public OutputStream asJsonLD(boolean skolemize) throws MobiOntologyException {
        OutputStream outputStream = new ByteArrayOutputStream();
        WriterConfig config = new WriterConfig();
        try {
            org.eclipse.rdf4j.model.Model sesameModel = transformer.sesameModel(asModel(mf));
            if (skolemize) {
                sesameModel = transformer.sesameModel(bNodeService.skolemize(transformer.mobiModel(sesameModel)));
            }
            Rio.write(sesameModel, outputStream, RDFFormat.JSONLD, config);
        } catch (RDFHandlerException e) {
            throw new MobiOntologyException("Error while parsing Ontology.");
        }
        return outputStream;
    }

    private OutputStream getOntologyOutputStream(RDFFormat format) {
        OutputStream outputStream = new ByteArrayOutputStream();
        try {
            RDFHandler rdfWriter = new BufferedGroupingRDFHandler(Rio.createWriter(format, outputStream));
            org.eclipse.rdf4j.model.Model sesameModel = transformer.sesameModel(asModel(mf));
            Rio.write(sesameModel, rdfWriter);
        } catch (RDFHandlerException e) {
            throw new MobiOntologyException("Error while writing Ontology.");
        }
        return outputStream;
    }

    @Override
    public OntologyId getOntologyId() {
        return ontologyId;
    }

    @Override
    public Set<IRI> getUnloadableImportIRIs() {
        return unresolvedImports.stream().map(imported -> (IRI) imported).collect(Collectors.toSet());
    }

    @Override
    public Set<Ontology> getImportsClosure() {
        try (DatasetConnection conn = getDatasetConnection()) {
            Resource sdNg = conn.getSystemDefaultNamedGraph();
            Set<Ontology> closure = new HashSet<>();
            conn.getDefaultNamedGraphs().forEach(ng -> {
                if (ng.stringValue().equals(sdNg.stringValue())) {
                    closure.add(this);
                } else {
                    IRI ontIRI = vf.createIRI(ng.stringValue().substring(0, ng.stringValue()
                            .lastIndexOf(SYSTEM_DEFAULT_NG_SUFFIX)));
                    IRI ontDatasetIRI = importsResolver.getDatasetIRI(ontIRI, ontologyManager);
                    Model importModel = RepositoryResults.asModel(conn.getStatements(null, null, null, ng), mf);
                    closure.add(new SimpleOntology(ontDatasetIRI, importModel, repository, ontologyManager,
                            datasetManager, importsResolver, transformer, bNodeService, vf, mf));
                }
            });
            undoApplyDifferenceIfPresent(conn);
            return closure;
        }
    }

    @Override
    public Set<IRI> getImportedOntologyIRIs() {
        return importsClosure.stream().map(imported -> (IRI) imported).collect(Collectors.toSet());
    }

    @Override
    public Set<Annotation> getOntologyAnnotations() {
        IRI ontologyIRI = ontologyId.getOntologyIRI().orElse((IRI) ontologyId.getOntologyIdentifier());
        return getAnnotationSet(runQueryOnOntology(String.format(GET_ONTOLOGY_ANNOTATIONS,
                ontologyIRI.stringValue()), null, "getOntologyAnnotations()", false));
    }

    @Override
    public Set<Annotation> getAllAnnotations() {
        return getAnnotationSet(runQueryOnOntology(GET_ALL_ANNOTATIONS, null,
                "getAllAnnotations()", false));
    }

    @Override
    public Set<AnnotationProperty> getAllAnnotationProperties() {
        try (DatasetConnection conn = getDatasetConnection()) {
            List<Statement> statements = RepositoryResults.asList(conn.getStatements(null,
                    vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.ANNOTATIONPROPERTY.stringValue())));
            Set<AnnotationProperty> annotationProperties = statements.stream()
                    .map(Statement::getSubject)
                    .map(subject -> new SimpleAnnotationProperty((IRI) subject))
                    .collect(Collectors.toSet());
            undoApplyDifferenceIfPresent(conn);
            return annotationProperties;
        }
    }

    @Override
    public boolean containsClass(IRI iri) {
        try (DatasetConnection conn = getDatasetConnection()) {
            boolean contains = conn.contains(iri, vf.createIRI(RDF.TYPE.stringValue()),
                    vf.createIRI(OWL.CLASS.stringValue()));
            undoApplyDifferenceIfPresent(conn);
            return contains;
        }
    }

    @Override
    public Set<OClass> getAllClasses() {
        try (DatasetConnection conn = getDatasetConnection()) {
            List<Statement> statements = RepositoryResults.asList(conn.getStatements(null,
                    vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.CLASS.stringValue())));
            Set<OClass> oClasses = statements.stream()
                    .map(Statement::getSubject)
                    .filter(subject -> subject instanceof IRI)
                    .map(subject -> new SimpleClass((IRI) subject))
                    .collect(Collectors.toSet());
            undoApplyDifferenceIfPresent(conn);
            return oClasses;
        }
    }

    @Override
    public Set<ObjectProperty> getAllClassObjectProperties(IRI iri) {
        return getIRISet(runQueryOnOntology(String.format(GET_CLASS_OBJECT_PROPERTIES, iri.stringValue()), null,
                "getAllClassObjectProperties(iri)", true))
                .stream()
                .map(SimpleObjectProperty::new)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<ObjectProperty> getAllNoDomainObjectProperties() {
        return new HashSet<>();
    }

    @Override
    public Set<DataProperty> getAllClassDataProperties(IRI iri) {
        return getIRISet(runQueryOnOntology(String.format(GET_CLASS_DATA_PROPERTIES, iri.stringValue()), null,
                "getAllClassDataProperties(iri)", true))
                .stream()
                .map(SimpleDataProperty::new)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<DataProperty> getAllNoDomainDataProperties() {
        return new HashSet<>();
    }

    @Override
    public Set<Datatype> getAllDatatypes() {
        try (DatasetConnection conn = getDatasetConnection()) {
            List<Statement> statements = RepositoryResults.asList(conn.getStatements(null,null, null));
            Set<Datatype> datatypes = statements.stream()
                    .map(Statement::getObject)
                    .filter(s -> s instanceof Literal)
                    .map(literal -> ((Literal) literal).getDatatype())
                    .map(SimpleDatatype::new)
                    .collect(Collectors.toSet());
            undoApplyDifferenceIfPresent(conn);
            return datatypes;
        }
    }

    @Override
    public Set<ObjectProperty> getAllObjectProperties() {
        try (DatasetConnection conn = getDatasetConnection()) {
            List<Statement> statements = RepositoryResults.asList(conn.getStatements(null,
                    vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.OBJECTPROPERTY.stringValue())));
            Set<ObjectProperty> objectProperties = statements.stream()
                    .map(Statement::getSubject)
                    .map(subject -> new SimpleObjectProperty((IRI) subject))
                    .collect(Collectors.toSet());
            undoApplyDifferenceIfPresent(conn);
            return objectProperties;
        }
    }

    @Override
    public Optional<ObjectProperty> getObjectProperty(IRI iri) {
        try (DatasetConnection conn = getDatasetConnection()) {
            List<Statement> statements = RepositoryResults.asList(conn.getStatements(iri,
                    vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.OBJECTPROPERTY.stringValue())));
            if (statements.size() > 0) {
                Optional<ObjectProperty> objPropOpt = Optional.of(
                        new SimpleObjectProperty((IRI) statements.get(0).getSubject()));
                undoApplyDifferenceIfPresent(conn);
                return objPropOpt;
            }
            undoApplyDifferenceIfPresent(conn);
        }
        return Optional.empty();
    }

    @Override
    public Set<Resource> getObjectPropertyRange(ObjectProperty objectProperty) {
        try (DatasetConnection conn = getDatasetConnection()) {
            List<Statement> statements = RepositoryResults.asList(conn.getStatements(objectProperty.getIRI(),
                    vf.createIRI(RDFS.RANGE.stringValue()), null));
            Set<Resource> resources = statements.stream()
                    .map(Statement::getObject)
                    .map(value -> (Resource) value)
                    .collect(Collectors.toSet());
            undoApplyDifferenceIfPresent(conn);
            return resources;
        }
    }

    @Override
    public Set<DataProperty> getAllDataProperties() {
        try (DatasetConnection conn = getDatasetConnection()) {
            List<Statement> statements = RepositoryResults.asList(conn.getStatements(null,
                    vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.DATATYPEPROPERTY.stringValue())));
            Set<DataProperty> dataProperties = statements.stream()
                    .map(Statement::getSubject)
                    .map(subject -> new SimpleDataProperty((IRI) subject))
                    .collect(Collectors.toSet());
            undoApplyDifferenceIfPresent(conn);
            return dataProperties;
        }
    }

    @Override
    public Optional<DataProperty> getDataProperty(IRI iri) {
        try (DatasetConnection conn = getDatasetConnection()) {
            List<Statement> statements = RepositoryResults.asList(conn.getStatements(iri,
                    vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.DATATYPEPROPERTY.stringValue())));
            if (statements.size() > 0) {
                Optional<DataProperty> dataPropOpt = Optional.of(
                        new SimpleDataProperty((IRI) statements.get(0).getSubject()));
                undoApplyDifferenceIfPresent(conn);
                return dataPropOpt;
            }
            undoApplyDifferenceIfPresent(conn);
        }
        return Optional.empty();
    }

    @Override
    public Set<Resource> getDataPropertyRange(DataProperty dataProperty) {
        try (DatasetConnection conn = getDatasetConnection()) {
            List<Statement> statements = RepositoryResults.asList(conn.getStatements(dataProperty.getIRI(),
                    vf.createIRI(RDFS.RANGE.stringValue()), null));
            Set<Resource> resources = statements.stream()
                    .map(Statement::getObject)
                    .map(value -> (Resource) value)
                    .collect(Collectors.toSet());
            undoApplyDifferenceIfPresent(conn);
            return resources;
        }
    }

    @Override
    public Set<Individual> getAllIndividuals() {
        // TODO: SKOS??
        try (DatasetConnection conn = getDatasetConnection()) {
            List<Statement> statements = RepositoryResults.asList(conn.getStatements(null,
                    vf.createIRI(RDF.TYPE.stringValue()), vf.createIRI(OWL.NAMEDINDIVIDUAL.stringValue())));
            Set<Individual> individuals = statements.stream()
                    .map(Statement::getSubject)
                    .map(subject -> new SimpleIndividual((IRI) subject))
                    .collect(Collectors.toSet());
            undoApplyDifferenceIfPresent(conn);
            individuals.addAll(getIndividualsOfType(vf.createIRI(SKOS.CONCEPT.stringValue())));
            return individuals;
        }
    }

    @Override
    public Set<Individual> getIndividualsOfType(IRI classIRI) {
        return getIRISet(runQueryOnOntology(String.format(GET_INDIVIDUALS_OF_TYPE, classIRI.stringValue()), null,
                "getIndividualsOfType(iri)", true))
                .stream()
                .map(SimpleIndividual::new)
                .collect(Collectors.toSet());
    }

    @Override
    public Set<Individual> getIndividualsOfType(OClass clazz) {
        return getIndividualsOfType(clazz.getIRI());
    }

    @Override
    public Hierarchy getSubClassesOf(ValueFactory vf, ModelFactory mf) {
        return getHierarchy(runQueryOnOntology(GET_SUB_CLASSES_OF, null, "getSubClassesOf(ontology)", true));
    }

    @Override
    public Set<IRI> getSubClassesFor(IRI iri) {
        return getIRISet(runQueryOnOntology(String.format(GET_CLASSES_FOR, iri.stringValue()), null,
                "getSubClassesFor(ontology, iri)", true));
    }

    @Override
    public Set<IRI> getSubPropertiesFor(IRI iri) {
        return getIRISet(runQueryOnOntology(String.format(GET_PROPERTIES_FOR, iri.stringValue()), null,
                "getSubPropertiesFor(ontology, iri)", true));
    }

    @Override
    public Hierarchy getSubDatatypePropertiesOf(ValueFactory vf, ModelFactory mf) {
        return getHierarchy(runQueryOnOntology(GET_SUB_DATATYPE_PROPERTIES_OF, null,
                "getSubDatatypePropertiesOf(ontology)", true));
    }

    @Override
    public Hierarchy getSubAnnotationPropertiesOf(ValueFactory vf, ModelFactory mf) {
        return getHierarchy(runQueryOnOntology(GET_SUB_ANNOTATION_PROPERTIES_OF, null,
                "getSubAnnotationPropertiesOf(ontology)", true));
    }

    @Override
    public Hierarchy getSubObjectPropertiesOf(ValueFactory vf, ModelFactory mf) {
        return getHierarchy(runQueryOnOntology(GET_SUB_OBJECT_PROPERTIES_OF, null,
                "getSubObjectPropertiesOf(ontology)", true));
    }

    @Override
    public Hierarchy getClassesWithIndividuals(ValueFactory vf, ModelFactory mf) {
        return getHierarchy(runQueryOnOntology(GET_CLASSES_WITH_INDIVIDUALS, null,
                "getClassesWithIndividuals(ontology)", true));
    }

    @Override
    public TupleQueryResult getEntityUsages(Resource entity) {
        return runQueryOnOntology(SELECT_ENTITY_USAGES, tupleQuery -> {
            tupleQuery.setBinding(ENTITY_BINDING, entity);
            return tupleQuery;
        }, "getEntityUsages(ontology, entity)", true);

    }

    @Override
    public Model constructEntityUsages(Resource entity, ModelFactory modelFactory) {
        long start = getStartTime();
        try (DatasetConnection conn = getDatasetConnection()) {
            GraphQuery query = conn.prepareGraphQuery(CONSTRUCT_ENTITY_USAGES);
            query.setBinding(ENTITY_BINDING, entity);
            Model model = QueryResults.asModel(query.evaluate(), modelFactory);
            undoApplyDifferenceIfPresent(conn);
            return model;
        } finally {
            logTrace("constructEntityUsages(entity, conn)", start);
        }

    }

    @Override
    public Hierarchy getConceptRelationships(ValueFactory vf, ModelFactory mf) {
        return getHierarchy(runQueryOnOntology(GET_CONCEPT_RELATIONSHIPS, null,
                "getConceptRelationships(ontology)", true));
    }

    @Override
    public Hierarchy getConceptSchemeRelationships(ValueFactory vf, ModelFactory mf) {
        return getHierarchy(runQueryOnOntology(GET_CONCEPT_SCHEME_RELATIONSHIPS, null,
                "getConceptSchemeRelationships(ontology)", true));
    }

    @Override
    public TupleQueryResult getSearchResults(String searchText, ValueFactory valueFactory) {
        return runQueryOnOntology(GET_SEARCH_RESULTS, tupleQuery -> {
            tupleQuery.setBinding(SEARCH_TEXT, valueFactory.createLiteral(searchText.toLowerCase()));
            return tupleQuery;
        }, "getSearchResults(ontology, searchText)", true);

    }

    @Override
    public TupleQueryResult getTupleQueryResults(String queryString, boolean includeImports) {
        return runQueryOnOntology(queryString, null,"getTupleQueryResults(ontology, queryString)", includeImports);
    }

    @Override
    public Model getGraphQueryResults(String queryString, boolean includeImports, ModelFactory modelFactory) {
        return runGraphQueryOnOntology(queryString, null, "getGraphQueryResults(ontology, queryString)", includeImports,
                modelFactory);
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }

        if (obj instanceof SimpleOntology) {
            SimpleOntology simpleOntology = (SimpleOntology) obj;
            OntologyId ontologyId = simpleOntology.getOntologyId();
            if (this.ontologyId.equals(ontologyId)) {
                return this.datasetIRI.equals(simpleOntology.datasetIRI);
            }
        }
        return false;
    }

    @Override
    public int hashCode() {
        return this.ontologyId.hashCode() + datasetIRI.hashCode();
    }

    /**
     * Executes the provided Graph query on the provided Ontology.
     *
     * @param queryString the query string that you wish to run.
     * @param addBinding  the binding to add to the query, if needed.
     * @param methodName  the name of the method to provide more accurate logging messages.
     * @return the results of the query as a model.
     */
    private Model runGraphQueryOnOntology(String queryString,
                                          @Nullable Function<GraphQuery, GraphQuery> addBinding,
                                          String methodName, boolean includeImports, ModelFactory modelFactory) {
        if (includeImports) {
            try (DatasetConnection conn = getDatasetConnection()) {
                Model model = runGraphQueryOnOntology(queryString, addBinding, methodName, conn, modelFactory);
                undoApplyDifferenceIfPresent(conn);
                return model;
            }
        } else {
            // TODO: ONLY QUERY SDNG && apply diff
            try (RepositoryConnection conn = repository.getConnection()) {
                return runGraphQueryOnOntology(queryString, addBinding, methodName, conn, modelFactory);
            }
        }
    }

    /**
     * Executes the provided Graph query on the provided RepositoryConnection.
     *
     * @param queryString the query string that you wish to run.
     * @param addBinding  the binding to add to the query, if needed.
     * @param methodName  the name of the method to provide more accurate logging messages.
     * @param conn        the {@link RepositoryConnection} to run the query against.
     * @return the results of the query as a model.
     */
    private Model runGraphQueryOnOntology(String queryString, @Nullable Function<GraphQuery, GraphQuery> addBinding,
                                          String methodName, RepositoryConnection conn, ModelFactory modelFactory) {
        long start = getStartTime();
        try {
            GraphQuery query = conn.prepareGraphQuery(queryString);
            if (addBinding != null) {
                query = addBinding.apply(query);
            }
            return QueryResults.asModel(query.evaluate(), modelFactory);
        } finally {
            logTrace(methodName, start);
        }
    }

    /**
     * TODO: FILL IN
     * @param queryString
     * @param addBinding
     * @param methodName
     * @param includeImports
     * @return
     */
    private TupleQueryResult runQueryOnOntology(String queryString,
                                                @Nullable Function<TupleQuery, TupleQuery> addBinding,
                                                String methodName, boolean includeImports) {
        if (includeImports) {
            try (DatasetConnection conn = getDatasetConnection()) {
                TupleQueryResult result = runQueryOnOntology(queryString, addBinding, methodName, conn);
                undoApplyDifferenceIfPresent(conn);
                return result;
            }
        } else {
            // TODO: QUERY ONLY QUERY SDNG... && apply diff
            try (RepositoryConnection conn = repository.getConnection()) {
                return runQueryOnOntology(queryString, addBinding, methodName, conn);
            }
        }
    }

    /**
     * Executes the provided query on the provided RepositoryConnection.
     *
     * @param queryString the query string that you wish to run.
     * @param addBinding  the binding to add to the query, if needed.
     * @param methodName  the name of the method to provide more accurate logging messages.
     * @param conn        the {@link RepositoryConnection} to run the query against.
     * @return the results of the query.
     */
    private TupleQueryResult runQueryOnOntology(String queryString,
                                                @Nullable Function<TupleQuery, TupleQuery> addBinding,
                                                String methodName, RepositoryConnection conn) {
        long start = getStartTime();
        try {
            TupleQuery query = conn.prepareTupleQuery(queryString);
            if (addBinding != null) {
                query = addBinding.apply(query);
            }
            return query.evaluateAndReturn();
        } finally {
            logTrace(methodName, start);
        }
    }

    /**
     * Uses the provided TupleQueryResult to construct a hierarchy of the entities provided. Each BindingSet in the Set
     * must have the parent set as the first binding and the child set as the second binding.
     *
     * @param tupleQueryResult the TupleQueryResult that contains the parent-child relationships for creating the
     *                         hierarchy.
     * @return a Hierarchy containing the hierarchy of the entities provided.
     */
    private Hierarchy getHierarchy(TupleQueryResult tupleQueryResult) {
        Hierarchy hierarchy = new Hierarchy(vf, mf);
        tupleQueryResult.forEach(queryResult -> {
            Value key = Iterables.get(queryResult, 0).getValue();
            Binding value = Iterables.get(queryResult, 1, null);
            if (!(key instanceof BNode) && key instanceof IRI) {
                hierarchy.addIRI((IRI) key);
                if (value != null && !(value.getValue() instanceof BNode) && value.getValue() instanceof IRI) {
                    hierarchy.addParentChild((IRI) key, (IRI) value.getValue());
                }
            }
        });
        return hierarchy;
    }

    /**
     * Uses the provided TupleQueryResult to construct a set of the entities provided.
     *
     * @param tupleQueryResult the TupleQueryResult that contains //TODO
     * @return a Hierarchy containing the hierarchy of the entities provided.
     */
    private Set<IRI> getIRISet(TupleQueryResult tupleQueryResult) {
        Set<IRI> iris = new HashSet<>();
        tupleQueryResult.forEach(r -> r.getBinding("s")
                .ifPresent(b -> iris.add(vf.createIRI(b.getValue().stringValue()))));
        return iris;
    }

    /**
     * Uses the provided TupleQueryResult to construct a set of the entities provided.
     *
     * @param tupleQueryResult the TupleQueryResult that contains //TODO
     * @return a Hierarchy containing the hierarchy of the entities provided.
     */
    private Set<Annotation> getAnnotationSet(TupleQueryResult tupleQueryResult) {
        Set<Annotation> annotations = new HashSet<>();
        tupleQueryResult.forEach(queryResult -> {
            Value prop = Bindings.requiredResource(queryResult, "prop");
            Value value = Bindings.requiredResource(queryResult, "value");
            if (!(prop instanceof BNode) && !(value instanceof BNode)) {
                annotations.add(new SimpleAnnotation(new SimpleAnnotationProperty((IRI) prop), value));
            }
        });
        return annotations;
    }

    private IRI createDatasetIRIFromKey(String key) {
        return vf.createIRI(DEFAULT_DS_NAMESPACE + ResourceUtils.encode(key));
    }

    private DatasetConnection getDatasetConnection() {
        DatasetConnection conn = datasetManager.getConnection(datasetIRI, repository.getConfig().id(), false);
        applyDifferenceIfPresent(conn);
        return conn;
    }

    private void applyDifferenceIfPresent(DatasetConnection conn) {
        if (difference != null) {
            conn.begin();
            conn.add(difference.getAdditions(), conn.getSystemDefaultNamedGraph());
            conn.remove(difference.getDeletions(), conn.getSystemDefaultNamedGraph());

            List<IRI> addedImports = difference.getAdditions().filter(null, vf.createIRI(OWL.IMPORTS.stringValue()),
                    null)
                    .stream()
                    .map(Statement::getObject)
                    .filter(iri -> iri instanceof IRI)
                    .map(iri -> (IRI) iri)
                    .collect(Collectors.toList());
            try (RepositoryConnection repoConn = repository.getConnection()) {
                addedImports.forEach(imported -> {
                    IRI importedDatasetIRI = importsResolver.getDatasetIRI(imported, ontologyManager);
                    IRI importedDatasetSdNgIRI = vf.createIRI(importedDatasetIRI.stringValue()
                            + SYSTEM_DEFAULT_NG_SUFFIX);
                    if (repoConn.containsContext(importedDatasetSdNgIRI)) {
                        Model importModel = RepositoryResults.asModel(repoConn.getStatements(null, null,
                                null, importedDatasetSdNgIRI), mf);
                        createTempImport(importedDatasetIRI, importModel, conn);
                    } else {
                        Optional<Model> localModel = importsResolver.retrieveOntologyLocal(imported, ontologyManager);
                        if (localModel.isPresent()) {
                            createTempImport(importedDatasetIRI, localModel.get(), conn);
                        } else {
                            Optional<Model> webModel = importsResolver.retrieveOntologyFromWeb(imported);
                            if (webModel.isPresent()) {
                                repoConn.add(webModel.get(), importedDatasetSdNgIRI);
                                createTempImport(importedDatasetIRI, webModel.get(), conn);
                            } else {
                                conn.add(datasetIRI, vf.createIRI(UNRESOLVED_IRI_STRING), imported, datasetIRI);
                            }
                        }
                    }
                });
            }

            List<IRI> removedImports = difference.getDeletions().filter(null, vf.createIRI(OWL.IMPORTS.stringValue()),
                    null)
                    .stream()
                    .map(Statement::getObject)
                    .filter(iri -> iri instanceof IRI)
                    .map(iri -> (IRI) iri)
                    .collect(Collectors.toList());
            removedImports.forEach(imported -> {
                IRI importDatasetIRI = vf.createIRI(
                        importsResolver.getDatasetIRI(imported, ontologyManager).stringValue()
                                + SYSTEM_DEFAULT_NG_SUFFIX);
                conn.removeGraph(importDatasetIRI);
                conn.remove(datasetIRI, vf.createIRI(OWL.IMPORTS.stringValue()), imported);
            });

        }
    }

    private void createTempImport(IRI importedDatasetIRI, Model model, DatasetConnection conn) {
        Ontology importedOntology = new SimpleOntology(importedDatasetIRI, model, repository,
                ontologyManager, datasetManager, importsResolver, transformer, bNodeService, vf, mf);
        importedOntology.getImportedOntologyIRIs().forEach(importedImport -> {
            conn.add(datasetIRI, vf.createIRI(OWL.IMPORTS.stringValue()), importedImport, datasetIRI);
            conn.addDefaultNamedGraph(
                    vf.createIRI(importsResolver.getDatasetIRI(importedImport, ontologyManager)
                            .stringValue() + SYSTEM_DEFAULT_NG_SUFFIX));
        });
        conn.removeGraph(datasetIRI);
    }

    private void undoApplyDifferenceIfPresent(RepositoryConnection conn) {
        if (difference != null) {
            conn.rollback();
        }
    }

    private long getStartTime() {
        return LOG.isTraceEnabled() ? System.currentTimeMillis() : 0L;
    }

    private void logTrace(String methodName, Long start) {
        if (LOG.isTraceEnabled()) {
            LOG.trace(String.format(methodName + " complete in %d ms", System.currentTimeMillis() - start));
        }
    }
}
