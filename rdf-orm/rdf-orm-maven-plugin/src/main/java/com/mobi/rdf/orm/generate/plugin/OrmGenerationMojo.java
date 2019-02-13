package com.mobi.rdf.orm.generate.plugin;


import com.mobi.rdf.orm.generate.GraphReadingUtility;
import com.mobi.rdf.orm.generate.ReferenceOntology;
import com.mobi.rdf.orm.generate.SourceGenerator;
import org.apache.commons.io.FileUtils;
import org.apache.commons.vfs2.FileObject;
import org.apache.commons.vfs2.FileSystemException;
import org.apache.commons.vfs2.FileSystemManager;
import org.apache.commons.vfs2.VFS;
import org.apache.maven.plugin.AbstractMojo;
import org.apache.maven.plugin.MojoExecutionException;
import org.apache.maven.plugin.MojoFailureException;
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;
import org.eclipse.rdf4j.model.Model;
import org.eclipse.rdf4j.rio.RDFFormat;
import org.eclipse.rdf4j.rio.RDFHandlerException;
import org.eclipse.rdf4j.rio.RDFParseException;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.UnsupportedRDFormatException;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/*-
 * #%L
 * RDF ORM Maven Plugin
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

/**
 * This class is the {@link Mojo} that our plugin will use for generating the
 * source code for a given ontology.
 *
 * @author bdgould
 */
@Mojo(name = "generate-orm")
public class OrmGenerationMojo extends AbstractMojo {

    private FileSystemManager fileSystemManager;

    /**
     * List of ontologies to generate.
     */
    @Parameter(alias = "generates", required = true)
    private List<Ontology> generates;

    /**
     * List of reference ontologies.
     */
    @Parameter(alias = "references")
    private List<Ontology> references;

    /**
     * The location where the generated source will be stored.
     */
    @Parameter(property = "outputLocation", required = true, defaultValue = "./src/main/java")
    private String outputLocation;

    /**
     * {@inheritDoc}
     */
    @Override
    public void execute() throws MojoExecutionException, MojoFailureException {
        // Initialize fileSystemManager.
        try {
            fileSystemManager = VFS.getManager();
        } catch (FileSystemException e) {
            throw new MojoExecutionException("Issue initializing VFS system to fetch ontologies!", e);
        }

        // Load the reference ontology data.
        final List<ReferenceOntology> referenceOntologies = gatherReferenceOntologies();
        // Generate each of the generation ontologies.
        for (final Ontology generate : generates) {
            try {
                final FileObject fileObject = fileSystemManager.resolveFile(generate.getOntologyFile());
                // Check that the file exists!
                if (fileObject.isFile()) {
                    try {
                        // Read the ontology file into our Model.
                        final Model ontology = readOntology(fileObject, generate.getOntologyFile());
                        // If the destination package already exists, remove the previous version.
                        FileUtils.deleteQuietly(new File(outputLocation + (outputLocation.endsWith(File.separator) ? "" : File.separator) + generate.getOutputPackage().replace('.', File.separatorChar)));
                        // Generate the source in the targeted output package.
                        SourceGenerator.toSource(ontology, generate.getOutputPackage(), generate.getOntologyName(), outputLocation, referenceOntologies);
                    } catch (Exception e) {
                        // Catch an exception during source generation and throw MojoFailureException.
                        throw new MojoFailureException(String.format("Issue generating source from ontology specified: {%s} {%s} {%s}",
                                generate.getOntologyFile(), generate.getOutputPackage(), outputLocation), e);
                    }
                } else {
                    // Throw an exception if that ontology file doesn't exist
                    String msg = "Issue generating source from ontology specified. No ontology found at specified location: "
                            + generate.getOntologyFile();
                    throw new MojoExecutionException(msg);
                }
            } catch (IOException e) {
                throw new MojoExecutionException("Issue fetching configured ontology", e);
            }
        }
    }

    private static Model readOntology(final FileObject fileObject, final String baseUri)
            throws RDFParseException, RDFHandlerException, UnsupportedRDFormatException, IOException {
        try (final InputStream is = fileObject.getContent().getInputStream()) {
            final Optional<RDFFormat> format = Rio.getParserFormatForFileName(fileObject.getName().getBaseName());
            if (format.isPresent()) {
                return GraphReadingUtility.readOntology(format.get(), is, baseUri);
            } else {
                throw new IOException("Could not identify format of file containing ontology: " + fileObject.getName());
            }
        }
    }

    private Model readOntology(final String fileLocation, final String baseUri)
            throws RDFParseException, RDFHandlerException, UnsupportedRDFormatException, IOException {
        return readOntology(fileSystemManager.resolveFile(fileLocation), baseUri);
    }

    /**
     * Gather the configured reference ontologies.
     *
     * @return The {@link List} of {@link ReferenceOntology} objects representing your data
     * @throws MojoExecutionException If there is an issue reading one of the reference ontologies
     */
    private List<ReferenceOntology> gatherReferenceOntologies() throws MojoExecutionException {
        final List<ReferenceOntology> referenceOntologies = new ArrayList<>(references != null ? references.size() : 0);
        if (references != null) {
            for (final Ontology ont : references) {
                try {
                    referenceOntologies.add(new ReferenceOntology(ont.getOutputPackage(), ont.getOntologyName(), readOntology(ont.getOntologyFile(), "")));
                } catch (IOException e) {
                    throw new MojoExecutionException("Issue reading referenced ontology: " + ont.getOntologyFile(), e);
                }
            }
        }
        for (final ReferenceOntology ont : referenceOntologies) {
            try {
                ont.generateSource(referenceOntologies);
            } catch (Exception e) {
                throw new MojoExecutionException("Issue generating referenced code model: " + e.getMessage(), e);
            }
        }
        return referenceOntologies;
    }

}
