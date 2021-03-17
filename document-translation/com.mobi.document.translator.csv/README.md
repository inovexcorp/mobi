# CSV Document Translator
This bundle provides and implementation of the `com.mobi.document.translator.api`
for CSV data. It leverages a version the `AbstractSemanticTranslator` API in order
to convert CSV data into RDF and an associated ontology.

The CSV document translator generates an ontology with a singular class derived from the title of the csv
with class properties corresponding to each column within the file. It also generates instance data
for each row of the data.

See the `com.mobi.semantic.translator.api` bundle README for specifics on the api.