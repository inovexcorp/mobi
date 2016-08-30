package org.matonto.rdf.orm.generate;

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
import com.sun.codemodel.*;
import org.apache.commons.lang3.StringUtils;
import org.matonto.rdf.api.ModelFactory;
import org.matonto.rdf.api.Value;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.AbstractOrmFactory;
import org.matonto.rdf.orm.OrmException;
import org.matonto.rdf.orm.OrmFactory;
import org.matonto.rdf.orm.Thing;
import org.matonto.rdf.orm.conversion.ValueConverter;
import org.matonto.rdf.orm.conversion.ValueConverterRegistry;
import org.matonto.rdf.orm.impl.ThingImpl;
import org.openrdf.model.IRI;
import org.openrdf.model.Model;
import org.openrdf.model.Statement;
import org.openrdf.model.vocabulary.OWL;
import org.openrdf.model.vocabulary.RDF;
import org.openrdf.model.vocabulary.RDFS;
import org.openrdf.model.vocabulary.XMLSchema;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

public class SourceGenerator {

    private static final Logger LOG = LoggerFactory.getLogger(SourceGenerator.class);

    private static final String CLASS_TYPE_IRI_FIELD = "TYPE";

    private static final String DEFAULT_IMPL_FIELD = "DEFAULT_IMPL";
    private final JCodeModel codeModel = new JCodeModel();
    private final Model model;
    private final String packageName;
    private Collection<IRI> classIris;
    private Map<IRI, JDefinedClass> interfaces = new HashMap<>();
    private Map<JDefinedClass, Map<String, IRI>> interfaceFieldIriMap = new HashMap<>();
    private Map<JDefinedClass, Map<String, IRI>> interfaceFieldRangeMap = new HashMap<>();
    private Map<JDefinedClass, Map<JMethod, JFieldVar>> classMethodIriMap = new HashMap<>();
    private Map<JDefinedClass, JDefinedClass> interfaceImplMap = new HashMap<>();

    public SourceGenerator(final Model ontologyGraph, final String outputPackage)
            throws OntologyToJavaException, IOException {
        this.model = ontologyGraph;
        this.packageName = outputPackage;
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
        // TODO - Generate ValueConverters for generated types.
    }

