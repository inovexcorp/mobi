## Settings Framework

The Settings Framework was designed to allow the tracking and editing of Settings within the Mobi Application.
The framework was designed to be easily extensible such that a new setting can be added to the platform with only
some RDF and a few code changes.

This bundle provides the API for the Mobi Settings Service.

There are two types of Settings within the Mobi application. Preferences and Application Settings.
1. Preferences are types of settings that apply to a specific user. An example of a hypothetical setting could be
whether that particular user wants to receive email notifications from the Mobi Application.
2. Application settings are types of settings that apply to all users of the application. These can only be created and
modified by users with the admin role. A hypothetical example of this could be an organizations logo to be used in the
top left pane of the application.

### Setting RDF Definition

In order to introduce new Settings to the Mobi Application, a developer must create an RDF representation of the
Setting they want to add to the application. The Setting Framework uses https://www.w3.org/TR/shacl/[SHACL] to
define settings. Setting RDF must consist of exactly one SHACL NodeShape and one SHACL PropertyShape in order to
be recognized as a Setting by the Mobi Application. Requirements for the structure of these SHACL shapes is
outlined below.

The following prefixes will be used in the rest of this appendix:

|Prefix   |Namespace   |
|---|---|
|`owl:`|`http://www.w3.org/2002/07/owl#`|
|`rdfs`   |`http://www.w3.org/2000/01/rdf-schema#`   |
|`shacl:`   |`http://www.w3.org/ns/shacl#`   |
|`setting:`   |`http://mobi.com/ontologies/setting#`   |
|`xsd:`|`http://www.w3.org/2001/XMLSchema#`|



For an explanation of what each SHACL class and property represent, read the descriptions given here:
`https://www.w3.org/TR/shacl/`. The following are descriptions of Mobi specific properties.

#### setting:Preference
The `setting:Preference` class acts as the parent class of all preferences within the Mobi Application. Mobi preferences always
have an `rdfs:subClassOf` `setting:Preference` and are also of type `sh:NodeShape`.

#### setting:ApplicationSetting
The `setting:ApplicationSetting` class acts as the parent class of all application settings within the Mobi Application. 
Mobi application settings always have an `rdfs:subClassOf` `setting:ApplicationSetting` and are also of type `sh:NodeShape`.

NOTE: From here on, when referring to either `setting:Preference` or `setting:ApplicationSetting` the phrase setting subType
may be used.

#### setting:PreferenceGroup
Every Mobi preference must have a `setting:inGroup` of a instance of `setting:PreferenceGroup`. These preference groups are
meant to group together semantically related preferences.

#### setting:ApplicationSettingGroup
Every Mobi application setting must have a `setting:inGroup` of a instance of `setting:ApplicationSettingGroup`. 
These application setting groups are meant to group together semantically related application settings.

#### setting:FormField
Instances of the `setting:FormField` class are used by Mobi settings to specify the form input that is used by the UI to
select setting values.

#### setting:hasDataValue
The `setting:hasDataValue` property is used by instances of setting subTypes to point to the current value of that
setting. All Settings must point to a Property Shape that has an `sh:path` of `setting:hasDataValue`.

#### setting:usesFormField
The `setting:usesFormField` property is used by the required `sh:PropertyShape` of a Mobi Setting to designate the type of form
input that will be used by the frontend to accept setting values for that specific setting.

### setting:inGroup
The `setting:inGroup` property specifies either the `setting:PreferenceGroup` or `setting:ApplicationSettingGroup` that 
a Mobi Setting belongs too. It is used to semantically group related Settings in the UI.

### Required SHACL NodeShape

* Must be of type `owl:Class` as well as type `shacl:Nodeshape`
* Must have an `rdfs:subClassOf` of `setting:Preference` or `setting:ApplicationSetting`
* Must have an `shacl:description` that will be shown above the Setting in the UI
* Must have a `shacl:property` that points to the required SHACL PropertyShape for the setting
* Must have a `setting:inGroup` of an IRI in the system of type
`setting:PreferenceGroup` or `setting:ApplicationSettingGroup`

### Required SHACL PropertyShape

* Must be of type `shacl:PropertyShape`
* Must have an `shacl:path` of `setting:hasDataValue`
* A `shacl:datatype` of one of the following values
** `xsd:boolean`
** `xsd:string`
** `xsd:integer`
* Must have a `setting:usesFormField` that has one of the following values that will affect
which type of form input is shown in the UI for this preference
** `setting:ToggleInput`
** `setting:TextInput`
* Must have a `setting:inGroup` of a valid instance of the
`setting:PreferenceGroup` or `setting:ApplicationSettingGroup` class.
* May have optional `shacl:minCount` and/or `shacl:maxCount` fields denoting the
min and max number of possible values for the preference which will be enforced in the UI.
* May have optional `shacl:pattern` which may have a regex that controls what values may be used and
will be enforced by the UI.

