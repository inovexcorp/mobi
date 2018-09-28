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

import java.io.File;

public class Ontology {
    private String ontologyName;
    private File ontologyFile;
    private String outputPackage;

    public String getOntologyName() {
        return ontologyName;
    }

    public void setOntologyName(String ontologyName) {
        this.ontologyName = ontologyName;
    }

    public File getOntologyFile() {
        return ontologyFile;
    }

    public void setOntologyFile(File ontologyFile) {
        this.ontologyFile = ontologyFile;
    }

    public String getOutputPackage() {
        return outputPackage;
    }

    public void setOutputPackage(String outputPackage) {
        this.outputPackage = outputPackage;
    }
}
