package com.mobi.rdf.orm.generate;

/*-
 * #%L
 * rdf.orm.generate
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

import aQute.bnd.annotation.component.Reference;
import com.mobi.rdf.api.*;
import com.mobi.rdf.orm.AbstractOrmFactory;
import com.sun.codemodel.ClassType;
import com.sun.codemodel.JBlock;
import com.sun.codemodel.JClass;
import com.sun.codemodel.JClassAlreadyExistsException;
import com.sun.codemodel.JCodeModel;
import com.sun.codemodel.JConditional;
import com.sun.codemodel.JDefinedClass;
import com.sun.codemodel.JDocComment;
import com.sun.codemodel.JExpr;
import com.sun.codemodel.JExpression;
import com.sun.codemodel.JFieldVar;
import com.sun.codemodel.JInvocation;
import com.sun.codemodel.JMethod;
import com.sun.codemodel.JMod;
import com.sun.codemodel.JOp;
import com.sun.codemodel.JType;
import com.sun.codemodel.JVar;
import org.apache.commons.lang3.StringUtils;
import com.mobi.rdf.orm.OrmException;
import com.mobi.rdf.orm.OrmFactory;
import com.mobi.rdf.orm.Thing;
import com.mobi.rdf.orm.conversion.ValueConverter;
import com.mobi.rdf.orm.conversion.ValueConverterRegistry;
import com.mobi.rdf.orm.generate.ontology.MOBI;
import com.mobi.rdf.orm.impl.ThingImpl;
import org.openrdf.model.IRI;
import org.openrdf.model.Model;
import org.openrdf.model.Resource;
import org.openrdf.model.impl.LinkedHashModel;
import org.openrdf.model.impl.SimpleValueFactory;
import org.openrdf.model.vocabulary.OWL;
import org.openrdf.model.vocabulary.RDF;
import org.openrdf.model.vocabulary.RDFS;
import org.openrdf.model.vocabulary.XMLSchema;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.stream.StreamSupport;

public class SourceGenerator {

    private static final Logger LOG = LoggerFactory.getLogger(SourceGenerator.class);

    private static final String CLASS_TYPE_IRI_FIELD = "TYPE";

    private static final String DEFAULT_IMPL_FIELD = "DEFAULT_IMPL";

    private static final String PROPERTY_IRI_GETTER_PREFIX = "_getPropertyIri_";

    private final String ontologyName;
    private final JCodeModel codeModel = new JCodeModel();
    private final Model metaModel;
    private final Model model;
    private final String packageName;
    private Collection<IRI> classIris;
    private Map<IRI, JDefinedClass> interfaces = new HashMap<>();
    private Map<JDefinedClass, Map<String, IRI>> interfaceFieldIriMap = new HashMap<>();
    private Map<JDefinedClass, Map<String, IRI>> interfaceFieldRangeMap = new HashMap<>();
    private Map<JDefinedClass, Map<JMethod, JFieldVar>> classMethodIriMap = new HashMap<>();
    private Map<JDefinedClass, JDefinedClass> interfaceImplMap = new HashMap<>();
    private Map<String, JDefinedClass> nameInterfaceMap = new HashMap<>();
    private final List<ReferenceOntology> referenceOntologies = new ArrayList<>();

    public SourceGenerator(final Model ontologyGraph, final String outputPackage, final Collection<ReferenceOntology> referenceOntologies)
            throws OntologyToJavaException, IOException {
        this(ontologyGraph, outputPackage, null, referenceOntologies);
    }

    public SourceGenerator(final Model ontologyGraph, final String outputPackage, final String ontologyName, final Collection<ReferenceOntology> referenceOntologies)
            throws OntologyToJavaException, IOException {
        this.ontologyName = ontologyName;
        if (referenceOntologies != null) {
            this.referenceOntologies.addAll(referenceOntologies);
        }
        this.model = ontologyGraph;
        this.metaModel = new LinkedHashModel(model);
        this.packageName = outputPackage;
        this.referenceOntologies.forEach(ont -> {
            this.metaModel.addAll(ont.getOntologyModel());
        });
        // LOG if we're not referencing an imported ontology.
        checkImports(this.model, this.referenceOntologies);
        // Built interfaces...
        generateIndividualInterfaces();
        // Link the interfaces inheritence-wise.
        linkIndividualInterfaces();
        // Populate each individual interface with the required accessors.
        populateInterfacesWithMethods();
        // Build Impls.
        generateImplementations();
        // Build factories.
        generateFactories();
    }

    /**
     * Simple method to LOG some warnings if we aren't importing referenced ontologies.
     */
    private static void checkImports(final Model checkingModel, final List<ReferenceOntology> referenceOntologies) {
        checkingModel.filter(null, OWL.IMPORTS, null).stream().forEach(stmt -> {
            boolean contains = false;
            for (ReferenceOntology refOnt : referenceOntologies) {
                Optional<org.openrdf.model.Resource> resource = refOnt.getOntologyModel().filter(null, RDF.TYPE, OWL.ONTOLOGY).stream().filter(ontStmt -> ontStmt.getSubject().equals(stmt.getObject())).map(ontStmt -> ontStmt.getSubject()).findFirst();
                if (resource.isPresent()) {
                    contains = true;
                    break;
                }
            }
            if (!contains) {
                LOG.warn(String.format("Potential error: Generate ontology '%s' specifies that it imports '%s', but it isn't referenced", stmt.getSubject().stringValue(), stmt.getObject().stringValue()));
            }
        });
    }

    public static void toSource(final Model model, final String outputPackage, final String location, final Collection<ReferenceOntology> referencedOntologies)
            throws OntologyToJavaException, IOException {
        toSource(model, outputPackage, null, location, referencedOntologies);
    }

    public static void toSource(final Model model, final String outputPackage, final String name, final String location, final Collection<ReferenceOntology> referencedOntologies)
            throws OntologyToJavaException, IOException {
        final SourceGenerator generator = new SourceGenerator(model, outputPackage, name, referencedOntologies);
        generator.build(location);
    }

    /**
     * Generate a method name from a given static field name.
     *
     * @param prefix
     * @param staticFieldName
     * @return
     */
    private static String generateMethodName(final String prefix, final String staticFieldName) {
        return prefix + StringUtils.capitalize(staticFieldName.substring(0, staticFieldName.length() - 4));
    }

    /**
     * This method will simply convert a given IRI to its name by pulling off
     * the end of the IRI.
     *
     * @param capitalize Whether or not to capitalize the first letter of the name
     * @param iri        The {@link IRI} to process
     * @param model      The {@link Model} to process statements from (should contain
     *                   the ontology)
     * @return The name of the field we'll use
     */
    static String getName(final boolean capitalize, final IRI iri, final Model model) {
        final String classIriString = iri.stringValue();
        String className = classIriString.contains("#") ? classIriString.substring(classIriString.lastIndexOf('#') + 1)
                : classIriString.contains("/") ? classIriString.substring(classIriString.lastIndexOf('/') + 1) : null;
        if (className != null) {
            className = stripWhiteSpace(className.trim());
            className = (capitalize ? StringUtils.capitalize(className) : StringUtils.uncapitalize(className));
        }
        return className;
    }

    /**
     * Simple method to strip whitespaces from the name. It will also ensure it
     * is a valid class or field name.
     *
     * @param input The input string
     * @return The stripped and cleaned output name
     */
    protected static String stripWhiteSpace(final String input) {
        StringBuilder builder = new StringBuilder();
        boolean lastIsWhiteSpace = false;
        boolean first = true;
        for (char c : input.toCharArray()) {
            if (first && !Character.isJavaIdentifierStart(c) && Character.isJavaIdentifierPart(c)) {
                builder.append("_");
                builder.append(c);
                first = false;
            } else if (Character.isWhitespace(c)) {
                lastIsWhiteSpace = true;
            } else if (Character.isJavaIdentifierPart(c)) {
                builder.append(lastIsWhiteSpace ? StringUtils.capitalize(c + "") : c);
                lastIsWhiteSpace = false;
                first = false;
            }
        }
        return builder.toString();
    }

    /**
     * Build the code.
     *
     * @param path
     * @throws IOException
     */
    private void build(final String path) throws IOException {
        File output = new File(path);
        output.mkdirs();
        codeModel.build(output);
    }

    private void generateFactories() throws OntologyToJavaException {
        final Collection<String> issues = new ArrayList<>();
        interfaceImplMap.forEach((interfaze, clazz) -> {
            final String factoryName = interfaze.name() + "Factory";
            try {
                final IRI id = iriFromInterface(interfaze);
                final JDefinedClass factory = codeModel._class(JMod.PUBLIC, packageName + "." + factoryName,
                        ClassType.CLASS);
                factory.javadoc()
                        .add("This {@link OrmFactory} implementation will construct "
                                + interfaze.name() + " objects.  It will be published as an OSGi service.  "
                                + (id != null ? "See " + id.stringValue() + " for more information." : ""));
                factory._extends(codeModel.ref(AbstractOrmFactory.class).narrow(interfaze));
                factory.annotate(aQute.bnd.annotation.component.Component.class).paramArray("provide")
                        .param(OrmFactory.class).param(ValueConverter.class).param(factory.dotclass());
                factory.constructor(JMod.PUBLIC).body().invoke("super").arg(JExpr.dotclass(interfaze))
                        .arg(JExpr.dotclass(clazz));

                final JMethod getExisting = factory.method(JMod.PUBLIC, codeModel.ref(Optional.class).narrow(interfaze), "getExisting");
                getExisting.annotate(Override.class);

                /*
                 * The conditional here is basically going to filter the model for the rdf:type of the
                 * thing we're looking for, and will return whether or not the resulting submodel is empty.
                 *
                 */
                final JInvocation conditional = JExpr.ref("model").invoke("filter")
                        .arg(JExpr.ref("resource"))
                        .arg(JExpr.ref("valueFactory").invoke("createIRI")
                                .arg(JExpr.ref("RDF_TYPE_IRI")))
                        .arg(JExpr._this().invoke("getTypeIRI"))
                        .invoke("isEmpty");

                // If the conditional is true, meaning there is no rdf:type statement.
                final JInvocation emptyOptional = codeModel.ref(Optional.class).staticInvoke("empty");

                /*
                 * If the condition is false, meaning there is a matching rdf:type statement.  Then
                 * we will create an Optional.of a new instance of our target Thing class using the
                 * model we're referencing.
                 */
                final JInvocation realOptional = codeModel.ref(Optional.class).staticInvoke("of")
                        .arg(JExpr._new(clazz)
                                .arg(getExisting.param(com.mobi.rdf.api.Resource.class, "resource"))
                                .arg(getExisting.param(com.mobi.rdf.api.Model.class, "model"))
                                .arg(getExisting.param(ValueFactory.class, "valueFactory"))
                                .arg(getExisting.param(ValueConverterRegistry.class,
                                        "valueConverterRegistry")));

                getExisting.body()._return(JOp.cond(conditional, emptyOptional, realOptional));


                final JMethod getTypeIri = factory.method(JMod.PUBLIC, com.mobi.rdf.api.IRI.class, "getTypeIRI");
                getTypeIri.annotate(Override.class);
                getTypeIri.body()
                        ._return(JExpr.ref("valueFactory").invoke("createIRI").arg(interfaze.staticRef("TYPE")));

                // Get the parent type IRIs by adding a hash set of all the parent interface IRIs.
                final JMethod getParentTypeIRIs = factory.method(JMod.PUBLIC, codeModel.ref(Set.class).narrow(com.mobi.rdf.api.IRI.class), "getParentTypeIRIs");
                getParentTypeIRIs.annotate(Override.class);
                JBlock body = getParentTypeIRIs.body();
                JVar set = body.decl(JMod.FINAL, codeModel.ref(Set.class).narrow(com.mobi.rdf.api.IRI.class), "set", JExpr._new(codeModel.ref(HashSet.class).narrow(com.mobi.rdf.api.IRI.class)));
                Set<JClass> tracking = new HashSet<JClass>();
                tracking.add(codeModel.ref(Thing.class));
                recurseAddParentTypeIris(interfaze, body, set, tracking);
                body._return(JExpr.ref("set"));


                final JMethod setModelFactory = factory.method(JMod.PUBLIC, codeModel.VOID, "setModelFactory");
                setModelFactory.annotate(Override.class);
                setModelFactory.annotate(Reference.class);
                JVar modelFactoryParam = setModelFactory.param(ModelFactory.class, "modelFactory");
                setModelFactory.body().assign(JExpr._this().ref("modelFactory"), modelFactoryParam);

                final JMethod setValueFactory = factory.method(JMod.PUBLIC, codeModel.VOID, "setValueFactory");
                setValueFactory.annotate(Override.class);
                setValueFactory.annotate(Reference.class);
                JVar valueFactoryParam = setValueFactory.param(ValueFactory.class, "valueFactory");
                setValueFactory.body().assign(JExpr._this().ref("valueFactory"), valueFactoryParam);

                final JMethod setValueConverterRegistry = factory.method(JMod.PUBLIC, codeModel.VOID,
                        "setValueConverterRegistry");
                setValueConverterRegistry.annotate(Override.class);
                setValueConverterRegistry.annotate(Reference.class);
                JVar valueConverterRegistryParam = setValueConverterRegistry.param(ValueConverterRegistry.class,
                        "valueConverterRegistry");
                setValueConverterRegistry.body().assign(JExpr._this().ref("valueConverterRegistry"),
                        valueConverterRegistryParam);

            } catch (final Exception e) {
                LOG.error("Issue generating factory class: " + factoryName + ": " + e.getMessage(), e);
                issues.add("Issue generating factory class: " + factoryName + ": " + e.getMessage());
            }
        });
        if (!issues.isEmpty()) {
            throw new OntologyToJavaException("Could not generate POJOs from ontology due to the following issues:\n\t"
                    + StringUtils.join(issues, "\n\t") + "\n\n");
        }
    }

    private void recurseAddParentTypeIris(JClass interfaze, JBlock body, JVar set, Set<JClass> alreadyHas) {
        interfaze._implements().forEachRemaining(item -> {
            if (!alreadyHas.contains(item)) {
                body.add(set.invoke("add").arg(JExpr.ref("valueFactory").invoke("createIRI").arg(item.staticRef("TYPE"))));
                alreadyHas.add(item);
                recurseAddParentTypeIris(item, body, set, alreadyHas);
            }
        });
    }

    private void recurseImplementations(final JDefinedClass impl, final JClass interfaceClass) {
        // implement the supplied interface class.
        impl._implements(interfaceClass);
        if (interfaceClass instanceof JDefinedClass) {
            // If the interface is a JDefinedClass (will be), then we'll recurse
            // up the lineage.
            generateFieldAccessorsForEachInterfaceMethod(impl, (JDefinedClass) interfaceClass);
            interfaceClass._implements().forEachRemaining(parentInterface -> {
                recurseImplementations(impl, parentInterface);
            });
        }
    }

    private void generateImplementations() throws OntologyToJavaException {
        final Collection<String> issues = new ArrayList<>();
        interfaces.forEach((classIri, interfaceClass) -> {
            if (classIri != null) {
                try {
                    /*
                     * Define the implementation class, wire it to the correct
                     * interface and extend Thing.
                     */
                    final JDefinedClass impl = codeModel._class(JMod.PUBLIC,
                            packageName + "." + interfaceClass.name() + "Impl", ClassType.CLASS);
                    interfaceImplMap.put(interfaceClass, impl);
                    impl._extends(codeModel.ref(ThingImpl.class));
                    impl._implements(interfaceClass);
                    impl.javadoc().add("This implementation of the '" + classIri.stringValue()
                            + "' entity will allow developers to work in native java POJOs.");
                    // Constructors - call super from Thing.
                    generateImplConstructors(impl, interfaceClass);
                    // Build methods for impl based on interfaces.
                    recurseImplementations(impl, interfaceClass);

                    // Generate default impl.
                    interfaceClass.field(JMod.PUBLIC | JMod.STATIC | JMod.FINAL,
                            codeModel.ref(Class.class).narrow(interfaceClass.wildcard()), DEFAULT_IMPL_FIELD,
                            impl.dotclass()).javadoc().add("The default implementation for this interface");
                } catch (Exception e) {
                    LOG.error("Issue generating implementation for '" + classIri.stringValue() + "': " + e.getMessage(), e);
                    issues.add("Issue generating implementation for '" + classIri.stringValue() + "': " + e.getMessage());
                }
            }
        });
        if (!issues.isEmpty()) {
            throw new OntologyToJavaException("Could not generate POJOs from ontology due to the following issues:\n\t"
                    + StringUtils.join(issues, "\n\t") + "\n\n");
        }
    }

    private void generateFieldAccessorsForEachInterfaceMethod(final JDefinedClass impl,
                                                              final JDefinedClass interfaceClass) {
        interfaceClass.methods().forEach(interfaceMethod -> {
            if (!alreadyHasMethod(impl, interfaceClass, interfaceMethod)) {
                LOG.debug("Adding " + interfaceMethod.name() + " to the implementation class: " + interfaceClass.name());
                // Generate getter.
                if (interfaceMethod.name().startsWith("get") || interfaceMethod.name().startsWith("is")) {
                    generateFieldGetterForImpl(impl, interfaceMethod, interfaceClass);
                }
                // Generate setter.
                else if (interfaceMethod.name().startsWith("set")) {
                    generateFieldSetterForImpl(impl, interfaceMethod, interfaceClass);
                }
                //Else it's an adder for a non-functional field.
                else if (interfaceMethod.name().startsWith("add")) {
                    generateFieldAdderRemoverForImpl(impl, interfaceMethod, interfaceClass, true);
                }
                // Else it's a remover for a non functional field.
                else if (interfaceMethod.name().startsWith("remove")) {
                    generateFieldAdderRemoverForImpl(impl, interfaceMethod, interfaceClass, false);
                }
                // Else it's a property IRI getter.
                else if (interfaceMethod.name().startsWith(PROPERTY_IRI_GETTER_PREFIX)) {
                    if (impl.methods().stream().noneMatch(method -> method.name().equals(interfaceMethod.name()))) {
                        final JMethod method = impl.method(JMod.PUBLIC, codeModel._ref(com.mobi.rdf.api.IRI.class), interfaceMethod.name());
                        method.annotate(Override.class);
                        method.body()._return(
                                JExpr._this().ref("valueFactory").invoke("createIRI")
                                        .arg(interfaceClass.staticRef(interfaceMethod.name().replace(PROPERTY_IRI_GETTER_PREFIX, "") + "_IRI")));
                    }
                }
            }
        });
    }

    private boolean alreadyHasMethod(final JDefinedClass impl, final JDefinedClass interfaceClass,
                                     final JMethod interfaceMethod) {
        boolean alreadyHas = false;
        if (impl.getMethod(interfaceMethod.name(), interfaceMethod.listParamTypes()) == null) {
            for (JMethod method : impl.methods()) {
                if (interfaceMethod.name().equals(method.name()) && variablesOverlap(method, interfaceMethod)) {
                    alreadyHas = true;
                    break;
                }
            }
        } else {
            alreadyHas = true;
        }
        return alreadyHas;
    }

    private boolean variablesOverlap(JMethod method, JMethod interfaceMethod) {
        boolean overlap = true;
        for (JVar implParam : method.params()) {
            boolean found = false;
            for (JVar newParam : interfaceMethod.params()) {
                if (newParam.type().fullName().equalsIgnoreCase(implParam.type().fullName())) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                overlap = false;
                break;
            }
        }
        return overlap;
    }

    private void generateFieldAdderRemoverForImpl(final JDefinedClass impl, final JMethod interfaceMethod,
                                                  final JDefinedClass interfaceClass, final boolean add) {
        if (impl.getMethod(interfaceMethod.name(), interfaceMethod.listParamTypes()) == null) {
            final JMethod method = impl.method(JMod.PUBLIC, interfaceMethod.type(), interfaceMethod.name());
            method.param(interfaceMethod.params().get(0).type(), "arg");
            method._throws(OrmException.class);
            method.annotate(Override.class);
            method.body()._return(JExpr.ref("this").invoke(add ? "addProperty" : "removeProperty").arg(JExpr.ref("valueConverterRegistry").invoke("convertType")
                    .arg(interfaceMethod.params().get(0)).arg(JExpr._this()))
                    .arg(JExpr.ref("valueFactory").invoke("createIRI")
                            .arg(interfaceClass.staticRef(classMethodIriMap.get(interfaceClass).get(interfaceMethod)))));
        } else {
            LOG.warn("Avoided duplicate adder method: " + interfaceMethod.name() + " on class: " + impl.name());
        }
    }

    private void generateFieldSetterForImpl(final JDefinedClass impl, final JMethod interfaceMethod,
                                            final JDefinedClass interfaceClass) {
        if (impl.getMethod(interfaceMethod.name(), interfaceMethod.listParamTypes()) == null) {
            final JMethod method = impl.method(JMod.PUBLIC, interfaceMethod.type(), interfaceMethod.name());
            method.param(interfaceMethod.params().get(0).type(), "arg");
            method._throws(OrmException.class);
            method.annotate(Override.class);
            if (interfaceMethod.params().get(0).type().fullName().startsWith("java.util.Set")) {
                method.body().invoke("setProperties")
                        .arg(JExpr.ref("valueConverterRegistry").invoke("convertTypes")
                                .arg(interfaceMethod.params().get(0)).arg(JExpr._this()))
                        .arg(JExpr.ref("valueFactory").invoke("createIRI")
                                .arg(interfaceClass.staticRef(classMethodIriMap.get(interfaceClass).get(interfaceMethod))));
            } else {
                method.body().invoke("setProperty")
                        .arg(JExpr.ref("valueConverterRegistry").invoke("convertType")
                                .arg(interfaceMethod.params().get(0)).arg(JExpr._this()))
                        .arg(JExpr.ref("valueFactory").invoke("createIRI")
                                .arg(interfaceClass.staticRef(classMethodIriMap.get(interfaceClass).get(interfaceMethod))));
            }
            // TODO - add javadoc.
            // JDocComment jdoc = method.javadoc();
            // jdoc.add("");
        } else {
            LOG.warn("Avoided duplicate setter method: " + interfaceMethod.name() + " on class: " + impl.name());
        }
    }

    private void generateFieldGetterForImpl(final JDefinedClass impl, final JMethod interfaceMethod,
                                            final JDefinedClass interfaceClass) {
        if (impl.getMethod(interfaceMethod.name(), interfaceMethod.listParamTypes()) == null) {
            final JMethod method = impl.method(JMod.PUBLIC, interfaceMethod.type(), interfaceMethod.name());
            method._throws(OrmException.class);
            method.annotate(Override.class);
            // TODO - add javadoc.
            // JDocComment jdoc = method.javadoc();
            // jdoc.add("");
            convertValueBody(interfaceClass, interfaceMethod, impl, method);
        } else {
            LOG.warn("Avoided duplicate getter method: " + interfaceMethod.name() + " on class: " + impl.name());
        }
    }

    private void generateImplConstructors(final JDefinedClass impl, final JDefinedClass interfaceClazz) {
        final JMethod constructor = impl.constructor(JMod.PUBLIC);
        constructor.body().invoke("super")
                .arg(constructor.param(JMod.FINAL, com.mobi.rdf.api.Resource.class, "subjectIri"))
                .arg(constructor.param(JMod.FINAL, com.mobi.rdf.api.Model.class, "backingModel"))
                .arg(constructor.param(JMod.FINAL, ValueFactory.class, "valueFactory"))
                .arg(constructor.param(JMod.FINAL, ValueConverterRegistry.class, "valueConverterRegistry"));
        JDocComment basicDoc = constructor.javadoc();
        basicDoc.add("Construct a new " + interfaceClazz.name() + " with the subject IRI and the backing dataset");
        basicDoc.addParam("subjectIri").add("The subject of this " + interfaceClazz.name());
        basicDoc.addParam("valueFactory").add("The value factory to use for this " + interfaceClazz.name());
        basicDoc.addParam("backingModel").add("The backing dataset/model of this " + interfaceClazz.name());
        basicDoc.addParam("valueConverterRegistry")
                .add("The ValueConversionRegistry for this " + interfaceClazz.name());

        final JMethod constructor2 = impl.constructor(JMod.PUBLIC);
        constructor2.body().invoke("super").arg(constructor2.param(JMod.FINAL, String.class, "subjectIriStr"))
                .arg(constructor2.param(JMod.FINAL, com.mobi.rdf.api.Model.class, "backingModel"))
                .arg(constructor2.param(JMod.FINAL, ValueFactory.class, "valueFactory"))
                .arg(constructor2.param(JMod.FINAL, ValueConverterRegistry.class, "valueConversionRegistry"));
        JDocComment basicDoc2 = constructor2.javadoc();
        basicDoc2.add("Construct a new " + interfaceClazz.name() + " with the subject IRI and the backing dataset");
        basicDoc2.addParam("subjectIriStr").add("The subject of this " + interfaceClazz.name());
        basicDoc2.addParam("valueFactory").add("The value factory to use for this " + interfaceClazz.name());
        basicDoc2.addParam("backingModel").add("The backing dataset/model of this " + interfaceClazz.name());
        basicDoc2.addParam("valueConversionRegistry")
                .add("The ValueConversionRegistry for this " + interfaceClazz.name());

    }

    /**
     * Add getters and setters to the interfaces.
     */
    private void populateInterfacesWithMethods() {
        interfaces.forEach((iri, clazz) -> {
            final Map<JMethod, JFieldVar> methodIriMap = new HashMap<>();
            clazz.fields().forEach((name, fieldVar) -> {
                if (!name.equals(CLASS_TYPE_IRI_FIELD)) {
                    final IRI propertyIri = interfaceFieldIriMap.get(clazz).get(name);
                    final String fieldName = name.substring(0, name.length() - 4);

                    final JClass type = identifyType(propertyIri);
                    if (type != null) {
                        JClass getterType;
                        JClass setterType;

                        JClass resourceGetterType;

                        if (isPropertyFunctional(propertyIri)) {
                            getterType = codeModel.ref(Optional.class).narrow(type);
                            setterType = type;
                            resourceGetterType = codeModel.ref(Optional.class).narrow(com.mobi.rdf.api.Resource.class);
                        } else {
                            getterType = codeModel.ref(Set.class).narrow(type);
                            setterType = codeModel.ref(Set.class).narrow(type);
                            resourceGetterType = codeModel.ref(Set.class).narrow(com.mobi.rdf.api.Resource.class);
                            methodIriMap.put(generateAddMethodForInterface(clazz, iri, name, fieldName, propertyIri, type), clazz.fields().get(fieldName + "_IRI"));
                            methodIriMap.put(generateRemoveMethodForInterface(clazz, iri, name, fieldName, propertyIri, type), clazz.fields().get(fieldName + "_IRI"));
                        }

                        methodIriMap.put(
                                generateGetterMethodForInterface(clazz, iri, name, fieldName, propertyIri, getterType, false),
                                clazz.fields().get(fieldName + "_IRI"));
                        // If it's a Object Property, then add a getResource additional method.
                        if (!type.equals(codeModel.ref(com.mobi.rdf.api.Resource.class)) // Not already a resource.
                                && !type.equals(codeModel.ref(Value.class)) // Not a Value
                                && this.metaModel.filter(propertyIri, RDF.TYPE, null).objects().contains(OWL.OBJECTPROPERTY)) {
                            methodIriMap.put(
                                    generateGetterMethodForInterface(clazz, iri, name, fieldName, propertyIri, resourceGetterType, true),
                                    clazz.fields().get(fieldName + "_IRI"));
                        }

                        methodIriMap.put(
                                generateSetterMethodForInterface(clazz, iri, name, fieldName, propertyIri, setterType),
                                clazz.fields().get(fieldName + "_IRI"));
                    } else {
                        // TODO - handle the type is undefined... Work with it
                        // as a Value?
                    }
                }
            });
            classMethodIriMap.put(clazz, methodIriMap);
        });
    }

    private JMethod generateGetterMethodForInterface(final JDefinedClass clazz, final IRI interfaceIri,
                                                     final String name, final String fieldName, final IRI propertyIri, final JClass type, final boolean thingResource) {
        final JMethod method = clazz.method(JMod.PUBLIC, type,
                generateMethodName(type.equals(boolean.class) ? "is" : "get", name) + (thingResource ? "_resource" : ""));
        method._throws(OrmException.class);
        final JDocComment comment = method.javadoc();
        comment.add("Get the " + fieldName + " property from this instance of a " + (interfaceIri != null ? interfaceIri.stringValue() : getOntologyName(this.packageName, this.ontologyName))
                + "' type.<br><br>" + getFieldComment(propertyIri));
        comment.addReturn().add("The " + fieldName + " {@link " + type.binaryName() + "} value for this instance");
        return method;
    }

    private JMethod generateSetterMethodForInterface(final JDefinedClass clazz, final IRI interfaceIri,
                                                     final String name, final String fieldName, final IRI propertyIri, final JClass type) {
        final JMethod method = clazz.method(JMod.PUBLIC, codeModel.VOID, generateMethodName("set", name));
        method._throws(OrmException.class);
        method.param(type, "arg");
        // TODO - comments
        // final JDocComment comment = method.javadoc();
        // comment.add("Get the " + fieldName + " property from this instance of
        // a " + interfaceIri.stringValue()
        // + "' type.<br><br>" + getFieldComment(propertyIri));
        // comment.addReturn().add("The " + fieldName + " {@link " +
        // type.binaryName() + "} value for this instance");
        return method;
    }


    private JMethod generateAddMethodForInterface(final JDefinedClass clazz, final IRI interfaceIri,
                                                  final String name, final String fieldName, final IRI propertyIri, final JClass type) {
        final JMethod method = clazz.method(JMod.PUBLIC, boolean.class, generateMethodName("add", name));
        method._throws(OrmException.class);
        method.param(type, "arg");
        return method;
    }

    private JMethod generateRemoveMethodForInterface(final JDefinedClass clazz, final IRI interfaceIri,
                                                     final String name, final String fieldName, final IRI propertyIri, final JClass type) {
        final JMethod method = clazz.method(JMod.PUBLIC, boolean.class, generateMethodName("remove", name));
        method._throws(OrmException.class);
        method.param(type, "arg");
        return method;
    }

    /**
     * TODO - make better?
     *
     * @param property The IRI of the property you want to figure the type out for.
     * @return The JClass representing the type of parameter the property specifies
     */
    private JClass identifyType(final IRI property) {
        final Set<org.openrdf.model.Value> objects = this.metaModel.filter(property, RDFS.RANGE, null).objects();
        if (objects.size() == 1) {
            final IRI rangeIri = (IRI) objects.iterator().next();
            //TODO - think about moving the searching through our ontology and references to the end of this logic.
            // Handle our types.
            final Optional<String> optName = getTargetClassFullName(rangeIri);
            if (optName.isPresent()) {
                return codeModel.ref(optName.get());
            } else if (rangeIri.equals(RDFS.LITERAL)) {
                return codeModel.ref(Literal.class);
            } else if (rangeIri.equals(XMLSchema.ANYURI)) {
                return codeModel.ref(com.mobi.rdf.api.IRI.class);
            } else if (rangeIri.equals(SimpleValueFactory.getInstance().createIRI(MOBI.IDENTIFIER))) {
                return codeModel.ref(com.mobi.rdf.api.Resource.class);
            } else if (rangeIri.equals(RDFS.RESOURCE)) {
                return codeModel.ref(Value.class);
            } else if (rangeIri.equals(XMLSchema.STRING)) {
                return codeModel.ref(String.class);
            } else if (rangeIri.equals(XMLSchema.BOOLEAN)) {
                return codeModel.ref(Boolean.class);
            } else if (rangeIri.equals(XMLSchema.BYTE)) {
                return codeModel.ref(Byte.class);
            } else if (rangeIri.equals(XMLSchema.DATE) || rangeIri.equals(XMLSchema.DATETIME)) {
                return codeModel.ref(OffsetDateTime.class);
            } else if (rangeIri.equals(XMLSchema.FLOAT)) {
                return codeModel.ref(Float.class);
            } else if (rangeIri.equals(XMLSchema.DOUBLE)) {
                return codeModel.ref(Double.class);
            } else if (rangeIri.equals(XMLSchema.LONG)) {
                return codeModel.ref(Long.class);
            } else if (rangeIri.equals(XMLSchema.INTEGER)) {
                return codeModel.ref(Integer.class);
            } else if (rangeIri.equals(OWL.THING)) {
                return codeModel.ref(Thing.class);
            } else {
                LOG.warn("ORM does not know what type to make properties of range '" + rangeIri.stringValue()
                        + "' so we'll use Optional<Value> or Set<Value>");
                // TODO - evaluate for NPE potential.
                return this.metaModel.filter(property, RDF.TYPE, null).objects().contains(OWL.OBJECTPROPERTY)
                        ? codeModel.ref(Thing.class)
                        : codeModel.ref(Value.class);
            }
        } else {
            // TODO - evaluate for NPE potential.
            LOG.warn("Property '" + property + "' " + (objects.isEmpty() ? "doesn't specify a range." : "Specifies multiple ranges"));
            return this.metaModel.filter(property, RDF.TYPE, null).objects().contains(OWL.OBJECTPROPERTY)
                    ? codeModel.ref(Thing.class)
                    : codeModel.ref(Value.class);
        }
    }

    /**
     * Identify the full class name of a given range that is in either our ontology, or a referenced one.  This
     * method will return the first match it identifies.
     *
     * @param rangeIri The IRI of the property we're identifying
     * @return The fully qualified class name or an empty {@link Optional} if one doesn't exist in our context
     */
    private Optional<String> getTargetClassFullName(final IRI rangeIri) {
        String fullClassName = null;
        final JDefinedClass ourClass = interfaces.get(rangeIri);
        if (ourClass != null) {
            fullClassName = ourClass.fullName();
        } else {
            for (final ReferenceOntology ont : referenceOntologies) {
                LOG.debug("Looking in ontology " + ont.getPackageName() + " for " + rangeIri.stringValue());
                if (ont.containsClass(rangeIri)) {
                    fullClassName = ont.getClassName(rangeIri);
                    break;
                }
            }
        }
        return Optional.ofNullable(fullClassName);
    }

    /**
     * Link the ontology generated interfaces together.
     *
     * @throws OntologyToJavaException
     */
    private void linkIndividualInterfaces() throws OntologyToJavaException {
        final List<String> issues = new ArrayList<>();
        interfaces.forEach((iri, clazz) -> {
            if (iri != null) {
                model.filter(iri, RDFS.SUBCLASSOF, null).forEach(stmt -> {
                    org.openrdf.model.Value value = stmt.getObject();
                    if (value instanceof IRI) {
                        final IRI extending = (IRI) stmt.getObject();
                        if (!extending.equals(OWL.THING)) {
                            LOG.debug("Class '" + iri.stringValue() + "' extends '" + extending + "'");
                            if (interfaces.containsKey(extending)) {
                                clazz._implements(interfaces.get(extending));
                            } else {
                                referenceOntologies.forEach(refOnt -> {
                                    if (refOnt.containsClass(extending) && metaModel.subjects().contains(extending)) {
                                        if (refOnt.getSourceGenerator() == null) {
                                            try {
                                                refOnt.generateSource(referenceOntologies);
                                            } catch (Exception e) {
                                                LOG.error("Problem generating referenced data: " + e.getMessage(), e);
                                                issues.add("Problem generating referenced data: " + e.getMessage());
                                            }
                                        }
                                        clazz._implements(refOnt.getSourceGenerator().getCodeModel()._getClass(refOnt.getClassName(extending)));
                                        this.classMethodIriMap.putAll(refOnt.getSourceGenerator().getClassMethodIriMap());
                                    }
                                });
                            }
                        }
                    } else if (value instanceof org.openrdf.model.Resource) {
                        // TODO - handle blank nodes somehow
                        LOG.warn("Blank nodes remain unhandled");
                    } else {
                        issues.add("Unsupported rdfs:subclassOf property on '" + iri.stringValue()
                                + "' which tried to extend '" + value.stringValue() + "'");
                    }
                });
            }
        });
        if (!issues.isEmpty()) {
            throw new OntologyToJavaException("Could not generate POJOs from ontology due to the following issues:\n\t"
                    + StringUtils.join(issues, "\n\t") + "\n\n");
        }
    }

    /**
     * This method will take a root IRI identifying a class, and then populate a
     * list with the complete ancestry of that class.
     *
     * @param root    The IRI to climb the ancestry tree of
     * @param parents The parent entities
     */
    private void getAncestors(final IRI root, final List<IRI> parents) {
        List<IRI> firstLevel = this.model.filter(root, RDFS.SUBCLASSOF, null).stream()
                .map(stmt -> stmt.getObject()).filter(obj -> obj instanceof IRI).map(obj -> (IRI) obj)
                .filter(iri -> !parents.contains(iri)).collect(Collectors.toList());
        parents.addAll(firstLevel);
        firstLevel.forEach(newRoot -> {
            getAncestors(newRoot, parents);
        });
    }


    private JDefinedClass generateOntologyThing() throws OntologyToJavaException {
        try {
            final JDefinedClass ontologyThing = codeModel._class(JMod.PUBLIC, getOntologyName(this.packageName, this.ontologyName), ClassType.INTERFACE);
            ontologyThing._extends(codeModel.ref(Thing.class));
            // Track field names to the IRI.
            final Map<String, IRI> fieldIriMap = new HashMap<>();
            final Map<String, IRI> rangeMap = new HashMap<>();
            identifyAllDomainProperties(metaModel).stream().filter(resource -> resource instanceof IRI).forEach(resource -> {
                // Set a static final field for the IRI.
                final String fieldName = getName(false, (IRI) resource, this.metaModel);
                final IRI range = getRangeOfProperty((IRI) resource);
                ontologyThing.field(JMod.PUBLIC | JMod.STATIC | JMod.FINAL, String.class, fieldName + "_IRI",
                        JExpr.lit(resource.stringValue())).javadoc()
                        .add("IRI of the predicate that this property will represent.<br><br>Domain: " + range);
                fieldIriMap.put(fieldName + "_IRI", (IRI) resource);
                rangeMap.put(fieldName, range);
            });
            interfaceFieldIriMap.put(ontologyThing, fieldIriMap);
            interfaceFieldRangeMap.put(ontologyThing, rangeMap);
            //TODO, null, or create some kind of unique IRI?
            interfaces.put(null, ontologyThing);
            return ontologyThing;
        } catch (JClassAlreadyExistsException e) {
            throw new OntologyToJavaException("Ontology Super Thing class already exists, or conflicts with an existing class...", e);
        }
    }

    /**
     * Generate each individual interface with its static final predicate
     * fields.
     *
     * @throws OntologyToJavaException
     */
    private void generateIndividualInterfaces() throws OntologyToJavaException {
        final List<String> issues = new ArrayList<>();

        final JDefinedClass ontologyThing = generateOntologyThing();

        identifyClasses().forEach(classIri -> {
            try {
                final Model modelOfThisClass = this.model.filter(classIri, null, null);

                final String className = packageName + "." + getName(true, classIri, modelOfThisClass);

                List<IRI> ancestors = new ArrayList<>();
                getAncestors(classIri, ancestors);

                JDefinedClass clazz = codeModel._class(JMod.PUBLIC, className, ClassType.INTERFACE);
                if (!clazz.equals(ontologyThing)) {
                    clazz._extends(ontologyThing);
                }

                clazz.javadoc().add("Generated class representing things with the type: " + classIri.stringValue());

                clazz.field(JMod.PUBLIC | JMod.STATIC | JMod.FINAL, String.class, CLASS_TYPE_IRI_FIELD,
                        JExpr.lit(classIri.stringValue())).javadoc().add("The rdf:type IRI of this class.");

                // Track field names to the IRI.
                final Map<String, IRI> fieldIriMap = new HashMap<>();
                final Map<String, IRI> rangeMap = new HashMap<>();


                // Look for properties on this domain.
                final Collection<Resource> resources = this.model.filter(null, RDFS.DOMAIN, classIri).subjects().stream().filter(subj -> {
                    for (final IRI ancestorIri : ancestors) {
                        if (this.model.filter(subj, RDFS.DOMAIN, ancestorIri).size() > 0) {
                            return false;
                        }
                    }
                    return true;
                }).collect(Collectors.toSet());
                resources.stream().filter(resource -> resource instanceof IRI).forEach(resource -> {
                    LOG.debug("Adding '" + resource.stringValue() + "' to '" + classIri.stringValue()
                            + "' as it specifies it in its range");

                    // Set a static final field for the IRI.
                    final String fieldName = getName(false, (IRI) resource, this.model);
                    final IRI range = getRangeOfProperty((IRI) resource);
                    clazz.field(JMod.PUBLIC | JMod.STATIC | JMod.FINAL, String.class, fieldName + "_IRI",
                            JExpr.lit(resource.stringValue())).javadoc()
                            .add("IRI of the predicate that this property will represent.<br><br>Domain: " + range);
                    fieldIriMap.put(fieldName + "_IRI", (IRI) resource);
                    rangeMap.put(fieldName, range);
                });
                nameInterfaceMap.put(clazz.fullName(), clazz);
                interfaceFieldIriMap.put(clazz, fieldIriMap);
                interfaceFieldRangeMap.put(clazz, rangeMap);
                interfaces.put(classIri, clazz);
            } catch (Exception e) {
                LOG.error("Issue generating interface for '" + classIri.stringValue() + "': " + e.getMessage(), e);
                issues.add("Issue generating interface for '" + classIri.stringValue() + "': " + e.getMessage());
            }
        });

        if (!issues.isEmpty()) {
            throw new OntologyToJavaException("Could not generate POJOs from ontology due to the following issues:\n\t"
                    + StringUtils.join(issues, "\n\t") + "\n\n");
        }

    }

    /**
     * Gets the range of a given property IRI.
     *
     * @param propertyIri The property to fetch the range of
     * @return The IRI representing the range of the property
     */
    private IRI getRangeOfProperty(final IRI propertyIri) {
        final Model submodel = this.metaModel.filter(propertyIri, RDFS.RANGE, null);
        if (!submodel.isEmpty()) {
            return (IRI) submodel.iterator().next().getObject();
        } else {
            return null;
        }
    }

    /**
     * Determines whether or not a supplied property IRI is functional.
     *
     * @param propertyIri The {@link IRI} of the property to check
     * @return Whether or not the {@link IRI} is the subject in a statement
     * saying it is a owl:FunctionalProperty.
     */
    private boolean isPropertyFunctional(final IRI propertyIri) {
        return !this.metaModel.filter(propertyIri, RDF.TYPE, OWL.FUNCTIONALPROPERTY).isEmpty();
    }

    /**
     * Identify all of the subjects in the ontology that have the rdf:type of
     * owl:Class.
     *
     * @return The {@link Collection} of {@link IRI}s that are classes in the
     * ontology
     */
    private Collection<IRI> identifyClasses() {
        final Model owlClasses = this.model.filter(null, RDF.TYPE, OWL.CLASS);
        final Model rdfsClasses = this.model.filter(null, RDF.TYPE, RDFS.CLASS);
        classIris = new HashSet<>(owlClasses.size() + rdfsClasses.size());

        owlClasses.stream()
                .map(org.openrdf.model.Statement::getSubject)
                .filter(subject->subject instanceof IRI)
                .map(subject -> (IRI) subject)
                .forEach(classIris::add);

        rdfsClasses.stream()
                .map(org.openrdf.model.Statement::getSubject)
                .filter(subject->subject instanceof IRI)
                .map(subject -> (IRI) subject)
                .forEach(classIris::add);
        return classIris;
    }

    private String getFieldComment(final IRI propertyIri) {
        final StringBuilder builder = new StringBuilder();
        final Model propertyStuff = model.filter(propertyIri, null, null);
        propertyStuff.filter(propertyIri, RDFS.COMMENT, null).forEach(stmt -> {
            builder.append(stmt.getObject().stringValue());
            builder.append("\n\n");
        });
        return builder.toString().trim();
    }

    private JBlock convertValueBody(final JDefinedClass interfaceClass, final JMethod interfaceMethod,
                                    final JDefinedClass implClass, final JMethod implMethod) {
        final boolean returnsSet = interfaceMethod.type().fullName().startsWith("java.util.Set");

        JType returnType = (returnsSet) ? codeModel.ref(Set.class).narrow(Value.class)
                : codeModel.ref(Optional.class).narrow(Value.class);


        JExpression callGet = classMethodIriMap.containsKey(interfaceClass) ?
                JExpr.invoke(returnsSet ? "getProperties" : "getProperty").arg(JExpr.ref("valueFactory")
                        .invoke("createIRI").arg(interfaceClass.staticRef(classMethodIriMap.get(interfaceClass).get(interfaceMethod))))
                : null;

        final JVar value = implMethod.body().decl(JMod.FINAL, returnType, "value", callGet);

        JClass returnClass = ((JClass) interfaceMethod.type()).getTypeParameters().get(0);

        boolean returnsValue = interfaceMethod.type()
                .equals(codeModel.ref(Set.class).narrow(Value.class));
        boolean returnsValueSet = (returnsSet && returnClass.equals(codeModel.ref(Value.class)));

        if (returnsValue || returnsValueSet) {
            implMethod.body()._return(value);
        } else if (returnsSet) {
            if (nameInterfaceMap.containsKey(returnClass.fullName())) {
                implMethod.body().add(JExpr.ref("value").invoke("removeIf").arg(JExpr.direct("value1 -> !getModel().subjects().contains(value1)")));
            }
            implMethod.body()._return(JExpr.ref("valueConverterRegistry").invoke("convertValues").arg(value)
                    .arg(JExpr._this()).arg(returnClass.dotclass()));
        } else {
            JExpression convertValue = JExpr.ref("valueConverterRegistry").invoke("convertValue")
                    .arg(JExpr.ref("value").invoke("get")).arg(JExpr._this())
                    .arg(returnClass.dotclass());

            JInvocation valueIsPresent = JExpr.ref("value").invoke("isPresent");

            JConditional conditional;
            if (nameInterfaceMap.containsKey(returnClass.fullName())) {
                JInvocation modelContainsResource = JExpr._this()
                        .invoke("getModel")
                        .invoke("subjects")
                        .invoke("contains").arg(JExpr.ref("value").invoke("get"));
                conditional = implMethod.body()._if(valueIsPresent.cand(modelContainsResource));
            } else {
                conditional = implMethod.body()._if(valueIsPresent);
            }


            conditional._then()._return(codeModel.ref(Optional.class).staticInvoke("of").arg(convertValue));
            conditional._else()._return(codeModel.ref(Optional.class).staticInvoke("empty"));
        }

        return implMethod.body();
    }

    private IRI iriFromInterface(JDefinedClass interfaze) {
        for (final Map.Entry<IRI, JDefinedClass> entry : interfaces.entrySet()) {
            if (entry.getValue().equals(interfaze)) {
                return entry.getKey();
            }
        }
        return null;
    }

    private static Set<Resource> identifyAllDomainProperties(final Model metaModel) {
        final Set<Resource> resources = fetchAllDomainResources(OWL.OBJECTPROPERTY, metaModel).collect(Collectors.toSet());
        resources.addAll(fetchAllDomainResources(OWL.DATATYPEPROPERTY, metaModel).collect(Collectors.toSet()));
        resources.addAll(fetchAllDomainResources(RDF.PROPERTY, metaModel).collect(Collectors.toSet()));
        return resources;
    }

    private static Stream<Resource> fetchAllDomainResources(final IRI typeIri, final Model metaModel) {
        return metaModel.filter(null, RDF.TYPE, typeIri).subjects().stream()
                .filter(resource -> metaModel.filter(resource, RDFS.DOMAIN, null).isEmpty());
    }

    public JCodeModel getCodeModel() {
        return codeModel;
    }

    public Map<JDefinedClass, JDefinedClass> getInterfaceImplMap() {
        return interfaceImplMap;
    }

    public Map<JDefinedClass, Map<String, IRI>> getInterfaceFieldIriMap() {
        return interfaceFieldIriMap;
    }

    public Map<JDefinedClass, Map<JMethod, JFieldVar>> getClassMethodIriMap() {
        return classMethodIriMap;
    }

    public Map<JDefinedClass, Map<String, IRI>> getInterfaceFieldRangeMap() {
        return interfaceFieldRangeMap;
    }

    public Map<IRI, JDefinedClass> getInterfaces() {
        return interfaces;
    }

    protected static String getOntologyName(final String packageName, final String ontologyName) {
        return packageName + "." + (StringUtils.isBlank(ontologyName) ? "" : stripWhiteSpace(ontologyName)) + "_Thing";
    }
}
