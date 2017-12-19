# Semantic Translation
The purpose of the bundles in this suite of modules is to abstract away the
extraction of "meaning" from semi-structured data.  Namely, things like
JSON or XML files that have inherent meaning in them.  Algorithms can
be written to automatically generate an ontology to represent files in these
kinds of formats to reduce the effort necessary to ingest data into the
Mobi platform.

## Stacking Approach
For hierarchical structures such as XML or JSON, a common approach to
parsing the contents is to maintain a stack representing your current 
location in the file (in terms of the depth of the tree).  This approach
is particularly useful here since it allows a more simple implementation,
as well as being more easily abstracted to allow more rapid development
of different formats.

 