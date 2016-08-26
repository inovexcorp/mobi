package org.matonto.rdf.orm.generate.plugin;

import org.apache.maven.plugin.AbstractMojo;
import org.apache.maven.plugin.MojoExecutionException;
import org.apache.maven.plugin.MojoFailureException;
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;
import org.matonto.rdf.orm.generate.GraphReadingUtility;
import org.matonto.rdf.orm.generate.SourceGenerator;
import org.openrdf.model.Model;

import java.io.File;
import java.util.List;

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
 *
 */
@Mojo(name = "generate-orm")
public class OrmGenerationMojo extends AbstractMojo {

    /**
     * List of ontologies to generate.
     */
    @Parameter(alias = "generates", required = true)
    private List<Ontology> generates;

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
        for (Ontology generate : generates) {
            final File file = new File(generate.getOntologyFile());
            // Check that the file exists!
            if (file.isFile()) {
                try {
                    Model ontology = GraphReadingUtility.readOntology(file, generate.getOntologyFile());
                    SourceGenerator.toSource(ontology, generate.getOutputPackage(), outputLocation);
                } catch (Exception e) {
                    String msg = String.format("Issue generating source from ontology specified: {%s} {%s} {%s}",
                            generate.getOntologyFile(), generate.getOutputPackage(), outputLocation);
                    throw new MojoFailureException(msg, e);
                }
            } else {
                // Throw an exception if that ontology file doesn't exist
                String msg = "Issue generating source from ontology specified. No ontology found at specified location: "
                        + generate.getOntologyFile();
                throw new MojoExecutionException(msg);
            }
        }
    }

}
