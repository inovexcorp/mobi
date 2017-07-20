package org.matonto.explorable.dataset.rest.jaxb;

/*-
 * #%L
 * org.matonto.explorable.dataset.rest
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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

import java.util.List;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement
public class ClassDetails {
    private String classIRI;
    private String classTitle;
    private String classDescription;
    private int instancesCount;
    private List<String> classExamples;
    private String ontologyRecordTitle;
    private boolean deprecated;

    @XmlElement
    public String getClassIRI() {
        return classIRI;
    }

    public void setClassIRI(String classIRI) {
        this.classIRI = classIRI;
    }

    @XmlElement
    public String getClassTitle() {
        return classTitle;
    }

    public void setClassTitle(String classTitle) {
        this.classTitle = classTitle;
    }

    @XmlElement
    public String getClassDescription() {
        return classDescription;
    }

    public void setClassDescription(String classDescription) {
        this.classDescription = classDescription;
    }

    @XmlElement
    public int getInstancesCount() {
        return instancesCount;
    }

    public void setInstancesCount(int instancesCount) {
        this.instancesCount = instancesCount;
    }

    @XmlElement
    public List<String> getClassExamples() {
        return classExamples;
    }

    public void setClassExamples(List<String> classExamples) {
        this.classExamples = classExamples;
    }

    @XmlElement
    public String getOntologyRecordTitle() {
        return ontologyRecordTitle;
    }

    public void setOntologyRecordTitle(String ontologyRecordTitle) {
        this.ontologyRecordTitle = ontologyRecordTitle;
    }

    @XmlElement
    public boolean isDeprecated() {
        return deprecated;
    }

    public void setDeprecated(boolean deprecated) {
        this.deprecated = deprecated;
    }
}
