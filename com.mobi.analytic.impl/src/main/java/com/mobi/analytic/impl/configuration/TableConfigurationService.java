package com.mobi.analytic.impl.configuration;

/*-
 * #%L
 * com.mobi.analytic.impl
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

import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Reference;
import com.mobi.analytic.api.configuration.BaseConfigurationService;
import com.mobi.analytic.api.jaxb.TableDetails;
import com.mobi.analytic.ontologies.analytic.ColumnFactory;
import com.mobi.analytic.ontologies.analytic.TableConfiguration;
import com.mobi.analytic.ontologies.analytic.TableConfigurationFactory;
import com.mobi.analytic.api.configuration.ConfigurationService;
import com.mobi.analytic.api.jaxb.ColumnDetails;
import com.mobi.analytic.api.jaxb.JaxbValidator;
import com.mobi.analytic.ontologies.analytic.Column;
import com.mobi.dataset.ontology.dataset.DatasetRecordFactory;
import com.mobi.rdf.api.Model;
import com.mobi.rdf.api.ValueFactory;

import java.util.UUID;
import java.util.stream.Collectors;

@Component(
        immediate = true,
        provide = { ConfigurationService.class, TableConfigurationService.class }
)
public class TableConfigurationService extends BaseConfigurationService<TableConfiguration> {
    private static final String COLUMN_NAMESPACE = "https://mobi.com/columns#";

    private ColumnFactory columnFactory;

    @Reference
    void setValueFactory(ValueFactory vf) {
        this.vf = vf;
    }

    @Reference
    void setTableConfigurationFactory(TableConfigurationFactory ormFactory) {
        this.ormFactory = ormFactory;
    }

    @Reference
    void setDatasetRecordFactory(DatasetRecordFactory datasetRecordFactory) {
        this.datasetRecordFactory = datasetRecordFactory;
    }

    @Reference
    void setColumnFactory(ColumnFactory columnFactory) {
        this.columnFactory = columnFactory;
    }

    @Override
    public String getTypeIRI() {
        return TableConfiguration.TYPE;
    }

    @Override
    public TableConfiguration create(String json) {
        TableDetails details = unmarshal(json, TableDetails.class);
        TableConfiguration configuration = super.create(json);
        configuration.setHasRow(vf.createIRI(details.getRow()));
        configuration.setHasColumn(details.getColumns().stream()
                .map(columnDetails ->  createColumn(columnDetails, configuration.getModel()))
                .collect(Collectors.toSet()));
        return configuration;
    }

    /**
     * Creates a {@link Column} using the provided {@link ColumnDetails}.
     *
     * @param details The {@link ColumnDetails} containing needed metadata.
     * @param model   The Configuration's {@link Model} to add the statements to.
     * @return A {@link Column} created using the provided {@link ColumnDetails}.
     */
    private Column createColumn(ColumnDetails details, Model model) {
        try {
            JaxbValidator.validateRequired(details, ColumnDetails.class);
            Column column = columnFactory.createNew(vf.createIRI(COLUMN_NAMESPACE + UUID.randomUUID()), model);
            column.setHasIndex(details.getIndex());
            column.setHasProperty(vf.createIRI(details.getProperty()));
            return column;
        } catch (JaxbValidator.ValidationException ex) {
            throw new IllegalArgumentException(ex.getMessage(), ex);
        }
    }
}
