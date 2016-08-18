package org.matonto.rdf.orm.generate.plugin;

import java.io.File;

import org.apache.maven.plugin.AbstractMojo;
import org.apache.maven.plugin.MojoExecutionException;
import org.apache.maven.plugin.MojoFailureException;
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;
import org.matonto.rdf.api.IRI;
import org.matonto.rdf.orm.generate.GraphReadingUtility;
import org.matonto.rdf.orm.generate.SourceGenerator;

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
	 * The file containing the ontology for our ingestion.
	 */
	@Parameter(property = "ontologyFile", required = true)
	private String ontologyFile;

	/**
	 * The {@link IRI} string for the target ontology.
	 */
	@Parameter(property = "ontologyIri", required = true)
	private String ontologyIri;

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
		final File file = new File(ontologyFile);
		// Check that the file exists!
		if (file.isFile()) {
			try {
				SourceGenerator.toSource(GraphReadingUtility.readOntology(file, ontologyFile), ontologyIri,
						outputLocation);
			} catch (Exception e) {
				throw new MojoFailureException("Issue generating source from ontology specified: {" + ontologyFile
						+ "} {" + ontologyIri + "} {" + outputLocation + "}", e);
			}
		} else {
			// Throw an exception if that ontology file doesn't exist
			throw new MojoExecutionException(
					"Issue generating source from ontology specified, no ontology found at specified location: "
							+ outputLocation);
		}
	}

}
