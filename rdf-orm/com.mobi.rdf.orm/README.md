# RDF ORM
This project provides the core API for the Resource Description Framework (RDF) Object Relational Mapping (ORM) system. This library allows users to generate POJOs based upon a given ontology so that a developer doesn't need to work at the Statement/Model level, but can work natively in Java. Each class in your ontology creates an interface and an implementation. This method allows us to support the "multiple inheritance" feature that RDF/OWL supports by having each interface extend all necessary Java interfaces. The implementations each have to implement the methods independently of sibling/parent class structure. 

## Thing
In OWL, every class extends owl:Thing, much like in Java, every class extends Object. To leverage this concept, we've created a Thing interface and implementation that provide the core functionality of the API.  

## Value Converters
The core challenge of this API is to convert between a Statement (or Set of Statements) and a Java class property. To enable this, we've created a ValueConverter framework that can be extended. This OSGi service (set of services really) allow us to dynamically convert between the Value in the Object of a given statement and a desired native Java type. A ValueConverterRegistry allows us to serve the whole suite of ValueConverters to the various Thing implementations such that each method in the various implementations of your ontology classes will be able to dynamically provide hooks to access the underlying statement data.
