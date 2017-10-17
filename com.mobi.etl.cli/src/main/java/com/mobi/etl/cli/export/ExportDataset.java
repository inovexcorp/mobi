package com.mobi.etl.cli.export;

/*-
 * #%L
 * com.mobi.etl.cli
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

import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.lifecycle.Reference;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import com.mobi.etl.api.config.rdf.export.RecordExportConfig;
import com.mobi.etl.api.rdf.export.DatasetExportService;
import org.openrdf.rio.RDFFormat;

import java.io.OutputStream;

@Command(scope = "mobi", name = "export-dataset",
        description = "Exports data from a DatasetRecord in the local catalog")
@Service
public class ExportDataset extends ExportBase implements Action {

    // Service References

    @Reference
    private DatasetExportService exportService;

    public void setExportService(DatasetExportService exportService) {
        this.exportService = exportService;
    }

    // Command Parameters

    @Argument(name = "DatasetRecord", description = "The IRI of the DatasetRecord to export", required = true)
    String datasetParam = null;

    // Implementation

    @Override
    public Object execute() throws Exception {
        OutputStream output = getOuput();
        RDFFormat outputFormat = getFormat();

        RecordExportConfig config = new RecordExportConfig.Builder(output, outputFormat).build();

        exportService.export(config, datasetParam);

        return null;
    }
}
