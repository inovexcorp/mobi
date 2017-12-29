# Translator API
This bundle contains the base API for implementing semantic translators.  This
includes some abstract classes that will reduce the amount of boilerplate code a typical
developer will have to write.

## Base API
The `SemanticTranslator` is the base interface that will describe a service for translating
data from some sort of semi-structured (XML, JSON, etc) data into RDF with a system managed
associated ontology.  Typically, other systems will require you to describe your ontology
and then manually build the translation from the source data into your desired model.

## Translation Ontology
The `urn://mobi.com/ontologies/SemanticTranslation` ontology describes an extension
to the OWL model for representing ontologies that will allow this API to manage an ontology
as dynamic data is ingested.  It includes extensions to the Class, DatatypeProperty, and
ObjectProperty "classes" in the OWL ontology, and as such, will allow additional structures
to be added to the generated ontology in order to more effectively generate both
individuals in the data and ontological structures.

For example, consider the `spelInstanceUri` property on the `ExtractedClass` entity.  This
property allows a developer to describe a template in Spring Expression Language with which
to generate IRIs for individuals of a specific, generated class.

The `com.mobi.semantic.translator.ontology` package contains the ORM objects representing
the structures in this ontology, and it is these objects that the translation APIs will
leverage in order to effectively generate and manage the ontologies.

## Stacking API
A common way of dealing with hierarchical structures such as JSON and XML is to manage
the data with a stack of elements.  In our case, each _entity_ on the stack represents a
class in the ontology, and each _property_ on the stack items will represent a data type 
property on that class.