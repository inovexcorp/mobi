# Mobi RDF ORM Maven Plugin
This maven plugin is a more simple, convenient way to generate your Mobi RDF ORM source code. You can configure your project to point at a necessary ontology file (including any imported ontologies), and then tell it where you want to write your source code.  Once you run maven install on your project, the source will automatically be generated.

Example configuration in your pom:

```xml
<plugin>
    <groupId>com.mobi.orm</groupId>
    <artifactId>rdf-orm-maven-plugin</artifactId>
    <version>${version}</version>
    <executions>
        <execution>
            <id>generateOrmSources</id>
            <phase>generate-sources</phase>
            <goals>
                <goal>generate-orm</goal>
            </goals>
            <inherited>false</inherited>
            <configuration>
                <!-- Ontologies listed in the generates section will generate source code -->
                <generates>
                    <ontology>
                        <!-- The file containing the ontology RDF -->
                        <ontologyFile>${project.basedir}/src/main/resources/ontology.trig</ontologyFile>
                        <!-- The package name representing this ontology (the package the ontology will be generated in) -->
                        <outputPackage>com.mobi.ontology</outputPackage>
                    </ontology>
                </generates>
                <!-- Ontologies listed in the references section will act as references for the generated source, but won't create Java files. -->
                <references>
                    <ontology>
                        <!-- The file containing the ontology RDF -->
                        <ontologyFile>${project.basedir}/src/main/resources/importedOntology.rdf</ontologyFile>
                        <!-- The package that references should use for this ontology data -->
                        <outputPackage>com.mobi.ontology.reference</outputPackage>
                    </ontology>
                </references>
                <!-- The location you want to write your Java classes to -->
                <outputLocation>${project.basedir}/src/test/java</outputLocation>
            </configuration>
        </execution>
    </executions>
</plugin>
```
