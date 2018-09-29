# Mobi RDF ORM Gradle Plugin
This Gradle plugin is a more simple, convenient way to generate your Mobi RDF ORM source code. It provides a type of task called `OrmGenerationTask` that you can configure to point at a necessary ontology file (including any imported ontologies), and then tell it where you want to write your source code. Then you can configure your Gradle build to execute the task and the source will automatically be generated.

Example configuration in your build.gradle:

```groovy
// Includes the ORM Gradle Plugin in the build classpath
buildscript {
  dependencies {
    classpath "com.mobi:rdf-orm-gradle-plugin:${version}"
  }
}

apply plugin: 'rdf-orm-gradle-plugin'

// A custom task of the ORM Gradle plugin type
generateOntologies {
  // The location you want to write your Java classes to
  outputLocation = file("$buildDir/generated-sources/java")

  // Ontologies included with a generates key will generate source code
  generates {
    // The name of the ontology to be used in the name of the overall "Thing" class
    ontologyName = 'Test'
    // The file containing the ontology RDF
    ontologyFile = file("$projectDir/src/main/resources/ontology.trig")
    // The package name representing this ontology (the package the ontology will be generated in)
    outputPackage = 'com.mobi.ontology'
  }

  // Ontologies includes with a references key will act as references for the generated source, but won't create Java files
  references {
    // The name of the ontology that was used in the name of the overall "Thing" class
    ontologyName = 'Reference'
    // The file containing the ontology RDF
    ontologyFile = file("$projectDir/src/main/resources/importedOntology.rdf")
    // The package that references should use for this ontology data
    outputPackage = 'com.mobi.ontology.reference'
  }
}

// Includes the generated sources as source code
sourceSets.main.java.srcDirs generateOntologies.outputLocation

// Hooks the custom task in with the default compile task
tasks.withType(JavaCompile) {
  dependsOn generateOntologies
}
```