NOTE: Support for more datatypes and form fields coming soon!

### Required PreferenceGroup/ApplicationSettingGroup
* At least one instance of `setting:PreferenceGroup` or `setting:ApplicationSettingGroup` must exist which has an
`rdfs:label`.
** Preference/ApplicationSetting Groups already in the system can be reused.

NOTE: Predefined Property Groups coming soon

### Example RDF

```
@prefix owl: <http://www.w3.org/2002/07/owl#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix sh: <http://www.w3.org/ns/shacl#>.
@prefix setting: <http://mobi.com/ontologies/preference#>.
@prefix : <http://mobi.com/ontologies/test#>.
@base <http://mobi.com/ontologies/test>.

:MyBooleanPreference a owl:Class, sh:NodeShape;
    rdfs:subClassOf setting:Preference;
    sh:description "What value do you want for your Boolean Preference?" ;
    sh:property :MyBooleanPreferencePropertyShape;
    setting:inGroup :MyTestPreferenceGroup .

:MyBooleanPreferencePropertyShape a sh:PropertyShape;
    sh:path setting:hasDataValue;
    sh:datatype xsd:boolean;
    sh:minCount 1 ;
    sh:maxCount 1 ;
    setting:usesFormField setting:ToggleInput .

:MyTestPreferenceGroup a setting:PreferenceGroup ;
    rdfs:label "My Test Preference Group"@en .
```

### Adding Custom Settings

In order to create new custom settings in the Mobi application, there are 3 steps:

1. Create Setting RDF to model the new Setting
2. Generate Java classes from the Setting RDF using the Mobi rdf-orm-plugin
3. Load the Setting RDF into the Mobi Repository

#### Generate Java Classes from Setting RDF

* Create an RDF file with your custom setting definition in the `src/main/resources` directory of a Mobi bundle.
This can be any valid RDF format, such a Turtle.

* Create a pom.xml based on the following example pom in the appropriate Mobi bundle.

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>org.example</groupId>
    <artifactId>Testsf</artifactId>
    <version>1.0-SNAPSHOT</version>
    <name>${project.groupId}.${project.artifactId}</name>
    <packaging>bundle</packaging>
    <parent>
        <artifactId>mobi-parent</artifactId>
        <groupId>com.mobi</groupId>
        <version>1.20.0</version>
        <relativePath></relativePath>
    </parent>
    <dependencies>
        <dependency>
            <groupId>com.mobi</groupId>
            <artifactId>rdf.orm</artifactId>
            <version>1.20.0</version>
        </dependency>
        <dependency>
            <groupId>com.mobi</groupId>
            <artifactId>setting.api</artifactId>
            <version>1.20.0</version>
        </dependency>
    </dependencies>
    <repositories>
        <repository>
            <id>inovex</id>
            <url>http://nexus.inovexcorp.com/nexus/content/repositories/public-maven-prod-group/</url>
        </repository>
    </repositories>
    <pluginRepositories>
        <pluginRepository>
            <id>inovex</id>
            <url>http://nexus.inovexcorp.com/nexus/content/repositories/public-maven-prod-group/</url>
        </pluginRepository>
    </pluginRepositories>
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.felix</groupId>
                <artifactId>maven-bundle-plugin</artifactId>
                <version>3.5.1</version>
                <extensions>true</extensions>
                <configuration>
                    <obrRepository>NONE</obrRepository>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-checkstyle-plugin</artifactId>
                <configuration>
                    <skip>true</skip>
                </configuration>
            </plugin>
            <plugin>
                <groupId>com.mobi.orm</groupId>
                <artifactId>rdf-orm-maven-plugin</artifactId>
                <version>1.20.0</version>
                <executions>
                    <execution>
                        <id>generateOrmSources</id>
                        <phase>generate-sources</phase>
                        <goals>
                            <goal>generate-orm</goal>
                        </goals>
                        <inherited>false</inherited>
                        <configuration>
                            <generates>
                                <ontology>
                                    <ontologyFile>${project.basedir}/src/main/resources/myontologyfile.ttl</ontologyFile>
                                    <outputPackage>my.bundle.ontologies</outputPackage>
                                    <ontologyName>MyOntologyName</ontologyName>
                                </ontology>
                            </generates>
                            <references>
                                <ontology>
                                    <ontologyFile>jar:http://nexus.inovexcorp.com/nexus/repository/public-maven-prod-group/com/mobi/rdf.orm.ontologies/1.20.0/rdf.orm.ontologies-1.20.0.jar!shacl.ttl</ontologyFile>
                                    <outputPackage>com.mobi.ontologies.shacl</outputPackage>
                                </ontology>
                                <ontology>
                                    <ontologyFile>jar:http://nexus.inovexcorp.com/nexus/repository/public-maven-prod-group/com/mobi/setting.api/1.20.0/setting.api-1.20.0.jar!setting.ttl</ontologyFile>
                                    <outputPackage>com.mobi.setting.api.ontologies</outputPackage>
                                    <ontologyName>Setting</ontologyName>
                                </ontology>
                            </references>
                            <outputLocation>${project.basedir}/src/main/java</outputLocation>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