    public static void toSource(final Model model, final String outputPackage, final String location)
            throws OntologyToJavaException, IOException {
        final SourceGenerator generator = new SourceGenerator(model, outputPackage);
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
    private static String getName(final boolean capitalize, final IRI iri, final Model model) {
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
    private static String stripWhiteSpace(final String input) {
        StringBuilder builder = new StringBuilder();
        boolean lastIsWhiteSpace = false;
        boolean first = true;
        for (char c : input.toCharArray()) {
            if (first && !Character.isJavaIdentifierStart(c) && Character.isJavaIdentifierPart(c)) {
                builder.append("_" + c);
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
    public void build(final String path) throws IOException {
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
                        .add("This {@link org.matonto.rdf.orm.OrmFactory} implementation will construct "
                                + interfaze.name() + " objects.  It will be published as an OSGi service.  "
                                + (id != null ? "See " + id.stringValue() + " for more information." : ""));
                factory._extends(codeModel.ref(AbstractOrmFactory.class).narrow(interfaze));
                factory.annotate(aQute.bnd.annotation.component.Component.class).paramArray("provide")
                        .param(OrmFactory.class).param(ValueConverter.class).param(factory.dotclass());
                factory.constructor(JMod.PUBLIC).body().invoke("super").arg(JExpr.dotclass(interfaze))
                        .arg(JExpr.dotclass(clazz));

                final JMethod getExisting = factory.method(JMod.PUBLIC, interfaze, "getExisting");
                getExisting.annotate(Override.class);
                getExisting.body()._return(
                        JExpr._new(clazz).arg(getExisting.param(org.matonto.rdf.api.Resource.class, "resource"))
                                .arg(getExisting.param(org.matonto.rdf.api.Model.class, "model"))
                                .arg(getExisting.param(org.matonto.rdf.api.ValueFactory.class, "valueFactory"))
                                .arg(getExisting.param(org.matonto.rdf.orm.conversion.ValueConverterRegistry.class,
                                        "valueConverterRegistry")));

                final JMethod getTypeIri = factory.method(JMod.PUBLIC, org.matonto.rdf.api.IRI.class, "getTypeIRI");
                getTypeIri.annotate(Override.class);
                getTypeIri.body()
                        ._return(JExpr.ref("valueFactory").invoke("createIRI").arg(interfaze.staticRef("TYPE")));

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
                issues.add("Issue generating factory class: " + factoryName + ": " + e.getMessage());
            }
        });
        if (!issues.isEmpty()) {
            throw new OntologyToJavaException("Could not generate POJOs from ontology due to the following issues:\n\t"
                    + StringUtils.join(issues, "\n\t") + "\n\n");
        }
    }

    private void recurseImplementations(JDefinedClass impl, JClass interfaceClass) {
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
                recurseImplementations(impl, interfaceClass);

                // Generate default impl.
                interfaceClass.field(JMod.PUBLIC | JMod.STATIC | JMod.FINAL,
                        codeModel.ref(Class.class).narrow(interfaceClass.wildcard()), DEFAULT_IMPL_FIELD,
                        impl.dotclass()).javadoc().add("The default implementation for this interface");
            } catch (Exception e) {
                e.printStackTrace();
                issues.add("Issue generating implementation for '" + classIri.stringValue() + "': " + e.getMessage());
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
            LOG.debug("Adding " + interfaceMethod.name() + " to the implementation class: " + interfaceClass.name());
            // Generate getter.
            if (interfaceMethod.name().startsWith("get") || interfaceMethod.name().startsWith("is")) {
                generateFieldGetterForImpl(impl, interfaceMethod, interfaceClass);
            }
            // Generate setter.
            else if (interfaceMethod.name().startsWith("set")) {
                // TODO
                generateFieldSetterForImpl(impl, interfaceMethod, interfaceClass);
            }
        });
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
                                .arg(classMethodIriMap.get(interfaceClass).get(interfaceMethod)));
            } else {
                method.body().invoke("setProperty")
                        .arg(JExpr.ref("valueConverterRegistry").invoke("convertType")
                                .arg(interfaceMethod.params().get(0)).arg(JExpr._this()))
                        .arg(JExpr.ref("valueFactory").invoke("createIRI")
                                .arg(classMethodIriMap.get(interfaceClass).get(interfaceMethod)));
            }
            // TODO - add javadoc.
            // JDocComment jdoc = method.javadoc();
            // jdoc.add("");
        } else {
            LOG.warn("Avoided dupliace setter method: " + interfaceMethod.name() + " on class: " + impl.name());
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
            LOG.warn("Avoided dupliace getter method: " + interfaceMethod.name() + " on class: " + impl.name());
        }
    }

    private void generateImplConstructors(final JDefinedClass impl, final JDefinedClass interfaceClazz) {
        final JMethod constructor = impl.constructor(JMod.PUBLIC);
        constructor.body().invoke("super")
                .arg(constructor.param(JMod.FINAL, org.matonto.rdf.api.Resource.class, "subjectIri"))
                .arg(constructor.param(JMod.FINAL, org.matonto.rdf.api.Model.class, "backingModel"))
                .arg(constructor.param(JMod.FINAL, ValueFactory.class, "valueFactory"))
                .arg(constructor.param(JMod.FINAL, ValueConverterRegistry.class, "valueConverterRegistry"));
        JDocComment basicDoc = constructor.javadoc();
        basicDoc.add("Construct a new " + interfaceClazz.name() + " with the subject IRI and the backing dataset");
        basicDoc.addParam("subjectIri").add("The subject of this " + interfaceClazz.name());
        basicDoc.addParam("valueFactory").add("The value factory to use for this " + interfaceClazz.name());
        basicDoc.addParam("backingModel").add("The backing dataset/model of this " + interfaceClazz.name());
        basicDoc.addParam("valueConversionRegistry")
                .add("The ValueConversionRegistry for this " + interfaceClazz.name());

        final JMethod constructor2 = impl.constructor(JMod.PUBLIC);
        constructor2.body().invoke("super").arg(constructor2.param(JMod.FINAL, String.class, "subjectIriStr"))
                .arg(constructor2.param(JMod.FINAL, org.matonto.rdf.api.Model.class, "backingModel"))
                .arg(constructor2.param(JMod.FINAL, ValueFactory.class, "valueFactory"))
                .arg(constructor2.param(JMod.FINAL, ValueConverterRegistry.class, "valueConversionRegistry"));
        JDocComment basicDoc2 = constructor2.javadoc();
        basicDoc2.add("Construct a new " + interfaceClazz.name() + " with the subject IRI and the backing dataset");
        basicDoc2.addParam("subjectIri").add("The subject of this " + interfaceClazz.name());
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

                    JClass getterType;
                    JClass setterType;

                    if (isPropertyFunctional(propertyIri)) {
                        getterType = codeModel.ref(Optional.class).narrow(type);
                        setterType = type;
                    } else {
                        getterType = codeModel.ref(Set.class).narrow(type);
                        setterType = codeModel.ref(Set.class).narrow(type);
                    }

                    if (type != null) {
                        methodIriMap.put(
                                generateGetterMethodForInterface(clazz, iri, name, fieldName, propertyIri, getterType),
                                clazz.fields().get(fieldName + "_IRI"));
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
                                                     final String name, final String fieldName, final IRI propertyIri, final JClass type) {
        final JMethod method = clazz.method(JMod.PUBLIC, type,
                generateMethodName(type.equals(boolean.class) ? "is" : "get", name));
        method._throws(OrmException.class);
        final JDocComment comment = method.javadoc();
        comment.add("Get the " + fieldName + " property from this instance of a " + interfaceIri.stringValue()
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

    /**
     * TODO - make better?
     *
     * @param property
     * @return
     */
    private JClass identifyType(final IRI property) {
        for (final Statement stmt : model.filter(property, RDFS.RANGE, null)) {
            final IRI rangeIri = (IRI) stmt.getObject();
            // Handle our types.
            final JDefinedClass ourClass = interfaces.get(rangeIri);
            if (ourClass != null) {
                return codeModel.ref(ourClass.fullName());
            } else if (rangeIri.equals(RDFS.LITERAL)) {
                return codeModel.ref(org.matonto.rdf.api.Literal.class);
            } else if (rangeIri.equals(XMLSchema.STRING)) {
                return codeModel.ref(String.class);
            } else if (rangeIri.equals(XMLSchema.BOOLEAN)) {
                return codeModel.ref(Boolean.class);
            } else if (rangeIri.equals(XMLSchema.BYTE)) {
                return codeModel.ref(Byte.class);
            } else if (rangeIri.equals(XMLSchema.DATE) || rangeIri.equals(XMLSchema.DATETIME)) {
                return codeModel.ref(Date.class);
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
                LOG.warn("Ibis does not know what type to make properties of range '" + rangeIri.stringValue()
                        + "' so we'll use Optional<Value> or Set<Value>");
                return codeModel.ref(Value.class);
            }
        }
        return null;
    }

    /**
     * Link the ontology generated interfaces together.
     *
     * @throws OntologyToJavaException
     */
    private void linkIndividualInterfaces() throws OntologyToJavaException {
        interfaces.forEach((iri, clazz) -> {
            model.filter(iri, RDFS.SUBCLASSOF, null).forEach(stmt -> {
                final IRI extending = (IRI) stmt.getObject();
                if (!extending.equals(OWL.THING)) {
                    LOG.debug("Class '" + iri.stringValue() + "' extends '" + extending + "'");
                    clazz._implements(interfaces.get(extending));
                }
            });
        });
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
                .map(stmt -> ((Statement) stmt).getObject()).filter(obj -> obj instanceof IRI).map(obj -> (IRI) obj)
                .filter(iri -> !parents.contains(iri)).collect(Collectors.toList());
        parents.addAll(firstLevel);
        firstLevel.stream().forEach(newRoot -> {
            getAncestors(newRoot, parents);
        });
    }

    /**
     * Generate each individual interface with its static final predicate
     * fields.
     *
     * @param issues
     * @throws OntologyToJavaException
     */
    private void generateIndividualInterfaces() throws OntologyToJavaException {
        final List<String> issues = new ArrayList<>();
        final List<IRI> allDomainPredicates = new ArrayList<>();
        this.model.filter(null, OWL.DATATYPEPROPERTY, null).subjects().forEach(resource -> {
            final Model submodel = model.filter(resource, RDFS.DOMAIN, null);
            if (submodel.size() == 0) {
                allDomainPredicates.add((IRI) resource);
            }
        });

        identifyClasses().forEach(classIri -> {
            try {
                final Model modelOfThisClass = this.model.filter(classIri, null, null);

                final String className = packageName + "." + getName(true, classIri, modelOfThisClass);

                List<IRI> ancestors = new ArrayList<>();
                getAncestors(classIri, ancestors);

                JDefinedClass clazz = codeModel._class(JMod.PUBLIC, className, ClassType.INTERFACE);
                clazz._extends(Thing.class);

                clazz.javadoc().add("Generated class representing things with the type: " + classIri.stringValue());

                clazz.field(JMod.PUBLIC | JMod.STATIC | JMod.FINAL, String.class, CLASS_TYPE_IRI_FIELD,
                        JExpr.lit(classIri.stringValue())).javadoc().add("The rdf:type IRI of this class.");

                // Track field names to the IRI.
                final Map<String, IRI> fieldIriMap = new HashMap<>();
                final Map<String, IRI> rangeMap = new HashMap<>();

                // Look for properties on this domain.
                this.model.filter(null, RDFS.DOMAIN, classIri).stream().filter(stmt -> {
                    for (final IRI ancestorIri : ancestors) {
                        if (this.model.filter(stmt.getSubject(), RDFS.DOMAIN, ancestorIri).size() > 0) {
                            return false;
                        }
                    }
                    return true;
                }).forEach(stmt -> {
                    LOG.debug("Adding '" + stmt.getSubject().stringValue() + "' to '" + classIri.stringValue()
                            + "' as it specifies it in its range");

                    // Set a static final field for the IRI.
                    final String fieldName = getName(false, (IRI) stmt.getSubject(), this.model);
                    final IRI range = getRangeOfProperty((IRI) stmt.getSubject());
                    clazz.field(JMod.PUBLIC | JMod.STATIC | JMod.FINAL, String.class, fieldName + "_IRI",
                            JExpr.lit(stmt.getSubject().stringValue())).javadoc()
                            .add("IRI of the predicate that this property will represent.<br><br>Domain: " + range);
                    fieldIriMap.put(fieldName + "_IRI", (IRI) stmt.getSubject());
                    rangeMap.put(fieldName, range);
                });
                interfaceFieldIriMap.put(clazz, fieldIriMap);
                interfaceFieldRangeMap.put(clazz, rangeMap);
                interfaces.put(classIri, clazz);
            } catch (Exception e) {
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
        final Model submodel = this.model.filter(propertyIri, RDFS.RANGE, null);
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
        return !this.model.filter(propertyIri, RDF.TYPE, OWL.FUNCTIONALPROPERTY).isEmpty();
    }

    /**
     * Identify all of the subjects in the ontology that have the rdf:type of
     * owl:Class.
     *
     * @return The {@link Collection} of {@link IRI}s that are classes in the
     * ontology
     */
    private Collection<IRI> identifyClasses() {
        final Model submodel = this.model.filter(null, RDF.TYPE, OWL.CLASS);
        classIris = new ArrayList<IRI>(submodel.size());
        submodel.forEach(statement -> {
            classIris.add((IRI) statement.getSubject());
        });
        return classIris;
    }

    private String getFieldComment(final IRI propertyIri) {
        final StringBuilder builder = new StringBuilder();
        final Model propertyStuff = model.filter(propertyIri, null, null);
        propertyStuff.filter(propertyIri, RDFS.COMMENT, null).forEach(stmt -> {
            builder.append(stmt.getObject().stringValue() + "\n\n");
        });
        return builder.toString().trim();
    }

    private JBlock convertValueBody(final JDefinedClass interfaceClass, final JMethod interfaceMethod,
                                    final JDefinedClass implClass, final JMethod implMethod) {
        final boolean returnsSet = interfaceMethod.type().fullName().startsWith("java.util.Set");

        JType returnType = (returnsSet) ? codeModel.ref(Set.class).narrow(org.matonto.rdf.api.Value.class)
                : codeModel.ref(Optional.class).narrow(org.matonto.rdf.api.Value.class);
        JExpression callGet = JExpr.invoke(returnsSet ? "getProperties" : "getProperty").arg(JExpr.ref("valueFactory")
                .invoke("createIRI").arg(classMethodIriMap.get(interfaceClass).get(interfaceMethod)));

        final JVar value = implMethod.body().decl(JMod.FINAL, returnType, "value", callGet);

        boolean returnsValue = interfaceMethod.type()
                .equals(codeModel.ref(Set.class).narrow(org.matonto.rdf.api.Value.class));
        boolean returnsValueSet = (returnsSet && ((JClass) interfaceMethod.type()).getTypeParameters().get(0)
                .equals(codeModel.ref(org.matonto.rdf.api.Value.class)));

        if (returnsValue || returnsValueSet) {
            implMethod.body()._return(value);
        } else if (returnsSet) {
            implMethod.body()._return(JExpr.ref("valueConverterRegistry").invoke("convertValues").arg(value)
                    .arg(JExpr._this()).arg(((JClass) interfaceMethod.type()).getTypeParameters().get(0).dotclass()));
        } else {
            JExpression convertValue = JExpr.ref("valueConverterRegistry").invoke("convertValue")
                    .arg(JExpr.ref("value").invoke("get")).arg(JExpr._this())
                    .arg((((JClass) interfaceMethod.type()).getTypeParameters().get(0)).dotclass());

            JConditional conditional = implMethod.body()._if(JExpr.ref("value").invoke("isPresent"));
            conditional._then()._return(codeModel.ref(Optional.class).staticInvoke("of").arg(convertValue));
            conditional._else()._return(codeModel.ref(Optional.class).staticInvoke("empty"));
        }

        return implMethod.body();
    }

    private final IRI iriFromInterface(JDefinedClass interfaze) {
        for (final Map.Entry<IRI, JDefinedClass> entry : interfaces.entrySet()) {
            if (entry.getValue().equals(interfaze)) {
                return entry.getKey();
            }
        }
        return null;
    }

}