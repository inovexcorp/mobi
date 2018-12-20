package com.mobi.rdf.orm.generate.gradle.plugin;

/*-
 * #%L
 * rdf-orm-gradle-plugin
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

import com.mobi.rdf.orm.generate.GraphReadingUtility;
import com.mobi.rdf.orm.generate.ReferenceOntology;
import com.mobi.rdf.orm.generate.SourceGenerator;
import groovy.lang.Closure;
import org.apache.commons.io.FileUtils;
import org.eclipse.rdf4j.model.Model;
import org.gradle.api.DefaultTask;
import org.gradle.api.GradleException;
import org.gradle.api.GradleScriptException;
import org.gradle.api.tasks.OutputDirectory;
import org.gradle.api.tasks.TaskAction;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class OrmGenerationTask extends DefaultTask {
    private File outputLocation;
    private List toGenerate = new ArrayList();
    private List toReference = new ArrayList();

    @OutputDirectory
    public File getOutputLocation() {
        return outputLocation;
    }

    public void setOutputLocation(File outputLocation) {
        this.outputLocation = outputLocation;
    }

    public void generates(Closure config) {
        toGenerate.add(getProject().configure(new Ontology(), config));
    }

    public void references(Closure config) {
        toReference.add(getProject().configure(new Ontology(), config));
    }

    @TaskAction
    public void perform() {
        // Load the reference ontology data.
        final List<ReferenceOntology> referenceOntologies = gatherReferenceOntologies();
        // Generate each of the generation ontologies.
        for (final Object generate : toGenerate) {
            Ontology ontology = (Ontology) generate;
            final File file = ontology.getOntologyFile();
            // Check that the file exists!
            if (file.isFile()) {
                try {
                    // Read the ontology file into our Model.
                    final Model model = GraphReadingUtility.readOntology(file,
                            ontology.getOntologyFile().getAbsolutePath());
                    // If the destination package already exists, remove the previous version.
                    FileUtils.deleteQuietly(new File(outputLocation.getAbsolutePath()
                            + (outputLocation.getAbsolutePath().endsWith(File.separator) ? "" : File.separator)
                            + ontology.getOutputPackage().replace('.', File.separatorChar)));
                    // Generate the source in the targeted output package.
                    SourceGenerator.toSource(model, ontology.getOutputPackage(), ontology.getOntologyName(),
                            outputLocation.getAbsolutePath(), referenceOntologies);
                } catch (Exception e) {
                    // Catch an exception during source generation and throw MojoFailureException.
                    throw new GradleScriptException(String.format("Issue generating source from ontology specified: "
                                    + "{%s} {%s} {%s}", ontology.getOntologyFile(), ontology.getOutputPackage(),
                            outputLocation), e);
                }
            } else {
                // Throw an exception if that ontology file doesn't exist
                String msg = "Issue generating source from ontology specified. No ontology found at specified location:"
                        + " " + ontology.getOntologyFile();
                throw new GradleException(msg);
            }
        }
    }

    /**
     * Gather the configured reference ontologies.
     * @return The {@link List} of {@link ReferenceOntology} objects representing your data
     */
    private List<ReferenceOntology> gatherReferenceOntologies() {
        final List<ReferenceOntology> references = new ArrayList<>(toReference != null ? toReference.size() : 0);
        if (toReference != null) {
            for (final Object reference : toReference) {
                Ontology ont = (Ontology) reference;
                try {
                    references.add(new ReferenceOntology(ont.getOutputPackage(), ont.getOntologyName(),
                            GraphReadingUtility.readOntology(ont.getOntologyFile(), "")));
                } catch (IOException e) {
                    throw new GradleScriptException("Issue reading referenced ontology: " + ont.getOntologyFile(), e);
                }
            }
        }
        for (final ReferenceOntology ont : references) {
            try {
                ont.generateSource(references);
            } catch (Exception e) {
                throw new GradleScriptException("Issue generating referenced code model: " + e.getMessage(), e);
            }
        }
        return references;
    }

}