Be sure to replace references to "My ontology" and "My bundle" with your actual ontology and bundle. Also make sure to
have the `<packaging>bundle</packaging>` and the `com.mobi.rdf.orm` dependency. On your next Mobi build, interfaces,
implementation classes, and factory classes will be created based on your ontology.


#### Load Setting RDF into Mobi Repo

In order for Setting RDF to be recognized by Mobi, it must be loaded into the `http://mobi.com/setting-management`
graph. This can be done one of two ways. The first option is to upload the RDF via Mobi Command Line. To do this, create
a trig file with a graph of `http://mobi.com/setting-management` that has the same contents as your setting RDF.
The following is an example:
```
@prefix owl: <http://www.w3.org/2002/07/owl#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>.
@prefix sh: <http://www.w3.org/ns/shacl#>.
@prefix setting: <http://mobi.com/ontologies/preference#>.
@prefix : <http://mobi.com/ontologies/test#>.
@base <http://mobi.com/ontologies/test>.

<http://mobi.com/setting-management> {
:MyBooleanPreference a owl:Class, sh:NodeShape;
rdfs:subClassOf setting:Preference;
sh:description "What value do you want for your Boolean Preference?" ;
sh:property :MyBooleanPreferencePropertyShape;
setting:inGroup :MyTestPreferenceGroup .

    :MyBooleanPreferencePropertyShape a sh:PropertyShape;
        sh:path setting:hasDataValue;
        sh:datatype xsd:boolean;
        sh:minCount 1 ;
        sh:maxCount 1 ;
        setting:usesFormField setting:ToggleInput .

    :MyTestPreferenceGroup a setting:PreferenceGroup ;
        rdfs:label "My Test Preference Group"@en .
}
```
Next, start up Mobi, and run the following command in the Mobi Shell:
`mobi:import -r system /path/to/my/trigfile.trig`. At this point, the preference should now be present and editable in
the Mobi UI.

NOTE: This will only work if you have already built using the rdf-orm-plugin described earlier in the documentation to
generate Java classes for the setting RDF.

The second option to load your Setting RDF into the Mobi Repository is to add code to the activate
method of a service in your corresponding Mobi bundle. The following methods can be used to help add code into the
Mobi Repository.

** The `Models.createModel()` method to turn an `InputStream` into a `Model`.
** `getRepository().getConnection().add(...)` from the `CatalogConfigProvider` class used to add a model to the repo. Be
sure to pass the `http://mobi.com/setting-management` iri as the context parameter value.

Example:
```java
Model ontologyModel;
try {
    ontologyModel = Models.createModel("ttl", MY_ONTOLOGY_STREAM, transformer);
} catch (IOException e) {
    throw new MobiException(e);
}
try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
    conn.add(ontologyModel, vf.createIRI(SettingService.GRAPH));
}
```

### Using a Stored Setting

In order to use the value of a stored setting, the setting service will be used in conjunction with one or more
of the ORM generated classes (classes generated in the "Generate Java Classes from Setting RDF" section). 
The following is an example of how to extract the value of a boolean preference that exists in the system:

```java
boolean myBooleanPreferenceValue = false;
Optional<Preference> myPreferenceOptional = preferenceService.getSetting(valueFactory.createIRI(MyPreference.TYPE), user;
if (myPreferenceOptional.isPresent()) {
    MyPreference myPreference = (MyPreference) myPreferenceOptional.get();
    myBooleanPreferenceValue = myPreference.getHasDataValue().orElseThrow(() -> new IllegalStateException("Some message")).booleanValue();
}
```