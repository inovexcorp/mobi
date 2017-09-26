package org.matonto.analytic.api.configuration;

/*-
 * #%L
 * org.matonto.analytic.api
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

import org.eclipse.persistence.jaxb.JAXBContextFactory;
import org.eclipse.persistence.jaxb.UnmarshallerProperties;
import org.matonto.analytic.api.jaxb.BaseDetails;
import org.matonto.analytic.api.jaxb.JaxbValidator;
import org.matonto.analytic.api.jaxb.JaxbValidator.ValidationException;
import org.matonto.analytic.ontologies.analytic.Configuration;
import org.matonto.dataset.ontology.dataset.DatasetRecord;
import org.matonto.dataset.ontology.dataset.DatasetRecordFactory;
import org.matonto.rdf.api.ValueFactory;
import org.matonto.rdf.orm.OrmFactory;

import java.io.StringReader;
import java.util.Collections;
import java.util.UUID;
import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Unmarshaller;
import javax.xml.transform.stream.StreamSource;

public abstract class BaseConfigurationService<T extends Configuration> implements ConfigurationService<T> {
    private static final String CONFIG_NAMESPACE = "https://matonto.org/configurations#";

    protected ValueFactory vf;
    protected OrmFactory<T> ormFactory;
    protected DatasetRecordFactory datasetRecordFactory;

    @Override
    public T create(String json) {
        BaseDetails details = unmarshal(json, BaseDetails.class);
        T configuration = ormFactory.createNew(vf.createIRI(CONFIG_NAMESPACE + UUID.randomUUID()));
        DatasetRecord datasetRecord = datasetRecordFactory.createNew(vf.createIRI(details.getDatasetRecordId()));
        configuration.setDatasetRecord(Collections.singleton(datasetRecord));
        return configuration;
    }

    /**
     * Unmarshals the JSON to a Java Object of the Class provided which extends BaseDetails.
     *
     * @param json  The JSON which will be unmarshalled.
     * @param clazz The Class of the expected Java Object.
     * @param <S>   An Object which extends BaseDetails.
     * @return The Java Object created by unmarshalling the provided JSON.
     */
    protected <S extends BaseDetails> S unmarshal(String json, Class<S> clazz) {
        try {
            JAXBContext jc = JAXBContextFactory.createContext(new Class[]{clazz}, Collections.EMPTY_MAP);
            Unmarshaller unmarshaller = jc.createUnmarshaller();
            unmarshaller.setProperty(UnmarshallerProperties.MEDIA_TYPE, "application/json");
            unmarshaller.setProperty(UnmarshallerProperties.JSON_INCLUDE_ROOT, false);
            StreamSource source = new StreamSource(new StringReader(json));
            S details = unmarshaller.unmarshal(source, clazz).getValue();
            JaxbValidator.validateRequired(details, clazz);
            return details;
        } catch (JAXBException | ValidationException ex) {
            throw new IllegalArgumentException(ex.getMessage());
        }
    }
}
