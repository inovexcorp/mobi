# Mobi RDF ORM

These modules provide a tools for creating POJOs from ontology files. Instead of hard coding various IRIs and manipulating Model objects, you can work with a Java object representing the entity you want to work with from a given ontology.

## Design

This library works by wrapping a given Model in a generated Java class that will automatically work with the RDF statements for you!  If you are familiar with FOAF, then consider instead of working with a Model and filtering down to get to the specific person you want, you can simply say:

```java
Person person = PersonFactory.getExisting(iri, model);
```

Instead of having to manipulate the Model and Statement objects, you get to simply work with a Person object as you would natively in Java.  Under the hood you would see that the Model object still exists, and that when you call getFirstName(), what actually happens is that it runs the filter operation, and dynamically converts the resulting Value object from the Statement into your expected native Java type.

## Generate

There will be many ways to generate your classes. The most simple is by using the SourceGenerator class in com.mobi.rdf.orm.generate. This class is the engine on which the other mechanisms are built. Perhaps the easiest and most common way to generate your source will be the Maven plugin (rdf-orm-maven-plugin). To use this plugin, simply have to add the necessary configuration to your POM (see the submodule for more information). Another mechanism is the use of the Karaf shell. The matonto:orm-generate command will take some arguments and generate classes to a specified location.
