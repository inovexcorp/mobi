/*-
 * #%L
 * org.matonto.rdf.orm.cli
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
package org.matonto.rdf.orm.cli;

import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Completion;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.apache.karaf.shell.support.completers.FileCompleter;
import org.matonto.rdf.orm.generate.GraphReadingUtility;
import org.matonto.rdf.orm.generate.ReferenceOntology;
import org.matonto.rdf.orm.generate.SourceGenerator;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;


@Command(scope = "mobi", name = "orm-generate", description = "Generates Java POJOs based upon provided ontology information")
@Service
public class CLIOrmGenerate implements Action {

    @Completion(FileCompleter.class)
    @Argument(index = 0, name = "Ontology File", description = "The file containing the RDF data representing ontology data you want to generate source for", required = true)
    private File ontologyFilePath;

    @Argument(index = 1, name = "Output Package", description = "The name of the package you want to generate your source files into", required = true)
    private String generateToPackage;

    @Argument(index = 2, name = "Ontology Name", description = "The name of the ontology.  This value is used in generating the name of the sub thing.")
    private String ontologyName;

    @Completion(FileCompleter.class)
    @Argument(index = 2, name = "Output Location", description = "Where to write your output Java classes", required = true)
    private File outputLocationPath;


    @Argument(index = 3, name = "Referenced Ontology Files", description = "Files you want to reference that contain any imported ontology you're using.  The format these values should be in is: ${package}:${fileLocation}", multiValued = true)
    private List<String> referencedOntologyFilePaths;

    @Override
    public Object execute() throws Exception {
        final File ontologyFile = verifyOntologyFile(ontologyFilePath.getAbsolutePath());
        final File outputLocationFile = verifyOutputLocation(outputLocationPath.getAbsolutePath());
        final List<ReferenceOntology> referencedOntologies = verifyReferencedOntologyFiles(referencedOntologyFilePaths);
        SourceGenerator.toSource(GraphReadingUtility.readOntology(ontologyFile, ""), generateToPackage, ontologyName, outputLocationFile.getAbsolutePath(), referencedOntologies);
        return null;
    }


    private static File verifyOutputLocation(final String path) throws IOException {
        final File outputPath = new File(path);
        if (!outputPath.exists()) {
            if (!outputPath.mkdirs()) {
                throw new IOException("Couldn't create specified output path for source files: " + outputPath.getAbsolutePath());
            }
        } else if (!outputPath.isDirectory()) {
            throw new IOException("Specified output directory exists, and is not a directory: " + outputPath.getAbsolutePath());
        }
        return outputPath;
    }

    private static File verifyOntologyFile(final String path) throws FileNotFoundException {
        final File f = new File(path);
        if (!f.isFile()) {
            throw new FileNotFoundException("Ontology file '" + f.getAbsolutePath() + "' does not exist");
        } else {
            return f;
        }
    }

    private static List<ReferenceOntology> verifyReferencedOntologyFiles(final List<String> referencedOntologyFilePaths) throws FileNotFoundException {
        final List<ReferenceOntology> referencedOntologyFiles = referencedOntologyFilePaths != null ?
                referencedOntologyFilePaths.stream().map(path -> {
                    try {
                        String[] split = path.split(":", 2);
                        return new ReferenceOntology(split[0], GraphReadingUtility.readOntology(new File(split[1]), ""));
                    } catch (Exception e) {
                        e.printStackTrace();
                        return null;
                    }
                }).collect(Collectors.toList()) : new ArrayList<>();
        for (ReferenceOntology f : referencedOntologyFiles) {
            if (f == null) {
                throw new IllegalArgumentException("Specified referenced ontology values invalid");
            }
        }
        return referencedOntologyFiles;
    }
}
