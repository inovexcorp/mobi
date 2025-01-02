package com.mobi.etl.cli.export;

/*-
 * #%L
 * com.mobi.etl.cli
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import com.mobi.catalog.api.RecordManager;
import com.mobi.catalog.api.record.config.OperationConfig;
import com.mobi.catalog.api.record.config.RecordExportSettings;
import com.mobi.catalog.api.record.config.RecordOperationConfig;
import com.mobi.catalog.config.CatalogConfigProvider;
import com.mobi.persistence.utils.BatchExporter;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.eclipse.rdf4j.model.Resource;
import org.eclipse.rdf4j.model.ValueFactory;
import org.eclipse.rdf4j.model.impl.ValidatingValueFactory;
import org.eclipse.rdf4j.repository.RepositoryConnection;
import org.eclipse.rdf4j.rio.Rio;
import org.eclipse.rdf4j.rio.helpers.BufferedGroupingRDFHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Command(scope = "mobi", name = "export-records", description = "Exports records from the local catalog")
@Service
public class ExportRecords extends ExportBase implements Action {

    private static final Logger LOG = LoggerFactory.getLogger(ExportRecords.class);
    final ValueFactory vf = new ValidatingValueFactory();

    // Service References

    @Reference
    protected CatalogConfigProvider configProvider;

    @Reference
    private RecordManager recordManager;

    // Command Parameters

    @Argument(name = "CatalogRecords", description = "A comma-separated list of catalog record IDs to export. NOTE: "
            + "Any % symbols as a result of URL encoding must be escaped.")
    private String recordsParam = null;

    // Implementation

    @Override
    public Object execute() throws Exception {
        List<Resource> recordIRIs = Arrays.asList(recordsParam.split(",")).stream()
                .map(record -> vf.createIRI(record.trim())).collect(Collectors.toList());

        BatchExporter writer = new BatchExporter(new BufferedGroupingRDFHandler(
                Rio.createWriter(getFormat(), getOuput())));
        writer.setLogger(LOG);
        writer.setPrintToSystem(true);

        RecordOperationConfig operationConfig = new OperationConfig();
        operationConfig.set(RecordExportSettings.BATCH_EXPORTER, writer);
        try (RepositoryConnection conn = configProvider.getRepository().getConnection()) {
            recordManager.export(recordIRIs, operationConfig, conn);
        }

        return null;
    }
}
